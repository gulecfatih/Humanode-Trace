namespace HumanodeTracker.Models;

public class EqualityMetricsDto
{
    public double GiniCoefficient { get; set; }
    public string GiniRatingCode { get; set; } = "moderate";
    public string GiniRating { get; set; } = "Moderate Inequality";
    public string GiniDescription { get; set; } = "";
    public int TotalHoldersCount { get; set; }
    public double TotalTrackedWealthHmnd { get; set; }
    public int ActiveValidatorsCount { get; set; }
    public int Nakamoto51Coefficient { get; set; }
    public int Nakamoto33Coefficient { get; set; }
    public string ProofOfHumanityAdvantage { get; set; } = "";
    public List<LorenzPointDto> LorenzCurve { get; set; } = new();
    public WealthTiersDto WealthDistribution { get; set; } = new();
}
