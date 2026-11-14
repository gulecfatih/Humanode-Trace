using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class QueryRowDto
{
    [JsonPropertyName("cells")]
    public List<QueryCellDto> Cells { get; set; } = new();
}
