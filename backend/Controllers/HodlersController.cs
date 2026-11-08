using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class HodlersController : ControllerBase
{
    private readonly IHodlersRepository _hodlersRepo;

    public HodlersController(IHodlersRepository hodlersRepo)
    {
        _hodlersRepo = hodlersRepo;
    }

    [HttpGet("hodlers")]
    public async Task<IActionResult> GetHodlers(
        [FromQuery] string network = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string q = "")
    {
        var result = await _hodlersRepo.GetHodlersAnalyticsAsync(network, page, limit, q);
        return Ok(result);
    }
}
