using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class TokensController : ControllerBase
{
    private readonly TokenRepository _tokenRepo;

    public TokensController(TokenRepository tokenRepo)
    {
        _tokenRepo = tokenRepo;
    }

    [HttpGet("tokens")]
    public async Task<IActionResult> GetTokens()
    {
        var tokens = await _tokenRepo.GetTokenDirectoryAsync();
        return Ok(tokens);
    }
}
