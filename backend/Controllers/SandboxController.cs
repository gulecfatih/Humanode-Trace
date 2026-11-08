using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

public class QuerySandboxRequestDto
{
    public string Sql { get; set; } = "";
}

[ApiController]
[Route("api")]
public class SandboxController : ControllerBase
{
    private readonly IQuerySandboxRepository _sandboxRepo;

    public SandboxController(IQuerySandboxRepository sandboxRepo)
    {
        _sandboxRepo = sandboxRepo;
    }

    [HttpGet("query-presets")]
    public IActionResult GetPresets()
    {
        var presets = _sandboxRepo.GetPresets();
        return Ok(presets);
    }

    [HttpPost("query-sandbox")]
    public async Task<IActionResult> ExecuteSandboxQuery([FromBody] QuerySandboxRequestDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Sql))
        {
            return BadRequest(new { success = false, error = "Sorgu parametresi boş olamaz." });
        }

        var result = await _sandboxRepo.ExecuteQueryAsync(request.Sql);
        return Ok(result);
    }
}
