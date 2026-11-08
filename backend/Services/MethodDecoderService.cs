namespace HumanodeTracker.Services;

public interface IMethodDecoderService
{
    DecodedCallDto DecodeInput(string input);
}

public class DecodedCallDto
{
    public bool IsDecoded { get; set; }
    public string Selector { get; set; } = "";
    public string FunctionName { get; set; } = "Bilinmeyen Fonksiyon";
    public string Signature { get; set; } = "";
    public string Category { get; set; } = "Genel";
    public string Description { get; set; } = "";
    public List<DecodedParamDto> Parameters { get; set; } = new();
}

public class DecodedParamDto
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public string Value { get; set; } = "";
}

public class MethodDecoderService : IMethodDecoderService
{
    private static readonly Dictionary<string, (string name, string sig, string category, string desc)> Signatures =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["0xa9059cbb"] = ("transfer", "transfer(address to, uint256 value)", "ERC-20", "Belirtilen adrese token aktarımı."),
            ["0x095ea7b3"] = ("approve", "approve(address spender, uint256 value)", "ERC-20", "Harcayıcıya token limit onayı verme."),
            ["0x23b872dd"] = ("transferFrom", "transferFrom(address from, address to, uint256 value)", "ERC-20", "Onaylanmış hesaptan token çekme."),
            ["0x38ed1739"] = ("swapExactTokensForTokens", "swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)", "DEX Swap", "DEX havuzunda token takası."),
            ["0x18cbafe5"] = ("swapExactTokensForETH", "swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)", "DEX Swap", "Token verip yerel HMND alma."),
            ["0x7ff36ab5"] = ("swapExactETHForTokens", "swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)", "DEX Swap", "Yerel HMND verip token alma."),
            ["0xd0e30db0"] = ("deposit", "deposit()", "WETH / Wrapper", "Yerel HMND sarıp Wrapped eHMND alma."),
            ["0x2e1a7d4d"] = ("withdraw", "withdraw(uint256 wad)", "WETH / Wrapper", "Wrapped eHMND çözüp yerel HMND alma."),
            ["0xe8e33700"] = ("addLiquidity", "addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)", "DEX LP", "Likidite havuzuna çift taraflı fon ekleme."),
            ["0xbaa2abde"] = ("removeLiquidity", "removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline)", "DEX LP", "Likidite havuzundan fon çekme."),
            ["0x8b9e4f93"] = ("stake", "stake(uint256 amount)", "Staking / Yield", "Protokol staking havuzuna kitleme."),
            ["0x2e17de78"] = ("claim", "claim()", "Rewards", "Hak edilen ödül veya airdrop talep etme.")
        };

    public DecodedCallDto DecodeInput(string input)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length < 10)
        {
            return new DecodedCallDto
            {
                IsDecoded = false,
                FunctionName = "Yerel Transfer",
                Description = "Herhangi bir fonksiyon çağrısı içermeyen yerel transfer."
            };
        }

        var clean = input.Trim();
        if (!clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            clean = "0x" + clean;

        var selector = clean[..10].ToLowerInvariant();
        if (!Signatures.TryGetValue(selector, out var sig))
        {
            return new DecodedCallDto
            {
                IsDecoded = false,
                Selector = selector,
                FunctionName = $"Bilinmeyen Çağrı ({selector})",
                Description = "Özel sözleşme yürütmesi veya henüz tescillenmemiş ABI çağrısı."
            };
        }

        var paramsList = new List<DecodedParamDto>();
        var dataPart = clean.Length > 10 ? clean[10..] : "";

        // Parse transfer(address, uint256)
        if (selector == "0xa9059cbb" && dataPart.Length >= 128)
        {
            var rawAddr = dataPart[..64].TrimStart('0');
            if (rawAddr.Length < 40) rawAddr = rawAddr.PadLeft(40, '0');
            var targetAddr = "0x" + rawAddr;

            var hexAmt = dataPart[64..128].TrimStart('0');
            double amt = 0;
            if (System.Numerics.BigInteger.TryParse(hexAmt, System.Globalization.NumberStyles.HexNumber, null, out var bigAmt))
            {
                amt = (double)(bigAmt / 1_000_000_000_000_000_000) + ((double)(bigAmt % 1_000_000_000_000_000_000) / 1e18);
            }

            paramsList.Add(new DecodedParamDto { Name = "to", Type = "address", Value = targetAddr });
            paramsList.Add(new DecodedParamDto { Name = "value", Type = "uint256", Value = $"{amt:N4}" });
        }
        else if (selector == "0x095ea7b3" && dataPart.Length >= 128)
        {
            var rawAddr = dataPart[..64].TrimStart('0');
            if (rawAddr.Length < 40) rawAddr = rawAddr.PadLeft(40, '0');
            var spender = "0x" + rawAddr;
            paramsList.Add(new DecodedParamDto { Name = "spender", Type = "address", Value = spender });
            paramsList.Add(new DecodedParamDto { Name = "value", Type = "uint256", Value = "Sınırsız / Max Limit" });
        }

        return new DecodedCallDto
        {
            IsDecoded = true,
            Selector = selector,
            FunctionName = sig.name,
            Signature = sig.sig,
            Category = sig.category,
            Description = sig.desc,
            Parameters = paramsList
        };
    }
}
