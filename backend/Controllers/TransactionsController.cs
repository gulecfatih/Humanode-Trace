using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Models;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class TransactionsController : ControllerBase
{
    private readonly TransactionRepository _txRepo;
    private readonly BlockRepository _blockRepo;

    public TransactionsController(TransactionRepository txRepo, BlockRepository blockRepo)
    {
        _txRepo = txRepo;
        _blockRepo = blockRepo;
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] TransactionQueryRequest request)
    {
        request ??= new TransactionQueryRequest();
        if (!string.IsNullOrWhiteSpace(request.Hash))
        {
            var details = await _txRepo.GetTransactionDetailsAsync(request.Hash.Trim());
            return Ok(details ?? new TransactionDetailsResultDto { Found = false });
        }

        var result = await _txRepo.SearchActivitiesAsync(new SearchActivitiesRequest
        {
            Layer = request.Layer,
            Filter = request.Filter,
            Page = request.Page,
            Limit = request.Limit,
            HideZeroFee = request.HideZeroFee
        });

        return Ok(result);
    }

    [HttpGet("search")]
    [HttpGet("blocks")]
    public async Task<IActionResult> Search([FromQuery] SearchActivitiesRequest request)
    {
        request ??= new SearchActivitiesRequest();

        if (request.ViewMode.Equals("block", StringComparison.OrdinalIgnoreCase))
        {
            var blockResult = await _blockRepo.SearchBlocksAsync(request);
            return Ok(blockResult);
        }

        var searchResult = await _txRepo.SearchActivitiesAsync(request);
        return Ok(searchResult);
    }

    [HttpGet("block")]
    public async Task<IActionResult> GetBlock([FromQuery] string? number = null, [FromQuery] string? block = null, [FromQuery] string? id = null)
    {
        var raw = number ?? block ?? id;
        if (string.IsNullOrWhiteSpace(raw) || !long.TryParse(raw.Replace("#", "").Trim(), out var blockNum))
        {
            return BadRequest(new ApiErrorDto { Error = "err_block_required", MessageKey = "err_block_required" });
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
            return BadRequest(new ApiErrorDto { Error = "err_hash_required", MessageKey = "err_hash_required" });
        }

        var details = await _txRepo.GetTransactionDetailsAsync(targetHash.Trim());
        return Ok(details ?? new TransactionDetailsResultDto { Found = false });
    }
}
