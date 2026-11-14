using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class MultisigStatsDto
{
    [JsonPropertyName("total_txs")]
    public int TotalTxs { get; set; }

    [JsonPropertyName("unique_signers")]
    public int UniqueSigners { get; set; }
}
