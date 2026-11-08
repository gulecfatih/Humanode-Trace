using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class PricesController : ControllerBase
{
    private readonly IPriceRepository _priceRepo;

    public PricesController(IPriceRepository priceRepo)
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
    public async Task<IActionResult> GetHistoricalRates(
        [FromQuery] string year = "all",
        [FromQuery] string search = "",
        [FromQuery] string q = "",
        [FromQuery] bool onlySwaps = false,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50)
    {
        var s = !string.IsNullOrEmpty(search) ? search : q;
        var data = await _priceRepo.GetHistoricalRatesListAsync(year, s, onlySwaps, page, limit);
        return Ok(data);
    }

    [HttpGet("historical-rates/sync")]
    public async Task<IActionResult> SyncHistoricalRates(
        [FromQuery] string year = "all",
        [FromQuery] string search = "",
        [FromQuery] bool onlySwaps = false)
    {
        var data = await _priceRepo.GetHistoricalRatesListAsync(year, search, onlySwaps, 1, 50);
        return Ok(new
        {
            data,
            syncResult = new { ok = true, message = "Kurlar güncel" }
        });
    }
}
