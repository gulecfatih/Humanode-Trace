using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BiomapperChainDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("shortName")]
    public string ShortName { get; set; } = "";

    [JsonPropertyName("chainId")]
    public long ChainId { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "";

    [JsonPropertyName("contractAddress")]
    public string ContractAddress { get; set; } = "";

    [JsonPropertyName("explorerName")]
    public string ExplorerName { get; set; } = "";

    [JsonPropertyName("explorerUrl")]
    public string ExplorerUrl { get; set; } = "";

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    [JsonPropertyName("iconColor")]
    public string IconColor { get; set; } = "";

    [JsonPropertyName("generationsSupported")]
    public string GenerationsSupported { get; set; } = "";

    [JsonPropertyName("sdkInterface")]
    public string SdkInterface { get; set; } = "";

    [JsonPropertyName("features")]
    public List<string> Features { get; set; } = new();
}
