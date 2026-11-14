namespace HumanodeTracker.Models;

public class WalletTokensContext
{
    public string Address { get; set; } = "";
    public double NetBalance { get; set; }
    public double PriceUsd { get; set; }
    public double TotalIn { get; set; }
    public double TotalOut { get; set; }
    public int TotalHmndTxs { get; set; }
}
