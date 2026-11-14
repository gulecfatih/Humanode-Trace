using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class LeaderboardItemDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "";

    [JsonPropertyName("total_txs")]
    public long TotalTxs { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("balance_hmnd")]
    public double BalanceHmnd { get; set; }

    [JsonPropertyName("last_seen")]
    public long LastSeen { get; set; }
}
