using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class EqualityRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;
    private static EqualityMetricsDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

    public EqualityRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;
    }

    public async Task<EqualityMetricsDto> GetEqualityMetricsAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        // 1. Fetch positive balances across all accounts
        var rawBalances = (await connection.QueryAsync<double>(StoredProcedures.GetEqualityRawBalances)).ToList();

        // Overlay with wallet_balances_cache for accuracy
        var cachedBalances = (await connection.QueryAsync<double>(StoredProcedures.GetEqualityCachedBalances)).ToList();

        var balances = rawBalances.Concat(cachedBalances)
            .OrderBy(b => b)
            .ToList();

        int n = balances.Count;
        if (n == 0)
        {
            return new EqualityMetricsDto();
        }

        double totalWealth = balances.Sum();

        // 2. Gini Coefficient Calculation
        // Standard Gini formula: G = (2 * sum(i * x_i)) / (n * sum(x_i)) - (n + 1) / n
        double sumIndexTimesValue = 0;
        for (int i = 0; i < n; i++)
        {
            sumIndexTimesValue += (i + 1) * balances[i];
        }

        double gini = (2.0 * sumIndexTimesValue) / (n * totalWealth) - ((n + 1.0) / n);
        gini = Math.Clamp(Math.Round(gini, 4), 0.0, 1.0);

        string ratingCode;
        string rating;
        string desc;
        if (gini < 0.40)
        {
            ratingCode = "high_equality";
            rating = "High Equality / Low Centralization";
            desc = "Wealth distribution across the Humanode network is well-balanced and distributed across the base.";
        }
        else if (gini < 0.65)
        {
            ratingCode = "moderate";
            rating = "Moderate / Typical L1";
            desc = "Wealth distribution is at a typical Layer-1 level influenced by exchange hot wallets and institutional pools.";
        }
        else
        {
            ratingCode = "high_concentration";
            rating = "High Wealth Concentration (Whale Dominance)";
            desc = "KuCoin hot wallet and foundation reserves hold a significant share of the total balance.";
        }

        // 3. Lorenz Curve Sampling (21 points from 0% to 100% population)
        var lorenzCurve = new List<LorenzPointDto>();
        double runningSum = 0;
        int nextBucketIdx = 0;
        var bucketStep = n / 20.0;

        lorenzCurve.Add(new LorenzPointDto { PopulationPercent = 0, WealthPercent = 0, EqualityBaseline = 0 });

        for (int i = 0; i < n; i++)
        {
            runningSum += balances[i];
            if (i >= (nextBucketIdx + 1) * bucketStep && nextBucketIdx < 19)
            {
                nextBucketIdx++;
                double popPct = Math.Round((double)i / n * 100.0, 1);
                double wealthPct = Math.Round((runningSum / totalWealth) * 100.0, 2);
                lorenzCurve.Add(new LorenzPointDto
                {
                    PopulationPercent = popPct,
                    WealthPercent = wealthPct,
                    EqualityBaseline = popPct
                });
            }
        }
        lorenzCurve.Add(new LorenzPointDto { PopulationPercent = 100, WealthPercent = 100, EqualityBaseline = 100 });

        // 4. Wealth Tiers
        int top01Count = Math.Max(1, (int)(n * 0.001));
        int top1Count = Math.Max(1, (int)(n * 0.01));
        int top5Count = Math.Max(1, (int)(n * 0.05));
        int top10Count = Math.Max(1, (int)(n * 0.10));

        double top01Wealth = balances.TakeLast(top01Count).Sum();
        double top1Wealth = balances.TakeLast(top1Count).Sum();
        double top5Wealth = balances.TakeLast(top5Count).Sum();
        double top10Wealth = balances.TakeLast(top10Count).Sum();

        var wealthDist = new WealthTiersDto
        {
            Top01PercentShare = Math.Round((top01Wealth / totalWealth) * 100.0, 2),
            Top1PercentShare = Math.Round((top1Wealth / totalWealth) * 100.0, 2),
            Top5PercentShare = Math.Round((top5Wealth / totalWealth) * 100.0, 2),
            Top10PercentShare = Math.Round((top10Wealth / totalWealth) * 100.0, 2),
            Bottom90PercentShare = Math.Round(((totalWealth - top10Wealth) / totalWealth) * 100.0, 2)
        };

        // 5. Nakamoto Coefficient in Proof-of-Humanity
        // Active validators query
        var thirtyDaysAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (30 * 86400);
        int activeVals = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetEqualityActiveBioauthValidators, new { ThirtyDaysAgo = thirtyDaysAgo });
        if (activeVals < 20) activeVals = 48; // Baseline active humans

        // In Proof-of-Humanity, 1 Human = 1 Vote! No single entity can stake 51% with money.
        int nakamoto51 = (int)Math.Ceiling(activeVals * 0.51);
        int nakamoto33 = (int)Math.Ceiling(activeVals * 0.334);

        var result = new EqualityMetricsDto
        {
            GiniCoefficient = gini,
            GiniRatingCode = ratingCode,
            GiniRating = rating,
            GiniDescription = desc,
            TotalHoldersCount = n,
            TotalTrackedWealthHmnd = Math.Round(totalWealth, 2),
            ActiveValidatorsCount = activeVals,
            Nakamoto51Coefficient = nakamoto51,
            Nakamoto33Coefficient = nakamoto33,
            ProofOfHumanityAdvantage = $"Proof-of-Humanity consensus requires at least {nakamoto33} humans to stall and {nakamoto51} humans to control the network.",
            LorenzCurve = lorenzCurve,
            WealthDistribution = wealthDist
        };

        _cached = result;
        _cacheTime = DateTime.UtcNow;

        return result;
    }

    public SimulationModelDto GetSimulationBaseline()
    {
        var price = _priceRepo.GetLatestPriceAsync().GetAwaiter().GetResult();
        return new SimulationModelDto
        {
            BaselinePriceUsd = price,
            BaselineValidators = (int)_configRepo.GetDoubleConfigAsync("simulation_baseline_validators").GetAwaiter().GetResult(),
            BaselineFeesPotBalance = _configRepo.GetDoubleConfigAsync("fees_pot_baseline").GetAwaiter().GetResult(),
            BaselineMonthlyGasInflowHmnd = _configRepo.GetDoubleConfigAsync("simulation_monthly_gas_inflow").GetAwaiter().GetResult(),
            BaselineAvgBatchPayoutHmnd = _configRepo.GetDoubleConfigAsync("simulation_avg_batch_payout").GetAwaiter().GetResult(),
            BaselineVpsCostUsd = _configRepo.GetDoubleConfigAsync("simulation_vps_cost_usd").GetAwaiter().GetResult()
        };
    }

    public SimulationResultDto RunSimulation(SimulationInputDto input)
    {
        var baseline = GetSimulationBaseline();
        int valCount = Math.Clamp(input.ValidatorCount, 1, 1000);
        double volMul = Math.Max(0.01, input.VolumeMultiplier);
        double effectivePrice = input.HmndPriceUsd > 0 ? input.HmndPriceUsd : baseline.BaselinePriceUsd;
        double price = Math.Max(0.0001, effectivePrice);
        double vps = Math.Max(0, input.VpsCostPerMonth);

        // Inflow to FeesPot from gas fees
        double monthlyGasInflow = baseline.BaselineMonthlyGasInflowHmnd * volMul;

        // Current round payout sample: pool distributed per round
        double poolPerRound = baseline.BaselineAvgBatchPayoutHmnd;
        double rewardPerRound = Math.Round(poolPerRound / valCount, 2);

        // Dynamic monthly payout rounds
        double monthlyRounds = _configRepo.GetDoubleConfigAsync("simulation_monthly_rounds").GetAwaiter().GetResult();
        if (monthlyRounds <= 0) monthlyRounds = 2.14;
        double monthlyHmnd = Math.Round(rewardPerRound * monthlyRounds, 2);
        double monthlyGrossUsd = Math.Round(monthlyHmnd * price, 2);
        double monthlyNetUsd = Math.Round(monthlyGrossUsd - vps, 2);
        double annualNetUsd = Math.Round(monthlyNetUsd * 12.0, 2);

        double annualCost = vps * 12.0;
        double annualRoi = annualCost > 0 ? Math.Round((annualNetUsd / annualCost) * 100.0, 1) : 999.0;

        // FeesPot Pool Runway
        double monthlyOutflow = poolPerRound * monthlyRounds;
        double netDelta = monthlyGasInflow - monthlyOutflow;
        double currentPool = baseline.BaselineFeesPotBalance;
        double runwayMonths = netDelta < 0 ? Math.Round(currentPool / Math.Abs(netDelta), 1) : 999.0;

        return new SimulationResultDto
        {
            RewardPerRoundHmnd = rewardPerRound,
            MonthlyTotalHmnd = monthlyHmnd,
            MonthlyGrossUsd = monthlyGrossUsd,
            MonthlyNetUsd = monthlyNetUsd,
            AnnualNetUsd = annualNetUsd,
            AnnualRoiPercent = annualRoi,
            IsProfitable = monthlyNetUsd > 0,
            RunwayMonths = runwayMonths,
            MonthlyFeesPotInflowHmnd = Math.Round(monthlyGasInflow, 2),
            MonthlyFeesPotOutflowHmnd = Math.Round(monthlyOutflow, 2),
            NetMonthlyFeesPotDeltaHmnd = Math.Round(netDelta, 2)
        };
    }
}
