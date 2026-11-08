using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class WalletController : ControllerBase
{
    private readonly IWalletRepository _walletRepo;
    private readonly IClusterRepository _clusterRepo;

    public WalletController(IWalletRepository walletRepo, IClusterRepository clusterRepo)
    {
        _walletRepo = walletRepo;
        _clusterRepo = clusterRepo;
    }

    [HttpGet("wallet-cluster")]
    public async Task<IActionResult> GetWalletCluster([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Cüzdan adresi parametresi gereklidir (?address=...)" });
        }

        var cluster = await _clusterRepo.GetWalletClusterAsync(target.Trim());
        return Ok(cluster);
    }

    [HttpGet("address")]
    [HttpGet("address/{addr}")]
    public async Task<IActionResult> GetAddressSummary(
        string? addr = null,
        [FromQuery] string? address = null,
        [FromQuery(Name = "addr")] string? queryAddr = null)
    {
        var target = addr ?? address ?? queryAddr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Adres parametresi gereklidir." });
        }

        var summary = await _walletRepo.GetAddressSummaryAsync(target.Trim());
        if (summary == null)
        {
            return NotFound(new { error = "Cüzdan bulunamadı." });
        }
        return Ok(summary);
    }

    [HttpGet("wallet-ledger")]
    public async Task<IActionResult> GetWalletLedger(
        [FromQuery] string? address = null,
        [FromQuery] string? addr = null,
        [FromQuery] int ledgerPage = 1,
        [FromQuery] int ledgerLimit = 50,
        [FromQuery] string ledgerFlow = "all",
        [FromQuery] bool hideBioauth = true)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Cüzdan adresi parametresi gereklidir." });
        }

        var ledger = await _walletRepo.GetWalletLedgerAnalyticsAsync(target.Trim(), ledgerPage, ledgerLimit, ledgerFlow, hideBioauth);
        return Ok(ledger);
    }

    [HttpGet("wallet-ledger/export")]
    public async Task<IActionResult> ExportWalletLedgerCsv(
        [FromQuery] string? address = null,
        [FromQuery] string flow = "all")
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new { error = "Adres parametresi gereklidir." });
        }

        var csv = await _walletRepo.ExportWalletLedgerCsvAsync(address.Trim(), flow);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", $"cuzdan_hesap_defteri_{address.Trim()[..Math.Min(10, address.Trim().Length)]}.csv");
    }

    [HttpGet("cross-layer-link")]
    public async Task<IActionResult> GetCrossLayerLink([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { hasLink = false, error = "Cüzdan adresi parametresi gerekli" });
        }

        var link = await _walletRepo.GetCrossLayerIdentityAsync(target.Trim());
        return Ok(link);
    }

    [HttpGet("money-trail")]
    public async Task<IActionResult> GetMoneyTrail(
        [FromQuery] string? address = null,
        [FromQuery] string? addr = null,
        [FromQuery] int depth = 2,
        [FromQuery] int limit = 4)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Cüzdan adresi parametresi gereklidir." });
        }

        var trail = await _walletRepo.GetMultiHopMoneyTrailAsync(target.Trim(), depth, limit);
        return Ok(trail);
    }

    [HttpGet("compare-wallets")]
    public async Task<IActionResult> CompareWallets(
        [FromQuery] string? walletA = null,
        [FromQuery] string? a = null,
        [FromQuery] string? walletB = null,
        [FromQuery] string? b = null)
    {
        var wA = walletA ?? a;
        var wB = walletB ?? b;

        if (string.IsNullOrWhiteSpace(wA) || string.IsNullOrWhiteSpace(wB))
        {
            return BadRequest(new { error = "walletA ve walletB parametreleri zorunludur." });
        }

        var cmp = await _walletRepo.CompareWalletsAsync(wA.Trim(), wB.Trim());
        return Ok(cmp);
    }

    [HttpGet("wallet-persona")]
    public async Task<IActionResult> GetWalletPersona([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new { error = "Cüzdan adresi parametresi gereklidir." });
        }

        var persona = await _walletRepo.GetWalletPersonaAsync(target.Trim());
        return Ok(persona);
    }
}
