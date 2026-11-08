using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class ValidatorsController : ControllerBase
{
    private readonly IValidatorRepository _validatorRepo;

    public ValidatorsController(IValidatorRepository validatorRepo)
    {
        _validatorRepo = validatorRepo;
    }

    [HttpGet("validators")]
    public async Task<IActionResult> GetValidators()
    {
        var health = await _validatorRepo.GetValidatorHealthAsync();
        return Ok(health);
    }

    [HttpGet("validator-economics")]
    public async Task<IActionResult> GetValidatorEconomics([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Validatör adresi gereklidir." });
        }
        var econ = await _validatorRepo.GetValidatorEconomicsAsync(target.Trim());
        return Ok(econ);
    }
}
