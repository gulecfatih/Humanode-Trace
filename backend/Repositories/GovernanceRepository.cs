using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface IGovernanceRepository
{
    Task<GovernanceAnalyticsDto> GetGovernanceAnalyticsAsync();
    Task<object> GetUnlocksAndSwapsAnalyticsAsync(string category = "all", int page = 1, int limit = 50, string q = "");
}

public class GovernanceRepository : IGovernanceRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public GovernanceRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<GovernanceAnalyticsDto> GetGovernanceAnalyticsAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        const string sudoKey = "hmt3zuFmJpA9ohqFqbuRskS7bSKkxBtkddk6WySqwsNcYxFcY";

        const string sudoSql = @"
            SELECT block_number, timestamp, signer, method, details
            FROM substrate_extrinsics
            WHERE pallet = 'sudo'
            ORDER BY block_number DESC
            LIMIT 20";
        var sudoTxs = (await connection.QueryAsync<dynamic>(sudoSql)).ToList<object>();

        const string msStatsSql = @"
            SELECT COUNT(*) as total_txs, COUNT(DISTINCT signer) as unique_signers
            FROM substrate_extrinsics
            WHERE pallet = 'multisig'";
        var msStats = await connection.QueryFirstOrDefaultAsync<(int total_txs, int unique_signers)>(msStatsSql);

        const string msRecentSql = @"
            SELECT block_number, timestamp, signer, method, details, fee_hmnd
            FROM substrate_extrinsics
            WHERE pallet = 'multisig'
            ORDER BY block_number DESC
            LIMIT 15";
        var msRecent = (await connection.QueryAsync<dynamic>(msRecentSql)).ToList<object>();

        return new GovernanceAnalyticsDto
        {
            SudoKey = sudoKey,
            TotalSudoCalls = sudoTxs.Count,
            RecentSudoCalls = sudoTxs,
            MultisigStats = new MultisigStatsDto
            {
                TotalTxs = msStats.total_txs,
                UniqueSigners = msStats.unique_signers
            },
            RecentMultisigCalls = msRecent,
            SpecVersion = 135,
            Chain = "Humanode Mainnet"
        };
    }

    public async Task<object> GetUnlocksAndSwapsAnalyticsAsync(string category = "all", int page = 1, int limit = 50, string q = "")
    {
        var safePage = Math.Max(1, page);
        var safeLimit = Math.Clamp(limit, 1, 250);
        var offset = (safePage - 1) * safeLimit;
        var cleanQ = (q ?? "").Trim();
        var cat = (category ?? "all").Trim();

        using var connection = _dbFactory.CreateConnection();

        const string VESTING_VAULTS = "('hmoSQfhjSfTma4wsprfarynvpNGiuHSgA6dGwpVnU8AYy9LMY', 'hmsQhDefepRwhF8dpGwYCnb13t18V5mHUm6AqpYDZxMvF3e4X')";

        // KPIs across pallets
        string kpiVesting = $"SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'vesting' OR (signer IN {VESTING_VAULTS} AND pallet = 'balances' AND value_hmnd > 0)";
        var vRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(kpiVesting);

        const string kpiClaims = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'tokenClaims'";
        var tcRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(kpiClaims);

        const string kpiSwaps = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'nativeToEvmSwap'";
        var neRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(kpiSwaps);

        const string kpiCurSwaps = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'currencySwap'";
        var csRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(kpiCurSwaps);

        const string kpiMultisig = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'multisig'";
        var msRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(kpiMultisig);

        var kpis = new
        {
            vesting = vRow.c,
            vesting_amount_hmnd = Math.Round(vRow.val, 2),
            tokenClaims = tcRow.c,
            tokenClaims_amount_hmnd = Math.Round(tcRow.val, 2),
            nativeToEvmSwap = neRow.c,
            nativeToEvmSwap_amount_hmnd = Math.Round(neRow.val, 2),
            currencySwap = csRow.c,
            currencySwap_amount_hmnd = Math.Round(csRow.val, 2),
            multisig = msRow.c,
            multisig_amount_hmnd = Math.Round(msRow.val, 2),
            total = vRow.c + tcRow.c + neRow.c + csRow.c + msRow.c
        };

        var p = new DynamicParameters();
        string whereSql;
        if (cat == "vesting")
        {
            whereSql = $"WHERE (pallet = 'vesting' OR (signer IN {VESTING_VAULTS} AND pallet = 'balances' AND value_hmnd > 0))";
        }
        else if (cat is "tokenClaims" or "nativeToEvmSwap" or "currencySwap" or "multisig")
        {
            whereSql = "WHERE pallet = @cat";
            p.Add("cat", cat);
        }
        else
        {
            whereSql = $"WHERE (pallet IN ('vesting', 'tokenClaims', 'nativeToEvmSwap', 'currencySwap', 'multisig') OR (signer IN {VESTING_VAULTS} AND pallet = 'balances' AND value_hmnd > 0))";
        }

        if (!string.IsNullOrEmpty(cleanQ))
        {
            whereSql += " AND (signer LIKE @qTerm OR target LIKE @qTerm OR hash LIKE @qTerm)";
            p.Add("qTerm", $"%{cleanQ}%");
        }

        var totalCount = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM substrate_extrinsics {whereSql}", p);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));

        p.Add("safeLimit", safeLimit);
        p.Add("offset", offset);

        string dataSql = $@"
            SELECT
                hash, block_number, timestamp, pallet, method, signer, target,
                value_hmnd, fee_hmnd, status, details
            FROM substrate_extrinsics
            {whereSql}
            ORDER BY timestamp DESC, block_number DESC
            LIMIT @safeLimit OFFSET @offset";

        var rawItems = (await connection.QueryAsync<dynamic>(dataSql, p)).ToList();
        var items = rawItems.Select(item =>
        {
            var dict = (IDictionary<string, object>)item;
            string s = dict.ContainsKey("signer") && dict["signer"] != null ? dict["signer"].ToString()! : "";
            string pal = dict.ContainsKey("pallet") && dict["pallet"] != null ? dict["pallet"].ToString()! : "";
            if ((s == "hmoSQfhjSfTma4wsprfarynvpNGiuHSgA6dGwpVnU8AYy9LMY" || s == "hmsQhDefepRwhF8dpGwYCnb13t18V5mHUm6AqpYDZxMvF3e4X") && pal == "balances")
            {
                dict["pallet"] = "vesting";
                dict["method"] = "hakedisTransferi";
                dict["details"] = "Humanode Vakfı & Vesting Kilit Açılım Transferi";
            }
            return dict;
        }).ToList();

        return new
        {
            kpis,
            items,
            pagination = new
            {
                page = safePage,
                limit = safeLimit,
                totalCount,
                totalPages,
                hasNextPage = safePage < totalPages,
                hasPrevPage = safePage > 1
            }
        };
    }
}
