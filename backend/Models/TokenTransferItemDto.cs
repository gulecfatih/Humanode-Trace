using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TokenTransferItemDto
{
    [JsonPropertyName("token_address")]
    public string TokenAddress { get; set; } = "";

    [JsonPropertyName("token_symbol")]
    public string TokenSymbol { get; set; } = "";

    [JsonPropertyName("from_address")]
    public string FromAddress { get; set; } = "";

    [JsonPropertyName("to_address")]
    public string ToAddress { get; set; } = "";

    [JsonPropertyName("amount")]
    public double Amount { get; set; }
}
