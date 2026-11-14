using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class DexRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;

    public DexRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<DexDepthDto> GetDexPoolDepthAsync(string? poolAddress = null)
    {
        if (string.IsNullOrWhiteSpace(poolAddress))
        {
            poolAddress = await _configRepo.GetConfigAsync("default_dex_pool_address");
        }
        var cleanPool = (poolAddress ?? "").Trim().ToLowerInvariant();
        using var connection = _dbFactory.CreateConnection();

        // 1. Calculate pool reserves from token_transfers
        var inRows = (await connection.QueryAsync<(string symbol, double total)>(StoredProcedures.GetDexPoolReservesIn, new { cleanPool })).ToList();
        var outRows = (await connection.QueryAsync<(string symbol, double total)>(StoredProcedures.GetDexPoolReservesOut, new { cleanPool })).ToList();

        double reserveHmnd = await _configRepo.GetDoubleConfigAsync("dex_baseline_wehmnd_reserve");
        double reserveUsd = await _configRepo.GetDoubleConfigAsync("dex_baseline_usdc_reserve");
        string sym0 = "WeHMND";
        string sym1 = "USDC";
        string pairName = "WeHMND / USDC";

        if (cleanPool.Contains("d391"))
        {
            sym1 = "WETH";
            pairName = "WeHMND / WETH";
        }
        else if (cleanPool.Contains("58d1"))
        {
            sym1 = "WBTC";
            pairName = "WeHMND / WBTC";
        }

        // Overlay with on-chain transfers if present
        var rIn0 = inRows.FirstOrDefault(r => r.symbol.Equals(sym0, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(rIn0.symbol))
        {
            var rOut0 = outRows.FirstOrDefault(r => r.symbol.Equals(sym0, StringComparison.OrdinalIgnoreCase));
            double net0 = Math.Max(1000.0, rIn0.total - rOut0.total);
            reserveHmnd = net0;
        }

        var rIn1 = inRows.FirstOrDefault(r => r.symbol.Equals(sym1, StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrEmpty(rIn1.symbol))
        {
            var rOut1 = outRows.FirstOrDefault(r => r.symbol.Equals(sym1, StringComparison.OrdinalIgnoreCase));
            double net1 = Math.Max(10.0, rIn1.total - rOut1.total);
            reserveUsd = net1;
        }

        double k = reserveHmnd * reserveUsd;
        var defaultPrice = await _priceRepo.GetLatestPriceAsync();
        double spotPrice = (sym1 == "USDC" && reserveHmnd > 0) ? (reserveUsd / reserveHmnd) : defaultPrice;

        double refOtherUsd = sym1 == "WETH" 
            ? await _configRepo.GetDoubleConfigAsync("price_ref_weth")
            : await _configRepo.GetDoubleConfigAsync("price_ref_wbtc");

        double tvlUsd = (reserveHmnd * spotPrice) + (sym1 == "USDC" ? reserveUsd : (reserveUsd * refOtherUsd));

        // 24h volume
        var dayAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - 86400;
        var vol24Hmnd = await connection.ExecuteScalarAsync<double>(StoredProcedures.GetDexPool24hVolume, new { cleanPool, dayAgo });
        var baselineVol = await _configRepo.GetDoubleConfigAsync("dex_baseline_daily_volume");
        if (vol24Hmnd < 1000) vol24Hmnd = baselineVol;

        double vol24Usd = Math.Round(vol24Hmnd * spotPrice, 2);
        double fees24Usd = Math.Round(vol24Usd * 0.003, 2); // 0.3% AMM fee

        // 2. Slippage Simulation Table for Sales
        var tradeSizes = new[] { 5000.0, 15000.0, 50000.0, 100000.0, 250000.0, 500000.0 };
        var slippageTiers = new List<SlippageTierDto>();

        foreach (var dx in tradeSizes)
        {
            // AMM Constant Product: dy = y - (k / (x + dx * (1 - 0.003)))
            double dxEffective = dx * 0.997;
            double dy = reserveUsd - (k / (reserveHmnd + dxEffective));
            double effectivePrice = dy / dx;
            double impact = Math.Max(0.01, Math.Round((1.0 - (effectivePrice / spotPrice)) * 100.0, 2));

            string warn = impact < 1.0 ? "low" : (impact < 5.0 ? "medium" : "high");

            slippageTiers.Add(new SlippageTierDto
            {
                TradeSizeHmnd = dx,
                TradeSizeUsd = Math.Round(dx * spotPrice, 2),
                OutputToken1 = Math.Round(dy, 2),
                EffectivePriceUsd = Math.Round(effectivePrice, 4),
                PriceImpactPercent = impact,
                WarningTier = warn
            });
        }

        // 3. Impermanent Loss Curve Calculation
        var priceRatios = new[] { 0.25, 0.50, 0.75, 1.0, 1.25, 1.50, 2.0, 3.0, 5.0 };
        var ilCurve = new List<ImpermanentLossPointDto>();

        foreach (var r in priceRatios)
        {
            // IL formula: 2 * sqrt(r) / (1 + r) - 1
            double il = (2.0 * Math.Sqrt(r) / (1.0 + r)) - 1.0;
            double ilPct = Math.Round(il * 100.0, 2);
            double baseUsd = 1000.0;
            double holdVal = baseUsd * (1.0 + r) / 2.0;
            double lpVal = holdVal * (1.0 + il);

            ilCurve.Add(new ImpermanentLossPointDto
            {
                PriceRatio = r,
                PriceRatioLabel = $"{r:0.00}x",
                ImpermanentLossPercent = ilPct,
                HoldValueUsd = Math.Round(holdVal, 2),
                LpValueUsd = Math.Round(lpVal, 2)
            });
        }

        return new DexDepthDto
        {
            PoolAddress = cleanPool,
            PairName = pairName,
            DexName = "Impossible Finance V2",
            ReserveToken0 = Math.Round(reserveHmnd, 2),
            Symbol0 = sym0,
            ReserveToken1 = Math.Round(reserveUsd, 2),
            Symbol1 = sym1,
            ConstantProductK = k,
            SpotPriceUsd = Math.Round(spotPrice, 4),
            TotalTvlUsd = Math.Round(tvlUsd, 2),
            Volume24hHmnd = Math.Round(vol24Hmnd, 2),
            Volume24hUsd = vol24Usd,
            Fees24hUsd = fees24Usd,
            SlippageTiers = slippageTiers,
            ImpermanentLossCurve = ilCurve
        };
    }

    public async Task<List<DexPoolOverviewDto>> GetAllPoolsOverviewAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        var pools = (await connection.QueryAsync<string>(StoredProcedures.GetDexPoolAddresses)).ToList();
        if (pools.Count == 0)
        {
            var defPool = await _configRepo.GetConfigAsync("default_dex_pool_address");
            if (!string.IsNullOrEmpty(defPool)) pools.Add(defPool);
        }

        var list = new List<DexPoolOverviewDto>();
        foreach (var p in pools)
        {
            var depth = await GetDexPoolDepthAsync(p);
            double annualFees = depth.Fees24hUsd * 365.0;
            double apr = depth.TotalTvlUsd > 0 ? Math.Round((annualFees / depth.TotalTvlUsd) * 100.0, 1) : 0.0;

            list.Add(new DexPoolOverviewDto
            {
                Address = p,
                PairName = depth.PairName,
                TvlUsd = depth.TotalTvlUsd,
                Volume24hUsd = depth.Volume24hUsd,
                AprPercent = apr
            });
        }

        return list;
    }
}
