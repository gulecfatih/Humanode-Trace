using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class DailyStatsDto
{
    [JsonPropertyName("day")]
    public string Day { get; set; } = "";

    [JsonPropertyName("period")]
    public string Period { get; set; } = "";

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("tx_count")]
    public long TxCount { get; set; }

    [JsonPropertyName("extrinsics_count")]
    public long ExtrinsicsCount { get; set; }

    [JsonPropertyName("token_tx_count")]
    public long TokenTxCount { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("fees_usd")]
    public double FeesUsd { get; set; }

    [JsonPropertyName("total_fees_usd")]
    public double TotalFeesUsd { get; set; }

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; }
}
