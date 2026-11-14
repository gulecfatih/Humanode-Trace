namespace HumanodeTracker.Models;

public class DecodedCallDto
{
    public bool IsDecoded { get; set; }
    public string Selector { get; set; } = "";
    public string FunctionName { get; set; } = "Unknown Function";
    public string Signature { get; set; } = "";
    public string CategoryCode { get; set; } = "general";
    public string Category { get; set; } = "General";
    public string DescriptionKey { get; set; } = "evm_desc_unknown_call";
    public string Description { get; set; } = "";
    public List<DecodedParamDto> Parameters { get; set; } = new();
}
