using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Data;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;
using HumanodeTracker.Services;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class DexController : ControllerBase
{
    private readonly DexRepository _dexRepo;
    private readonly MethodDecoderService _decoderService;

    public DexController(DexRepository dexRepo, MethodDecoderService decoderService)
    {
        _dexRepo = dexRepo;
        _decoderService = decoderService;
    }

    [HttpGet("dex")]
    [HttpGet("dex-depth")]
    public async Task<IActionResult> GetDexDepth([FromQuery] string? pool = null)
    {
        var depth = await _dexRepo.GetDexPoolDepthAsync(pool);
        return Ok(depth);
    }

    [HttpGet("dex-pools")]
    public async Task<IActionResult> GetDexPools()
    {
        var pools = await _dexRepo.GetAllPoolsOverviewAsync();
        return Ok(pools);
    }

    [HttpGet("decode-method")]
    public IActionResult DecodeMethod([FromQuery] string? input = null)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return BadRequest(new ApiErrorDto { Ok = false, Error = "err_input_required", MessageKey = "err_input_required" });
        }
        var decoded = _decoderService.DecodeInput(input);
        return Ok(decoded);
    }
}
