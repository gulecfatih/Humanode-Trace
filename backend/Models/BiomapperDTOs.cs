using System.Text.Json.Serialization;
using HumanodeTracker.Repositories;

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

public class BiomapperKpisDto
{
    [JsonPropertyName("total_supported_chains")]
    public int TotalSupportedChains { get; set; }

    [JsonPropertyName("total_bioauth_operations")]
    public long TotalBioauthOperations { get; set; }

    [JsonPropertyName("active_human_validators")]
    public int ActiveHumanValidators { get; set; }

    [JsonPropertyName("active_generation")]
    public int ActiveGeneration { get; set; } = 4;

    [JsonPropertyName("active_generation_label")]
    public string ActiveGenerationLabel { get; set; } = "Generation #4 (Head)";

    [JsonPropertyName("cross_layer_matched_wallets")]
    public int CrossLayerMatchedWallets { get; set; }

    [JsonPropertyName("privacy_engine")]
    public string PrivacyEngine { get; set; } = "Confidential Virtual Machine (CVM) Enclave";

    [JsonPropertyName("security_standard")]
    public string SecurityStandard { get; set; } = "1 Human = 1 Address per Generation";
}

public class BioauthFeedItemDto
{
    [JsonPropertyName("tx_hash")]
    public string TxHash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("signer")]
    public string Signer { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("details")]
    public string Details { get; set; } = "";

    [JsonPropertyName("network")]
    public string Network { get; set; } = "Humanode Root L1";

    [JsonPropertyName("evm_counterpart")]
    public string? EvmCounterpart { get; set; }
}

public class BioauthFeedDto
{
    [JsonPropertyName("items")]
    public List<BioauthFeedItemDto> Items { get; set; } = new();

    [JsonPropertyName("pagination")]
    public PaginationDto Pagination { get; set; } = new();
}

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
