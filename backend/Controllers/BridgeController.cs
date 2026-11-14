using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class BridgeController : ControllerBase
{
    private readonly BridgeRepository _bridgeRepo;

    public BridgeController(BridgeRepository bridgeRepo)
    {
        _bridgeRepo = bridgeRepo;
    }

    [HttpGet("bridge")]
    public async Task<IActionResult> GetBridgeAnalytics([FromQuery] BridgeQueryRequest request)
    {
        var result = await _bridgeRepo.GetBridgeAnalyticsAsync(request);
        return Ok(result);
    }
}
