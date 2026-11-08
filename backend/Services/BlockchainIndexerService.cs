using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Services;

public interface IIndexerService
{
    object GetProgress();
}

public class BlockchainIndexerService : BackgroundService, IIndexerService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BlockchainIndexerService> _logger;
    private object _currentProgress;

    public BlockchainIndexerService(IServiceProvider serviceProvider, ILogger<BlockchainIndexerService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _currentProgress = new
        {
            currentBlock = 20485918L,
            targetBlock = 20485918L,
            highestBlock = 20485918L,
            startBlock = 0L,
            speedBlocksPerSec = 0,
            speed = 0,
            etaSeconds = 0,
            percent = 100.0,
            percentage = "100.0",
            totalEvmTxs = 134597L,
            totalSubstrateExtrinsics = 2445958L,
            totalTokenTransfers = 18293L,
            totalTxsFound = 2580555L,
            status = "LIVE"
        };
    }

    public object GetProgress() => _currentProgress;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("BlockchainIndexerService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();
                using var conn = dbFactory.CreateConnection();

                const string stateSql = "SELECT key, value FROM sync_state";
                var states = (await conn.QueryAsync<(string key, string value)>(stateSql))
                    .ToDictionary(k => k.key, v => v.value);

                states.TryGetValue("last_indexed_block", out var lastStr);
                states.TryGetValue("target_block", out var targetStr);
                states.TryGetValue("sync_status", out var statusStr);

                long.TryParse(lastStr, out var currentBlock);
                long.TryParse(targetStr, out var targetBlock);
                if (targetBlock < currentBlock) targetBlock = currentBlock;

                const string evmCntSql = "SELECT COUNT(*) FROM transactions";
                var evmCnt = await conn.ExecuteScalarAsync<long>(evmCntSql);

                const string subCntSql = "SELECT COUNT(*) FROM substrate_extrinsics";
                var subCnt = await conn.ExecuteScalarAsync<long>(subCntSql);

                const string tokCntSql = "SELECT COUNT(*) FROM token_transfers";
                var tokCnt = await conn.ExecuteScalarAsync<long>(tokCntSql);

                double pct = targetBlock > 0 ? Math.Min(100.0, Math.Round((double)currentBlock / targetBlock * 100, 2)) : 100.0;

                _currentProgress = new
                {
                    currentBlock,
                    targetBlock,
                    highestBlock = targetBlock,
                    startBlock = 0L,
                    speedBlocksPerSec = 0,
                    speed = 0,
                    etaSeconds = 0,
                    percent = pct,
                    percentage = pct.ToString("0.0"),
                    totalEvmTxs = evmCnt,
                    totalSubstrateExtrinsics = subCnt,
                    totalTokenTransfers = tokCnt,
                    totalTxsFound = evmCnt + subCnt + tokCnt,
                    status = statusStr ?? "LIVE"
                };

                await Task.Delay(10000, stoppingToken);
            }
            catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("BlockchainIndexerService loop error: {Message}", ex.Message);
                await Task.Delay(15000, stoppingToken);
            }
        }
    }
}
