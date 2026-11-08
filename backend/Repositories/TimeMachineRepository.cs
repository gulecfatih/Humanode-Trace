using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface ITimeMachineRepository
{
    Task<TimeMachineSnapshotDto> GetSnapshotAsync(long? blockNumber = null, string? date = null);
}

public class TimeMachineSnapshotDto
{
    public long BlockNumber { get; set; }
    public long Timestamp { get; set; }
    public string Date { get; set; } = "";
    public double HmndPriceUsd { get; set; }
    public long CumulativeBlocks { get; set; }
    public long CumulativeTransactions { get; set; }
    public double CumulativeGasFeesHmnd { get; set; }
    public double CirculatingSupplyEstimate { get; set; }
    public List<SnapshotHolderDto> TopHoldersAtSnapshot { get; set; } = new();
}

public class SnapshotHolderDto
{
    public string Address { get; set; } = "";
    public string Layer { get; set; } = "Substrate";
    public double BalanceHmnd { get; set; }
    public double ValueUsd { get; set; }
}

public class TimeMachineRepository : ITimeMachineRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public TimeMachineRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<TimeMachineSnapshotDto> GetSnapshotAsync(long? blockNumber = null, string? date = null)
    {
        using var connection = _dbFactory.CreateConnection();

        long targetBlock = blockNumber ?? 20485859;
        long targetTs = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
        {
            targetTs = new DateTimeOffset(parsedDate, TimeSpan.Zero).ToUnixTimeSeconds();
            const string blkSql = "SELECT number FROM blocks_with_tx WHERE timestamp <= @targetTs ORDER BY number DESC LIMIT 1";
            var foundBlk = await connection.ExecuteScalarAsync<long?>(blkSql, new { targetTs });
            if (foundBlk.HasValue) targetBlock = foundBlk.Value;
        }
        else if (blockNumber.HasValue)
        {
            const string tsSql = "SELECT timestamp FROM blocks_with_tx WHERE number <= @targetBlock ORDER BY number DESC LIMIT 1";
            var foundTs = await connection.ExecuteScalarAsync<long?>(tsSql, new { targetBlock });
            if (foundTs.HasValue) targetTs = foundTs.Value;
        }

        var dateStr = DateTimeOffset.FromUnixTimeSeconds(targetTs).ToString("yyyy-MM-dd");

        // Price at snapshot date
        const string priceSql = "SELECT price_usd FROM hmnd_daily_prices WHERE day <= @dateStr ORDER BY day DESC LIMIT 1";
        var price = await connection.ExecuteScalarAsync<double?>(priceSql, new { dateStr }) ?? 0.045;

        // Cumulative blocks, txs, fees up to targetBlock
        const string cumBlockSql = "SELECT COUNT(*) FROM blocks_with_tx WHERE number <= @targetBlock";
        var cumBlocks = await connection.ExecuteScalarAsync<long>(cumBlockSql, new { targetBlock });

        const string cumTxsSql = "SELECT (SELECT COUNT(*) FROM transactions WHERE block_number <= @targetBlock) + (SELECT COUNT(*) FROM substrate_extrinsics WHERE block_number <= @targetBlock)";
        var cumTxs = await connection.ExecuteScalarAsync<long>(cumTxsSql, new { targetBlock });

        const string cumFeesSql = "SELECT COALESCE(SUM(total_fees_hmnd), 0) FROM blocks_with_tx WHERE number <= @targetBlock";
        var cumFees = await connection.ExecuteScalarAsync<double>(cumFeesSql, new { targetBlock });

        // Top holders up to that block
        const string topHoldersSql = @"
            SELECT address, 'Substrate' as layer, SUM(inflow - outflow) as bal
            FROM (
                SELECT target as address, SUM(value_hmnd) as inflow, 0.0 as outflow
                FROM substrate_extrinsics
                WHERE block_number <= @targetBlock AND target > '' AND status = 1
                GROUP BY target
                UNION ALL
                SELECT signer as address, 0.0 as inflow, SUM(value_hmnd) as outflow
                FROM substrate_extrinsics
                WHERE block_number <= @targetBlock AND signer > '' AND status = 1
                GROUP BY signer
            )
            GROUP BY address
            HAVING bal > 1000
            ORDER BY bal DESC
            LIMIT 10";

        var holders = (await connection.QueryAsync<(string address, string layer, double bal)>(topHoldersSql, new { targetBlock }))
            .Select(h => new SnapshotHolderDto
            {
                Address = h.address,
                Layer = h.layer,
                BalanceHmnd = Math.Round(h.bal, 2),
                ValueUsd = Math.Round(h.bal * price, 2)
            })
            .ToList();

        return new TimeMachineSnapshotDto
        {
            BlockNumber = targetBlock,
            Timestamp = targetTs,
            Date = dateStr,
            HmndPriceUsd = Math.Round(price, 4),
            CumulativeBlocks = cumBlocks,
            CumulativeTransactions = cumTxs,
            CumulativeGasFeesHmnd = Math.Round(cumFees, 2),
            CirculatingSupplyEstimate = Math.Round(Math.Min(285970432.0, 100000000.0 + (targetBlock * 9.0)), 2),
            TopHoldersAtSnapshot = holders
        };
    }
}
