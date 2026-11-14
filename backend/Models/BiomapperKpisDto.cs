using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

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
