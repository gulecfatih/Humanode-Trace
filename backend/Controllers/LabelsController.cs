using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api/labels")]
public class LabelsController : ControllerBase
{
    private readonly ILabelRepository _labelRepo;

    public LabelsController(ILabelRepository labelRepo)
    {
        _labelRepo = labelRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetLabels(
        [FromQuery] bool watchedOnly = false,
        [FromQuery] string category = "all",
        [FromQuery] string search = "",
        [FromQuery] string q = "")
    {
        var s = !string.IsNullOrEmpty(search) ? search : q;
        var (labels, total) = await _labelRepo.GetAddressLabelsAsync(watchedOnly, category, s);
        return Ok(new { ok = true, labels, total });
    }

    [HttpPost]
    public async Task<IActionResult> SaveLabel([FromBody] AddressLabelDto model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Address) || string.IsNullOrWhiteSpace(model.Label))
        {
            return BadRequest(new { ok = false, error = "Geçersiz veri: Cüzdan adresi ve etiket adı zorunludur." });
        }

        var saved = await _labelRepo.SaveAddressLabelAsync(model);
        return Ok(new { ok = true, label = saved });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteLabel([FromQuery] string? address = null)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new { ok = false, error = "Silinecek adres parametresi gerekli (?address=...)" });
        }

        var deleted = await _labelRepo.DeleteAddressLabelAsync(address.Trim());
        return Ok(new { ok = true, deleted });
    }
}
