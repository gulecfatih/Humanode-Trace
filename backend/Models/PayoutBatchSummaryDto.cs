using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class PayoutBatchSummaryDto
{
    [JsonPropertyName("block")]
    public long Block { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("recipientCount")]
    public int RecipientCount { get; set; }

    [JsonPropertyName("samplePerValidator")]
    public double SamplePerValidator { get; set; }
}
