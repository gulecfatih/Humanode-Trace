using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BioauthFeedDto
{
    [JsonPropertyName("items")]
    public List<BioauthFeedItemDto> Items { get; set; } = new();

    [JsonPropertyName("pagination")]
    public PaginationDto Pagination { get; set; } = new();
}
