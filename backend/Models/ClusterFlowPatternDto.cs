namespace HumanodeTracker.Models;

public class ClusterFlowPatternDto
{
    public string Direction { get; set; } = "IN";
    public string Counterparty { get; set; } = "";
    public string CounterpartyLabel { get; set; } = "";
    public double TotalHmnd { get; set; }
    public int TxCount { get; set; }
    public double SharePercent { get; set; }
}
