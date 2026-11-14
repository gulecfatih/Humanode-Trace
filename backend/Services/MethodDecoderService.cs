using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Services;

public class MethodDecoderService
{
    private readonly SqliteConnectionFactory _dbFactory;
    private List<MethodSignatureDto> _signatures = new();

    public MethodDecoderService(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
        LoadSignatures();
    }

    private void LoadSignatures()
    {
        try
        {
            using var conn = _dbFactory.CreateConnection();
            var rows = conn.Query<(string selector, string function_name, string signature, string category_code, string description_key)>(StoredProcedures.GetEvmMethodSignatures);
            var list = new List<MethodSignatureDto>();
            foreach (var r in rows)
            {
                var sel = (r.selector ?? "").ToLowerInvariant();
                list.Add(new MethodSignatureDto
                {
                    Selector = sel,
                    Name = r.function_name,
                    Signature = r.signature,
                    CategoryCode = r.category_code,
                    Category = r.category_code.ToUpperInvariant(),
                    DescriptionKey = r.description_key,
                    Description = ""
                });
            }
            if (list.Count > 0)
            {
                _signatures = list;
            }
        }
        catch
        {
            // Graceful fallback if database is loading
        }
    }

    public DecodedCallDto DecodeInput(string input)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length < 10)
        {
            return new DecodedCallDto
            {
                IsDecoded = false,
                FunctionName = "evm_func_native_transfer",
                CategoryCode = "native_transfer",
                Category = "Transfer",
                DescriptionKey = "evm_desc_native_transfer",
                Description = ""
            };
        }

        var clean = input.Trim();
        if (!clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase))
            clean = "0x" + clean;

        var selector = clean[..10].ToLowerInvariant();
        if (_signatures.Count == 0)
        {
            LoadSignatures();
        }

        var sig = _signatures.FirstOrDefault(s => s.Selector == selector);
        if (sig == null)
        {
            return new DecodedCallDto
            {
                IsDecoded = false,
                Selector = selector,
                FunctionName = selector,
                CategoryCode = "custom_call",
                Category = "custom_call",
                DescriptionKey = "evm_desc_unknown_call",
                Description = ""
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
            paramsList.Add(new DecodedParamDto { Name = "value", Type = "uint256", Value = "Unlimited / Max Allowance" });
        }

        return new DecodedCallDto
        {
            IsDecoded = true,
            Selector = selector,
            FunctionName = sig.Name,
            Signature = sig.Signature,
            CategoryCode = sig.CategoryCode,
            Category = sig.Category,
            DescriptionKey = sig.DescriptionKey,
            Description = sig.Description,
            Parameters = paramsList
        };
    }
}
