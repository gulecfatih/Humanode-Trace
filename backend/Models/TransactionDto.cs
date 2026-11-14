using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TransactionDto
{
    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "EVM";

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("from_address")]
    public string FromAddress { get; set; } = "";

    [JsonPropertyName("from_label")]
    public string? FromLabel { get; set; }

    [JsonPropertyName("to_address")]
    public string ToAddress { get; set; } = "";

    [JsonPropertyName("to_label")]
    public string? ToLabel { get; set; }

    [JsonPropertyName("value_hmnd")]
    public double ValueHmnd { get; set; }

    [JsonPropertyName("fee_hmnd")]
    public double FeeHmnd { get; set; }

    [JsonPropertyName("gas_used")]
    public long GasUsed { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("pallet")]
    public string? Pallet { get; set; }

    [JsonPropertyName("method")]
    public string? Method { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "HMND";

    [JsonPropertyName("tokenTransfers")]
    public List<TokenTransferItemDto>? TokenTransfers { get; set; }
}
