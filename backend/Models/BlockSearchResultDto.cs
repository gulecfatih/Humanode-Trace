using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BlockSearchResultDto
{
    [JsonPropertyName("results")]
    public List<BlockSummaryDto> Results { get; set; } = new();

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("pagination")]
    public PaginationDto Pagination { get; set; } = new();
}
