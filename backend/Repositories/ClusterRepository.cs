using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IClusterRepository
{
    Task<WalletClusterDto> GetWalletClusterAsync(string address);
}

public class WalletClusterDto
{
    public string Address { get; set; } = "";
    public string ShortAddress { get; set; } = "";
    public string EntityType { get; set; } = "RETAIL";
    public string EntityName { get; set; } = "Bireysel Kullanıcı";
    public string Color { get; set; } = "#3b82f6";
    public string Icon { get; set; } = "👤";
    public int RiskScore { get; set; } = 10;
    public string RiskLevel { get; set; } = "Düşük / Güvenli";
    public string BehavioralSummary { get; set; } = "";
    public List<ClusterMemberDto> AssociatedClusterWallets { get; set; } = new();
    public List<ClusterFlowPatternDto> TopFlowPatterns { get; set; } = new();
}

public class ClusterMemberDto
{
    public string Address { get; set; } = "";
    public string RelationType { get; set; } = "Ortak Fon Akışı";
    public double SharedVolumeHmnd { get; set; }
    public double AffinityPercent { get; set; }
    public string InferredRole { get; set; } = "";
}

public class ClusterFlowPatternDto
{
    public string Direction { get; set; } = "IN";
    public string Counterparty { get; set; } = "";
    public string CounterpartyLabel { get; set; } = "";
    public double TotalHmnd { get; set; }
    public int TxCount { get; set; }
    public double SharePercent { get; set; }
}

