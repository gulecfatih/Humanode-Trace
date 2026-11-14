namespace HumanodeTracker.Models;

public class ClusterMemberDto
{
    public string Address { get; set; } = "";
    public string ShortAddress { get; set; } = "";
    public string RelationType { get; set; } = "shared_flow";
    public double SharedVolumeHmnd { get; set; }
    public double AffinityPercent { get; set; }
    public double AffinityPercentage { get; set; }
    public string InferredRole { get; set; } = "";
    public string Role { get; set; } = "";
    public int CommonTxsCount { get; set; }
}
