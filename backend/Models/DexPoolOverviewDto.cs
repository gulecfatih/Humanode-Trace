namespace HumanodeTracker.Models;

public class DexPoolOverviewDto
{
    public string Address { get; set; } = "";
    public string PairName { get; set; } = "";
    public double TvlUsd { get; set; }
    public double Volume24hUsd { get; set; }
    public double AprPercent { get; set; }
}
