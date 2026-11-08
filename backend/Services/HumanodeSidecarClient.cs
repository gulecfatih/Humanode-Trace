using System.Text.Json;

namespace HumanodeTracker.Services;

public interface IHumanodeSidecarClient
{
    Task<double?> GetAccountBalanceAsync(string address);
    Task<double?> GetOfficialCirculatingSupplyAsync();
}

public class HumanodeSidecarClient : IHumanodeSidecarClient
{
    private readonly HttpClient _httpClient;
    private readonly string _sidecarBaseUrl;
    private readonly string _supplyApiUrl;

    public HumanodeSidecarClient(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(6);
        _sidecarBaseUrl = config["Sidecar:BaseUrl"] ?? "https://explorer-api-sidecar.mainnet.stages.humanode.io";
        _supplyApiUrl = config["Tokenomics:CirculatingSupplyUrl"] ?? "https://supply-api.mainnet.stages.humanode.io/supply/circulating";
    }

    public async Task<double?> GetAccountBalanceAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        try
        {
            var url = $"{_sidecarBaseUrl.TrimEnd('/')}/accounts/{address.Trim()}/balance-info";
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
