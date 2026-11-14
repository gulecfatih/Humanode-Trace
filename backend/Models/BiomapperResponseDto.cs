using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BiomapperResponseDto
{
    [JsonPropertyName("kpis")]
    public BiomapperKpisDto Kpis { get; set; } = new();

    [JsonPropertyName("chains")]
    public List<BiomapperChainDto> Chains { get; set; } = new();

    [JsonPropertyName("totalChainsCount")]
    public int TotalChainsCount { get; set; }

    [JsonPropertyName("bioauthFeed")]
    public BioauthFeedDto BioauthFeed { get; set; } = new();
}
