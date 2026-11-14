using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class FiscalController : ControllerBase
{
    private readonly TaxReportRepository _taxRepo;

    public FiscalController(TaxReportRepository taxRepo)
    {
        _taxRepo = taxRepo;
    }

    [HttpGet("validator-tax-report")]
    public async Task<IActionResult> GetValidatorTaxReport([FromQuery] ValidatorTaxReportRequest request)
    {
        request ??= new ValidatorTaxReportRequest();
        if (string.IsNullOrWhiteSpace(request.Address))
        {
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_validator_address_required", MessageKey = "err_validator_address_required" });
        }

        if (request.Format.Equals("csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = await _taxRepo.GenerateTaxReportCsvAsync(request);
            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", $"humanode_vergi_raporu_{request.Address.Trim()[..Math.Min(8, request.Address.Trim().Length)]}.csv");
        }

        var report = await _taxRepo.GenerateTaxReportAsync(request);
        return Ok(report);
    }
}
