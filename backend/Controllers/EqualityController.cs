using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class EqualityController : ControllerBase
{
    private readonly EqualityRepository _equalityRepo;

    public EqualityController(EqualityRepository equalityRepo)
    {
        _equalityRepo = equalityRepo;
    }

    [HttpGet("equality")]
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
    public IActionResult SimulateGet([FromQuery] SimulationQueryRequest query)
    {
        query ??= new SimulationQueryRequest();
        var baseline = _equalityRepo.GetSimulationBaseline();
        var input = new SimulationInputDto
        {
            ValidatorCount = query.Validators ?? 48,
            VolumeMultiplier = query.Volume ?? 1.0,
            HmndPriceUsd = query.Price ?? baseline.BaselinePriceUsd,
            VpsCostPerMonth = query.Vps ?? 15.0
        };

        var result = _equalityRepo.RunSimulation(input);
        return Ok(result);
    }
}
