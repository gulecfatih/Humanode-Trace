namespace HumanodeTracker.Models;

public class UpdateTranslationRequest
{
    public string Lang { get; set; } = "";
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}
