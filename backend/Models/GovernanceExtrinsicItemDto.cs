using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class GovernanceExtrinsicItemDto
{
    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("pallet")]
    public string Pallet { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("signer")]
    public string Signer { get; set; } = "";

    [JsonPropertyName("target")]
    public string? Target { get; set; }

    [JsonPropertyName("value_hmnd")]
    public double ValueHmnd { get; set; }

    [JsonPropertyName("fee_hmnd")]
    public double FeeHmnd { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }
}
