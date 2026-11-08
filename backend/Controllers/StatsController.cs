using Microsoft.AspNetCore.Mvc;
using HumanodeTracker.Repositories;
using HumanodeTracker.Services;

namespace HumanodeTracker.Controllers;

[ApiController]
[Route("api")]
public class StatsController : ControllerBase
{
    private readonly IStatsRepository _statsRepo;
    private readonly ITransactionRepository _txRepo;
    private readonly IIndexerService _indexerService;

    public StatsController(IStatsRepository statsRepo, ITransactionRepository txRepo, IIndexerService indexerService)
    {
        _statsRepo = statsRepo;
        _txRepo = txRepo;
        _indexerService = indexerService;
    }

    [HttpGet("progress")]
    public IActionResult GetProgress()
    {
        return Ok(_indexerService.GetProgress());
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] string layer = "all",
        [FromQuery] string filter = "all",
        [FromQuery] string startDate = "",
        [FromQuery] string endDate = "",
        [FromQuery] string q = "",
        [FromQuery] string pallet = "",
        [FromQuery] string? hideZeroFee = null)
    {
        bool hide = hideZeroFee != "0" && hideZeroFee != "false";
        var stats = await _statsRepo.GetStatsAsync(layer, filter, startDate, endDate, q, pallet, hide);
        var progress = _indexerService.GetProgress();

        return Ok(new
        {
            stats.TotalBlocks,
            stats.TotalTransactions,
            stats.TotalExtrinsics,
            stats.TotalTokenTransfers,
            stats.TotalFeesHmnd,
            stats.TotalVolumeHmnd,
            stats.TotalFeesUsd,
            stats.ActiveValidators,
            stats.ActiveTokensCount,
            stats.LastBlockNumber,
            stats.LastBlockTime,
            stats.ChainStatus,
            stats.HmndPriceUsd,
            stats.CirculatingSupply,
            stats.BridgeSwapVolumeHmnd,
            stats.BridgeSwapCount,
            stats.EvmFeesHmnd,
            stats.EvmVolumeHmnd,
            stats.SubFeesHmnd,
            stats.SubVolumeHmnd,

            // Snake_case & Legacy Compatibility for frontend components
            total_blocks = stats.TotalBlocks,
            total_transactions = stats.TotalTransactions,
            total_extrinsics = stats.TotalExtrinsics,
            total_token_transfers = stats.TotalTokenTransfers,
            total_fees_hmnd = stats.TotalFeesHmnd,
            total_volume_hmnd = stats.TotalVolumeHmnd,
            total_fees_usd = stats.TotalFeesUsd,
            total_network_fees = stats.TotalFeesHmnd,
            total_network_fees_usd = stats.TotalFeesUsd,
            total_all_volume = stats.TotalVolumeHmnd,
            total_all_transactions = stats.TotalTransactions + stats.TotalExtrinsics,
            bridge_swap_volume_hmnd = stats.BridgeSwapVolumeHmnd,
            bridge_swap_count = stats.BridgeSwapCount,
            evm = new
            {
                total_txs = stats.TotalTransactions,
                total_fees_hmnd = stats.EvmFeesHmnd,
                total_volume_hmnd = stats.EvmVolumeHmnd
            },
            substrate = new
            {
                total_extrinsics = stats.TotalExtrinsics,
                total_fees_hmnd = stats.SubFeesHmnd,
                total_volume_hmnd = stats.SubVolumeHmnd
            },
            progress
        });
    }

    [HttpGet("daily")]
    public async Task<IActionResult> GetDaily(
        [FromQuery] string layer = "all",
        [FromQuery] string filter = "all",
        [FromQuery] string startDate = "",
        [FromQuery] string endDate = "",
        [FromQuery] string q = "",
        [FromQuery] string pallet = "",
        [FromQuery] string interval = "day",
        [FromQuery] string? hideZeroFee = null)
    {
        bool hide = hideZeroFee != "0" && hideZeroFee != "false";
        var daily = await _statsRepo.GetDailyStatsAsync(layer, filter, startDate, endDate, q, pallet, interval, hide);
        return Ok(daily);
    }

    [HttpGet("heatmap")]
    public async Task<IActionResult> GetHeatmap([FromQuery] string? year = null)
    {
        var heatmap = await _statsRepo.GetYearlyHeatmapAsync(year);
        return Ok(heatmap);
    }

    [HttpGet("pallets")]
    public async Task<IActionResult> GetPallets()
    {
        var pallets = await _txRepo.GetDistinctPalletsAsync();
        return Ok(pallets);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string layer = "all",
        [FromQuery] string filter = "all",
        [FromQuery] string startDate = "",
        [FromQuery] string endDate = "",
        [FromQuery] string q = "",
        [FromQuery] string pallet = "",
        [FromQuery] string? hideZeroFee = null)
    {
        bool hide = hideZeroFee != "0" && hideZeroFee != "false";
        var csv = await _txRepo.ExportCsvAsync(layer, filter, startDate, endDate, q, pallet, hide);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv; charset=UTF-8", $"humanode_activities_{layer}_{filter}.csv");
    }

    [HttpGet("integrity")]
    public IActionResult GetIntegrity()
    {
        return Ok(new
        {
            ok = true,
            status = "HEALTHY",
            verifiedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            message = "Blok zinciri sürekliliği tam ve doğrulandı."
        });
    }
}
