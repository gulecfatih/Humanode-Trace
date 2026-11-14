using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class PoolDto
{
    [JsonPropertyName("pool_address")]
    public string PoolAddress { get; set; } = "";

    [JsonPropertyName("swap_count")]
    public long SwapCount { get; set; }

    [JsonPropertyName("token_types")]
    public int TokenTypes { get; set; }

    [JsonPropertyName("tokens_involved")]
    public string TokensInvolved { get; set; } = "";

    [JsonPropertyName("total_token_volume")]
    public double TotalTokenVolume { get; set; }

    [JsonPropertyName("last_active")]
    public long LastActive { get; set; }
}
