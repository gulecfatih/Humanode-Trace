namespace HumanodeTracker.Models;

public class ImpermanentLossPointDto
{
    public double PriceRatio { get; set; }
    public string PriceRatioLabel { get; set; } = "";
    public double ImpermanentLossPercent { get; set; }
    public double HoldValueUsd { get; set; }
    public double LpValueUsd { get; set; }
}
