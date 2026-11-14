using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BlockDto
{
    [JsonPropertyName("number")]
    public long Number { get; set; }

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("parent_hash")]
    public string? ParentHash { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("evm_tx_count")]
    public int EvmTxCount { get; set; }

    [JsonPropertyName("sub_tx_count")]
    public int SubTxCount { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("author")]
    public string? Author { get; set; }

    [JsonPropertyName("transactions")]
    public List<TransactionDto>? Transactions { get; set; }
}
