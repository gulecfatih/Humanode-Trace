using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TokenomicsDto
{
    [JsonPropertyName("totalIssuance")]
    public double TotalIssuance { get; set; } = 400000000;

    [JsonPropertyName("burnedTotal")]
    public double BurnedTotal { get; set; }

    [JsonPropertyName("burnContractAddress")]
    public string BurnContractAddress { get; set; } = "";

    [JsonPropertyName("burnedTxsCount")]
    public int BurnedTxsCount { get; set; }

    [JsonPropertyName("effectiveSupply")]
    public double EffectiveSupply { get; set; }

    [JsonPropertyName("claimableAirdrop")]
    public double ClaimableAirdrop { get; set; }

    [JsonPropertyName("feesPotBalance")]
    public double FeesPotBalance { get; set; }

    [JsonPropertyName("lockedVesting")]
    public double LockedVesting { get; set; }

    [JsonPropertyName("circulatingEstimate")]
    public double CirculatingEstimate { get; set; }

    [JsonPropertyName("source")]
    public string Source { get; set; } = "Official Humanode Native Supply API (supply-api.mainnet.stages.humanode.io)";
}
