using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api/labels")]
public class LabelsController : ControllerBase
{
    private readonly LabelRepository _labelRepo;

    public LabelsController(LabelRepository labelRepo)
    {
        _labelRepo = labelRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetLabels([FromQuery] LabelsQueryRequest request)
    {
        request ??= new LabelsQueryRequest();
        var s = !string.IsNullOrEmpty(request.Search) ? request.Search : request.Q;
        var (labels, total) = await _labelRepo.GetAddressLabelsAsync(request.WatchedOnly, request.Category, s);
        return Ok(new { ok = true, labels, total });
    }

    [HttpPost]
    public async Task<IActionResult> SaveLabel([FromBody] AddressLabelDto model)
    {
        if (model == null || string.IsNullOrWhiteSpace(model.Address) || string.IsNullOrWhiteSpace(model.Label))
        {
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_invalid_data", MessageKey = "err_invalid_data" });
        }

        var saved = await _labelRepo.SaveAddressLabelAsync(model);
        return Ok(new { ok = true, label = saved });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteLabel([FromQuery] string? address = null)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var deleted = await _labelRepo.DeleteAddressLabelAsync(address.Trim());
        return Ok(new { ok = true, deleted });
    }
}
