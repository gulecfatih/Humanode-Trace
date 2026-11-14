namespace HumanodeTracker.Models;

public class TransactionQueryRequest
{
    public string? Hash { get; set; }
    public string Layer { get; set; } = "all";
    public string Filter { get; set; } = "all";
    public int Page { get; set; } = 1;
    public int Limit { get; set; } = 50;
    public string? HideZeroFee { get; set; }
}
