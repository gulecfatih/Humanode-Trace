using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class TokenRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private static TokenDirectoryResultDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(20);

    public TokenRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<TokenDirectoryResultDto> GetTokenDirectoryAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        var metaRows = (await connection.QueryAsync<(string Address, string Symbol, string Name, string Category, string Color)>(StoredProcedures.GetTokensMetadata)).ToList();

        var rawTokens = (await connection.QueryAsync<TokenDto>(StoredProcedures.GetTokenTransfersSummary)).ToList();

        var tokens = new List<TokenDto>();
        foreach (var t in rawTokens)
        {
            var addr = (t.TokenAddress ?? "").ToLowerInvariant();
            var meta = metaRows.FirstOrDefault(m => (m.Address ?? "").Equals(addr, StringComparison.OrdinalIgnoreCase));

            var sym = meta.Symbol;
            if (string.IsNullOrEmpty(sym))
            {
                if (!string.IsNullOrEmpty(t.Symbol) && !t.Symbol.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
                {
                    sym = t.Symbol;
                }
                else
                {
                    sym = addr.Length > 10 ? $"{addr[..6]}...{addr[^4..]}" : "TOKEN";
                }
            }

            var name = meta.Name;
            if (string.IsNullOrEmpty(name))
            {
                if (sym.StartsWith("IF-LP:"))
                    name = $"Impossible Finance: {sym.Replace("IF-LP:", "").Trim()} Pool";
                else if (sym != "TOKEN" && !sym.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
                    name = $"{sym} Token";
                else
                    name = "ERC-20 Contract";
            }

            var category = meta.Category;
            if (string.IsNullOrEmpty(category))
            {
                if (sym.StartsWith("IF-LP:")) category = "dex_lp";
                else if (sym is "USDC" or "USDT") category = "stablecoin";
                else if (sym is "WETH" or "WBTC") category = "wrapped";
                else if (sym == "HPEPE" || sym.Contains("woof", StringComparison.OrdinalIgnoreCase)) category = "meme";
                else category = "contract";
            }

            var color = meta.Color;
            if (string.IsNullOrEmpty(color))
            {
                if (sym.StartsWith("IF-LP:")) color = "violet";
                else if (sym is "USDC" or "USDT") color = "blue";
                else if (sym == "WETH") color = "cyan";
                else if (sym == "WBTC") color = "orange";
                else color = "teal";
            }

            t.Symbol = sym;
            t.TokenSymbol = sym;
            t.Name = name;
            t.TokenName = name;
            t.Category = category;
            t.Color = color;
            t.Address = t.TokenAddress ?? "";
            tokens.Add(t);
        }

        var topPools = (await connection.QueryAsync<PoolDto>(StoredProcedures.GetTopPools)).ToList();

        var result = new TokenDirectoryResultDto
        {
            Tokens = tokens,
            TopPools = topPools
        };

        _cached = result;
        _cacheTime = DateTime.UtcNow;

        return result;
    }
}
