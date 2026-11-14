using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Models;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class HodlersController : ControllerBase
{
    private readonly HodlersRepository _hodlersRepo;

    public HodlersController(HodlersRepository hodlersRepo)
    {
        _hodlersRepo = hodlersRepo;
    }

    [HttpGet("hodlers")]
    public async Task<IActionResult> GetHodlers([FromQuery] HodlersQueryRequest request)
    {
        var result = await _hodlersRepo.GetHodlersAnalyticsAsync(request);
        return Ok(result);
    }
}
