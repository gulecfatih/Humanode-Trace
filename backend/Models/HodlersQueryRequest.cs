namespace HumanodeTracker.Models;

public class HodlersQueryRequest
{
    public string Network { get; set; } = "all";
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
    public string Q { get; set; } = "";
}
