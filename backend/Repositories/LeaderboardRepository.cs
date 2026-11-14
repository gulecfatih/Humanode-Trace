using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class LeaderboardRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private static LeaderboardDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(30);

    public LeaderboardRepository(SqliteConnectionFactory dbFactory)
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
        var evmSenders = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardSendersEvm)).ToList();

        // 2. Top Senders - Substrate
        var subSenders = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardSendersSubstrate)).ToList();

        var allSenders = evmSenders.Concat(subSenders)
            .OrderByDescending(x => x.TotalTxs)
            .Take(50)
            .ToList();

        // 3. Top Volume - EVM
        var evmVolume = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardVolumeEvm)).ToList();

        // 4. Top Volume - Substrate
        var subVolume = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardVolumeSubstrate)).ToList();

        var allVolume = evmVolume.Concat(subVolume)
            .OrderByDescending(x => x.TotalVolumeHmnd)
            .Take(50)
            .ToList();

        // 5. Top Fees - EVM
        var evmFees = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardFeesEvm)).ToList();

        // 6. Top Fees - Substrate
        var subFees = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardFeesSubstrate)).ToList();

        var allFees = evmFees.Concat(subFees)
            .OrderByDescending(x => x.TotalFeesHmnd)
            .Take(50)
            .ToList();

        // 7. Top Balances - EVM
        var evmBalances = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardBalancesEvm)).ToList();

        // 8. Top Balances - Substrate
        var subBalances = (await connection.QueryAsync<LeaderboardItemDto>(StoredProcedures.GetLeaderboardBalancesSubstrate)).ToList();

        // Live balance overlay from wallet_balances_cache
        var cachedBalances = (await connection.QueryAsync<(string address, double balance_hmnd)>(StoredProcedures.GetWalletBalancesCache)).ToList();

        foreach (var item in subBalances)
        {
            var match = cachedBalances.FirstOrDefault(c => c.address.Equals(item.Address, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(match.address))
            {
                item.BalanceHmnd = match.balance_hmnd;
            }
        }
        foreach (var item in evmBalances)
        {
            var match = cachedBalances.FirstOrDefault(c => c.address.Equals(item.Address, StringComparison.OrdinalIgnoreCase));
            if (!string.IsNullOrEmpty(match.address))
            {
                item.BalanceHmnd = match.balance_hmnd;
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
