namespace HumanodeTracker.Models;

public class ExportCsvRequest
{
    public string Layer { get; set; } = "all";
    public string Filter { get; set; } = "all";
    public string StartDate { get; set; } = "";
    public string EndDate { get; set; } = "";
    public string Search { get; set; } = "";
    public string Q { get; set; } = "";
    public string Pallet { get; set; } = "";
    public string? HideZeroFee { get; set; }
}
