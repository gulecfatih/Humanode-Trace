namespace HumanodeTracker.Models;

public class SlippageTierDto
{
    public double TradeSizeHmnd { get; set; }
    public double TradeSizeUsd { get; set; }
    public double OutputToken1 { get; set; }
    public double EffectivePriceUsd { get; set; }
    public double PriceImpactPercent { get; set; }
    public string WarningTier { get; set; } = "low";
}
