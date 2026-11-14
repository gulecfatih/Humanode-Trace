namespace HumanodeTracker.Models;

public class MoneyTrailRequest
{
    public string? Address { get; set; }
    public string? Addr { get; set; }
    public int Depth { get; set; } = 2;
    public int Limit { get; set; } = 4;

    public string TargetAddress => !string.IsNullOrWhiteSpace(Address) ? Address.Trim() : (Addr ?? "").Trim();
}
