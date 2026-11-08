using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ILeaderboardRepository
{
    Task<LeaderboardDto> GetLeaderboardStatsAsync();
}

public class LeaderboardRepository : ILeaderboardRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private static LeaderboardDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public LeaderboardRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<LeaderboardDto> GetLeaderboardStatsAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        // 1. Top Senders - EVM
        const string evmSendersSql = @"
            SELECT
                from_address as Address,
                'EVM' as Layer,
                COUNT(*) as TotalTxs,
                COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
                COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
                MAX(timestamp) as LastSeen
            FROM transactions
            WHERE from_address > ''
            GROUP BY from_address
            ORDER BY TotalTxs DESC
            LIMIT 50";
        var evmSenders = (await connection.QueryAsync<LeaderboardItemDto>(evmSendersSql)).ToList();

        // 2. Top Senders - Substrate
        const string subSendersSql = @"
            SELECT
                signer as Address,
                'Substrate' as Layer,
                COUNT(*) as TotalTxs,
                COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
                COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
                MAX(timestamp) as LastSeen
            FROM substrate_extrinsics
            WHERE signer > ''
            GROUP BY signer
            ORDER BY TotalTxs DESC
            LIMIT 50";
        var subSenders = (await connection.QueryAsync<LeaderboardItemDto>(subSendersSql)).ToList();

        var allSenders = evmSenders.Concat(subSenders)
            .OrderByDescending(x => x.TotalTxs)
            .Take(50)
            .ToList();

        // 3. Top Volume - EVM
        const string evmVolumeSql = @"
            SELECT
                address as Address,
                'EVM' as Layer,
                SUM(tx_count) as TotalTxs,
                SUM(vol) as TotalVolumeHmnd,
                MAX(last_active) as LastSeen
            FROM (
                SELECT from_address as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM transactions WHERE value_hmnd > 0 GROUP BY from_address
                UNION ALL
                SELECT to_address as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM transactions WHERE value_hmnd > 0 GROUP BY to_address
            )
            WHERE address > ''
            GROUP BY address
            ORDER BY TotalVolumeHmnd DESC
            LIMIT 50";
        var evmVolume = (await connection.QueryAsync<LeaderboardItemDto>(evmVolumeSql)).ToList();

        // 4. Top Volume - Substrate
        const string subVolumeSql = @"
            SELECT
                address as Address,
                'Substrate' as Layer,
                SUM(tx_count) as TotalTxs,
                SUM(vol) as TotalVolumeHmnd,
                MAX(last_active) as LastSeen
            FROM (
                SELECT signer as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM substrate_extrinsics WHERE value_hmnd > 0 GROUP BY signer
                UNION ALL
                SELECT target as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM substrate_extrinsics WHERE value_hmnd > 0 GROUP BY target
            )
            WHERE address > ''
            GROUP BY address
            ORDER BY TotalVolumeHmnd DESC
            LIMIT 50";
        var subVolume = (await connection.QueryAsync<LeaderboardItemDto>(subVolumeSql)).ToList();

        var allVolume = evmVolume.Concat(subVolume)
            .OrderByDescending(x => x.TotalVolumeHmnd)
            .Take(50)
            .ToList();

        // 5. Top Fees - EVM
        const string evmFeesSql = @"
            SELECT
                from_address as Address,
                'EVM' as Layer,
                COUNT(*) as TotalTxs,
                COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
                COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
                MAX(timestamp) as LastSeen
            FROM transactions
            WHERE fee_hmnd > 0.000001 AND from_address > ''
            GROUP BY from_address
            ORDER BY TotalFeesHmnd DESC
            LIMIT 50";
        var evmFees = (await connection.QueryAsync<LeaderboardItemDto>(evmFeesSql)).ToList();

        // 6. Top Fees - Substrate
        const string subFeesSql = @"
            SELECT
                signer as Address,
                'Substrate' as Layer,
                COUNT(*) as TotalTxs,
                COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
                COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
                MAX(timestamp) as LastSeen
            FROM substrate_extrinsics
            WHERE fee_hmnd > 0.000001 AND signer > ''
            GROUP BY signer
            ORDER BY TotalFeesHmnd DESC
            LIMIT 50";
        var subFees = (await connection.QueryAsync<LeaderboardItemDto>(subFeesSql)).ToList();

        var allFees = evmFees.Concat(subFees)
            .OrderByDescending(x => x.TotalFeesHmnd)
            .Take(50)
            .ToList();

        // 7. Top Balances - EVM
        const string evmBalancesSql = @"
            SELECT
                address as Address,
                'EVM' as Layer,
                SUM(inflow - outflow - fee) as BalanceHmnd,
                SUM(inflow + outflow) as TotalVolumeHmnd,
                SUM(fee) as TotalFeesHmnd,
                SUM(tx_count) as TotalTxs,
                MAX(last_seen) as LastSeen
            FROM (
                SELECT to_address as address, SUM(value_hmnd) as inflow, 0.0 as outflow, 0.0 as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
                FROM transactions WHERE to_address > '' AND status = 1 AND value_hmnd > 0 GROUP BY to_address
                UNION ALL
                SELECT from_address as address, 0.0 as inflow, SUM(value_hmnd) as outflow, SUM(fee_hmnd) as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
                FROM transactions WHERE from_address > '' AND status = 1 GROUP BY from_address
            )
            WHERE address LIKE '0x%'
            GROUP BY address
            HAVING BalanceHmnd > 0
            ORDER BY BalanceHmnd DESC
            LIMIT 50";
        var evmBalances = (await connection.QueryAsync<LeaderboardItemDto>(evmBalancesSql)).ToList();

        // 8. Top Balances - Substrate
        const string subBalancesSql = @"
            SELECT
                address as Address,
                'Substrate' as Layer,
                SUM(inflow - outflow - fee) as BalanceHmnd,
                SUM(inflow + outflow) as TotalVolumeHmnd,
                SUM(fee) as TotalFeesHmnd,
                SUM(tx_count) as TotalTxs,
                MAX(last_seen) as LastSeen
            FROM (
                SELECT target as address, SUM(value_hmnd) as inflow, 0.0 as outflow, 0.0 as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
                FROM substrate_extrinsics WHERE target > '' AND status = 1 AND value_hmnd > 0 GROUP BY target
                UNION ALL
                SELECT signer as address, 0.0 as inflow, SUM(value_hmnd) as outflow, SUM(fee_hmnd) as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
                FROM substrate_extrinsics WHERE signer > '' AND status = 1 GROUP BY signer
            )
            WHERE address LIKE 'hm%'
            GROUP BY address
            HAVING BalanceHmnd > 0
            ORDER BY BalanceHmnd DESC
            LIMIT 50";
        var subBalances = (await connection.QueryAsync<LeaderboardItemDto>(subBalancesSql)).ToList();

        // Live balance overlay from wallet_balances_cache
        const string cacheSql = "SELECT address, balance_hmnd FROM wallet_balances_cache";
        var cachedBalances = (await connection.QueryAsync<(string address, double balance_hmnd)>(cacheSql))
            .ToDictionary(k => k.address, v => v.balance_hmnd);

        foreach (var item in subBalances)
        {
            if (cachedBalances.TryGetValue(item.Address, out var liveBal))
            {
                item.BalanceHmnd = liveBal;
            }
        }
        foreach (var item in evmBalances)
        {
            if (cachedBalances.TryGetValue(item.Address, out var liveBal))
            {
                item.BalanceHmnd = liveBal;
            }
        }

        subBalances = subBalances.OrderByDescending(x => x.BalanceHmnd).ToList();
        evmBalances = evmBalances.OrderByDescending(x => x.BalanceHmnd).ToList();

        var allBalances = evmBalances.Concat(subBalances)
            .OrderByDescending(x => x.BalanceHmnd)
            .Take(50)
            .ToList();

        var result = new LeaderboardDto
        {
            TopBalances = allBalances,
            TopBalancesEvm = evmBalances,
            TopBalancesSubstrate = subBalances,
            TopSenders = allSenders,
            TopSendersEvm = evmSenders,
            TopSendersSubstrate = subSenders,
            TopVolume = allVolume,
            TopVolumeEvm = evmVolume,
            TopVolumeSubstrate = subVolume,
            TopFeeSpenders = allFees,
            TopFeeSpendersEvm = evmFees,
            TopFeeSpendersSubstrate = subFees
        };

        _cached = result;
        _cacheTime = DateTime.UtcNow;

        return result;
    }
}
