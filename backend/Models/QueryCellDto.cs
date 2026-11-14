using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class QueryCellDto
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = "";

    [JsonPropertyName("value")]
    public object? Value { get; set; }
}