public class ClusterRepository : IClusterRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public ClusterRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<WalletClusterDto> GetWalletClusterAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return new WalletClusterDto();
        var clean = address.Trim();
        var isEvm = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);

        using var connection = _dbFactory.CreateConnection();

        // 1. Check known curated labels
        const string labelSql = "SELECT label, category, color, notes FROM address_labels WHERE LOWER(address) = LOWER(@clean)";
        var labelRow = await connection.QueryFirstOrDefaultAsync<(string label, string category, string color, string notes)>(labelSql, new { clean });

        string shortAddr = clean.Length > 16 ? $"{clean[..6]}...{clean[^4..]}" : clean;
        string entityType = "RETAIL";
        string entityName = "Bireysel Kullanıcı";
        string color = "#3b82f6";
        string icon = "👤";
        int riskScore = 15;
        string riskLevel = "Düşük";

        if (labelRow.label != null)
        {
            entityName = labelRow.label;
            color = !string.IsNullOrEmpty(labelRow.color) ? labelRow.color : "#6366f1";
            entityType = labelRow.category.ToUpperInvariant() switch
            {
                "EXCHANGE" => "CEX_VAULT",
                "SYSTEM" => "SYSTEM_POT",
                "WHALE" => "WHALE",
                "BRIDGE" => "BRIDGE_CONTRACT",
                "DEX" or "DEFI" => "DEX_POOL",
                _ => "CURATED_ENTITY"
            };
            icon = entityType switch
            {
                "CEX_VAULT" => "🏦",
                "SYSTEM_POT" => "🏛️",
                "WHALE" => "🐋",
                "BRIDGE_CONTRACT" => "🌉",
                "DEX_POOL" => "🔄",
                _ => "🏷️"
            };
            riskScore = 5;
            riskLevel = "Doğrulanmış / Çok Güvenli";
        }
        else
        {
            // Heuristic detection
            if (!isEvm)
            {
                const string bioSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @clean AND pallet = 'bioauth'";
                var bioCount = await connection.ExecuteScalarAsync<int>(bioSql, new { clean });
                if (bioCount > 0)
                {
                    entityType = "VALIDATOR";
                    entityName = "Aktif Biyometrik Validatör";
                    color = "#10b981";
                    icon = "🧬";
                    riskScore = 5;
                    riskLevel = "Konsensüs Düğümü / Güvenli";
                }
            }
            else
            {
                // Check if it has many incoming calls from many different users
                const string contractCheck = "SELECT COUNT(DISTINCT from_address) as senders, COUNT(*) as total FROM transactions WHERE LOWER(to_address) = LOWER(@clean)";
                var (senders, total) = await connection.QueryFirstOrDefaultAsync<(int senders, int total)>(contractCheck, new { clean });
                if (senders > 30 && total > 100)
                {
                    entityType = "SMART_CONTRACT";
                    entityName = "Akıllı Sözleşme / Protokol";
                    color = "#8b5cf6";
                    icon = "📜";
                }
            }
        }

        // 2. Discover associated cluster counterparties
        var flowPatterns = new List<ClusterFlowPatternDto>();
        var clusterMembers = new List<ClusterMemberDto>();

        if (isEvm)
        {
            var lower = clean.ToLowerInvariant();
            const string inSql = @"
                SELECT from_address as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
                FROM transactions
                WHERE to_address = @lower AND from_address > ''
                GROUP BY from_address
                ORDER BY TotalHmnd DESC
                LIMIT 5";
            var inRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(inSql, new { lower })).ToList();
            var totalIn = inRows.Sum(r => r.TotalHmnd);

            foreach (var r in inRows)
            {
                double share = totalIn > 0 ? Math.Round((r.TotalHmnd / totalIn) * 100.0, 1) : 0;
                flowPatterns.Add(new ClusterFlowPatternDto
                {
                    Direction = "IN",
                    Counterparty = r.Counterparty,
                    TotalHmnd = Math.Round(r.TotalHmnd, 2),
                    TxCount = r.TxCount,
                    SharePercent = share
                });

                if (share >= 35.0 && r.TotalHmnd > 1000)
                {
                    clusterMembers.Add(new ClusterMemberDto
                    {
                        Address = r.Counterparty,
                        RelationType = "Ana Finansman Kaynağı (Parent Wallet)",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        InferredRole = "Besleyici / Master Cüzdan"
                    });
                }
            }

            const string outSql = @"
                SELECT to_address as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
                FROM transactions
                WHERE from_address = @lower AND to_address > ''
                GROUP BY to_address
                ORDER BY TotalHmnd DESC
                LIMIT 5";
            var outRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(outSql, new { lower })).ToList();
            var totalOut = outRows.Sum(r => r.TotalHmnd);

            foreach (var r in outRows)
            {
                double share = totalOut > 0 ? Math.Round((r.TotalHmnd / totalOut) * 100.0, 1) : 0;
                flowPatterns.Add(new ClusterFlowPatternDto
                {
                    Direction = "OUT",
                    Counterparty = r.Counterparty,
                    TotalHmnd = Math.Round(r.TotalHmnd, 2),
                    TxCount = r.TxCount,
                    SharePercent = share
                });

                if (share >= 35.0 && r.TotalHmnd > 1000)
                {
                    clusterMembers.Add(new ClusterMemberDto
                    {
                        Address = r.Counterparty,
                        RelationType = "Ana Çıkış Hedefi (Primary Sink)",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        InferredRole = "Toplayıcı / Kasa"
                    });
                }
            }
        }
        else
        {
            const string inSql = @"
                SELECT signer as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
                FROM substrate_extrinsics
                WHERE target = @clean AND signer > ''
                GROUP BY signer
                ORDER BY TotalHmnd DESC
                LIMIT 5";
            var inRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(inSql, new { clean })).ToList();
            var totalIn = inRows.Sum(r => r.TotalHmnd);

            foreach (var r in inRows)
            {
                double share = totalIn > 0 ? Math.Round((r.TotalHmnd / totalIn) * 100.0, 1) : 0;
                flowPatterns.Add(new ClusterFlowPatternDto
                {
                    Direction = "IN",
                    Counterparty = r.Counterparty,
                    TotalHmnd = Math.Round(r.TotalHmnd, 2),
                    TxCount = r.TxCount,
                    SharePercent = share
                });

                if (share >= 35.0 && r.TotalHmnd > 1000)
                {
                    clusterMembers.Add(new ClusterMemberDto
                    {
                        Address = r.Counterparty,
                        RelationType = "Ana Besleyici (Parent Wallet)",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        InferredRole = "Finansman / Master Hesap"
                    });
                }
            }

            const string outSql = @"
                SELECT target as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
                FROM substrate_extrinsics
                WHERE signer = @clean AND target > ''
                GROUP BY target
                ORDER BY TotalHmnd DESC
                LIMIT 5";
            var outRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(outSql, new { clean })).ToList();
            var totalOut = outRows.Sum(r => r.TotalHmnd);

            foreach (var r in outRows)
            {
                double share = totalOut > 0 ? Math.Round((r.TotalHmnd / totalOut) * 100.0, 1) : 0;
                flowPatterns.Add(new ClusterFlowPatternDto
                {
                    Direction = "OUT",
                    Counterparty = r.Counterparty,
                    TotalHmnd = Math.Round(r.TotalHmnd, 2),
                    TxCount = r.TxCount,
                    SharePercent = share
                });

                if (share >= 35.0 && r.TotalHmnd > 1000)
                {
                    clusterMembers.Add(new ClusterMemberDto
                    {
                        Address = r.Counterparty,
                        RelationType = "Ana Çıkış Kanalı (Primary Sink)",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        InferredRole = "Toplayıcı / Hazine"
                    });
                }
            }
        }

        string behaviorSummary = $"{entityName} rolünde sınıflandırıldı. Toplam {flowPatterns.Count} ana akış paterni tespit edildi. Doğrudan bağlı {clusterMembers.Count} küme üyesi mevcut.";

        return new WalletClusterDto
        {
            Address = clean,
            ShortAddress = shortAddr,
            EntityType = entityType,
            EntityName = entityName,
            Color = color,
            Icon = icon,
            RiskScore = riskScore,
            RiskLevel = riskLevel,
            BehavioralSummary = behaviorSummary,
            AssociatedClusterWallets = clusterMembers,
            TopFlowPatterns = flowPatterns
        };
    }
}
