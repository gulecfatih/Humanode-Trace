namespace HumanodeTracker.Models;

public class TimeMachineSnapshotDto
{
    public long BlockNumber { get; set; }
    public long Timestamp { get; set; }
    public string Date { get; set; } = "";
    public double HmndPriceUsd { get; set; }
    public long CumulativeBlocks { get; set; }
    public long CumulativeTransactions { get; set; }
    public double CumulativeGasFeesHmnd { get; set; }
    public double CirculatingSupplyEstimate { get; set; }
    public List<SnapshotHolderDto> TopHoldersAtSnapshot { get; set; } = new();
}
