using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class GovernanceController : ControllerBase
{
    private readonly GovernanceRepository _govRepo;
    private readonly DirectoryRepository _dirRepo;

    public GovernanceController(GovernanceRepository govRepo, DirectoryRepository dirRepo)
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
    public async Task<IActionResult> GetUnlocksAndSwaps([FromQuery] UnlocksAndSwapsQueryRequest request)
    {
        var data = await _govRepo.GetUnlocksAndSwapsAnalyticsAsync(request);
        return Ok(data);
    }

    [HttpGet("major-wallets")]
    public async Task<IActionResult> GetMajorWallets()
    {
        var data = await _dirRepo.GetMajorWalletsDirectoryAsync();
        return Ok(data);
    }
}
