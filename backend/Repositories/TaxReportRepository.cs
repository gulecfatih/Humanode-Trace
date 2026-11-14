using System.Text.Json;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class TaxReportRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly string _payoutsPath;

    public TaxReportRepository(SqliteConnectionFactory dbFactory, IConfiguration config, PriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
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

    public async Task<ValidatorTaxReportDto> GenerateTaxReportAsync(ValidatorTaxReportRequest req)
    {
        req ??= new ValidatorTaxReportRequest();
        var clean = (req.Address ?? "").Trim();
        var targetYear = req.Year ?? DateTime.UtcNow.Year;
        var vpsMonthlyUsd = req.VpsMonthly;

        var priceList = await _priceRepo.GetPriceMapAsync();
        var latestPrice = await _priceRepo.GetLatestPriceAsync();

        var payouts = new List<TaxPayoutItemDto>();

        using var connection = _dbFactory.CreateConnection();
        try
        {
            var rows = await connection.QueryAsync<(int BatchNumber, long BlockNumber, long Timestamp, double AmountHmnd)>(StoredProcedures.GetTaxReportPayouts, new { Clean = clean });
            foreach (var r in rows)
            {
                var tsSec = r.Timestamp > 100_000_000_000 ? r.Timestamp / 1000 : r.Timestamp;
                var dt = DateTimeOffset.FromUnixTimeSeconds(tsSec);
                if (req.Year.HasValue && dt.Year != targetYear) continue;

                var dateStr = dt.ToString("yyyy-MM-dd");
                var priceMatch = priceList.FirstOrDefault(x => x.Date.Equals(dateStr, StringComparison.OrdinalIgnoreCase));
                double price = priceMatch != null ? priceMatch.PriceUsd : latestPrice;
                double gross = Math.Round(r.AmountHmnd * price, 2);
                double expense = Math.Round(vpsMonthlyUsd / 2.14, 2);
                double net = Math.Max(0, Math.Round(gross - expense, 2));

                payouts.Add(new TaxPayoutItemDto
                {
                    BatchNumber = r.BatchNumber,
                    BlockNumber = r.BlockNumber,
                    Date = dateStr,
                    Timestamp = tsSec,
                    AmountHmnd = Math.Round(r.AmountHmnd, 2),
                    PriceUsd = price,
                    GrossIncomeUsd = gross,
                    DeductibleExpenseUsd = expense,
                    NetTaxableUsd = net
                });
            }
        }
        catch
        {
            // Table error, fallback to JSON
        }

        if (payouts.Count == 0 && File.Exists(_payoutsPath))
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

                        if (req.Year.HasValue && payoutYear != targetYear) continue;

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
                                    var priceMatch = priceList.FirstOrDefault(x => x.Date.Equals(dateStr, StringComparison.OrdinalIgnoreCase));
                                    double price = priceMatch != null ? priceMatch.PriceUsd : latestPrice;
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

    public async Task<string> GenerateTaxReportCsvAsync(ValidatorTaxReportRequest req)
    {
        var report = await GenerateTaxReportAsync(req);
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("BatchNumber,BlockNumber,Date,Timestamp,Amount_HMND,Price_USD,Gross_Income_USD,Deductible_Expense_USD,Net_Taxable_USD");

        foreach (var p in report.Payouts)
        {
            sb.AppendLine($"{p.BatchNumber},{p.BlockNumber},\"{p.Date}\",{p.Timestamp},{p.AmountHmnd},{p.PriceUsd},{p.GrossIncomeUsd},{p.DeductibleExpenseUsd},{p.NetTaxableUsd}");
        }

        return sb.ToString();
    }
}
