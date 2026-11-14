using System.Diagnostics;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class QuerySandboxRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private static readonly List<string> ForbiddenTokens = new()
    {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "REPLACE",
        "ATTACH", "DETACH", "PRAGMA", "VACUUM", "EXEC", "TRUNCATE", "REINDEX"
    };

    public QuerySandboxRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public List<QueryPresetDto> GetPresets()
    {
        try
        {
            using var connection = _dbFactory.CreateConnection();
            var rows = connection.Query<QueryPresetDto>(StoredProcedures.GetQuerySandboxPresets).ToList();
            foreach (var r in rows)
            {
                r.Title = r.TitleKey;
                r.Description = r.DescriptionKey;
            }
            if (rows.Count > 0) return rows;
        }
        catch { }

        return new List<QueryPresetDto>();
    }

    public async Task<QuerySandboxResultDto> ExecuteQueryAsync(string sql)
    {
        var sw = Stopwatch.StartNew();
        if (string.IsNullOrWhiteSpace(sql))
        {
            return new QuerySandboxResultDto { Success = false, Error = "err_query_empty", MessageKey = "err_query_empty" };
        }

        var trimmed = sql.Trim().TrimEnd(';');
        var upper = trimmed.ToUpperInvariant();

        // 1. Must start with SELECT or WITH
        if (!upper.StartsWith("SELECT") && !upper.StartsWith("WITH"))
        {
            return new QuerySandboxResultDto
            {
                Success = false,
                Error = "err_query_readonly_only",
                MessageKey = "err_query_readonly_only"
            };
        }

        // 2. Scan for forbidden mutating keywords
        var tokens = upper.Split(new[] { ' ', '\t', '\r', '\n', '(', ')', ';' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var t in tokens)
        {
            if (ForbiddenTokens.Contains(t, StringComparer.OrdinalIgnoreCase))
            {
                return new QuerySandboxResultDto
                {
                    Success = false,
                    Error = "err_query_forbidden_keyword",
                    MessageKey = "err_query_forbidden_keyword"
                };
            }
        }

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(4));
            using var connection = _dbFactory.CreateConnection();

            // Append safe LIMIT if not present
            var safeSql = trimmed;
            if (!upper.Contains("LIMIT"))
            {
                safeSql += " LIMIT 250";
            }

            using var cmd = connection.CreateCommand();
            cmd.CommandText = safeSql;
            cmd.CommandTimeout = 4;

            using var reader = await cmd.ExecuteReaderAsync(cts.Token);
            var cols = new List<string>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                cols.Add(reader.GetName(i));
            }

            var rows = new List<QueryRowDto>();
            while (await reader.ReadAsync(cts.Token))
            {
                var row = new QueryRowDto();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var val = reader.GetValue(i);
                    row.Cells.Add(new QueryCellDto
                    {
                        Key = cols[i],
                        Value = val == DBNull.Value ? null : val
                    });
                }
                rows.Add(row);
                if (rows.Count >= 500) break;
            }

            sw.Stop();
            return new QuerySandboxResultDto
            {
                Success = true,
                Columns = cols,
                Rows = rows,
                RowCount = rows.Count,
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
        catch (OperationCanceledException)
        {
            sw.Stop();
            return new QuerySandboxResultDto
            {
                Success = false,
                Error = "Query timed out (maximum 4 seconds limit exceeded). Please add filters or LIMIT.",
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new QuerySandboxResultDto
            {
                Success = false,
                Error = "SQL Execution Error: " + ex.Message,
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
    }
}
