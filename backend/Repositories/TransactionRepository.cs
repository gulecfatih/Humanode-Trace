using System.Data;
using System.Text;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class TransactionRepository
{
    private readonly SqliteConnectionFactory _dbFactory;

    public TransactionRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<List<TokenTransferItemDto>> GetTokenTransfersByTxHashAsync(string hash)
    {
        if (string.IsNullOrWhiteSpace(hash)) return new();
        using var connection = _dbFactory.CreateConnection();
        return (await connection.QueryAsync<TokenTransferItemDto>(StoredProcedures.GetTokenTransfersByTxHash, new { Hash = hash })).ToList();
    }

    public async Task<List<string>> GetDistinctPalletsAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        var list = (await connection.QueryAsync<string>(StoredProcedures.GetDistinctPallets)).ToList();
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
        var evmTx = await connection.QueryFirstOrDefaultAsync<TransactionDto>(StoredProcedures.GetTransactionDetailsEvm, new { cleanHash, CleanHash = cleanHash });
        if (evmTx != null)
        {
            var transfers = await GetTokenTransfersByTxHashAsync(evmTx.Hash);
            evmTx.TokenTransfers = transfers;
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
                    category = "evm_call",
                    name = "Ethereum:transact",
                    description = "Ethereum:transact"
                }
            };
        }

        // 2. Search Substrate
        var subTx = await connection.QueryFirstOrDefaultAsync<TransactionDto>(StoredProcedures.GetTransactionDetailsSubstrate, new { cleanHash, CleanHash = cleanHash });
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
                    category = "substrate_call",
                    name = $"{subTx.Pallet}:{subTx.Method}",
                    signature = $"{subTx.Pallet}({subTx.Method})",
                    description = subTx.Details ?? $"{subTx.Pallet}:{subTx.Method}"
                }
            };
        }

        return new TransactionDetailsResultDto { Found = false };
    }

    public async Task<ActivitiesSearchResultDto> SearchActivitiesAsync(SearchActivitiesRequest req)
    {
        req ??= new SearchActivitiesRequest();
        var safeLimit = Math.Clamp(req.Limit, 1, 500);
        var safePage = Math.Max(1, req.Page);
        var offset = (safePage - 1) * safeLimit;

        var layer = (req.Layer ?? "all").ToLowerInvariant();
        var pallet = (req.Pallet ?? "").Trim();
        var queryTrim = (req.Q ?? "").Trim();
        var hideZeroFee = req.IsZeroFeeHidden;
        var whaleOnly = req.WhaleOnly;
        var startDate = req.StartDate;
        var endDate = req.EndDate;
        var filter = req.Filter;
        var q = req.Q;

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
            evmWhere.Append($" AND (value_hmnd >= 100000 OR hash IN ({StoredProcedures.WhaleTokenTransfersSubquery}))");
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
            var evmCnt = await connection.ExecuteScalarAsync<long>($"{StoredProcedures.GetTransactionsCountBase} {evmWhere}", p);
            var subCnt = await connection.ExecuteScalarAsync<long>($"{StoredProcedures.GetSubstrateExtrinsicsCountBase} {subWhere}", p);
            totalCount = evmCnt + subCnt;
        }
        else if (includeEvm)
        {
            totalCount = await connection.ExecuteScalarAsync<long>($"{StoredProcedures.GetTransactionsCountBase} {evmWhere}", p);
        }
        else if (includeSub)
        {
            totalCount = await connection.ExecuteScalarAsync<long>($"{StoredProcedures.GetSubstrateExtrinsicsCountBase} {subWhere}", p);
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
            sql = string.Format(StoredProcedures.GetUnifiedTransactionsUnionTemplate, evmWhere, subWhere);
        }
        else if (includeEvm)
        {
            sql = string.Format(StoredProcedures.GetUnifiedTransactionsEvmTemplate, evmWhere);
        }
        else if (includeSub)
        {
            sql = string.Format(StoredProcedures.GetUnifiedTransactionsSubstrateTemplate, subWhere);
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

    public async Task<string> ExportCsvAsync(ExportCsvRequest req)
    {
        req ??= new ExportCsvRequest();
        var hide = req.HideZeroFee == "1" || req.HideZeroFee == "true";
        var q = !string.IsNullOrEmpty(req.Q) ? req.Q : req.Search;
        var data = await SearchActivitiesAsync(new SearchActivitiesRequest
        {
            Q = q,
            Layer = req.Layer,
            Pallet = req.Pallet,
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Filter = req.Filter,
            Page = 1,
            Limit = 500,
            HideZeroFee = req.HideZeroFee
        });
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
