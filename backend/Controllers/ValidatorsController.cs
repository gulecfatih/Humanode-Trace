using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class ValidatorsController : ControllerBase
{
    private readonly ValidatorRepository _validatorRepo;

    public ValidatorsController(ValidatorRepository validatorRepo)
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
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_validator_address_required", MessageKey = "err_validator_address_required" });
        }
        var econ = await _validatorRepo.GetValidatorEconomicsAsync(target.Trim());
        return Ok(econ);
    }
}
