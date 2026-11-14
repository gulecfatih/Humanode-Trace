using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class WhaleRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;

    public WhaleRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<List<WhaleTransactionDto>> GetWhaleTransactionsAsync(double minHmnd = 50000, int limit = 60, string asset = "hmnd")
    {
        var safeLimit = Math.Clamp(limit, 1, 200);
        asset = (asset ?? "hmnd").Trim().ToLowerInvariant();

        using var connection = _dbFactory.CreateConnection();
        var results = new List<WhaleTransactionDto>();

        // 1. HMND / ALL: EVM & Substrate Native Transfers
        if (asset is "hmnd" or "all")
        {
            var evmWhales = (await connection.QueryAsync<WhaleTransactionDto>(StoredProcedures.GetWhaleEvmTransactions, new { MinHmnd = minHmnd, Limit = safeLimit })).ToList();
            results.AddRange(evmWhales);

            var subWhales = (await connection.QueryAsync<WhaleTransactionDto>(StoredProcedures.GetWhaleSubstrateTransactions, new { MinHmnd = minHmnd, Limit = safeLimit })).ToList();
            results.AddRange(subWhales);
        }

        // 2. Token Transfers (Only legitimate verified ecosystem tokens)
        if (asset is "hmnd" or "all" or "wehmnd" or "usdc")
        {
            var tokenWhales = (await connection.QueryAsync<WhaleTransactionDto>(StoredProcedures.GetWhaleTokenTransfers, new { MinHmnd = minHmnd, Limit = safeLimit })).ToList();
            results.AddRange(tokenWhales);
        }

        // 3. Compute USD, tier and tag
        var priceMap = await _priceRepo.GetPriceMapAsync();
        var latestPrice = await _priceRepo.GetLatestPriceAsync();
        var refWeth = await _configRepo.GetDoubleConfigAsync("price_ref_weth");
        var refWbtc = await _configRepo.GetDoubleConfigAsync("price_ref_wbtc");
        var refUsdc = await _configRepo.GetDoubleConfigAsync("price_ref_usdc");

        foreach (var item in results)
        {
            var sym = item.Symbol ?? (item.Layer == "EVM_TOKEN" ? item.Method : "HMND");
            var itemDate = item.Timestamp > 0
                ? DateTimeOffset.FromUnixTimeSeconds(item.Timestamp).UtcDateTime.ToString("yyyy-MM-dd")
                : "";
            var priceMatch = priceMap.FirstOrDefault(x => x.Date.Equals(itemDate, StringComparison.OrdinalIgnoreCase));
            var dayHmndPrice = priceMatch != null ? priceMatch.PriceUsd : latestPrice;

            double priceUsd = sym switch
            {
                "USDC" or "USDT" => refUsdc,
                "WETH" => refWeth,
                "WBTC" => refWbtc,
                _ => dayHmndPrice
            };

            item.PriceUsd = priceUsd;
            item.UsdEst = Math.Round(item.ValueHmnd * priceUsd, 2);

            if (item.UsdEst >= 50000 || item.ValueHmnd >= 1000000)
            {
                item.Tier = "whale";
                item.Tag = "whale";
            }
            else if (item.UsdEst >= 10000 || item.ValueHmnd >= 100000)
            {
                item.Tier = "dolphin";
                item.Tag = "dolphin";
            }
            else
            {
                item.Tier = "fish";
                item.Tag = "fish";
            }
        }

        return results
            .OrderByDescending(w => w.ValueHmnd)
            .Take(safeLimit)
            .ToList();
    }
}
