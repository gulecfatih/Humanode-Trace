using System.Text.Json;

namespace HumanodeTracker.Services;

public interface IHumanodeSidecarClient
{
    Task<double?> GetAccountBalanceAsync(string address);
    Task<double?> GetEvmBalanceAsync(string address);
    Task<double?> GetErc20BalanceAsync(string tokenAddress, string walletAddress, int decimals = 18);
    Task<double?> GetOfficialCirculatingSupplyAsync();
}

public class HumanodeSidecarClient : IHumanodeSidecarClient
{
    private readonly HttpClient _httpClient;
    private readonly string _sidecarBaseUrl;
    private readonly string _rpcUrl;
    private readonly string _supplyApiUrl;

    public HumanodeSidecarClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(6);
        _sidecarBaseUrl = config["Sidecar:BaseUrl"] ?? config["SidecarUrl"] ?? "https://explorer-api-sidecar.mainnet.stages.humanode.io";
        _rpcUrl = config["RpcUrl"] ?? "https://explorer-rpc-http.mainnet.stages.humanode.io";
        _supplyApiUrl = config["Tokenomics:CirculatingSupplyUrl"] ?? config["SupplyApiUrl"] ?? "https://supply-api.mainnet.stages.humanode.io/supply/circulating";
    }

    public async Task<double?> GetEvmBalanceAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        try
        {
            var clean = address.Trim();
            var payload = new
            {
                jsonrpc = "2.0",
                method = "eth_getBalance",
                @params = new object[] { clean, "latest" },
                id = 1
            };
            var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var res = await _httpClient.PostAsync(_rpcUrl, content);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("result", out var r) && r.ValueKind == JsonValueKind.String)
            {
                var hex = r.GetString() ?? "0x0";
                if (hex.StartsWith("0x", StringComparison.OrdinalIgnoreCase)) hex = hex[2..];
                if (string.IsNullOrEmpty(hex)) hex = "0";

                if (System.Numerics.BigInteger.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out var wei))
                {
                    var whole = (double)(wei / 1_000_000_000_000_000_000);
                    var frac = (double)(wei % 1_000_000_000_000_000_000) / 1e18;
                    return Math.Round(whole + frac, 4);
                }
            }
        }
        catch
        {
            // RPC fallback
        }
        return null;
    }

    public async Task<double?> GetErc20BalanceAsync(string tokenAddress, string walletAddress, int decimals = 18)
    {
        if (string.IsNullOrWhiteSpace(tokenAddress) || string.IsNullOrWhiteSpace(walletAddress)) return null;
        try
        {
            var cleanToken = tokenAddress.Trim();
            var cleanWallet = walletAddress.Trim().ToLowerInvariant();
            if (cleanWallet.StartsWith("0x")) cleanWallet = cleanWallet[2..];
            var paddedWallet = cleanWallet.PadLeft(64, '0');
            var callData = "0x70a08231" + paddedWallet;

            var payload = new
            {
                jsonrpc = "2.0",
                method = "eth_call",
                @params = new object[]
                {
                    new { to = cleanToken, data = callData },
                    "latest"
                },
                id = 1
            };
            var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
            var res = await _httpClient.PostAsync(_rpcUrl, content);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("result", out var r) && r.ValueKind == JsonValueKind.String)
            {
                var hex = r.GetString() ?? "0x0";
                if (hex.StartsWith("0x", StringComparison.OrdinalIgnoreCase)) hex = hex[2..];
                if (string.IsNullOrEmpty(hex)) hex = "0";

                if (System.Numerics.BigInteger.TryParse(hex, System.Globalization.NumberStyles.HexNumber, null, out var rawVal))
                {
                    var div = System.Numerics.BigInteger.Pow(10, decimals);
                    var whole = (double)(rawVal / div);
                    var frac = (double)(rawVal % div) / Math.Pow(10, decimals);
                    return Math.Round(whole + frac, 4);
                }
            }
        }
        catch
        {
            // RPC fallback
        }
        return null;
    }

    public async Task<double?> GetAccountBalanceAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        var clean = address.Trim();
        if (clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
        {
            return await GetEvmBalanceAsync(clean);
        }

        try
        {
            var url = $"{_sidecarBaseUrl.TrimEnd('/')}/accounts/{clean}/balance-info";
            var res = await _httpClient.GetAsync(url);
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            string freeStr = root.TryGetProperty("free", out var f) ? f.GetString() ?? "0" : "0";
            string resStr = root.TryGetProperty("reserved", out var r) ? r.GetString() ?? "0" : "0";

            if (System.Numerics.BigInteger.TryParse(freeStr, out var freeBig) &&
                System.Numerics.BigInteger.TryParse(resStr, out var resBig))
            {
                var total = freeBig + resBig;
                var whole = (double)(total / 1_000_000_000_000_000_000);
                var frac = (double)(total % 1_000_000_000_000_000_000) / 1e18;
                return Math.Round(whole + frac, 4);
            }
        }
        catch
        {
            // Network timeout / transient
        }
        return null;
    }

    public async Task<double?> GetOfficialCirculatingSupplyAsync()
    {
        try
        {
            var res = await _httpClient.GetAsync(_supplyApiUrl);
            if (res.IsSuccessStatusCode)
            {
                var text = (await res.Content.ReadAsStringAsync()).Trim();
                if (double.TryParse(text, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var val) && val > 1e8)
                {
                    return Math.Round(val, 2);
                }
            }
        }
        catch
        {
            // Transient error
        }
        return null;
    }
}
