using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class EqualityController : ControllerBase
{
    private readonly IEqualityRepository _equalityRepo;

    public EqualityController(IEqualityRepository equalityRepo)
    {
        _equalityRepo = equalityRepo;
    }

    [HttpGet("equality-metrics")]
    public async Task<IActionResult> GetEqualityMetrics()
    {
        var metrics = await _equalityRepo.GetEqualityMetricsAsync();
        return Ok(metrics);
    }

    [HttpGet("simulation-model")]
    public IActionResult GetSimulationModel()
    {
        var baseline = _equalityRepo.GetSimulationBaseline();
        return Ok(baseline);
    }

    [HttpPost("simulate")]
    public IActionResult SimulatePost([FromBody] SimulationInputDto input)
    {
        var result = _equalityRepo.RunSimulation(input ?? new SimulationInputDto());
        return Ok(result);
    }

    [HttpGet("simulate")]
    public IActionResult SimulateGet(
        [FromQuery] int? validators = null,
        [FromQuery] double? volume = null,
        [FromQuery] double? price = null,
        [FromQuery] double? vps = null)
    {
        var baseline = _equalityRepo.GetSimulationBaseline();
        var input = new SimulationInputDto
        {
            ValidatorCount = validators ?? 48,
            VolumeMultiplier = volume ?? 1.0,
            HmndPriceUsd = price ?? baseline.BaselinePriceUsd,
            VpsCostPerMonth = vps ?? 15.0
        };

        var result = _equalityRepo.RunSimulation(input);
        return Ok(result);
    }
}
