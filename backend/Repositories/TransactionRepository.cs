using System.Data;
using System.Text;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ITransactionRepository
{
    Task<ActivitiesSearchResultDto> SearchActivitiesAsync(
        string q = "",
        string layer = "all",
        string pallet = "",
        string startDate = "",
        string endDate = "",
        string filter = "all",
        int page = 1,
        int limit = 50,
        bool hideZeroFee = false,
        bool whaleOnly = false);

    Task<TransactionDetailsResultDto?> GetTransactionDetailsAsync(string hash);
    Task<List<TokenTransferItemDto>> GetTokenTransfersByTxHashAsync(string hash);
    Task<List<string>> GetDistinctPalletsAsync();
    Task<string> ExportCsvAsync(
        string layer = "all",
        string filter = "all",
        string startDate = "",
        string endDate = "",
        string q = "",
        string pallet = "",
        bool hideZeroFee = false);
}

public class ActivitiesSearchResultDto
{
    public List<TransactionDto> Results { get; set; } = new();
    public int Count { get; set; }
    public PaginationDto Pagination { get; set; } = new();
    public object? Filters { get; set; }
    public bool IsLiveMatch { get; set; }
}

public class PaginationDto
{
    public int Page { get; set; }
    public int Limit { get; set; }
    public long TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPrevPage { get; set; }
}

public class TransactionDetailsResultDto
{
    public bool Found { get; set; }
    public string? Layer { get; set; }
    public TransactionDto? Tx { get; set; }
    public List<TokenTransferItemDto>? TokenTransfers { get; set; }
    public object? DecodedCall { get; set; }
}

