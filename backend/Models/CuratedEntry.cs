namespace HumanodeTracker.Models;

public class CuratedEntry
{
    public string Address { get; set; } = "";
    public string Label { get; set; } = "";
    public string Category { get; set; } = "";
    public string Color { get; set; } = "";
    public string Notes { get; set; } = "";
    public int IsWatched { get; set; }
}
