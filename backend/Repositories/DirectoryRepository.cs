using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class DirectoryRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;
    private static object? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public DirectoryRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<object> GetMajorWalletsDirectoryAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        // Cached live balances
        var liveBalances = (await connection.QueryAsync<(string address, double balance_hmnd)>(StoredProcedures.GetWalletBalancesCache)).ToList();
        var feesPotAddress = await _configRepo.GetConfigAsync("fees_pot_address");

        var items = new List<MajorWalletDto>();
        var curPrice = await _priceRepo.GetLatestPriceAsync();

        var curatedEntries = (await connection.QueryAsync<CuratedEntry>(StoredProcedures.GetCuratedAddresses)).ToList();

        foreach (var entry in curatedEntries)
        {
            var addr = entry.Address;
            var isEvm = addr.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
            long outCount = 0;
            double outHmnd = 0;
            long inCount = 0;
            double inHmnd = 0;

            if (isEvm)
            {
                var norm = addr.ToLowerInvariant();
                var o = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(StoredProcedures.GetEvmTransfersOut, new { Address = norm });
                outCount = o.c;
                outHmnd = o.vol;

                var i = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(StoredProcedures.GetEvmTransfersIn, new { Address = norm });
                inCount = i.c;
                inHmnd = i.vol;
            }
            else
            {
                var o = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(StoredProcedures.GetSubstrateTransfersOut, new { Address = addr });
                outCount = o.c;
                outHmnd = o.vol;

                var i = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(StoredProcedures.GetSubstrateTransfersIn, new { Address = addr });
                inCount = i.c;
                inHmnd = i.vol;

                if (addr.Equals(feesPotAddress, StringComparison.OrdinalIgnoreCase))
                {
                    var pTotals = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(StoredProcedures.GetValidatorPayoutsTotals);
                    outCount += pTotals.c;
                    outHmnd += pTotals.vol;
                    inHmnd = Math.Max(inHmnd, outHmnd);
                }
            }

            var totalTx = outCount + inCount;
            var totalVolumeHmnd = Math.Round(outHmnd + inHmnd, 2);

            double liveBalanceHmnd = 0;
            var cachedBal = liveBalances.FirstOrDefault(k => k.address.Equals(addr, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(cachedBal.address))
            {
                liveBalanceHmnd = Math.Round(cachedBal.balance_hmnd, 2);
            }
            else
            {
                liveBalanceHmnd = Math.Round(Math.Max(0, inHmnd - outHmnd), 2);
            }

            var balanceUsd = Math.Round(liveBalanceHmnd * curPrice, 2);

            items.Add(new MajorWalletDto
            {
                Address = addr,
                Label = entry.Label,
                Category = entry.Category,
                Color = entry.Color,
                Notes = entry.Notes,
                Layer = isEvm ? "EVM" : "Substrate",
                TxCount = totalTx,
                InCount = inCount,
                OutCount = outCount,
                InflowHmnd = Math.Round(inHmnd, 2),
                OutflowHmnd = Math.Round(outHmnd, 2),
                TotalVolumeHmnd = totalVolumeHmnd,
                LiveBalanceHmnd = liveBalanceHmnd,
                BalanceUsd = balanceUsd
            });
        }

        items.Sort((a, b) =>
        {
            var oa = GetCategoryOrder(a.Category);
            var ob = GetCategoryOrder(b.Category);
            if (oa != ob) return oa.CompareTo(ob);
            return b.TotalVolumeHmnd.CompareTo(a.TotalVolumeHmnd);
        });

        var res = new
        {
            updatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            priceUsd = curPrice,
            items
        };

        _cached = res;
        _cacheTime = DateTime.UtcNow;

        return res;
    }

    private static int GetCategoryOrder(string category) => (category ?? "").ToLowerInvariant() switch
    {
        "exchange" => 1,
        "system" => 2,
        "whale" => 3,
        "bridge" => 4,
        "dex" => 5,
        "defi" => 6,
        "token" => 7,
        _ => 99
    };
}
