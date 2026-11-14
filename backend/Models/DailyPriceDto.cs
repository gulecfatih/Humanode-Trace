using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class DailyPriceDto
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = "";

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; }
}
