using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ITokenRepository
{
    Task<TokenDirectoryResultDto> GetTokenDirectoryAsync();
}

public class TokenDirectoryResultDto
{
    public List<TokenDto> Tokens { get; set; } = new();
    public List<PoolDto> TopPools { get; set; } = new();
}

public class PoolDto
{
    public string PoolAddress { get; set; } = "";
    public long SwapCount { get; set; }
    public int TokenTypes { get; set; }
    public string TokensInvolved { get; set; } = "";
    public double TotalTokenVolume { get; set; }
    public long LastActive { get; set; }
}

public class TokenRepository : ITokenRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private static TokenDirectoryResultDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(20);

    private static readonly Dictionary<string, (string symbol, string name, string category, string color)> KnownMetadata =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["0x0000000000000000000000000000000000000802"] = ("WeHMND", "Wrapped eHMND (Native Bridged)", "Native Bridged", "teal"),
            ["0x33e5b3e24501774598367bc0832b52787ac39ca5"] = ("USDC", "USD Coin (ChainPort Bridged)", "Sabit Kripto (Stablecoin)", "blue"),
            ["0xa73b7ee7d585e032f11adfac1eec7415c93fe65f"] = ("WETH", "Wrapped Ether (WETH Bridged)", "Sarılmış Kripto (Wrapped)", "cyan"),
            ["0xd241d51cf9152d63d9b04645125b36a51c147c15"] = ("WBTC", "Wrapped Bitcoin (WBTC Bridged)", "Sarılmış Kripto (Wrapped)", "orange"),
            ["0xe48cc340b8f1ac0a326577b3c2d1fe5229ebb1c2"] = ("IF-LP: WeHMND/USDC", "Impossible Finance: WeHMND / USDC Havuzu (DEX LP)", "DEX LP Havuzu", "violet"),
            ["0xd39111ff6649f78c4c9b9bb975886f6e062b653d"] = ("IF-LP: WeHMND/WETH", "Impossible Finance: WeHMND / WETH Havuzu (DEX LP)", "DEX LP Havuzu", "violet"),
            ["0x58d1d314abc3fb9896e30316cf2527aa14c8f680"] = ("IF-LP: WeHMND/WBTC", "Impossible Finance: WeHMND / WBTC Havuzu (DEX LP)", "DEX LP Havuzu", "violet"),
            ["0xcf1b51c5652852a931cbb39a45d9df0850902e70"] = ("HPEPE", "Humanode Pepe (Meme Token)", "Meme Token", "green"),
            ["0x38d7b516d3d47641674e2c7ebf6a4c3462140e44"] = ("WOOF", "Woof Token (Humanode Topluluk)", "Meme Token", "yellow"),
            ["0x0553764662e3de189ad00292bfcf2c182b75d0d1"] = ("MBG", "MBG GameFi Ekosistem Tokenı", "GameFi / Ekosistem", "pink"),
            ["0xec3473b13bff64cfc7e15d7d1ea7063c2fac6560"] = ("BOTK", "Botk AI & Bot Ağı Protokol Tokenı", "Yapay Zeka / Bot", "grape"),
            ["0x7302cd7bc97719f81322ad43c9f8feb6fe006f8d"] = ("RBCP", "Rubic Protocol Çapraz Ağ Tokenı", "Çapraz Ağ DEX", "indigo"),
            ["0x37c57a89812a0d492aeed7691f1610ca0a8f74a1"] = ("OCX", "OceanEx Topluluk Tokenı", "Ekosistem Tokenı", "red")
        };

    public TokenRepository(IDbConnectionFactory dbFactory)
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

        const string tokenSql = @"
            SELECT
                t.token_symbol as Symbol,
                t.token_address as TokenAddress,
                COUNT(*) as TransferCount,
                COALESCE(SUM(t.amount), 0) as TotalVolume,
                COUNT(DISTINCT t.from_address) as UniqueSenders,
                COUNT(DISTINCT t.to_address) as UniqueHolders,
                MIN(t.timestamp) as FirstSeen,
                MAX(t.timestamp) as LastSeen
            FROM token_transfers t
            GROUP BY t.token_address, t.token_symbol
            ORDER BY TransferCount DESC";

        var rawTokens = (await connection.QueryAsync<TokenDto>(tokenSql)).ToList();

        var tokens = new List<TokenDto>();
        foreach (var t in rawTokens)
        {
            var addr = (t.TokenAddress ?? "").ToLowerInvariant();
            KnownMetadata.TryGetValue(addr, out var meta);

            var sym = meta.symbol;
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

            var name = meta.name;
            if (string.IsNullOrEmpty(name))
            {
                if (sym.StartsWith("IF-LP:"))
                    name = $"Impossible Finance: {sym.Replace("IF-LP:", "").Trim()} Likidite Havuzu";
                else if (sym != "TOKEN" && !sym.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
                    name = $"{sym} Token";
                else
                    name = "Özel ERC-20 Sözleşmesi";
            }

            var category = meta.category;
            if (string.IsNullOrEmpty(category))
            {
                if (sym.StartsWith("IF-LP:")) category = "DEX LP Havuzu";
                else if (sym is "USDC" or "USDT") category = "Sabit Kripto (Stablecoin)";
                else if (sym is "WETH" or "WBTC") category = "Sarılmış Kripto (Wrapped)";
                else if (sym == "HPEPE" || sym.Contains("woof", StringComparison.OrdinalIgnoreCase)) category = "Meme Token";
                else category = "ERC-20 Token";
            }

            var color = meta.color;
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
            t.Address = t.TokenAddress;
            tokens.Add(t);
        }

        const string poolsSql = @"
            SELECT
                to_address as PoolAddress,
                COUNT(*) as SwapCount,
                COUNT(DISTINCT token_symbol) as TokenTypes,
                GROUP_CONCAT(DISTINCT token_symbol) as TokensInvolved,
                SUM(amount) as TotalTokenVolume,
                MAX(timestamp) as LastActive
            FROM token_transfers
            GROUP BY to_address
            ORDER BY SwapCount DESC
            LIMIT 15";

        var topPools = (await connection.QueryAsync<PoolDto>(poolsSql)).ToList();

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
