namespace HumanodeTracker.Models;

public class SnapshotHolderDto
{
    public string Address { get; set; } = "";
    public string Layer { get; set; } = "Substrate";
    public double BalanceHmnd { get; set; }
    public double ValueUsd { get; set; }
}
