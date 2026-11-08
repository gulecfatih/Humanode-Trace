using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class WhalesController : ControllerBase
{
    private readonly IWhaleRepository _whaleRepo;

    public WhalesController(IWhaleRepository whaleRepo)
    {
        _whaleRepo = whaleRepo;
    }

    [HttpGet("whales")]
    public async Task<IActionResult> GetWhales(
        [FromQuery] double minHmnd = 50000,
        [FromQuery] int limit = 60,
        [FromQuery] string asset = "hmnd")
    {
        var whales = await _whaleRepo.GetWhaleTransactionsAsync(minHmnd, limit, asset);
        return Ok(whales);
    }
}
