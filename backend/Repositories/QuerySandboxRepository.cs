using System.Diagnostics;
using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IQuerySandboxRepository
{
    Task<QuerySandboxResultDto> ExecuteQueryAsync(string sql);
    List<QueryPresetDto> GetPresets();
}

public class QuerySandboxResultDto
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public List<string> Columns { get; set; } = new();
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
    public int RowCount { get; set; }
    public long ExecutionTimeMs { get; set; }
}

public class QueryPresetDto
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Sql { get; set; } = "";
}

public class QuerySandboxRepository : IQuerySandboxRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private static readonly HashSet<string> ForbiddenTokens = new(StringComparer.OrdinalIgnoreCase)
    {
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "REPLACE",
        "ATTACH", "DETACH", "PRAGMA", "VACUUM", "EXEC", "TRUNCATE", "REINDEX"
    };

    public QuerySandboxRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public List<QueryPresetDto> GetPresets()
    {
        return new List<QueryPresetDto>
        {
            new()
            {
                Id = "top-gas-burners",
                Title = "En Çok Gas Yakan 10 Cüzdan",
                Description = "Ağda toplamda en yüksek fee harcaması yapmış 10 cüzdan.",
                Sql = "SELECT from_address as cüzdan, COUNT(*) as işlem_sayısı, ROUND(SUM(fee_hmnd), 4) as toplam_fee_hmnd FROM transactions GROUP BY from_address ORDER BY toplam_fee_hmnd DESC LIMIT 10;"
            },
            new()
            {
                Id = "monthly-growth",
                Title = "Aylık İşlem Hacmi ve Büyüme Trendi",
                Description = "Son 12 ayın EVM ve Substrate işlem sayıları dökümü.",
                Sql = "SELECT strftime('%Y-%m', timestamp, 'unixepoch') as ay, COUNT(*) as işlem_adedi, ROUND(SUM(value_hmnd), 2) as toplam_hacim FROM transactions GROUP BY ay ORDER BY ay DESC LIMIT 12;"
            },
            new()
            {
                Id = "top-tokens",
                Title = "En Çok Transfer Edilen ERC-20 Tokenları",
                Description = "Humanode EVM üzerindeki tokenların transfer sıklığı ve toplam hacmi.",
                Sql = "SELECT token_symbol as sembol, COUNT(*) as transfer_adedi, ROUND(SUM(amount), 2) as toplam_miktar FROM token_transfers GROUP BY token_symbol ORDER BY transfer_adedi DESC LIMIT 10;"
            },
            new()
            {
                Id = "high-value-extrinsics",
                Title = "Substrate Katmanı En Büyük 15 Transfer",
                Description = "100.000+ HMND üzeri doğrulanmış Substrate yerel transferleri.",
                Sql = "SELECT block_number, datetime(timestamp, 'unixepoch') as tarih, signer as gönderici, target as alıcı, ROUND(value_hmnd, 2) as hmnd_tutarı FROM substrate_extrinsics WHERE value_hmnd >= 100000 AND status = 1 ORDER BY value_hmnd DESC LIMIT 15;"
            }
        };
    }

    public async Task<QuerySandboxResultDto> ExecuteQueryAsync(string sql)
    {
        var sw = Stopwatch.StartNew();
        if (string.IsNullOrWhiteSpace(sql))
        {
            return new QuerySandboxResultDto { Success = false, Error = "Sorgu metni boş olamaz." };
        }

        var trimmed = sql.Trim().TrimEnd(';');
        var upper = trimmed.ToUpperInvariant();

        // 1. Must start with SELECT or WITH
        if (!upper.StartsWith("SELECT") && !upper.StartsWith("WITH"))
        {
            return new QuerySandboxResultDto
            {
                Success = false,
                Error = "Güvenlik kuralı: Yalnızca SELECT veya WITH ile başlayan salt-okunur sorgulara izin verilir."
            };
        }

        // 2. Scan for forbidden mutating keywords
        var tokens = upper.Split(new[] { ' ', '\t', '\r', '\n', '(', ')', ';' }, StringSplitOptions.RemoveEmptyEntries);
        foreach (var t in tokens)
        {
            if (ForbiddenTokens.Contains(t))
            {
                return new QuerySandboxResultDto
                {
                    Success = false,
                    Error = $"Güvenlik kuralı: '{t}' anahtar sözcüğü yasaklıdır. Yalnızca salt-okunur sorgular çalıştırılabilir."
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

            var rows = new List<Dictionary<string, object?>>();
            while (await reader.ReadAsync(cts.Token))
            {
                var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var val = reader.GetValue(i);
                    row[cols[i]] = val == DBNull.Value ? null : val;
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
                Error = "Sorgu zaman aşımına uğradı (maksimum 4 saniye sınırı aşıldı). Lütfen sorgunuza filtre veya LIMIT ekleyin.",
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new QuerySandboxResultDto
            {
                Success = false,
                Error = "SQL Çalıştırma Hatası: " + ex.Message,
                ExecutionTimeMs = sw.ElapsedMilliseconds
            };
        }
    }
}
