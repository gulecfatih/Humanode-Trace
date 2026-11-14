namespace HumanodeTracker.Models;

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
