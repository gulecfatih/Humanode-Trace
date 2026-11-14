using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BioauthFeedItemDto
{
    [JsonPropertyName("tx_hash")]
    public string TxHash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("signer")]
    public string Signer { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("details")]
    public string Details { get; set; } = "";

    [JsonPropertyName("network")]
    public string Network { get; set; } = "Humanode Root L1";

    [JsonPropertyName("evm_counterpart")]
    public string? EvmCounterpart { get; set; }
}
