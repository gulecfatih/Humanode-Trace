namespace HumanodeTracker.Models;

public class HistoricalRatesQueryRequest
{
    public string Year { get; set; } = "all";
    public string Search { get; set; } = "";
    public string Q { get; set; } = "";
    public bool OnlySwaps { get; set; }
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
}
