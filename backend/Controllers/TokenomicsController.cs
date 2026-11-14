using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class TokenomicsController : ControllerBase
{
    private readonly TokenomicsRepository _tokenomicsRepo;

    public TokenomicsController(TokenomicsRepository tokenomicsRepo)
    {
        _tokenomicsRepo = tokenomicsRepo;
    }

    [HttpGet("tokenomics")]
    public async Task<IActionResult> GetTokenomics()
    {
        var data = await _tokenomicsRepo.GetTokenomicsAsync();
        return Ok(data);
    }

    [HttpGet("fees-pot")]
    [HttpGet("feespot")]
    [HttpGet("fees-pot-analytics")]
    public async Task<IActionResult> GetFeesPotAnalytics()
    {
        var data = await _tokenomicsRepo.GetFeesPotAnalyticsAsync();
        return Ok(data);
    }
}