public class TransactionRepository : ITransactionRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public TransactionRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<List<TokenTransferItemDto>> GetTokenTransfersByTxHashAsync(string hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return new();
        using var connection = _dbFactory.CreateConnection();
        const string sql = @"
            SELECT
                token_address as TokenAddress,
                token_symbol as TokenSymbol,
                from_address as FromAddress,
                to_address as ToAddress,
                amount as Amount
            FROM token_transfers
            WHERE tx_hash = @hash
            ORDER BY id ASC";
        return (await connection.QueryAsync<TokenTransferItemDto>(sql, new { hash })).ToList();
    }

    public async Task<List<string>> GetDistinctPalletsAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        const string sql = "SELECT DISTINCT pallet FROM substrate_extrinsics WHERE pallet > '' ORDER BY pallet ASC";
        var list = (await connection.QueryAsync<string>(sql)).ToList();
        if (!list.Contains("Ethereum", StringComparer.OrdinalIgnoreCase))
        {
            list.Insert(0, "Ethereum");
        }
        return list;
    }

    public async Task<TransactionDetailsResultDto?> GetTransactionDetailsAsync(string hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return new TransactionDetailsResultDto { Found = false };
        var cleanHash = hash.Trim();

        using var connection = _dbFactory.CreateConnection();

        // 1. Search EVM
        const string evmSql = @"
            SELECT
                'EVM' as Layer,
                hash as Hash,
                block_number as BlockNumber,
                timestamp as Timestamp,
                from_address as FromAddress,
                to_address as ToAddress,
                value_hmnd as ValueHmnd,
                gas_used as GasUsed,
                fee_hmnd as FeeHmnd,
                status as Status,
                'Ethereum' as Pallet,
                'transact' as Method,
                'HMND' as Symbol
            FROM transactions
            WHERE LOWER(hash) = LOWER(@cleanHash)";

        var evmTx = await connection.QueryFirstOrDefaultAsync<TransactionDto>(evmSql, new { cleanHash });
        if (evmTx != null)
        {
            var transfers = await GetTokenTransfersByTxHashAsync(evmTx.Hash);
            return new TransactionDetailsResultDto
            {
                Found = true,
                Layer = "EVM",
                Tx = evmTx,
                TokenTransfers = transfers,
                DecodedCall = new
                {
                    isKnown = true,
                    isEvm = true,
                    category = "EVM Çağrısı",
                    name = "Ethereum:transact",
                    description = "EVM Katmanı Akıllı Sözleşme / Transfer Çağrısı"
                }
            };
        }

        // 2. Search Substrate
        const string subSql = @"
            SELECT
                'SUBSTRATE' as Layer,
                hash as Hash,
                block_number as BlockNumber,
                timestamp as Timestamp,
                pallet as Pallet,
                method as Method,
                signer as FromAddress,
                target as ToAddress,
                value_hmnd as ValueHmnd,
                0 as GasUsed,
                fee_hmnd as FeeHmnd,
                status as Status,
                details as Details,
                'HMND' as Symbol
            FROM substrate_extrinsics
            WHERE LOWER(hash) = LOWER(@cleanHash)";

        var subTx = await connection.QueryFirstOrDefaultAsync<TransactionDto>(subSql, new { cleanHash });
        if (subTx != null)
        {
            return new TransactionDetailsResultDto
            {
                Found = true,
                Layer = "SUBSTRATE",
                Tx = subTx,
                TokenTransfers = new(),
                DecodedCall = new
                {
                    isKnown = true,
                    isSubstrate = true,
                    category = "Substrate Yerel Çağrısı",
                    name = $"{subTx.Pallet}:{subTx.Method}",
                    signature = $"{subTx.Pallet}({subTx.Method})",
                    description = subTx.Details ?? "Doğrulanmış konsensüs çağrısı."
                }
            };
        }

        return new TransactionDetailsResultDto { Found = false };
    }

    public async Task<ActivitiesSearchResultDto> SearchActivitiesAsync(
        string q = "",
        string layer = "all",
        string pallet = "",
        string startDate = "",
        string endDate = "",
        string filter = "all",
        int page = 1,
        int limit = 50,
        bool hideZeroFee = false,
        bool whaleOnly = false)
    {
        var safeLimit = Math.Clamp(limit, 1, 500);
        var safePage = Math.Max(1, page);
        var offset = (safePage - 1) * safeLimit;

        layer = (layer ?? "all").ToLowerInvariant();
        pallet = (pallet ?? "").Trim();
        var queryTrim = (q ?? "").Trim();

        using var connection = _dbFactory.CreateConnection();

        var evmWhere = new StringBuilder("WHERE 1=1");
        var subWhere = new StringBuilder("WHERE 1=1");
        var p = new DynamicParameters();

        if (hideZeroFee)
        {
            evmWhere.Append(" AND fee_hmnd > 0.000001");
            subWhere.Append(" AND fee_hmnd > 0.000001");
        }

        if (whaleOnly)
        {
            evmWhere.Append(" AND (value_hmnd >= 100000 OR hash IN (SELECT tx_hash FROM token_transfers WHERE amount >= 100000))");
            subWhere.Append(" AND value_hmnd >= 100000");
        }

        if (!string.IsNullOrEmpty(pallet) && pallet != "all" && pallet != "ethereum")
        {
            subWhere.Append(" AND pallet = @pallet");
            p.Add("pallet", pallet);
        }

        if (!string.IsNullOrEmpty(queryTrim))
        {
            p.Add("queryExact", queryTrim.ToLowerInvariant());
            p.Add("queryLike", $"%{queryTrim.ToLowerInvariant()}%");

            if (long.TryParse(queryTrim.Replace("#", ""), out var bNum))
            {
                p.Add("bNum", bNum);
                evmWhere.Append(" AND block_number = @bNum");
                subWhere.Append(" AND block_number = @bNum");
            }
            else if (queryTrim.StartsWith("0x") && queryTrim.Length > 42)
            {
                evmWhere.Append(" AND LOWER(hash) = @queryExact");
                subWhere.Append(" AND LOWER(hash) = @queryExact");
            }
            else
            {
                evmWhere.Append(" AND (LOWER(from_address) LIKE @queryLike OR LOWER(to_address) LIKE @queryLike OR LOWER(hash) LIKE @queryLike)");
                subWhere.Append(" AND (LOWER(signer) LIKE @queryLike OR LOWER(target) LIKE @queryLike OR LOWER(details) LIKE @queryLike OR LOWER(hash) LIKE @queryLike)");
            }
        }

        var includeEvm = (layer is "all" or "evm") && (string.IsNullOrEmpty(pallet) || pallet is "ethereum" or "all");
        var includeSub = (layer is "all" or "substrate") && pallet != "ethereum";

        long totalCount = 0;
        if (includeEvm && includeSub)
        {
            var evmCnt = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM transactions {evmWhere}", p);
            var subCnt = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM substrate_extrinsics {subWhere}", p);
            totalCount = evmCnt + subCnt;
        }
        else if (includeEvm)
        {
            totalCount = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM transactions {evmWhere}", p);
        }
        else if (includeSub)
        {
            totalCount = await connection.ExecuteScalarAsync<long>($"SELECT COUNT(*) FROM substrate_extrinsics {subWhere}", p);
        }

        int totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));
        var currentPage = Math.Clamp(safePage, 1, totalPages);
        offset = (currentPage - 1) * safeLimit;
        var innerWindow = offset + safeLimit;

        p.Add("safeLimit", safeLimit);
        p.Add("offset", offset);
        p.Add("innerWindow", innerWindow);

        string sql;
        if (includeEvm && includeSub)
        {
            sql = $@"
                SELECT * FROM (
                    SELECT * FROM (
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
                        {evmWhere}
                        ORDER BY block_number DESC, timestamp DESC
                        LIMIT @innerWindow
                    )
                    UNION ALL
                    SELECT * FROM (
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
                        {subWhere}
                        ORDER BY block_number DESC, timestamp DESC
                        LIMIT @innerWindow
                    )
                )
                ORDER BY BlockNumber DESC, Timestamp DESC
                LIMIT @safeLimit OFFSET @offset";
        }
        else if (includeEvm)
        {
            sql = $@"
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
                {evmWhere}
                ORDER BY block_number DESC, timestamp DESC
                LIMIT @safeLimit OFFSET @offset";
        }
        else if (includeSub)
        {
            sql = $@"
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
                {subWhere}
                ORDER BY block_number DESC, timestamp DESC
                LIMIT @safeLimit OFFSET @offset";
        }
        else
        {
            return new ActivitiesSearchResultDto
            {
                Results = new(),
                Count = 0,
                Pagination = new PaginationDto { Page = 1, Limit = safeLimit, TotalCount = 0, TotalPages = 1 }
            };
        }

        var results = (await connection.QueryAsync<TransactionDto>(sql, p)).ToList();

        // Attach token transfers for EVM transactions
        foreach (var r in results.Where(r => r.Layer == "EVM"))
        {
            r.TokenTransfers = await GetTokenTransfersByTxHashAsync(r.Hash);
        }

        return new ActivitiesSearchResultDto
        {
            Results = results,
            Count = results.Count,
            Pagination = new PaginationDto
            {
                Page = currentPage,
                Limit = safeLimit,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = currentPage < totalPages,
                HasPrevPage = currentPage > 1
            },
            Filters = new { q, layer, pallet, startDate, endDate, filter }
        };
    }

    public async Task<string> ExportCsvAsync(
        string layer = "all",
        string filter = "all",
        string startDate = "",
        string endDate = "",
        string q = "",
        string pallet = "",
        bool hideZeroFee = false)
    {
        var data = await SearchActivitiesAsync(q, layer, pallet, startDate, endDate, filter, 1, 500, hideZeroFee);
        var sb = new StringBuilder();
        sb.AppendLine("Layer,Block,Timestamp,Date,Pallet,Method,Sender,Target,Value_HMND,Fee_HMND,Status,Details,Hash");

        foreach (var r in data.Results)
        {
            var date = DateTimeOffset.FromUnixTimeSeconds(r.Timestamp).ToString("yyyy-MM-dd HH:mm:ss");
            sb.AppendLine($"\"{r.Layer}\",{r.BlockNumber},{r.Timestamp},\"{date}\",\"{r.Pallet}\",\"{r.Method}\",\"{r.FromAddress}\",\"{r.ToAddress}\",{r.ValueHmnd},{r.FeeHmnd},{r.Status},\"{(r.Details ?? "").Replace("\"", "\"\"")}\",\"{r.Hash}\"");
        }

        return sb.ToString();
    }
}
