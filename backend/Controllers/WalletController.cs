using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Models;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class WalletController : ControllerBase
{
    private readonly WalletRepository _walletRepo;
    private readonly ClusterRepository _clusterRepo;

    public WalletController(WalletRepository walletRepo, ClusterRepository clusterRepo)
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
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
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
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var summary = await _walletRepo.GetAddressSummaryAsync(target.Trim());
        if (summary == null)
        {
            return NotFound(new ApiErrorDto { Error = "err_wallet_not_found", MessageKey = "err_wallet_not_found" });
        }
        return Ok(summary);
    }

    [HttpGet("wallet-ledger")]
    public async Task<IActionResult> GetWalletLedger([FromQuery] WalletLedgerQueryRequest request)
    {
        request ??= new WalletLedgerQueryRequest();
        var target = !string.IsNullOrEmpty(request.Address) ? request.Address : request.Addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var ledger = await _walletRepo.GetWalletLedgerAnalyticsAsync(request);
        return Ok(ledger);
    }

    [HttpGet("wallet-ledger/export")]
    public async Task<IActionResult> ExportWalletLedgerCsv(
        [FromQuery] string? address = null,
        [FromQuery] string flow = "all")
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var csv = await _walletRepo.ExportWalletLedgerCsvAsync(address.Trim(), flow);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv; charset=utf-8", $"humanode_wallet_ledger_{address.Trim()[..Math.Min(10, address.Trim().Length)]}.csv");
    }

    [HttpGet("cross-layer-link")]
    public async Task<IActionResult> GetCrossLayerLink([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var link = await _walletRepo.GetCrossLayerIdentityAsync(target.Trim());
        return Ok(link);
    }

    [HttpGet("money-trail")]
    public async Task<IActionResult> GetMoneyTrail([FromQuery] MoneyTrailRequest request)
    {
        request ??= new MoneyTrailRequest();
        var target = request.TargetAddress;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var trail = await _walletRepo.GetMultiHopMoneyTrailAsync(target, request.Depth, request.Limit);
        return Ok(trail);
    }

    [HttpGet("compare-wallets")]
    public async Task<IActionResult> CompareWallets([FromQuery] CompareWalletsRequest request)
    {
        request ??= new CompareWalletsRequest();
        var wA = request.FirstWallet;
        var wB = request.SecondWallet;

        if (string.IsNullOrWhiteSpace(wA) || string.IsNullOrWhiteSpace(wB))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallets_compare_required", MessageKey = "err_wallets_compare_required" });
        }

        var cmp = await _walletRepo.CompareWalletsAsync(wA, wB);
        return Ok(cmp);
    }

    [HttpGet("wallet-persona")]
    public async Task<IActionResult> GetWalletPersona([FromQuery] string? address = null, [FromQuery] string? addr = null)
    {
        var target = address ?? addr;
        if (string.IsNullOrWhiteSpace(target))
        {
            return BadRequest(new ApiErrorDto { Error = "err_wallet_address_required", MessageKey = "err_wallet_address_required" });
        }

        var persona = await _walletRepo.GetWalletPersonaAsync(target.Trim());
        return Ok(persona);
    }
}
