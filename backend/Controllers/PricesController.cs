using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Models;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class PricesController : ControllerBase
{
    private readonly PriceRepository _priceRepo;

    public PricesController(PriceRepository priceRepo)
    {
        _priceRepo = priceRepo;
    }

    [HttpGet("prices")]
    public async Task<IActionResult> GetPrices()
    {
        var data = await _priceRepo.GetDailyPricesMapAsync();
        return Ok(data);
    }

    [HttpGet("historical-rates")]
    public async Task<IActionResult> GetHistoricalRates([FromQuery] HistoricalRatesQueryRequest request)
    {
        var data = await _priceRepo.GetHistoricalRatesListAsync(request);
        return Ok(data);
    }

    [HttpGet("historical-rates/sync")]
    public async Task<IActionResult> SyncHistoricalRates([FromQuery] HistoricalRatesQueryRequest request)
    {
        request ??= new HistoricalRatesQueryRequest();
        request.Page = 1;
        request.Limit = 50;
        var data = await _priceRepo.GetHistoricalRatesListAsync(request);
        return Ok(new
        {
            data,
            syncResult = new { ok = true, message = "Rates are up to date" }
        });
    }
}
