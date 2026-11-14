using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class TimeMachineController : ControllerBase
{
    private readonly TimeMachineRepository _timeMachineRepo;

    public TimeMachineController(TimeMachineRepository timeMachineRepo)
    {
        _timeMachineRepo = timeMachineRepo;
    }

    [HttpGet("time-machine")]
    public async Task<IActionResult> GetSnapshot(
        [FromQuery] long? block = null,
        [FromQuery] string? date = null)
    {
        var snapshot = await _timeMachineRepo.GetSnapshotAsync(block, date);
        return Ok(snapshot);
    }
}
