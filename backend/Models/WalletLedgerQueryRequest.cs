namespace HumanodeTracker.Models;

public class WalletLedgerQueryRequest
{
    public string Address { get; set; } = "";
    public string Addr { get; set; } = "";
    public int LedgerPage { get; set; } = 1;
    public int LedgerLimit { get; set; } = 50;
    public string LedgerFlow { get; set; } = "all";
    public bool HideBioauth { get; set; } = true;
    public string Flow { get; set; } = "";
    public string Format { get; set; } = "";
}
