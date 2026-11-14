using System.Data;
using System.Text.Json.Serialization;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class BlockRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly TransactionRepository _txRepo;
    private readonly PriceRepository _priceRepo;

    public BlockRepository(SqliteConnectionFactory dbFactory, TransactionRepository txRepo, PriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _txRepo = txRepo;
        _priceRepo = priceRepo;
    }

    public async Task<BlockDetailDto> GetBlockDetailsAsync(long blockNumber)
    {
        using var connection = _dbFactory.CreateConnection();

        var evmTxs = (await connection.QueryAsync<TransactionDto>(StoredProcedures.GetBlockDetailsEvmTxs, new { BlockNumber = blockNumber })).ToList();
        foreach (var t in evmTxs)
        {
            t.TokenTransfers = await _txRepo.GetTokenTransfersByTxHashAsync(t.Hash);
        }

        var subTxs = (await connection.QueryAsync<TransactionDto>(StoredProcedures.GetBlockDetailsSubExtrinsics, new { BlockNumber = blockNumber })).ToList();

        var allTxs = evmTxs.Concat(subTxs).ToList();
        if (allTxs.Count == 0)
        {
            return new BlockDetailDto { Found = false, BlockNumber = blockNumber };
        }

        var ts = allTxs[0].Timestamp;
        var totalFees = Math.Round(allTxs.Sum(t => t.FeeHmnd), 6);
        var totalVol = Math.Round(allTxs.Sum(t => t.ValueHmnd), 4);
        var dateStr = DateTimeOffset.FromUnixTimeSeconds(ts).UtcDateTime.ToString("yyyy-MM-dd");
        var price = await _priceRepo.GetPriceForDateAsync(dateStr);

        return new BlockDetailDto
        {
            Found = true,
            BlockNumber = blockNumber,
            Timestamp = ts,
            PriceUsd = price,
            TxCount = allTxs.Count,
            EvmCount = evmTxs.Count,
            SubstrateCount = subTxs.Count,
            TotalFeesHmnd = totalFees,
            TotalVolumeHmnd = totalVol,
            Transactions = allTxs
        };
    }

    public async Task<BlockSearchResultDto> SearchBlocksAsync(SearchActivitiesRequest req)
    {
        req ??= new SearchActivitiesRequest();
        var safeLimit = Math.Clamp(req.Limit, 1, 200);
        var safePage = Math.Max(1, req.Page);
        var offset = (safePage - 1) * safeLimit;
        var q = req.Q;

        using var connection = _dbFactory.CreateConnection();

        // When q is a block number
        if (long.TryParse(q.Replace("#", "").Trim(), out var targetBlock))
        {
            var single = await GetBlockDetailsAsync(targetBlock);
            if (single.Found)
            {
                var summary = new BlockSummaryDto
                {
                    BlockNumber = single.BlockNumber,
                    Timestamp = single.Timestamp,
                    TxCount = single.TxCount,
                    EvmCount = single.EvmCount,
                    SubstrateCount = single.SubstrateCount,
                    TotalFeesHmnd = single.TotalFeesHmnd,
                    TotalVolumeHmnd = single.TotalVolumeHmnd,
                    Transactions = single.Transactions
                };
                return new BlockSearchResultDto
                {
                    Results = new() { summary },
                    Count = 1,
                    Pagination = new PaginationDto { Page = 1, Limit = safeLimit, TotalCount = 1, TotalPages = 1 }
                };
            }
        }

        // Distinct block numbers from blocks_with_tx
        var totalCount = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetBlocksCount);
        int totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));
        var currentPage = Math.Clamp(safePage, 1, totalPages);
        offset = (currentPage - 1) * safeLimit;

        var blocks = (await connection.QueryAsync<(long Number, long Timestamp, int TxCount, double TotalFeesHmnd)>(StoredProcedures.GetBlocksWithTxPaged, new { SafeLimit = safeLimit, Offset = offset })).ToList();

        var summaries = new List<BlockSummaryDto>();
        foreach (var b in blocks)
        {
            var details = await GetBlockDetailsAsync(b.Number);
            summaries.Add(new BlockSummaryDto
            {
                BlockNumber = b.Number,
                Timestamp = b.Timestamp,
                TxCount = details.Found ? details.TxCount : b.TxCount,
                EvmCount = details.EvmCount,
                SubstrateCount = details.SubstrateCount,
                TotalFeesHmnd = b.TotalFeesHmnd > 0 ? b.TotalFeesHmnd : details.TotalFeesHmnd,
                TotalVolumeHmnd = details.TotalVolumeHmnd,
                Transactions = details.Transactions
            });
        }

        return new BlockSearchResultDto
        {
            Results = summaries,
            Count = summaries.Count,
            Pagination = new PaginationDto
            {
                Page = currentPage,
                Limit = safeLimit,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = currentPage < totalPages,
                HasPrevPage = currentPage > 1
            }
        };
    }
}
