using System.Text.Json;
using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface ITaxReportRepository
{
    Task<ValidatorTaxReportDto> GenerateTaxReportAsync(string address, int? year = null, double vpsMonthlyUsd = 15.0);
    Task<string> GenerateTaxReportCsvAsync(string address, int? year = null, double vpsMonthlyUsd = 15.0);
}

public class ValidatorTaxReportDto
{
    public string Address { get; set; } = "";
    public int TaxYear { get; set; }
    public string Currency { get; set; } = "USD";
    public double TotalEarnedHmnd { get; set; }
    public double TotalGrossIncomeUsd { get; set; }
    public double TotalVpsExpensesUsd { get; set; }
    public double NetTaxableIncomeUsd { get; set; }
    public int PayoutCount { get; set; }
    public List<TaxPayoutItemDto> Payouts { get; set; } = new();
}

public class TaxPayoutItemDto
{
    public int BatchNumber { get; set; }
    public long BlockNumber { get; set; }
    public string Date { get; set; } = "";
    public long Timestamp { get; set; }
    public double AmountHmnd { get; set; }
    public double PriceUsd { get; set; }
    public double GrossIncomeUsd { get; set; }
    public double DeductibleExpenseUsd { get; set; }
    public double NetTaxableUsd { get; set; }
}

public class TaxReportRepository : ITaxReportRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly string _payoutsPath;

    public TaxReportRepository(IDbConnectionFactory dbFactory, IConfiguration config)
    {
        _dbFactory = dbFactory;
        var configuredPath = config["DataFiles:ValidatorPayouts"] ?? "Data/validator_payouts.json";
        if (File.Exists(configuredPath))
            _payoutsPath = configuredPath;
        else if (File.Exists(Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json")))
            _payoutsPath = Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json");
        else if (File.Exists("../src/data/validator_payouts.json"))
            _payoutsPath = "../src/data/validator_payouts.json";
        else
            _payoutsPath = "Data/validator_payouts.json";
    }

    public async Task<ValidatorTaxReportDto> GenerateTaxReportAsync(string address, int? year = null, double vpsMonthlyUsd = 15.0)
    {
        var clean = (address ?? "").Trim();
        var targetYear = year ?? DateTime.UtcNow.Year;

        using var connection = _dbFactory.CreateConnection();
        const string priceSql = "SELECT day, price_usd FROM hmnd_daily_prices";
        var priceMap = (await connection.QueryAsync<(string day, double price_usd)>(priceSql))
            .ToDictionary(r => r.day, r => r.price_usd, StringComparer.OrdinalIgnoreCase);

        var payouts = new List<TaxPayoutItemDto>();

        if (File.Exists(_payoutsPath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(_payoutsPath);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("payouts", out var payoutsArr))
                {
                    int batchIndex = 0;
                    foreach (var b in payoutsArr.EnumerateArray())
                    {
                        batchIndex++;
                        var blk = b.GetProperty("block").GetInt64();
                        var rawTs = b.GetProperty("ts").GetInt64();
                        var tsSec = rawTs > 100_000_000_000 ? rawTs / 1000 : rawTs;
                        var dateStr = DateTimeOffset.FromUnixTimeSeconds(tsSec).ToString("yyyy-MM-dd");
                        var payoutYear = DateTimeOffset.FromUnixTimeSeconds(tsSec).Year;

                        if (year.HasValue && payoutYear != targetYear) continue;

                        if (b.TryGetProperty("recipients", out var recs))
                        {
                            foreach (var r in recs.EnumerateArray())
                            {
                                string recipientAddr = "";
                                double hmnd = 0;

                                if (r.ValueKind == JsonValueKind.Array && r.GetArrayLength() > 1)
                                {
                                    recipientAddr = r[0].GetString() ?? "";
                                    hmnd = r[1].GetDouble();
                                }
                                else if (r.ValueKind == JsonValueKind.Object)
                                {
                                    if (r.TryGetProperty("address", out var aProp)) recipientAddr = aProp.GetString() ?? "";
                                    if (r.TryGetProperty("hmnd", out var hProp)) hmnd = hProp.GetDouble();
                                }

                                if (string.Equals(recipientAddr, clean, StringComparison.OrdinalIgnoreCase))
                                {
                                    double price = priceMap.TryGetValue(dateStr, out var p) ? p : 0.045;
                                    double gross = Math.Round(hmnd * price, 2);
                                    double expense = Math.Round(vpsMonthlyUsd / 2.14, 2); // Expense allocated per round
                                    double net = Math.Max(0, Math.Round(gross - expense, 2));

                                    payouts.Add(new TaxPayoutItemDto
                                    {
                                        BatchNumber = batchIndex,
                                        BlockNumber = blk,
                                        Date = dateStr,
                                        Timestamp = tsSec,
                                        AmountHmnd = Math.Round(hmnd, 2),
                                        PriceUsd = price,
                                        GrossIncomeUsd = gross,
                                        DeductibleExpenseUsd = expense,
                                        NetTaxableUsd = net
                                    });
                                }
                            }
                        }
                    }
                }
            }
            catch {}
        }

        double totalHmnd = Math.Round(payouts.Sum(p => p.AmountHmnd), 2);
        double totalGross = Math.Round(payouts.Sum(p => p.GrossIncomeUsd), 2);
        double totalExpense = Math.Round(payouts.Sum(p => p.DeductibleExpenseUsd), 2);
        double totalNet = Math.Round(payouts.Sum(p => p.NetTaxableUsd), 2);

        return new ValidatorTaxReportDto
        {
            Address = clean,
            TaxYear = targetYear,
            Currency = "USD",
            TotalEarnedHmnd = totalHmnd,
            TotalGrossIncomeUsd = totalGross,
            TotalVpsExpensesUsd = totalExpense,
            NetTaxableIncomeUsd = totalNet,
            PayoutCount = payouts.Count,
            Payouts = payouts
        };
    }

    public async Task<string> GenerateTaxReportCsvAsync(string address, int? year = null, double vpsMonthlyUsd = 15.0)
    {
        var report = await GenerateTaxReportAsync(address, year, vpsMonthlyUsd);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("BatchNumber,BlockNumber,Date,Timestamp,Amount_HMND,Price_USD,Gross_Income_USD,Deductible_Expense_USD,Net_Taxable_USD");

        foreach (var p in report.Payouts)
        {
            sb.AppendLine($"{p.BatchNumber},{p.BlockNumber},\"{p.Date}\",{p.Timestamp},{p.AmountHmnd},{p.PriceUsd},{p.GrossIncomeUsd},{p.DeductibleExpenseUsd},{p.NetTaxableUsd}");
        }

        return sb.ToString();
    }
}
