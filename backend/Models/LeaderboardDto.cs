using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class LeaderboardDto
{
    [JsonPropertyName("topBalances")]
    public List<LeaderboardItemDto> TopBalances { get; set; } = new();

    [JsonPropertyName("topBalancesEvm")]
    public List<LeaderboardItemDto> TopBalancesEvm { get; set; } = new();

    [JsonPropertyName("topBalancesSubstrate")]
    public List<LeaderboardItemDto> TopBalancesSubstrate { get; set; } = new();

    [JsonPropertyName("topSenders")]
    public List<LeaderboardItemDto> TopSenders { get; set; } = new();

    [JsonPropertyName("topSendersEvm")]
    public List<LeaderboardItemDto> TopSendersEvm { get; set; } = new();

    [JsonPropertyName("topSendersSubstrate")]
    public List<LeaderboardItemDto> TopSendersSubstrate { get; set; } = new();

    [JsonPropertyName("topVolume")]
    public List<LeaderboardItemDto> TopVolume { get; set; } = new();

    [JsonPropertyName("topVolumeEvm")]
    public List<LeaderboardItemDto> TopVolumeEvm { get; set; } = new();

    [JsonPropertyName("topVolumeSubstrate")]
    public List<LeaderboardItemDto> TopVolumeSubstrate { get; set; } = new();

    [JsonPropertyName("topFeeSpenders")]
    public List<LeaderboardItemDto> TopFeeSpenders { get; set; } = new();

    [JsonPropertyName("topFeeSpendersEvm")]
    public List<LeaderboardItemDto> TopFeeSpendersEvm { get; set; } = new();

    [JsonPropertyName("topFeeSpendersSubstrate")]
    public List<LeaderboardItemDto> TopFeeSpendersSubstrate { get; set; } = new();
}
