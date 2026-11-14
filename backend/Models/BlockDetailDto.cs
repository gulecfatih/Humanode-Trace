using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class BlockDetailDto
{
    [JsonPropertyName("found")]
    public bool Found { get; set; }

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("blockNumber")]
    public long BlockNumberCamel => BlockNumber;

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; } = 0.0;

    [JsonPropertyName("total_tx_count")]
    public int TxCount { get; set; }

    [JsonPropertyName("tx_count")]
    public int TxCountSnake => TxCount;

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

    [JsonPropertyName("transactions")]
    public List<TransactionDto> Transactions { get; set; } = new();
}
