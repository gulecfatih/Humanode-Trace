using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface IWhaleRepository
{
    Task<List<WhaleTransactionDto>> GetWhaleTransactionsAsync(double minHmnd = 50000, int limit = 60, string asset = "hmnd");
}

public class WhaleRepository : IWhaleRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IPriceRepository _priceRepo;

    public WhaleRepository(IDbConnectionFactory dbFactory, IPriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
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
            var evmSql = @"
                SELECT
                    'EVM' as Layer,
                    hash as Hash,
                    block_number as BlockNumber,
                    timestamp as Timestamp,
                    'Ethereum' as Pallet,
                    'Transact' as Method,
                    from_address as Sender,
                    to_address as Target,
                    value_hmnd as ValueHmnd,
                    fee_hmnd as FeeHmnd,
                    gas_used as GasUsed,
                    status as Status,
                    'HMND' as Symbol,
                    'EVM Yerel HMND Transferi' as Details
                FROM transactions
                WHERE value_hmnd >= @minHmnd AND status = 1
                ORDER BY value_hmnd DESC, timestamp DESC
                LIMIT @safeLimit";

            var evmWhales = (await connection.QueryAsync<WhaleTransactionDto>(evmSql, new { minHmnd, safeLimit })).ToList();
            results.AddRange(evmWhales);

            var subSql = @"
                SELECT
                    'SUBSTRATE' as Layer,
                    hash as Hash,
                    block_number as BlockNumber,
                    timestamp as Timestamp,
                    pallet as Pallet,
                    method as Method,
                    signer as Sender,
                    target as Target,
                    value_hmnd as ValueHmnd,
                    fee_hmnd as FeeHmnd,
                    0 as GasUsed,
                    status as Status,
                    'HMND' as Symbol,
                    details as Details
                FROM substrate_extrinsics
                WHERE value_hmnd >= @minHmnd AND status = 1
                ORDER BY value_hmnd DESC, timestamp DESC
                LIMIT @safeLimit";

            var subWhales = (await connection.QueryAsync<WhaleTransactionDto>(subSql, new { minHmnd, safeLimit })).ToList();
            results.AddRange(subWhales);
        }

        // 2. Token Transfers (Only legitimate verified ecosystem tokens)
        if (asset == "hmnd")
        {
            var tokenSql = @"
                SELECT
                    'EVM_TOKEN' as Layer,
                    t.tx_hash as Hash,
                    t.block_number as BlockNumber,
                    t.timestamp as Timestamp,
                    'ERC-20' as Pallet,
                    'WeHMND' as Method,
                    t.from_address as Sender,
                    t.to_address as Target,
                    t.amount as ValueHmnd,
                    0 as FeeHmnd,
                    0 as GasUsed,
                    1 as Status,
                    'WeHMND' as Symbol,
                    'Wrapped eHMND (1:1 Native Köprü)' as Details
                FROM token_transfers t
                WHERE t.token_symbol = 'WeHMND' AND t.amount >= @minHmnd
                ORDER BY t.amount DESC, t.timestamp DESC
                LIMIT @safeLimit";

            var tokenWhales = (await connection.QueryAsync<WhaleTransactionDto>(tokenSql, new { minHmnd, safeLimit })).ToList();
            results.AddRange(tokenWhales);
        }
        else if (asset == "usdc")
        {
            var minUsdc = Math.Min(minHmnd, 10000.0);
            var tokenSql = @"
                SELECT
                    'EVM_TOKEN' as Layer,
                    t.tx_hash as Hash,
                    t.block_number as BlockNumber,
                    t.timestamp as Timestamp,
                    'ERC-20' as Pallet,
                    'USDC' as Method,
                    t.from_address as Sender,
                    t.to_address as Target,
                    t.amount as ValueHmnd,
                    0 as FeeHmnd,
                    0 as GasUsed,
                    1 as Status,
                    'USDC' as Symbol,
                    'USD Coin (ChainPort Bridged)' as Details
                FROM token_transfers t
                WHERE t.token_symbol = 'USDC' AND t.amount >= @minUsdc
                ORDER BY t.amount DESC, t.timestamp DESC
                LIMIT @safeLimit";

            var tokenWhales = (await connection.QueryAsync<WhaleTransactionDto>(tokenSql, new { minUsdc, safeLimit })).ToList();
            results.AddRange(tokenWhales);
        }
        else if (asset == "all")
        {
            var tokenSql = @"
                SELECT
                    'EVM_TOKEN' as Layer,
                    t.tx_hash as Hash,
                    t.block_number as BlockNumber,
                    t.timestamp as Timestamp,
                    'ERC-20' as Pallet,
                    t.token_symbol as Method,
                    t.from_address as Sender,
                    t.to_address as Target,
                    t.amount as ValueHmnd,
                    0 as FeeHmnd,
                    0 as GasUsed,
                    1 as Status,
                    t.token_symbol as Symbol,
                    t.token_symbol || ' Token Transferi' as Details
                FROM token_transfers t
                WHERE t.token_symbol IN ('WeHMND', 'USDC', 'WETH', 'WBTC')
                  AND (
                    (t.token_symbol = 'WeHMND' AND t.amount >= @minHmnd) OR
                    (t.token_symbol = 'USDC' AND t.amount >= 10000) OR
                    (t.token_symbol = 'WETH' AND t.amount >= 5) OR
                    (t.token_symbol = 'WBTC' AND t.amount >= 0.1)
                  )
                ORDER BY t.amount DESC, t.timestamp DESC
                LIMIT @safeLimit";

            var tokenWhales = (await connection.QueryAsync<WhaleTransactionDto>(tokenSql, new { minHmnd, safeLimit })).ToList();
            results.AddRange(tokenWhales);
        }

        // 3. Compute USD, tier and tag
        var priceMap = await _priceRepo.GetPriceMapAsync();
        var latestPrice = await _priceRepo.GetLatestPriceAsync();

        foreach (var item in results)
        {
            var sym = item.Symbol ?? (item.Layer == "EVM_TOKEN" ? item.Method : "HMND");
            var itemDate = item.Timestamp > 0
                ? DateTimeOffset.FromUnixTimeSeconds(item.Timestamp).UtcDateTime.ToString("yyyy-MM-dd")
                : "";
            var dayHmndPrice = (!string.IsNullOrEmpty(itemDate) && priceMap.TryGetValue(itemDate, out var hp)) ? hp : latestPrice;

            double priceUsd = sym switch
            {
                "USDC" or "USDT" => 1.0,
                "WETH" => 2650.0,
                "WBTC" => 68000.0,
                _ => dayHmndPrice
            };

            item.PriceUsd = priceUsd;
            item.UsdEst = Math.Round(item.ValueHmnd * priceUsd, 2);

            if (item.UsdEst >= 50000 || item.ValueHmnd >= 1000000)
            {
                item.Tier = "whale";
                item.Tag = "🐋 Balina";
            }
            else if (item.UsdEst >= 10000 || item.ValueHmnd >= 100000)
            {
                item.Tier = "dolphin";
                item.Tag = "🐬 Yunus";
            }
            else
            {
                item.Tier = "standard";
                item.Tag = "🐟 Balık";
            }
        }

        return results
            .OrderByDescending(w => w.ValueHmnd)
            .Take(safeLimit)
            .ToList();
    }
}
