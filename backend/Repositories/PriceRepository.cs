using System.Data;
using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IPriceRepository
{
    Task<object> GetDailyPricesMapAsync();
    Task<object> GetHistoricalRatesListAsync(string year = "all", string search = "", bool onlySwaps = false, int page = 1, int limit = 50);
    Task<double> GetLatestPriceAsync();
}

public class PriceRepository : IPriceRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private static Dictionary<string, double>? _priceMap;
    private static double _latestPrice = 0.045;
    private static DateTime _cacheTime = DateTime.MinValue;

    public PriceRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    private async Task EnsureLoadedAsync()
    {
        if (_priceMap != null && DateTime.UtcNow - _cacheTime < TimeSpan.FromMinutes(10))
            return;

        using var connection = _dbFactory.CreateConnection();
        const string sql = "SELECT day, price_usd FROM hmnd_daily_prices ORDER BY day ASC";
        var rows = (await connection.QueryAsync<(string day, double price_usd)>(sql)).ToList();

        var dict = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            dict[r.day] = r.price_usd;
        }

        if (rows.Count > 0)
        {
            _latestPrice = rows[^1].price_usd;
        }

        _priceMap = dict;
        _cacheTime = DateTime.UtcNow;
    }

    public async Task<double> GetLatestPriceAsync()
    {
        await EnsureLoadedAsync();
        return _latestPrice;
    }

    public async Task<object> GetDailyPricesMapAsync()
    {
        await EnsureLoadedAsync();
        return new
        {
            prices = _priceMap ?? new Dictionary<string, double>(),
            latestPrice = _latestPrice
        };
    }

    public async Task<object> GetHistoricalRatesListAsync(string year = "all", string search = "", bool onlySwaps = false, int page = 1, int limit = 50)
    {
        await EnsureLoadedAsync();
        var safeLimit = Math.Clamp(limit, 1, 200);
        var safePage = Math.Max(1, page);
        var offset = (safePage - 1) * safeLimit;

        using var connection = _dbFactory.CreateConnection();
        var p = new DynamicParameters();
        var where = "WHERE 1=1";

        if (!string.IsNullOrEmpty(year) && year != "all")
        {
            where += " AND day LIKE @year";
            p.Add("year", $"{year}-%");
        }

        if (!string.IsNullOrEmpty(search))
        {
            where += " AND day LIKE @search";
            p.Add("search", $"%{search.Trim()}%");
        }

        if (onlySwaps)
        {
            where += " AND source = 'COINGECKO'";
        }

        var totalCount = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM hmnd_daily_prices {where}", p);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));

        p.Add("safeLimit", safeLimit);
        p.Add("offset", offset);

        string sql = $@"
            WITH rated AS (
                SELECT
                    day, price_usd, swaps_count, source,
                    LAG(price_usd) OVER (ORDER BY day ASC) AS prev_price
                FROM hmnd_daily_prices
                {(onlySwaps ? "WHERE source = 'COINGECKO'" : "")}
            )
            SELECT
                day, price_usd, swaps_count, source,
                CASE
                    WHEN prev_price IS NOT NULL AND prev_price > 0
                    THEN ((price_usd - prev_price) / prev_price) * 100
                    ELSE 0
                END AS change_pct
            FROM rated
            {where}
            ORDER BY day DESC
            LIMIT @safeLimit OFFSET @offset";

        var rows = (await connection.QueryAsync<dynamic>(sql, p)).ToList();

        var ath = await connection.QueryFirstOrDefaultAsync<dynamic>("SELECT day, price_usd FROM hmnd_daily_prices WHERE source = 'COINGECKO' ORDER BY price_usd DESC LIMIT 1");
        var atl = await connection.QueryFirstOrDefaultAsync<dynamic>("SELECT day, price_usd FROM hmnd_daily_prices WHERE source = 'COINGECKO' ORDER BY price_usd ASC LIMIT 1");
        var totalDays = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM hmnd_daily_prices");
        var swapDays = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM hmnd_daily_prices WHERE source = 'COINGECKO'");

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
