using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class MajorWalletDto
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = "whale";

    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "Substrate";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = "";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "#3b82f6";

    [JsonPropertyName("tx_count")]
    public long TxCount { get; set; }

    [JsonPropertyName("in_count")]
    public long InCount { get; set; }

    [JsonPropertyName("out_count")]
    public long OutCount { get; set; }

    [JsonPropertyName("inflow_hmnd")]
    public double InflowHmnd { get; set; }

    [JsonPropertyName("outflow_hmnd")]
    public double OutflowHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("live_balance_hmnd")]
    public double LiveBalanceHmnd { get; set; }

    [JsonPropertyName("balance_usd")]
    public double BalanceUsd { get; set; }
}
