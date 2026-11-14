using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class ValidatorHealthDto
{
    [JsonPropertyName("totalValidators")]
    public int TotalValidators { get; set; }

    [JsonPropertyName("activeValidators")]
    public int ActiveValidators { get; set; }

    [JsonPropertyName("offlineCount")]
    public int OfflineCount { get; set; }

    [JsonPropertyName("totalBioauth")]
    public int TotalBioauth { get; set; }

    [JsonPropertyName("totalHeartbeats")]
    public int TotalHeartbeats { get; set; }

    [JsonPropertyName("fees_pot_address")]
    public string FeesPotAddress { get; set; } = "";

    [JsonPropertyName("fees_pot_balance_hmnd")]
    public double FeesPotBalanceHmnd { get; set; }

    [JsonPropertyName("last_payout_block")]
    public long LastPayoutBlock { get; set; }

    [JsonPropertyName("last_payout_ts")]
    public long LastPayoutTs { get; set; }

    [JsonPropertyName("last_payout_per_validator")]
    public double LastPayoutPerValidator { get; set; }

    [JsonPropertyName("est_round_per_validator")]
    public double EstRoundPerValidator { get; set; }

    [JsonPropertyName("validators")]
    public List<ValidatorItemDto> Validators { get; set; } = new();
}
