namespace HumanodeTracker.Models;

public class LabelsQueryRequest
{
    public bool WatchedOnly { get; set; }
    public string Category { get; set; } = "all";
    public string Search { get; set; } = "";
    public string Q { get; set; } = "";
}
