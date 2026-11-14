using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class BiomapperController : ControllerBase
{
    private readonly BiomapperRepository _biomapperRepo;

    public BiomapperController(BiomapperRepository biomapperRepo)
    {
        _biomapperRepo = biomapperRepo;
    }

    [HttpGet("biomapper")]
    public async Task<IActionResult> GetBiomapper([FromQuery] BiomapperQueryRequest request)
    {
        var result = await _biomapperRepo.GetBiomapperAnalyticsAsync(request);
        return Ok(result);
    }
}
