using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Models;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class SandboxController : ControllerBase
{
    private readonly QuerySandboxRepository _sandboxRepo;

    public SandboxController(QuerySandboxRepository sandboxRepo)
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
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_query_empty", MessageKey = "err_query_empty" });
        }

        var result = await _sandboxRepo.ExecuteQueryAsync(request.Sql);
        return Ok(result);
    }
}
