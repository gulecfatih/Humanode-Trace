using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class BridgeController : ControllerBase
{
    private readonly IBridgeRepository _bridgeRepo;

    public BridgeController(IBridgeRepository bridgeRepo)
    {
        _bridgeRepo = bridgeRepo;
    }

    [HttpGet("bridge")]
    public async Task<IActionResult> GetBridgeAnalytics(
        [FromQuery] string direction = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string q = "")
    {
        var result = await _bridgeRepo.GetBridgeAnalyticsAsync(direction, page, limit, q);
        return Ok(result);
    }
}
