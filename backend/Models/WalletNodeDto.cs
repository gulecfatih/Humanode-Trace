namespace HumanodeTracker.Models;

public class WalletNodeDto
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public string ShortAddr { get; set; } = "";
    public string Layer { get; set; } = "";
    public bool IsRoot { get; set; }
    public int Depth { get; set; }
    public double Balance { get; set; }
}
