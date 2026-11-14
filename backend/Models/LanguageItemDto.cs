using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class LanguageItemDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = "";

    [JsonPropertyName("flag")]
    public string Flag { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("nativeName")]
    public string NativeName { get; set; } = "";

    [JsonPropertyName("country")]
    public string Country { get; set; } = "";

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }
}
