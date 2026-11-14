namespace HumanodeTracker.Models;

public class BiomapperQueryRequest
{
    public string NetworkType { get; set; } = "all";
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 25;
    public string Q { get; set; } = "";
    public string FeedNetwork { get; set; } = "all";
}
