using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class TimeMachineRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;

    public TimeMachineRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<TimeMachineSnapshotDto> GetSnapshotAsync(long? blockNumber = null, string? date = null)
    {
        using var connection = _dbFactory.CreateConnection();
        var circBaseline = await _configRepo.GetDoubleConfigAsync("circulating_supply_baseline");

        long targetBlock = blockNumber ?? 20485859;
        long targetTs = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
        {
            targetTs = new DateTimeOffset(parsedDate, TimeSpan.Zero).ToUnixTimeSeconds();
            var foundBlk = await connection.ExecuteScalarAsync<long?>(StoredProcedures.GetSnapshotBlockByTimestamp, new { targetTs });
            if (foundBlk.HasValue) targetBlock = foundBlk.Value;
        }
        else if (blockNumber.HasValue)
        {
            var foundTs = await connection.ExecuteScalarAsync<long?>(StoredProcedures.GetSnapshotTimestampByBlock, new { targetBlock });
            if (foundTs.HasValue) targetTs = foundTs.Value;
        }

        var dateStr = DateTimeOffset.FromUnixTimeSeconds(targetTs).ToString("yyyy-MM-dd");

        // Price at snapshot date
        var price = await connection.ExecuteScalarAsync<double?>(StoredProcedures.GetSnapshotPriceByDate, new { dateStr }) ?? await _priceRepo.GetPriceForDateAsync(dateStr);

        // Cumulative blocks, txs, fees up to targetBlock
        var cumBlocks = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetSnapshotCumulativeBlocks, new { targetBlock });
        var cumTxs = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetSnapshotCumulativeTxs, new { targetBlock });
        var cumFees = await connection.ExecuteScalarAsync<double>(StoredProcedures.GetBurnedTotalFees);

        // Top holders up to that block
        var holders = (await connection.QueryAsync<(string address, string layer, double bal)>(StoredProcedures.GetSnapshotTopHolders, new { targetBlock }))
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
            CirculatingSupplyEstimate = Math.Round(Math.Min(circBaseline, 100000000.0 + (targetBlock * 9.0)), 2),
            TopHoldersAtSnapshot = holders
        };
    }
}
