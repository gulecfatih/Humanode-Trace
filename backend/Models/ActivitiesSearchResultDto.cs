namespace HumanodeTracker.Models;

public class ActivitiesSearchResultDto
{
    public List<TransactionDto> Results { get; set; } = new();
    public int Count { get; set; }
    public PaginationDto Pagination { get; set; } = new();
    public object? Filters { get; set; }
    public bool IsLiveMatch { get; set; }
}
