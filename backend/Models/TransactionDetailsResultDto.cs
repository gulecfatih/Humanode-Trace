namespace HumanodeTracker.Models;

public class TransactionDetailsResultDto
{
    public bool Found { get; set; }
    public string? Layer { get; set; }
    public TransactionDto? Tx { get; set; }
    public List<TokenTransferItemDto>? TokenTransfers { get; set; }
    public object? DecodedCall { get; set; }
}
