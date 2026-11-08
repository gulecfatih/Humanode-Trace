using System.Data;
using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IBridgeRepository
{
    Task<object> GetBridgeAnalyticsAsync(string direction = "all", int page = 1, int limit = 50, string q = "");
}

public class BridgeRepository : IBridgeRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public BridgeRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<object> GetBridgeAnalyticsAsync(string direction = "all", int page = 1, int limit = 50, string q = "")
    {
        var safePage = Math.Max(1, page);
        var safeLimit = Math.Clamp(limit, 1, 200);
        var cleanQ = (q ?? "").Trim().ToLower();
        var dir = (direction ?? "all").Trim().ToLower();

        using var connection = _dbFactory.CreateConnection();

        // 1. KPIs
        const string subKpiSql = @"
            SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
            FROM substrate_extrinsics
            WHERE pallet = 'nativeToEvmSwap'";
        var subKpi = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(subKpiSql);

        const string evmKpiSql = @"
            SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
            FROM transactions
            WHERE to_address = '0x0000000000000000000000000000000000000900'";
        var evmKpi = await connection.QueryFirstOrDefaultAsync<(long c, double vol)>(evmKpiSql);

        const string crossCountSql = "SELECT COUNT(*) FROM cross_layer_links";
        var crossMatchedCount = await connection.ExecuteScalarAsync<long>(crossCountSql);

        var subVol = subKpi.vol;
        var evmVol = evmKpi.vol;
        var totalVolume = subVol + evmVol;
        var totalSwaps = subKpi.c + evmKpi.c;

        var kpis = new
        {
            total_volume_hmnd = Math.Round(totalVolume, 2),
            total_swaps = totalSwaps,
            sub_to_evm_count = subKpi.c,
            sub_to_evm_volume_hmnd = Math.Round(subVol, 2),
            evm_to_sub_count = evmKpi.c,
            evm_to_sub_volume_hmnd = Math.Round(evmVol, 2),
            net_flow_hmnd = Math.Round(subVol - evmVol, 2),
            net_direction = subVol >= evmVol ? "Substrate ➔ EVM (Net Çıkış)" : "EVM ➔ Substrate (Net Giriş)",
            cross_layer_matched_wallets = crossMatchedCount,
            precompile_address = "0x0000000000000000000000000000000000000900"
        };

        // 2. Fetch Items
        var items = new List<dynamic>();

        string whereSub = "pallet = 'nativeToEvmSwap'";
        string whereEvm = "to_address = '0x0000000000000000000000000000000000000900'";
        var subP = new DynamicParameters();
        var evmP = new DynamicParameters();

        if (!string.IsNullOrEmpty(cleanQ))
        {
            whereSub += " AND (signer LIKE @q OR target LIKE @q OR hash LIKE @q OR CAST(block_number AS TEXT) LIKE @q)";
            subP.Add("q", $"%{cleanQ}%");

            whereEvm += " AND (from_address LIKE @q OR to_address LIKE @q OR hash LIKE @q OR CAST(block_number AS TEXT) LIKE @q)";
            evmP.Add("q", $"%{cleanQ}%");
        }

        if (dir is "all" or "sub_to_evm")
        {
            string sqlSub = $@"
                SELECT
                    'sub_to_evm' as direction,
                    'Substrate ➔ EVM' as direction_label,
                    'Substrate' as source_layer,
                    'EVM' as target_layer,
                    block_number,
                    hash as tx_hash,
                    timestamp,
                    signer as from_address,
                    target as to_address,
                    value_hmnd,
                    fee_hmnd,
                    status,
                    method
                FROM substrate_extrinsics
                WHERE {whereSub}
                ORDER BY block_number DESC
                LIMIT 1000";

            var subRows = await connection.QueryAsync<dynamic>(sqlSub, subP);
            items.AddRange(subRows);
        }

        if (dir is "all" or "evm_to_sub")
        {
            string sqlEvm = $@"
                SELECT
                    'evm_to_sub' as direction,
                    'EVM ➔ Substrate' as direction_label,
                    'EVM' as source_layer,
                    'Substrate' as target_layer,
                    block_number,
                    hash as tx_hash,
                    timestamp,
                    from_address,
                    to_address,
                    value_hmnd,
                    fee_hmnd,
                    status,
                    'transact (0x0900 precompile)' as method
                FROM transactions
                WHERE {whereEvm}
                ORDER BY block_number DESC
                LIMIT 1000";

            var evmRows = await connection.QueryAsync<dynamic>(sqlEvm, evmP);
            items.AddRange(evmRows);
        }

        // Sort items by timestamp / block_number desc
        var sorted = items.OrderByDescending(x => (long)(x.timestamp ?? 0))
                          .ThenByDescending(x => (long)(x.block_number ?? 0))
                          .ToList();

        var totalCount = sorted.Count;
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));
        var paginatedItems = sorted.Skip((safePage - 1) * safeLimit).Take(safeLimit).ToList();

        return new
        {
            kpis,
            items = paginatedItems,
            pagination = new
            {
                page = safePage,
                limit = safeLimit,
                totalCount,
                totalPages
            }
        };
    }
}
