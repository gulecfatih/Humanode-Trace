using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Models;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class LocalizationController : ControllerBase
{
    private readonly LocalizationRepository _locRepo;

    public LocalizationController(LocalizationRepository locRepo)
    {
        _locRepo = locRepo;
    }

    [HttpGet("languages")]
    public async Task<IActionResult> GetLanguages()
    {
        var langs = await _locRepo.GetLanguagesAsync();
        return Ok(langs);
    }

    [HttpGet("translations")]
    public async Task<IActionResult> GetTranslations([FromQuery] string lang = "")
    {
        var translations = await _locRepo.GetTranslationsAsync(lang);
        return Ok(translations);
    }

    [HttpGet("localization/page")]
    public async Task<IActionResult> GetPageLocalization([FromQuery] string page = "", [FromQuery] string lang = "")
    {
        var fields = await _locRepo.GetPageLocalizationAsync(page, lang);
        return Ok(new
        {
            page = string.IsNullOrWhiteSpace(page) ? "overview" : page.Trim().ToLower(),
            lang = lang ?? "",
            count = fields.Count,
            fields
        });
    }

    [HttpPost("translations")]
    public async Task<IActionResult> UpdateTranslation([FromBody] UpdateTranslationRequest req)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.Key))
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_key_required", MessageKey = "err_key_required" });

        var success = await _locRepo.UpsertTranslationAsync(req.Lang, req.Key, req.Value);
        return Ok(new { success });
    }
}
