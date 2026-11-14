namespace HumanodeTracker.Models;

public class SimulationResultDto
{
    public double RewardPerRoundHmnd { get; set; }
    public double MonthlyTotalHmnd { get; set; }
    public double MonthlyGrossUsd { get; set; }
    public double MonthlyNetUsd { get; set; }
    public double AnnualNetUsd { get; set; }
    public double AnnualRoiPercent { get; set; }
    public bool IsProfitable { get; set; }
    public double RunwayMonths { get; set; }
    public double MonthlyFeesPotInflowHmnd { get; set; }
    public double MonthlyFeesPotOutflowHmnd { get; set; }
    public double NetMonthlyFeesPotDeltaHmnd { get; set; }
}
