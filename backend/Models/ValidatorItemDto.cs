using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class ValidatorItemDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; }

    [JsonPropertyName("status_label")]
    public string StatusLabel { get; set; } = "active_verified";

    [JsonPropertyName("blocks_authored")]
    public int BlocksAuthored { get; set; }

    [JsonPropertyName("total_blocks")]
    public int TotalBlocks => BlocksAuthored;

    [JsonPropertyName("recent_blocks")]
    public int RecentBlocks { get; set; }

    [JsonPropertyName("is_bio_valid")]
    public bool IsBioValid { get; set; }

    [JsonPropertyName("bio_expires_at")]
    public long? BioExpiresAt => ExpiresAtSec;

    [JsonPropertyName("bio_remaining_seconds")]
    public long? BioRemainingSeconds => SecondsLeft;

    [JsonPropertyName("bio_remaining_hours")]
    public double? BioRemainingHours => SecondsLeft.HasValue ? Math.Round(SecondsLeft.Value / 3600.0, 1) : null;

    [JsonPropertyName("total_bioauth")]
    public int TotalBioauth { get; set; }

    [JsonPropertyName("bio_current_epoch")]
    public int BioCurrentEpoch { get; set; }

    [JsonPropertyName("total_earned_hmnd")]
    public double TotalEarnedHmnd { get; set; }

    [JsonPropertyName("payout_rounds")]
    public int PayoutRounds { get; set; }

    [JsonPropertyName("last_payout_hmnd")]
    public double LastPayoutHmnd { get; set; }

    [JsonPropertyName("cadence_hours")]
    public double CadenceHours { get; set; } = 4.0;

    [JsonPropertyName("last_seen")]
    public long? LastSeen { get; set; }

    [JsonPropertyName("last_authored_block")]
    public long? LastAuthoredBlock { get; set; }

    [JsonPropertyName("last_authored_ts")]
    public long? LastAuthoredTs { get; set; }

    [JsonPropertyName("last_heartbeat_ts")]
    public long? LastHeartbeatTs { get; set; }

    [JsonPropertyName("last_bioauth_ts")]
    public long? LastBioauthTs { get; set; }

    [JsonPropertyName("expires_at_sec")]
    public long? ExpiresAtSec { get; set; }

    [JsonPropertyName("seconds_left")]
    public long? SecondsLeft { get; set; }

    [JsonPropertyName("key_updates")]
    public int KeyUpdates { get; set; }

    [JsonPropertyName("total_ops")]
    public int TotalOps { get; set; }

    [JsonPropertyName("balance_hmnd")]
    public double BalanceHmnd { get; set; }
}
