namespace HumanodeTracker.Models;

public class ApiErrorDto
{
    public bool Ok { get; set; } = false;
    public string Error { get; set; } = "";
    public string MessageKey { get; set; } = "";
}
