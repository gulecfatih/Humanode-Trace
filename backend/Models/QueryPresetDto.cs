using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class QueryPresetDto
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("title_key")]
    public string TitleKey { get; set; } = "";

    [JsonPropertyName("description_key")]
    public string DescriptionKey { get; set; } = "";

    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("sql")]
    public string Sql { get; set; } = "";

    [JsonPropertyName("display_order")]
    public int DisplayOrder { get; set; }
}
