using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardRepository _leaderboardRepo;

    public LeaderboardController(ILeaderboardRepository leaderboardRepo)
    {
        _leaderboardRepo = leaderboardRepo;
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var leaderboard = await _leaderboardRepo.GetLeaderboardStatsAsync();
        return Ok(leaderboard);
    }
}
