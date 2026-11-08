using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Repositories;

namespace HumanodeTracker.Services;

public class TokenomicsSyncService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TokenomicsSyncService> _logger;
    private const string FeesPotPalletAddress = "hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk";

    public TokenomicsSyncService(IServiceProvider serviceProvider, ILogger<TokenomicsSyncService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TokenomicsSyncService started.");

        // Initial immediate sync
        await SyncFeesPotAndSupplyAsync();

        var feesPotTimer = DateTime.UtcNow;
        var supplyTimer = DateTime.UtcNow;
        var leaderboardTimer = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Sync FeesPot balance every 60 seconds
                if (now - feesPotTimer >= TimeSpan.FromSeconds(60))
                {
                    feesPotTimer = now;
                    await SyncFeesPotAsync();
                }

                // Sync circulating supply every 10 minutes
                if (now - supplyTimer >= TimeSpan.FromMinutes(10))
                {
                    supplyTimer = now;
                    await SyncSupplyAsync();
                }

                // Sync top leaderboard balances every 5 minutes
                if (now - leaderboardTimer >= TimeSpan.FromMinutes(5))
                {
                    leaderboardTimer = now;
                    await SyncTopBalancesAsync();
                }

                await Task.Delay(5000, stoppingToken);
            }
            catch (TaskCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("TokenomicsSyncService error: {Message}", ex.Message);
                await Task.Delay(10000, stoppingToken);
            }
        }
    }

    private async Task SyncFeesPotAndSupplyAsync()
    {
        await SyncFeesPotAsync();
        await SyncSupplyAsync();
    }

    private async Task SyncFeesPotAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var sidecar = scope.ServiceProvider.GetRequiredService<IHumanodeSidecarClient>();
        var tokenomicsRepo = scope.ServiceProvider.GetRequiredService<ITokenomicsRepository>();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();

        var bal = await sidecar.GetAccountBalanceAsync(FeesPotPalletAddress);
        if (bal.HasValue && bal.Value > 1000)
        {
            tokenomicsRepo.UpdateFeesPotBalance(bal.Value);

            using var conn = dbFactory.CreateConnection();
            const string sql = @"
                INSERT INTO wallet_balances_cache (address, balance_hmnd, updated_at)
                VALUES (@FeesPotPalletAddress, @Balance, @UpdatedAt)
                ON CONFLICT(address) DO UPDATE SET
                    balance_hmnd = excluded.balance_hmnd,
                    updated_at = excluded.updated_at";

            await conn.ExecuteAsync(sql, new
            {
                FeesPotPalletAddress,
                Balance = bal.Value,
                UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
            });

            _logger.LogInformation("FeesPot balance updated: {Balance} HMND", bal.Value);
        }
    }

    private async Task SyncSupplyAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var sidecar = scope.ServiceProvider.GetRequiredService<IHumanodeSidecarClient>();
        var tokenomicsRepo = scope.ServiceProvider.GetRequiredService<ITokenomicsRepository>();

        var supply = await sidecar.GetOfficialCirculatingSupplyAsync();
        if (supply.HasValue && supply.Value > 1e8)
        {
            tokenomicsRepo.UpdateCirculatingSupply(supply.Value);
            _logger.LogInformation("Official circulating supply updated: {Supply} HMND", supply.Value);
        }
    }

    private async Task SyncTopBalancesAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var sidecar = scope.ServiceProvider.GetRequiredService<IHumanodeSidecarClient>();
        var dbFactory = scope.ServiceProvider.GetRequiredService<IDbConnectionFactory>();

        using var conn = dbFactory.CreateConnection();
        const string topSql = @"
            SELECT address FROM (
                SELECT target as address, SUM(value_hmnd) as vol FROM substrate_extrinsics WHERE target > '' AND status = 1 GROUP BY target
                UNION
                SELECT signer as address, SUM(value_hmnd) as vol FROM substrate_extrinsics WHERE signer > '' AND status = 1 GROUP BY signer
            ) WHERE address LIKE 'hm%' ORDER BY vol DESC LIMIT 25";

        var addresses = (await conn.QueryAsync<string>(topSql)).ToList();
        foreach (var addr in addresses)
        {
            var bal = await sidecar.GetAccountBalanceAsync(addr);
            if (bal.HasValue)
            {
                const string upsertSql = @"
                    INSERT INTO wallet_balances_cache (address, balance_hmnd, updated_at)
                    VALUES (@addr, @bal, @now)
                    ON CONFLICT(address) DO UPDATE SET
                        balance_hmnd = excluded.balance_hmnd,
                        updated_at = excluded.updated_at";
                await conn.ExecuteAsync(upsertSql, new { addr, bal = bal.Value, now = DateTimeOffset.UtcNow.ToUnixTimeSeconds() });
            }
        }
    }
}
