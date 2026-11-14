using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

public class TokenDto
{
    [JsonPropertyName("token_address")]
    public string TokenAddress { get; set; } = "";

    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "";

    [JsonPropertyName("token_symbol")]
    public string TokenSymbol { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("token_name")]
    public string TokenName { get; set; } = "";

    [JsonPropertyName("decimals")]
    public int Decimals { get; set; } = 18;

    [JsonPropertyName("transfer_count")]
    public long TransferCount { get; set; }

    [JsonPropertyName("total_volume")]
    public double TotalVolume { get; set; }

    [JsonPropertyName("unique_senders")]
    public int UniqueSenders { get; set; }

    [JsonPropertyName("unique_holders")]
    public int UniqueHolders { get; set; }

    [JsonPropertyName("first_seen")]
    public long FirstSeen { get; set; }

    [JsonPropertyName("last_seen")]
    public long LastSeen { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = "ERC-20 Token";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "violet";
}
