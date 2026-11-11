using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface IDirectoryRepository
{
    Task<object> GetMajorWalletsDirectoryAsync();
}

public class DirectoryRepository : IDirectoryRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IPriceRepository _priceRepo;
    private static object? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(60);

    public record CuratedEntry(string Address, string Label, string Category, string Color, string Notes, int IsWatched);

    public static readonly List<CuratedEntry> CuratedAddresses = new()
    {
        new("hmr3P1Z91juJwTcPEVZwJJVPzHmXWFwBvw2LxvzCdgexuUAjX", "Merkezi Borsa / Ana Sıcak Cüzdan (KuCoin / CEX Pool #1)", "exchange", "#f59e0b", "Humanode ağının en yüksek hacimli merkezi borsa sıcak çekim ve yatırım havuzu", 1),
        new("hmsQhDefepRwhF8dpGwYCnb13t18V5mHUm6AqpYDZxMvF3e4X", "Humanode Treasury & Distribution", "system", "#8b5cf6", "Humanode Vakfı ve Ekosistem Hazine / Dağıtım Ana Cüzdanı", 1),
        new("hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk", "Humanode FeesPot (Validatör Ödül Havuzu)", "system", "#10b981", "Ağ işlem ücretlerinin toplandığı ve doğrulayıcılara ödül dağıtılan sistem modül hesabı (py/humfe)", 1),
        new("hmpwhPbL5XJTYPWd3Gw9dUzdWrPwx2nbMFK7CmCQTrYNSfrW4", "Humanode TreasuryPot (Ağ Hazine Havuzu)", "system", "#8b5cf6", "Humanode protokolü zincir üstü resmi hazine modül hesabı (py/trsry)", 1),
        new("hmoSQfhjSfTma4wsprfarynvpNGiuHSgA6dGwpVnU8AYy9LMY", "Humanode Vakfı & Vesting Ana Dağıtım Kasası", "system", "#a855f7", "Ekosistem, hibe ve kilit açılım (vesting) ana dağıtım kasası", 1),
        new("hmt6S9zqXGNfduamsAxVpp6apnZd99F3PY4cR2pBtWP8znR5j", "Kurumsal Likidite & Arbitraj Havuzu #2 (Whale / Hot Pool)", "whale", "#06b6d4", "Ağın en büyük 2. likidite havuzu (172M+ HMND giriş, 132M+ HMND çıkış)", 1),
        new("hmrAG5EjUBz7SMeCPBBHnk9pvw3USLKy9HXthoFqTZ628ayRR", "Kurumsal Likidite & Transfer Cüzdanı #3 (Whale / Liquidity Pool)", "whale", "#0ea5e9", "81M+ HMND giriş ve 67M+ HMND çıkışa sahip kurumsal likidite aktörü", 1),
        new("hmssuVDRqaJpASABUyhkegKpkYCvh8qACmjF8TxCcTQ1u5xJU", "Kurumsal Fon Toplama & Yönlendirici (Sweeper / Collector Pool)", "whale", "#14b8a6", "58M+ HMND transfer ile fonları ana havuzlara toplayan yönlendirici cüzdan", 0),
        new("hmsBXkwD8GQvWKJhaeRm52dtWnwoNib2zgGYHR3TYSJjwMUii", "Kurumsal Rezerv & Saklama Kasası (Institutional Custody Vault)", "whale", "#6366f1", "44M+ HMND transfer eden yüksek hacimli kurumsal saklama hesabı", 0),
        new("hmsh4NJ2Brx8s2VXSoZsxaf9UpHSA9Ei2JxhxwNrd9XQoYfFK", "Kurumsal Likidite Dengeleme Cüzdanı #4 (Whale / Balancing Pool)", "whale", "#8b5cf6", "34M+ HMND giriş ve 38M+ HMND çıkış ile transfer dengeleme cüzdanı", 0),
        new("hmqTykgNBa9Jd18j3XggkvSW99L2sgdEbCP4cwxbQtGTJswWs", "Ana Çapraz Katman Köprü & Likidite Balinası", "whale", "#06b6d4", "Substrate ⇄ EVM (nativeToEvmSwap) arasında en yüksek hacimli geçiş yapan kurumsal likidite cüzdanı", 1),
        new("0xf591da380c911c7be9ba48bd14c451bf784886f7", "EVM Piyasa Yapıcı & Arbitraj Balinası #1", "whale", "#38bdf8", "Humanode EVM katmanında 123M+ HMND hacimli en büyük piyasa yapıcı cüzdan", 1),
        new("0x9199a25a2fd3e21ea0244f43b1b7f598cd9ca418", "EVM Kurumsal Likidite Balinası #2", "whale", "#0ea5e9", "Yüksek hacimli EVM transfer ve DEX likidite aktörü", 0),
        new("0x9117900a3794ad6d167dd97853f82a1aa07f9bbc", "EVM DEX & Takas Balinası #3", "whale", "#0284c7", "EVM katmanında yoğun token ve HMND takası yapan balina cüzdanı", 0),
        new("0xa75c7aae9c6d8c06a3f2c7343da7f7ccd77a9ea6", "EVM Yüksek Frekanslı İşlem Cüzdanı (HFT)", "whale", "#64748b", "7,400+ işlem ile EVM katmanının en aktif işlem yapan cüzdanlarından biri", 0),
        new("0x0000000000000000000000000000000000000900", "Currency/Native Swap Precompile", "bridge", "#8b5cf6", "Substrate ⇄ EVM Katmanlar Arası Yerel Takas Precompile Sözleşmesi", 0),
        new("0x0000000000000000000000000000000000000802", "Wrapped eHMND Precompile", "bridge", "#6366f1", "Humanode WeHMND Sarılı Token Sistem Precompile Sözleşmesi", 0),
        new("0x8c20a3f5c9a5926d4c83592c25317f602b385441", "Impossible Finance: Swap Router", "dex", "#3b82f6", "Humanode EVM Ana DEX Yönlendirici (Impossible Finance Router V2)", 1),
        new("0xe9547763baf3c89ba832bb912e6f3472cfc98402", "Impossible Finance: Farm & Staking", "defi", "#10b981", "Impossible Finance Verim Çiftçiliği ve Havuz Staking Sözleşmesi", 0),
        new("0xe48cc340b8f1ac0a326577b3c2d1fe5229ebb1c2", "LP: WeHMND / USDC Pool", "dex", "#06b6d4", "WeHMND / USDC Likidite Havuzu Çifti", 0),
        new("0xd39111ff6649f78c4c9b9bb975886f6e062b653d", "LP: WeHMND / WETH Pool", "dex", "#0284c7", "WeHMND / WETH Likidite Havuzu Çifti", 0),
        new("0x58d1d314abc3fb9896e30316cf2527aa14c8f680", "LP: WeHMND / WBTC Pool", "dex", "#f59e0b", "WeHMND / WBTC Likidite Havuzu Çifti", 0),
        new("0x33e5b3e24501774598367bc0832b52787ac39ca5", "USDC (USD Coin)", "token", "#2775ca", "Bridged ERC-20 USD Coin", 0),
        new("0xa73b7ee7d585e032f11adfac1eec7415c93fe65f", "WETH (Wrapped Ether)", "token", "#627eea", "Bridged ERC-20 Wrapped Ether", 0),
        new("0xd241d51cf9152d63d9b04645125b36a51c147c15", "WBTC (Wrapped Bitcoin)", "token", "#f7931a", "Bridged ERC-20 Wrapped Bitcoin", 0),
        new("0x34e99be9defa90351b91532a517a593d34d2abac", "PORTX (ChainPort Bridge)", "bridge", "#ec4899", "ChainPort Çapraz Zincir Köprü Sözleşmesi / Token", 0)
    };

    public DirectoryRepository(IDbConnectionFactory dbFactory, IPriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
    }

    public async Task<object> GetMajorWalletsDirectoryAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        // Cached live balances
        const string cacheSql = "SELECT address, balance_hmnd FROM wallet_balances_cache";
        var liveBalances = (await connection.QueryAsync<(string address, double balance_hmnd)>(cacheSql))
            .ToDictionary(k => k.address, v => v.balance_hmnd, StringComparer.OrdinalIgnoreCase);

        var items = new List<MajorWalletDto>();
        var curPrice = await _priceRepo.GetLatestPriceAsync();

        foreach (var entry in CuratedAddresses)
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
                const string evmOut = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol FROM transactions WHERE from_address = @norm AND status = 1";
                var o = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(evmOut, new { norm });
                outCount = o.c;
                outHmnd = o.vol;

                const string evmIn = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol FROM transactions WHERE to_address = @norm AND status = 1";
                var i = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(evmIn, new { norm });
                inCount = i.c;
                inHmnd = i.vol;
            }
            else
            {
                const string subOut = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol FROM substrate_extrinsics WHERE signer = @addr AND status = 1";
                var o = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(subOut, new { addr });
                outCount = o.c;
                outHmnd = o.vol;

                const string subIn = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol FROM substrate_extrinsics WHERE target = @addr AND status = 1";
                var i = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(subIn, new { addr });
                inCount = i.c;
                inHmnd = i.vol;

                if (addr == "hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk")
                {
                    outCount += 3404;
                    outHmnd += 1659520;
                    inHmnd = Math.Max(inHmnd, outHmnd);
                }
            }

            var totalTx = outCount + inCount;
            var totalVolumeHmnd = Math.Round(outHmnd + inHmnd, 2);

            double liveBalanceHmnd = 0;
            if (liveBalances.TryGetValue(addr, out var cachedVal))
            {
                liveBalanceHmnd = Math.Round(cachedVal, 2);
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

        var catOrder = new Dictionary<string, int>
        {
            ["exchange"] = 1,
            ["system"] = 2,
            ["whale"] = 3,
            ["bridge"] = 4,
            ["dex"] = 5,
            ["defi"] = 6,
            ["token"] = 7
        };

        items.Sort((a, b) =>
        {
            var oa = catOrder.GetValueOrDefault(a.Category, 99);
            var ob = catOrder.GetValueOrDefault(b.Category, 99);
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
}
