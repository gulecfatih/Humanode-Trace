namespace HumanodeTracker.Models;

public class ValidatorTaxReportRequest
{
    public string Address { get; set; } = "";
    public int? Year { get; set; }
    public double VpsMonthly { get; set; } = 15.0;
    public string Format { get; set; } = "json";
}
