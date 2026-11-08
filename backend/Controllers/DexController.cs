using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Services;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class DexController : ControllerBase
{
    private readonly IDexRepository _dexRepo;
    private readonly IMethodDecoderService _decoderService;

    public DexController(IDexRepository dexRepo, IMethodDecoderService decoderService)
    {
        _dexRepo = dexRepo;
        _decoderService = decoderService;
    }

    [HttpGet("dex-depth")]
    public async Task<IActionResult> GetDexDepth([FromQuery] string? pool = null)
    {
        var depth = await _dexRepo.GetDexPoolDepthAsync(pool ?? "0xe48cc340b8f1ac0a326577b3c2d1fe5229ebb1c2");
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
            return BadRequest(new { error = "Input parametresi gereklidir (ör: 0xa9059cbb...)." });
        }
        var decoded = _decoderService.DecodeInput(input);
        return Ok(decoded);
    }
}
