using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class StatsDto
{
    [JsonPropertyName("total_blocks")]
    public long TotalBlocks { get; set; }

    [JsonPropertyName("total_transactions")]
    public long TotalTransactions { get; set; }

    [JsonPropertyName("total_extrinsics")]
    public long TotalExtrinsics { get; set; }

    [JsonPropertyName("total_token_transfers")]
    public long TotalTokenTransfers { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("total_fees_usd")]
    public double TotalFeesUsd { get; set; }

    [JsonPropertyName("active_validators")]
    public int ActiveValidators { get; set; }

    [JsonPropertyName("active_tokens_count")]
    public int ActiveTokensCount { get; set; }

    [JsonPropertyName("last_block_number")]
    public long LastBlockNumber { get; set; }

    [JsonPropertyName("last_block_time")]
    public long LastBlockTime { get; set; }

    [JsonPropertyName("chain_status")]
    public string ChainStatus { get; set; } = "healthy";

    [JsonPropertyName("hmnd_price_usd")]
    public double HmndPriceUsd { get; set; }

    [JsonPropertyName("circulating_supply")]
    public double CirculatingSupply { get; set; }

    [JsonPropertyName("bridge_swap_volume_hmnd")]
    public double BridgeSwapVolumeHmnd { get; set; }

    [JsonPropertyName("bridge_swap_count")]
    public long BridgeSwapCount { get; set; }

    [JsonPropertyName("evm_fees_hmnd")]
    public double EvmFeesHmnd { get; set; }

    [JsonPropertyName("evm_volume_hmnd")]
    public double EvmVolumeHmnd { get; set; }

    [JsonPropertyName("sub_fees_hmnd")]
    public double SubFeesHmnd { get; set; }

    [JsonPropertyName("sub_volume_hmnd")]
    public double SubVolumeHmnd { get; set; }
}
