namespace HumanodeTracker.Models;

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
