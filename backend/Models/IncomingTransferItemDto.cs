using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class IncomingTransferItemDto
{
    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block")]
    public long Block { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("signer")]
    public string Signer { get; set; } = "";

    [JsonPropertyName("amount")]
    public double Amount { get; set; }

    [JsonPropertyName("pallet")]
    public string Pallet { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "DIRECT_TRANSFER";
}
