using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class AddressLabelDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "custom";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "cyan";

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = "";

    [JsonPropertyName("is_watched")]
    public int IsWatched { get; set; } = 1;

    [JsonPropertyName("updated_at")]
    public long UpdatedAt { get; set; }
}
