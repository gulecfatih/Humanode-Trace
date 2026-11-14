using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TranslationItemDto
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = "";

    [JsonPropertyName("value")]
    public string Value { get; set; } = "";
}
