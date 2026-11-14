namespace HumanodeTracker.Models;

public class CompareWalletsRequest
{
    public string? WalletA { get; set; }
    public string? A { get; set; }
    public string? WalletB { get; set; }
    public string? B { get; set; }

    public string FirstWallet => !string.IsNullOrWhiteSpace(WalletA) ? WalletA.Trim() : (A ?? "").Trim();
    public string SecondWallet => !string.IsNullOrWhiteSpace(WalletB) ? WalletB.Trim() : (B ?? "").Trim();
}
