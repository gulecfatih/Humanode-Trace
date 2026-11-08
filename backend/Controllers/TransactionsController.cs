using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionRepository _txRepo;
    private readonly IBlockRepository _blockRepo;

    public TransactionsController(ITransactionRepository txRepo, IBlockRepository blockRepo)
    {
        _txRepo = txRepo;
        _blockRepo = blockRepo;
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] string? hash = null,
        [FromQuery] string layer = "all",
        [FromQuery] string filter = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? hideZeroFee = null)
    {
        if (!string.IsNullOrWhiteSpace(hash))
        {
            var details = await _txRepo.GetTransactionDetailsAsync(hash.Trim());
            return Ok(details ?? new TransactionDetailsResultDto { Found = false });
        }

        bool hide = hideZeroFee != "0" && hideZeroFee != "false";
        var result = await _txRepo.SearchActivitiesAsync(
            layer: layer,
            filter: filter,
            page: page,
            limit: limit,
            hideZeroFee: hide);

        return Ok(result);
    }

    [HttpGet("search")]
    [HttpGet("blocks")]
    public async Task<IActionResult> Search(
        [FromQuery] string q = "",
        [FromQuery] string layer = "all",
        [FromQuery] string pallet = "",
        [FromQuery] string startDate = "",
        [FromQuery] string endDate = "",
        [FromQuery] string filter = "all",
        [FromQuery] int page = 1,
        [FromQuery] int limit = 50,
        [FromQuery] string? hideZeroFee = null,
        [FromQuery] bool whaleOnly = false,
        [FromQuery] string viewMode = "block")
    {
        bool hide = hideZeroFee != "0" && hideZeroFee != "false";

        if (viewMode.Equals("block", StringComparison.OrdinalIgnoreCase))
        {
            var blockResult = await _blockRepo.SearchBlocksAsync(
                q: q,
                layer: layer,
                pallet: pallet,
                startDate: startDate,
                endDate: endDate,
                filter: filter,
                page: page,
                limit: limit,
                hideZeroFee: hide,
                whaleOnly: whaleOnly);
            return Ok(blockResult);
        }

        var searchResult = await _txRepo.SearchActivitiesAsync(
            q: q,
            layer: layer,
            pallet: pallet,
            startDate: startDate,
            endDate: endDate,
            filter: filter,
            page: page,
            limit: limit,
            hideZeroFee: hide,
            whaleOnly: whaleOnly);

        return Ok(searchResult);
    }

    [HttpGet("block")]
    public async Task<IActionResult> GetBlock([FromQuery] string? number = null, [FromQuery] string? block = null, [FromQuery] string? id = null)
    {
        var raw = number ?? block ?? id;
        if (string.IsNullOrWhiteSpace(raw) || !long.TryParse(raw.Replace("#", "").Trim(), out var blockNum))
        {
            return BadRequest(new { error = "Geçerli bir blok numarası gereklidir." });
        }

        var details = await _blockRepo.GetBlockDetailsAsync(blockNum);
        return Ok(details);
    }

    [HttpGet("tx")]
    [HttpGet("tx/{hash}")]
    public async Task<IActionResult> GetTxDetails(string? hash = null, [FromQuery] string? queryHash = null)
    {
        var targetHash = hash ?? queryHash;
        if (string.IsNullOrWhiteSpace(targetHash))
        {
            return BadRequest(new { error = "Hash parametresi zorunludur." });
        }

        var details = await _txRepo.GetTransactionDetailsAsync(targetHash.Trim());
        return Ok(details ?? new TransactionDetailsResultDto { Found = false });
    }
}
