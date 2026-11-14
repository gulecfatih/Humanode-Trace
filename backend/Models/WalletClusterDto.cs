namespace HumanodeTracker.Models;

public class WalletClusterDto
{
    public string Address { get; set; } = "";
    public string ShortAddress { get; set; } = "";
    public string EntityType { get; set; } = "RETAIL";
    public string EntityName { get; set; } = "Retail User";
    public string Color { get; set; } = "#3b82f6";
    public string Icon { get; set; } = "👤";
    public int RiskScore { get; set; } = 10;
    public string RiskLevel { get; set; } = "low";
    public string BehavioralSummary { get; set; } = "";
    public List<ClusterMemberDto> AssociatedClusterWallets { get; set; } = new();
    public List<ClusterFlowPatternDto> TopFlowPatterns { get; set; } = new();
}
