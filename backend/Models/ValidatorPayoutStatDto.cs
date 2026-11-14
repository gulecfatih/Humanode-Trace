namespace HumanodeTracker.Models;

public class ValidatorPayoutStatDto
{
    public string Address { get; set; } = "";
    public int Count { get; set; }
    public double TotalHmnd { get; set; }
    public long LastTs { get; set; }
    public double LastHmnd { get; set; }
    public long LastBlock { get; set; }
}
