using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class GovernanceController : ControllerBase
{
    private readonly IGovernanceRepository _govRepo;
    private readonly IDirectoryRepository _dirRepo;

    public GovernanceController(IGovernanceRepository govRepo, IDirectoryRepository dirRepo)
    {
        _govRepo = govRepo;
        _dirRepo = dirRepo;
    }

    [HttpGet("governance")]
    public async Task<IActionResult> GetGovernance()
    {
        var data = await _govRepo.GetGovernanceAnalyticsAsync();
        return Ok(data);
    }

    [HttpGet("unlocks")]
    [HttpGet("unlocks-swaps")]
    public async Task<IActionResult> GetUnlocksAndSwaps(
        [FromQuery] string category = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string q = "")
    {
        var data = await _govRepo.GetUnlocksAndSwapsAnalyticsAsync(category, page, limit, q);
        return Ok(data);
    }

    [HttpGet("major-wallets")]
    public async Task<IActionResult> GetMajorWallets()
    {
        var data = await _dirRepo.GetMajorWalletsDirectoryAsync();
        return Ok(data);
    }
}
