using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class FeesPotAnalyticsDto
{
    [JsonPropertyName("feesPotAddress")]
    public string FeesPotAddress { get; set; } = "";

    [JsonPropertyName("currentBalance")]
    public double CurrentBalance { get; set; }

    [JsonPropertyName("totalBatches")]
    public int TotalBatches { get; set; }

    [JsonPropertyName("burnedTotal")]
    public double BurnedTotal { get; set; }

    [JsonPropertyName("totalInflowHmnd")]
    public double TotalInflowHmnd { get; set; }

    [JsonPropertyName("directTransfersHmnd")]
    public double DirectTransfersHmnd { get; set; }

    [JsonPropertyName("genesisReserveHmnd")]
    public double GenesisReserveHmnd { get; set; }

    [JsonPropertyName("incomingTransfers")]
    public List<IncomingTransferItemDto> IncomingTransfers { get; set; } = new();

    [JsonPropertyName("runwayRounds")]
    public double RunwayRounds { get; set; }

    [JsonPropertyName("runwayDays")]
    public int RunwayDays { get; set; }

    [JsonPropertyName("lastBatch")]
    public PayoutBatchSummaryDto? LastBatch { get; set; }

    [JsonPropertyName("nextEstimatedTs")]
    public long NextEstimatedTs { get; set; }

    [JsonPropertyName("history")]
    public List<PayoutBatchItemDto> History { get; set; } = new();
}
