using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class ClusterRepository
{
    private readonly SqliteConnectionFactory _dbFactory;

    public ClusterRepository(SqliteConnectionFactory dbFactory)
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
        var labelRow = await connection.QueryFirstOrDefaultAsync<(string label, string category, string color, string notes)>(StoredProcedures.GetAddressLabelByAddress, new { clean });

        string shortAddr = clean.Length > 16 ? $"{clean[..6]}...{clean[^4..]}" : clean;
        string entityType = "RETAIL";
        string entityName = "Retail User";
        string color = "#3b82f6";
        string icon = "👤";
        int riskScore = 15;
        string riskLevel = "low";

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
            riskLevel = "verified";
        }
        else
        {
            // Heuristic detection
            if (!isEvm)
            {
                var bioCount = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetWalletBioauthCount, new { clean });
                if (bioCount > 0)
                {
                    entityType = "VALIDATOR";
                    entityName = "Active Biometric Validator";
                    color = "#10b981";
                    icon = "🧬";
                    riskScore = 5;
                    riskLevel = "verified";
                }
            }
            else
            {
                // Check if it has many incoming calls from many different users
                var (senders, total) = await connection.QueryFirstOrDefaultAsync<(int senders, int total)>(StoredProcedures.GetContractCallersCount, new { clean });
                if (senders > 30 && total > 100)
                {
                    entityType = "SMART_CONTRACT";
                    entityName = "Smart Contract / Protocol";
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
            var inRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(StoredProcedures.GetClusterInflowEvm, new { lower })).ToList();
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
                        ShortAddress = r.Counterparty.Length > 12 ? $"{r.Counterparty[..6]}...{r.Counterparty[^4..]}" : r.Counterparty,
                        RelationType = "parent_wallet",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        AffinityPercentage = share,
                        InferredRole = "master_funder",
                        Role = "Master / Funder",
                        CommonTxsCount = r.TxCount
                    });
                }
            }

            var outRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(StoredProcedures.GetClusterOutflowEvm, new { lower })).ToList();
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
                        ShortAddress = r.Counterparty.Length > 12 ? $"{r.Counterparty[..6]}...{r.Counterparty[^4..]}" : r.Counterparty,
                        RelationType = "primary_sink",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        AffinityPercentage = share,
                        InferredRole = "collector_treasury",
                        Role = "Collector / Treasury",
                        CommonTxsCount = r.TxCount
                    });
                }
            }
        }
        else
        {
            var inRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(StoredProcedures.GetClusterInflowSub, new { clean })).ToList();
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
                        ShortAddress = r.Counterparty.Length > 12 ? $"{r.Counterparty[..6]}...{r.Counterparty[^4..]}" : r.Counterparty,
                        RelationType = "parent_wallet",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        AffinityPercentage = share,
                        InferredRole = "master_funder",
                        Role = "Master / Funder",
                        CommonTxsCount = r.TxCount
                    });
                }
            }

            var outRows = (await connection.QueryAsync<(string Counterparty, double TotalHmnd, int TxCount)>(StoredProcedures.GetClusterOutflowSub, new { clean })).ToList();
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
                        ShortAddress = r.Counterparty.Length > 12 ? $"{r.Counterparty[..6]}...{r.Counterparty[^4..]}" : r.Counterparty,
                        RelationType = "primary_sink",
                        SharedVolumeHmnd = Math.Round(r.TotalHmnd, 2),
                        AffinityPercent = share,
                        AffinityPercentage = share,
                        InferredRole = "collector_treasury",
                        Role = "Collector / Treasury",
                        CommonTxsCount = r.TxCount
                    });
                }
            }
        }

        string behaviorSummary = $"{entityName} • {flowPatterns.Count} flows • {clusterMembers.Count} cluster members";

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
