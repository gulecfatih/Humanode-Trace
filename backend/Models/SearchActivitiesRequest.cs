namespace HumanodeTracker.Models;

public class SearchActivitiesRequest
{
    public string Q { get; set; } = "";
    public string Layer { get; set; } = "all";
    public string Pallet { get; set; } = "";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public string Filter { get; set; } = "all";
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
    public string? HideZeroFee { get; set; }
    public bool WhaleOnly { get; set; }
    public string ViewMode { get; set; } = "block";

    public bool IsZeroFeeHidden => HideZeroFee != "0" && HideZeroFee != "false" && !string.IsNullOrWhiteSpace(HideZeroFee);
}

