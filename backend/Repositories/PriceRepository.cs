using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class PriceRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private static List<DailyPriceDto>? _priceList;
    private static double _latestPrice = 0.0;
    private static DateTime _cacheTime = DateTime.MinValue;

    public PriceRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    private async Task EnsureLoadedAsync()
    {
        if (_priceList != null && DateTime.UtcNow - _cacheTime < TimeSpan.FromMinutes(10))
            return;

        using var connection = _dbFactory.CreateConnection();
        var rows = (await connection.QueryAsync<(string day, double price_usd)>(StoredProcedures.GetDailyPrices)).ToList();

        var list = new List<DailyPriceDto>();
        foreach (var r in rows)
        {
            list.Add(new DailyPriceDto { Date = r.day, PriceUsd = r.price_usd });
        }

        if (rows.Count > 0)
        {
            _latestPrice = rows[^1].price_usd;
        }

        _priceList = list;
        _cacheTime = DateTime.UtcNow;
    }

    public async Task<double> GetLatestPriceAsync()
    {
        await EnsureLoadedAsync();
        return _latestPrice;
    }

    public async Task<double> GetPriceForDateAsync(string dateStr)
    {
        await EnsureLoadedAsync();
        if (string.IsNullOrWhiteSpace(dateStr)) return _latestPrice;
        var clean = dateStr.Trim();
        var match = _priceList?.FirstOrDefault(x => x.Date.Equals(clean, StringComparison.OrdinalIgnoreCase));
        if (match != null) return match.PriceUsd;
        return _latestPrice;
    }

    public async Task<List<DailyPriceDto>> GetPriceMapAsync()
    {
        await EnsureLoadedAsync();
        return _priceList ?? new List<DailyPriceDto>();
    }

    public async Task<object> GetDailyPricesMapAsync()
    {
        await EnsureLoadedAsync();
        return new
        {
            prices = _priceList ?? new List<DailyPriceDto>(),
            latestPrice = _latestPrice
        };
    }

    public async Task<object> GetHistoricalRatesListAsync(HistoricalRatesQueryRequest request)
    {
        request ??= new HistoricalRatesQueryRequest();
        await EnsureLoadedAsync();
        var safeLimit = Math.Clamp(request.Limit, 1, 200);
        var safePage = Math.Max(1, request.Page);
        var offset = (safePage - 1) * safeLimit;
        var s = !string.IsNullOrEmpty(request.Search) ? request.Search : request.Q;

        using var connection = _dbFactory.CreateConnection();
        var p = new DynamicParameters();
        var where = "WHERE 1=1";

        if (!string.IsNullOrEmpty(request.Year) && request.Year != "all")
        {
            where += " AND day LIKE @year";
            p.Add("year", $"{request.Year}-%");
        }

        if (!string.IsNullOrEmpty(s))
        {
            where += " AND day LIKE @search";
            p.Add("search", $"%{s.Trim()}%");
        }

        if (request.OnlySwaps)
        {
            where += " AND source = 'COINGECKO'";
        }

        var countSql = $"{StoredProcedures.GetDailyPricesCountBase} {where}";
        var totalCount = await connection.ExecuteScalarAsync<long>(countSql, p);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));

        p.Add("safeLimit", safeLimit);
        p.Add("offset", offset);

        var swapFilter = request.OnlySwaps ? "WHERE source = 'COINGECKO'" : "";
        var sql = string.Format(StoredProcedures.GetDailyPricesRatedBase, swapFilter, where);

        var rows = (await connection.QueryAsync<dynamic>(sql, p)).ToList();

        var ath = await connection.QueryFirstOrDefaultAsync<dynamic>(StoredProcedures.GetCoingeckoAthPrice);
        var atl = await connection.QueryFirstOrDefaultAsync<dynamic>(StoredProcedures.GetCoingeckoAtlPrice);
        var totalDays = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetDailyPricesTotalDays);
        var swapDays = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetCoingeckoSwapDays);

        return new
        {
            rates = rows,
            pagination = new
            {
                page = safePage,
                limit = safeLimit,
                totalCount,
                totalPages,
                hasNextPage = safePage < totalPages,
                hasPrevPage = safePage > 1
            },
            summary = new
            {
                totalDays,
                swapDays,
                latestPrice = _latestPrice,
                ath = ath != null ? new { day = (string)ath.day, price = (double)ath.price_usd } : null,
                atl = atl != null ? new { day = (string)atl.day, price = (double)atl.price_usd } : null
            }
        };
    }
}
