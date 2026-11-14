using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class GovernanceAnalyticsDto
{
    [JsonPropertyName("sudoKey")]
    public string SudoKey { get; set; } = "";

    [JsonPropertyName("totalSudoCalls")]
    public int TotalSudoCalls { get; set; }

    [JsonPropertyName("recentSudoCalls")]
    public List<object> RecentSudoCalls { get; set; } = new();

    [JsonPropertyName("multisigStats")]
    public MultisigStatsDto MultisigStats { get; set; } = new();

    [JsonPropertyName("recentMultisigCalls")]
    public List<object> RecentMultisigCalls { get; set; } = new();

    [JsonPropertyName("specVersion")]
    public int SpecVersion { get; set; } = 135;

    [JsonPropertyName("chain")]
    public string Chain { get; set; } = "Humanode Mainnet";
}
