using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class StatsRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;

    public StatsRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<StatsDto> GetStatsAsync(StatsQueryRequest req)
    {
        req ??= new StatsQueryRequest();
        var layer = req.Layer;
        var filter = req.Filter;
        var startDate = req.StartDate;
        var endDate = req.EndDate;
        var q = !string.IsNullOrEmpty(req.Q) ? req.Q : req.Search;
        var pallet = req.Pallet;
        var hideZeroFee = req.HideZeroFee == "1" || req.HideZeroFee == "true";

        using var conn = _dbFactory.CreateConnection();

        long? startTs = null;
        if (!string.IsNullOrWhiteSpace(startDate) && DateTimeOffset.TryParse(startDate, out var st))
            startTs = st.ToUnixTimeSeconds();

        long? endTs = null;
        if (!string.IsNullOrWhiteSpace(endDate) && DateTimeOffset.TryParse(endDate, out var et))
            endTs = et.ToUnixTimeSeconds();

        if (startTs == null && endTs == null && !string.IsNullOrWhiteSpace(filter) && filter != "all")
        {
            var now = DateTimeOffset.UtcNow;
            switch (filter.ToLowerInvariant())
            {
                case "today":
                    startTs = new DateTimeOffset(now.Date, TimeSpan.Zero).ToUnixTimeSeconds();
                    endTs = now.ToUnixTimeSeconds();
                    break;
                case "yesterday":
                    var yest = now.Date.AddDays(-1);
                    startTs = new DateTimeOffset(yest, TimeSpan.Zero).ToUnixTimeSeconds();
                    endTs = new DateTimeOffset(now.Date, TimeSpan.Zero).ToUnixTimeSeconds();
                    break;
                case "7d":
                    startTs = now.AddDays(-7).ToUnixTimeSeconds();
                    endTs = now.ToUnixTimeSeconds();
                    break;
                case "30d":
                    startTs = now.AddDays(-30).ToUnixTimeSeconds();
                    endTs = now.ToUnixTimeSeconds();
                    break;
                case "1y":
                    startTs = now.AddYears(-1).ToUnixTimeSeconds();
                    endTs = now.ToUnixTimeSeconds();
                    break;
            }
        }

        bool includeEvm = layer != "substrate";
        bool includeSub = layer != "evm";

        if (!string.IsNullOrWhiteSpace(pallet) && pallet != "all")
        {
            if (pallet.Equals("ethereum", StringComparison.OrdinalIgnoreCase))
            {
                includeSub = false;
            }
            else
            {
                includeEvm = false;
            }
        }

        var evmWhere = "WHERE status = 1";
        if (startTs.HasValue) evmWhere += " AND timestamp >= @startTs";
        if (endTs.HasValue) evmWhere += " AND timestamp <= @endTs";
        if (hideZeroFee) evmWhere += " AND fee_hmnd > 0";

        var subWhere = "WHERE status = 1";
        if (startTs.HasValue) subWhere += " AND timestamp >= @startTs";
        if (endTs.HasValue) subWhere += " AND timestamp <= @endTs";
        if (hideZeroFee) subWhere += " AND fee_hmnd > 0";
        if (!string.IsNullOrWhiteSpace(pallet) && pallet != "all" && !pallet.Equals("ethereum", StringComparison.OrdinalIgnoreCase))
        {
            subWhere += " AND pallet = @pallet";
        }

        var param = new { startTs, endTs, pallet };

        long evmCount = 0;
        double evmFees = 0;
        double evmVol = 0;

        if (includeEvm)
        {
            var evmRow = await conn.QueryFirstOrDefaultAsync<(long cnt, double? fees, double? vol)>(
                $"{StoredProcedures.GetEvmStatsSummaryBase} {evmWhere}", param);
            evmCount = evmRow.cnt;
            evmFees = evmRow.fees ?? 0;
            evmVol = evmRow.vol ?? 0;
        }

        long subCount = 0;
        double subFees = 0;
        double subVol = 0;

        if (includeSub)
        {
            var subRow = await conn.QueryFirstOrDefaultAsync<(long cnt, double? fees, double? vol)>(
                $"{StoredProcedures.GetSubstrateStatsSummaryBase} {subWhere}", param);
            subCount = subRow.cnt;
            subFees = subRow.fees ?? 0;
            subVol = subRow.vol ?? 0;
        }

        var bridgeSql = StoredProcedures.GetBridgeNativeToEvmSwapsKpi;
        if (startTs.HasValue) bridgeSql += " AND timestamp >= @startTs";
        if (endTs.HasValue) bridgeSql += " AND timestamp <= @endTs";
        var bridgeRow = await conn.QueryFirstOrDefaultAsync<(long cnt, double? vol)>(bridgeSql, param);

        var tokenCount = await conn.ExecuteScalarAsync<long>(StoredProcedures.GetTokenTransfersCount);
        var blockCount = await conn.ExecuteScalarAsync<long>(StoredProcedures.GetBlocksCount);

        var lastBlock = await conn.QueryFirstOrDefaultAsync<(long? number, long? timestamp)>(StoredProcedures.GetLatestBlockHeader);

        var totalFeesHmnd = evmFees + subFees;
        var totalVolumeHmnd = evmVol + subVol;

        var activeTokens = await conn.ExecuteScalarAsync<int>(StoredProcedures.GetActiveTokensCount);

        var maxTs = lastBlock.timestamp ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var thirtyDaysBefore = maxTs - 2592000;
        var activeValidators = await conn.ExecuteScalarAsync<int>(StoredProcedures.GetActiveValidatorsCount);
        if (activeValidators == 0) activeValidators = 89;

        var priceUsd = await _priceRepo.GetLatestPriceAsync();

        return new StatsDto
        {
            TotalBlocks = blockCount > 0 ? blockCount : (lastBlock.number ?? 20485918),
            TotalTransactions = evmCount,
            TotalExtrinsics = subCount,
            TotalTokenTransfers = tokenCount,
            TotalFeesHmnd = Math.Round(totalFeesHmnd, 4),
            TotalVolumeHmnd = Math.Round(totalVolumeHmnd, 2),
            TotalFeesUsd = Math.Round(totalFeesHmnd * priceUsd, 2),
            ActiveValidators = activeValidators,
            ActiveTokensCount = activeTokens,
            LastBlockNumber = lastBlock.number ?? 20485918,
            LastBlockTime = lastBlock.timestamp ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            ChainStatus = "healthy",
            HmndPriceUsd = priceUsd,
            CirculatingSupply = await _configRepo.GetDoubleConfigAsync("circulating_supply_baseline"),
            BridgeSwapVolumeHmnd = Math.Round(bridgeRow.vol ?? 0, 2),
            BridgeSwapCount = bridgeRow.cnt,
            EvmFeesHmnd = Math.Round(evmFees, 4),
            EvmVolumeHmnd = Math.Round(evmVol, 2),
            SubFeesHmnd = Math.Round(subFees, 4),
            SubVolumeHmnd = Math.Round(subVol, 2)
        };
    }

    public async Task<List<DailyStatsDto>> GetDailyStatsAsync(DailyStatsQueryRequest req)
    {
        req ??= new DailyStatsQueryRequest();
        var layer = req.Layer;
        var filter = req.Filter;
        var startDate = req.StartDate;
        var endDate = req.EndDate;
        var q = !string.IsNullOrEmpty(req.Q) ? req.Q : req.Search;
        var pallet = req.Pallet;
        var interval = req.Interval;
        var hideZeroFee = req.HideZeroFee == "1" || req.HideZeroFee == "true";

        using var conn = _dbFactory.CreateConnection();

        long? startTs = null;
        if (!string.IsNullOrWhiteSpace(startDate) && DateTimeOffset.TryParse(startDate, out var st))
            startTs = st.ToUnixTimeSeconds();

        long? endTs = null;
        if (!string.IsNullOrWhiteSpace(endDate) && DateTimeOffset.TryParse(endDate, out var et))
            endTs = et.ToUnixTimeSeconds();

        if (!startTs.HasValue)
        {
            var now = DateTimeOffset.UtcNow;
            startTs = interval.ToLowerInvariant() switch
            {
                "year" => 0,
                "month" => 0, // show full history for months
                "week" => now.AddDays(-365).ToUnixTimeSeconds(),
                _ => now.AddDays(-180).ToUnixTimeSeconds()
            };
        }

        string grpExpr = interval.ToLowerInvariant() switch
        {
            "year" => "strftime('%Y', timestamp, 'unixepoch')",
            "month" => "strftime('%Y-%m', timestamp, 'unixepoch')",
            "week" => "strftime('%Y-W%W', timestamp, 'unixepoch')",
            _ => "DATE(timestamp, 'unixepoch')"
        };

        bool includeEvm = layer != "substrate";
        bool includeSub = layer != "evm";

        if (!string.IsNullOrWhiteSpace(pallet) && pallet != "all")
        {
            if (pallet.Equals("ethereum", StringComparison.OrdinalIgnoreCase))
            {
                includeSub = false;
            }
            else
            {
                includeEvm = false;
            }
        }

        var evmWhere = "WHERE timestamp >= @startTs AND status = 1";
        if (endTs.HasValue) evmWhere += " AND timestamp <= @endTs";
        if (hideZeroFee) evmWhere += " AND fee_hmnd > 0";

        var subWhere = "WHERE timestamp >= @startTs AND status = 1";
        if (endTs.HasValue) subWhere += " AND timestamp <= @endTs";
        if (hideZeroFee) subWhere += " AND fee_hmnd > 0";
        if (!string.IsNullOrWhiteSpace(pallet) && pallet != "all" && !pallet.Equals("ethereum", StringComparison.OrdinalIgnoreCase))
        {
            subWhere += " AND pallet = @pallet";
        }

        var unions = new List<string>();
        if (includeEvm)
        {
            unions.Add($"{StoredProcedures.GetChartUnionEvmBase} {evmWhere}");
        }
        if (includeSub)
        {
            unions.Add($"{StoredProcedures.GetChartUnionSubstrateBase} {subWhere}");
        }

        if (unions.Count == 0) return new List<DailyStatsDto>();

        var innerSql = string.Join(" UNION ALL ", unions);
        var sql = string.Format(StoredProcedures.GetUnifiedChartGroupTemplate, grpExpr, innerSql);

        var param = new { startTs, endTs, pallet };
        var list = (await conn.QueryAsync<DailyStatsDto>(sql, param)).ToList();
        var priceMap = await _priceRepo.GetPriceMapAsync();
        var latestPrice = await _priceRepo.GetLatestPriceAsync();
        foreach (var d in list)
        {
            d.Period = d.Day;
            var priceMatch = priceMap.FirstOrDefault(x => x.Date.Equals(d.Day, StringComparison.OrdinalIgnoreCase));
            var dayPrice = priceMatch != null ? priceMatch.PriceUsd : latestPrice;
            d.PriceUsd = dayPrice;
            d.FeesUsd = Math.Round(d.TotalFeesHmnd * dayPrice, 2);
            d.TotalFeesUsd = d.FeesUsd;
        }
        return list;
    }

    public async Task<List<string>> GetDistinctPalletsAsync()
    {
        using var conn = _dbFactory.CreateConnection();
        var pallets = (await conn.QueryAsync<string>(StoredProcedures.GetDistinctPallets)).ToList();
        if (!pallets.Contains("Ethereum", StringComparer.OrdinalIgnoreCase))
        {
            pallets.Insert(0, "Ethereum");
        }
        return pallets;
    }

    public async Task<object> GetYearlyHeatmapAsync(string? year = null)
    {
        using var conn = _dbFactory.CreateConnection();
        var targetYear = !string.IsNullOrWhiteSpace(year) && int.TryParse(year, out var y) ? y : DateTime.UtcNow.Year;

        var startOfYear = new DateTimeOffset(new DateTime(targetYear, 1, 1), TimeSpan.Zero).ToUnixTimeSeconds();
        var endOfYear = new DateTimeOffset(new DateTime(targetYear, 12, 31, 23, 59, 59), TimeSpan.Zero).ToUnixTimeSeconds();

        var rows = (await conn.QueryAsync<(string day, int cnt, double fee)>(StoredProcedures.GetYearlyHeatmap, new { startOfYear, endOfYear })).ToList();
        int totalTxs = 0;
        double totalFeesHmnd = 0;
        string? peakGasDate = null;
        double peakGasFee = 0;
        int peakGasCount = 0;
        string? peakCountDate = null;
        int peakCount = 0;

        foreach (var r in rows)
        {
            if (!string.IsNullOrEmpty(r.day))
            {
                totalTxs += r.cnt;
                totalFeesHmnd += r.fee;

                if (r.fee > peakGasFee)
                {
                    peakGasFee = r.fee;
                    peakGasDate = r.day;
                    peakGasCount = r.cnt;
                }

                if (r.cnt > peakCount)
                {
                    peakCount = r.cnt;
                    peakCountDate = r.day;
                }
            }
        }

        var allDaysList = new List<object>();
        var activeDaysList = new List<object>();

        var startDate = new DateTime(targetYear, 1, 1);
        var endDate = new DateTime(targetYear, 12, 31);

        for (var dt = startDate; dt <= endDate; dt = dt.AddDays(1))
        {
            var dayStr = dt.ToString("yyyy-MM-dd");
            int cnt = 0;
            double fee = 0;

            var stat = rows.FirstOrDefault(r => r.day.Equals(dayStr, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(stat.day))
            {
                cnt = stat.cnt;
                fee = stat.fee;
            }

            var dayObj = new
            {
                date = dayStr,
                day = dayStr,
                count = cnt,
                tx_count = cnt,
                fee = Math.Round(fee, 4),
                total_fees = Math.Round(fee, 4)
            };

            allDaysList.Add(dayObj);
            if (cnt > 0 || fee > 0)
            {
                activeDaysList.Add(dayObj);
            }
        }

        var latestPrice = await _priceRepo.GetLatestPriceAsync();
        double totalFeesUsd = Math.Round(totalFeesHmnd * latestPrice, 2);
        var availableYears = new List<string> { "2026", "2025", "2024", "2023", "2022" };

        return new
        {
            year = targetYear.ToString(),
            years = availableYears,
            availableYears,
            days = allDaysList,
            dayMap = activeDaysList,
            totalTx = totalTxs,
            totalFees = Math.Round(totalFeesHmnd, 4),
            totalFeesUsd,
            peakGasDay = peakGasDate != null ? new { date = peakGasDate, fee = Math.Round(peakGasFee, 4), count = peakGasCount } : null,
            peakDay = peakCountDate != null ? new { date = peakCountDate, count = peakCount } : null,
            activeDaysCount = rows.Count,
            maxCount = peakCount,
            totalOps = totalTxs
        };
    }
}
