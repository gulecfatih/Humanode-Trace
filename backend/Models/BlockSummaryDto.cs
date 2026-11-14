using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BlockSummaryDto
{
    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("blockNumber")]
    public long BlockNumberCamel => BlockNumber;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("total_tx_count")]
    public int TxCount { get; set; }

    [JsonPropertyName("txCount")]
    public int TxCountCamel => TxCount;

    [JsonPropertyName("evm_count")]
    public int EvmCount { get; set; }

    [JsonPropertyName("evmCount")]
    public int EvmCountCamel => EvmCount;

    [JsonPropertyName("substrate_count")]
    public int SubstrateCount { get; set; }

    [JsonPropertyName("substrateCount")]
    public int SubstrateCountCamel => SubstrateCount;

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("totalFeesHmnd")]
    public double TotalFeesHmndCamel => TotalFeesHmnd;

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("totalVolumeHmnd")]
    public double TotalVolumeHmndCamel => TotalVolumeHmnd;

    [JsonPropertyName("pallets")]
    public string Pallets { get; set; } = "";

    [JsonPropertyName("transactions")]
    public List<TransactionDto> Transactions { get; set; } = new();
}
