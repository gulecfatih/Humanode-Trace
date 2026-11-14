using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class QuerySandboxResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("messageKey")]
    public string? MessageKey { get; set; }

    [JsonPropertyName("columns")]
    public List<string> Columns { get; set; } = new();

    [JsonPropertyName("rows")]
    public List<QueryRowDto> Rows { get; set; } = new();

    [JsonPropertyName("rowCount")]
    public int RowCount { get; set; }

    [JsonPropertyName("executionTimeMs")]
    public long ExecutionTimeMs { get; set; }
}
