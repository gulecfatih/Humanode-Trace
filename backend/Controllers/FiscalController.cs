using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class FiscalController : ControllerBase
{
    private readonly ITaxReportRepository _taxRepo;

    public FiscalController(ITaxReportRepository taxRepo)
    {
        _taxRepo = taxRepo;
    }

    [HttpGet("validator-tax-report")]
    public async Task<IActionResult> GetValidatorTaxReport(
        [FromQuery] string? address = null,
        [FromQuery] int? year = null,
        [FromQuery] double vpsMonthly = 15.0,
        [FromQuery] string format = "json")
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new { error = "Validatör adresi gereklidir (?address=...)" });
        }

        if (format.Equals("csv", StringComparison.OrdinalIgnoreCase))
        {
            var csv = await _taxRepo.GenerateTaxReportCsvAsync(address.Trim(), year, vpsMonthly);
            return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", $"humanode_vergi_raporu_{address.Trim()[..Math.Min(8, address.Trim().Length)]}.csv");
        }

        var report = await _taxRepo.GenerateTaxReportAsync(address.Trim(), year, vpsMonthly);
        return Ok(report);
    }
}
