namespace HumanodeTracker.Models;

public class DexDepthDto
{
    public string PoolAddress { get; set; } = "";
    public string PairName { get; set; } = "WeHMND / USDC";
    public string DexName { get; set; } = "Impossible Finance V2";
    public double ReserveToken0 { get; set; }
    public string Symbol0 { get; set; } = "WeHMND";
    public double ReserveToken1 { get; set; }
    public string Symbol1 { get; set; } = "USDC";
    public double ConstantProductK { get; set; }
    public double SpotPriceUsd { get; set; } = 0.0;
    public double TotalTvlUsd { get; set; }
    public double Volume24hHmnd { get; set; }
    public double Volume24hUsd { get; set; }
    public double Fees24hUsd { get; set; }
    public List<SlippageTierDto> SlippageTiers { get; set; } = new();
    public List<ImpermanentLossPointDto> ImpermanentLossCurve { get; set; } = new();
}
