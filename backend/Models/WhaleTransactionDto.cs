using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class WhaleTransactionDto
{
    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "SUBSTRATE";

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("pallet")]
    public string? Pallet { get; set; }

    [JsonPropertyName("method")]
    public string? Method { get; set; }

    [JsonPropertyName("sender")]
    public string Sender { get; set; } = "";

    [JsonPropertyName("target")]
    public string Target { get; set; } = "";

    [JsonPropertyName("value_hmnd")]
    public double ValueHmnd { get; set; }

    [JsonPropertyName("fee_hmnd")]
    public double FeeHmnd { get; set; }

    [JsonPropertyName("gas_used")]
    public long GasUsed { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; } = 1;

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "HMND";

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("tier")]
    public string Tier { get; set; } = "whale";

    [JsonPropertyName("tag")]
    public string Tag { get; set; } = "🐋 Balina";

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; }

    [JsonPropertyName("usd_est")]
    public double UsdEst { get; set; }
}
