namespace HumanodeTracker.Models;

public class SimulationInputDto
{
    public int ValidatorCount { get; set; } = 48;
    public double VolumeMultiplier { get; set; } = 1.0;
    public double HmndPriceUsd { get; set; } = 0.0;
    public double VpsCostPerMonth { get; set; } = 15.0;
}
