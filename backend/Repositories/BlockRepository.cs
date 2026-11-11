using System.Data;
using System.Text.Json.Serialization;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface IBlockRepository
{
    Task<BlockDetailDto> GetBlockDetailsAsync(long blockNumber);
    Task<BlockSearchResultDto> SearchBlocksAsync(
        string q = "",
        string layer = "all",
        string pallet = "",
        string startDate = "",
        string endDate = "",
        string filter = "all",
        int page = 1,
        int limit = 50,
        bool hideZeroFee = true,
        bool whaleOnly = false);
}

public class BlockDetailDto
{
    [JsonPropertyName("found")]
    public bool Found { get; set; }

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("blockNumber")]
    public long BlockNumberCamel => BlockNumber;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; } = 0.0;

    [JsonPropertyName("total_tx_count")]
    public int TxCount { get; set; }

    [JsonPropertyName("txCount")]
    public int TxCountCamel => TxCount;

    [JsonPropertyName("evm_count")]
    public int EvmCount { get; set; }

    [JsonPropertyName("evmCount")]
    public int EvmCountCamel => EvmCount;

    [JsonPropertyName("substrate_count")]
    public int SubstrateCount { get; set; }

    [JsonPropertyName("substrateCount")]
    public int SubstrateCountCamel => SubstrateCount;

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("totalFeesHmnd")]
    public double TotalFeesHmndCamel => TotalFeesHmnd;

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("totalVolumeHmnd")]
    public double TotalVolumeHmndCamel => TotalVolumeHmnd;

    [JsonPropertyName("transactions")]
    public List<TransactionDto> Transactions { get; set; } = new();
}

public class BlockSearchResultDto
{
    [JsonPropertyName("results")]
    public List<BlockSummaryDto> Results { get; set; } = new();

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("pagination")]
    public PaginationDto Pagination { get; set; } = new();
}

public class BlockSummaryDto
{
    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("blockNumber")]
    public long BlockNumberCamel => BlockNumber;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("total_tx_count")]
    public int TxCount { get; set; }

    [JsonPropertyName("txCount")]
    public int TxCountCamel => TxCount;

    [JsonPropertyName("evm_count")]
    public int EvmCount { get; set; }

    [JsonPropertyName("evmCount")]
    public int EvmCountCamel => EvmCount;

    [JsonPropertyName("substrate_count")]
    public int SubstrateCount { get; set; }

    [JsonPropertyName("substrateCount")]
    public int SubstrateCountCamel => SubstrateCount;

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("totalFeesHmnd")]
    public double TotalFeesHmndCamel => TotalFeesHmnd;

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("totalVolumeHmnd")]
    public double TotalVolumeHmndCamel => TotalVolumeHmnd;

    [JsonPropertyName("pallets")]
    public string Pallets { get; set; } = "";

    [JsonPropertyName("transactions")]
    public List<TransactionDto> Transactions { get; set; } = new();
}

public class BlockRepository : IBlockRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly ITransactionRepository _txRepo;
    private readonly IPriceRepository _priceRepo;

    public BlockRepository(IDbConnectionFactory dbFactory, ITransactionRepository txRepo, IPriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _txRepo = txRepo;
        _priceRepo = priceRepo;
    }

    public async Task<BlockDetailDto> GetBlockDetailsAsync(long blockNumber)
    {
        using var connection = _dbFactory.CreateConnection();

        const string evmSql = @"
            SELECT
                'EVM' AS Layer,
                hash AS Hash,
                block_number AS BlockNumber,
                timestamp AS Timestamp,
                'Ethereum' AS Pallet,
                'transact' AS Method,
                from_address AS FromAddress,
                to_address AS ToAddress,
                value_hmnd AS ValueHmnd,
                gas_used AS GasUsed,
                fee_hmnd AS FeeHmnd,
                status AS Status,
                '' AS Details,
                'HMND' AS Symbol
            FROM transactions
            WHERE block_number = @blockNumber
            ORDER BY timestamp DESC";

        var evmTxs = (await connection.QueryAsync<TransactionDto>(evmSql, new { blockNumber })).ToList();
        foreach (var t in evmTxs)
        {
            t.TokenTransfers = await _txRepo.GetTokenTransfersByTxHashAsync(t.Hash);
        }

        const string subSql = @"
            SELECT
                'SUBSTRATE' AS Layer,
                hash AS Hash,
                block_number AS BlockNumber,
                timestamp AS Timestamp,
                pallet AS Pallet,
                method AS Method,
                signer AS FromAddress,
                target AS ToAddress,
                value_hmnd AS ValueHmnd,
                0 AS GasUsed,
                fee_hmnd AS FeeHmnd,
                status AS Status,
                details AS Details,
                'HMND' AS Symbol
            FROM substrate_extrinsics
            WHERE block_number = @blockNumber
            ORDER BY timestamp DESC";

        var subTxs = (await connection.QueryAsync<TransactionDto>(subSql, new { blockNumber })).ToList();

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

    public async Task<BlockSearchResultDto> SearchBlocksAsync(
        string q = "",
        string layer = "all",
        string pallet = "",
        string startDate = "",
        string endDate = "",
        string filter = "all",
        int page = 1,
        int limit = 50,
        bool hideZeroFee = true,
        bool whaleOnly = false)
    {
        var safeLimit = Math.Clamp(limit, 1, 200);
        var safePage = Math.Max(1, page);
        var offset = (safePage - 1) * safeLimit;

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
        const string countSql = "SELECT COUNT(*) FROM blocks_with_tx";
        var totalCount = await connection.ExecuteScalarAsync<long>(countSql);
        int totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));
        var currentPage = Math.Clamp(safePage, 1, totalPages);
        offset = (currentPage - 1) * safeLimit;

        const string blocksSql = @"
            SELECT number as Number, timestamp as Timestamp, tx_count as TxCount, total_fees_hmnd as TotalFeesHmnd
            FROM blocks_with_tx
            ORDER BY number DESC
            LIMIT @safeLimit OFFSET @offset";

        var blocks = (await connection.QueryAsync<(long Number, long Timestamp, int TxCount, double TotalFeesHmnd)>(blocksSql, new { safeLimit, offset })).ToList();

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
