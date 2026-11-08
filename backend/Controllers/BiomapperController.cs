using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class BiomapperController : ControllerBase
{
    private readonly IBiomapperRepository _biomapperRepo;

    public BiomapperController(IBiomapperRepository biomapperRepo)
    {
        _biomapperRepo = biomapperRepo;
    }

    [HttpGet("biomapper")]
    public async Task<IActionResult> GetBiomapper(
        [FromQuery] string networkType = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 25,
        [FromQuery] string q = "",
        [FromQuery] string feedNetwork = "all")
    {
        var result = await _biomapperRepo.GetBiomapperAnalyticsAsync(networkType, page, limit, q, feedNetwork);
        return Ok(result);
    }
}
