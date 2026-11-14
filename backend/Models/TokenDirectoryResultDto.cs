using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TokenDirectoryResultDto
{
    [JsonPropertyName("tokens")]
    public List<TokenDto> Tokens { get; set; } = new();

    [JsonPropertyName("top_pools")]
    public List<PoolDto> TopPools { get; set; } = new();
}
