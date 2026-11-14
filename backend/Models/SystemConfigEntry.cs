using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class SystemConfigEntry
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = "";

    [JsonPropertyName("value")]
    public string Value { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("updated_at")]
    public long UpdatedAt { get; set; }
}
