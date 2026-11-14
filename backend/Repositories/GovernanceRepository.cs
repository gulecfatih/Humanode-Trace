using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class GovernanceRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly SystemConfigRepository _configRepo;

    public GovernanceRepository(SqliteConnectionFactory dbFactory, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _configRepo = configRepo;
    }

    public async Task<GovernanceAnalyticsDto> GetGovernanceAnalyticsAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        var sudoKey = await _configRepo.GetConfigAsync("sudo_address");

        var sudoTxs = (await connection.QueryAsync<dynamic>(StoredProcedures.GetGovernanceSudoCalls)).ToList<object>();
        var msStats = await connection.QueryFirstOrDefaultAsync<(int total_txs, int unique_signers)>(StoredProcedures.GetGovernanceMultisigStats);
        var msRecent = (await connection.QueryAsync<dynamic>(StoredProcedures.GetGovernanceRecentMultisigCalls)).ToList<object>();

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

    public async Task<object> GetUnlocksAndSwapsAnalyticsAsync(UnlocksAndSwapsQueryRequest req)
    {
        req ??= new UnlocksAndSwapsQueryRequest();
        var safePage = Math.Max(1, req.Page);
        var safeLimit = Math.Clamp(req.Limit, 1, 250);
        var offset = (safePage - 1) * safeLimit;
        var cleanQ = (req.Q ?? "").Trim();
        var cat = (req.Category ?? "all").Trim();

        using var connection = _dbFactory.CreateConnection();

        // KPIs across pallets
        var vRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(StoredProcedures.GetKpiVesting);
        var tcRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(StoredProcedures.GetKpiTokenClaims);
        var neRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(StoredProcedures.GetKpiNativeToEvmSwaps);
        var csRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(StoredProcedures.GetKpiCurrencySwaps);
        var msRow = await connection.QueryFirstOrDefaultAsync<(long c, double val)>(StoredProcedures.GetKpiMultisigCalls);

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
            whereSql = "WHERE (pallet = 'vesting' OR (signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault') AND pallet = 'balances' AND value_hmnd > 0))";
        }
        else if (cat is "tokenClaims" or "nativeToEvmSwap" or "currencySwap" or "multisig")
        {
            whereSql = "WHERE pallet = @cat";
            p.Add("cat", cat);
        }
        else
        {
            whereSql = "WHERE (pallet IN ('vesting', 'tokenClaims', 'nativeToEvmSwap', 'currencySwap', 'multisig') OR (signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault') AND pallet = 'balances' AND value_hmnd > 0))";
        }

        if (!string.IsNullOrEmpty(cleanQ))
        {
            whereSql += " AND (signer LIKE @qTerm OR target LIKE @qTerm OR hash LIKE @qTerm)";
            p.Add("qTerm", $"%{cleanQ}%");
        }

        var totalCount = await connection.ExecuteScalarAsync<long>($"{StoredProcedures.GetSubstrateExtrinsicsCountBase} {whereSql}", p);
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));

        p.Add("safeLimit", safeLimit);
        p.Add("offset", offset);

        string dataSql = $@"{StoredProcedures.GetGovernanceExtrinsicsBase}
            {whereSql}
            ORDER BY timestamp DESC, block_number DESC
            LIMIT @safeLimit OFFSET @offset";

        var items = (await connection.QueryAsync<GovernanceExtrinsicItemDto>(dataSql, p)).ToList();

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
