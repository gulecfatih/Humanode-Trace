using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IEqualityRepository
{
    Task<EqualityMetricsDto> GetEqualityMetricsAsync();
    SimulationModelDto GetSimulationBaseline();
    SimulationResultDto RunSimulation(SimulationInputDto input);
}

public class EqualityMetricsDto
{
    public double GiniCoefficient { get; set; }
    public string GiniRating { get; set; } = "Orta Eşitsizlik";
    public string GiniDescription { get; set; } = "";
    public int TotalHoldersCount { get; set; }
    public double TotalTrackedWealthHmnd { get; set; }
    public int ActiveValidatorsCount { get; set; }
    public int Nakamoto51Coefficient { get; set; }
    public int Nakamoto33Coefficient { get; set; }
    public string ProofOfHumanityAdvantage { get; set; } = "";
    public List<LorenzPointDto> LorenzCurve { get; set; } = new();
    public WealthTiersDto WealthDistribution { get; set; } = new();
}

public class LorenzPointDto
{
    public double PopulationPercent { get; set; }
    public double WealthPercent { get; set; }
    public double EqualityBaseline { get; set; }
}

public class WealthTiersDto
{
    public double Top01PercentShare { get; set; }
    public double Top1PercentShare { get; set; }
    public double Top5PercentShare { get; set; }
    public double Top10PercentShare { get; set; }
    public double Bottom90PercentShare { get; set; }
}

public class SimulationModelDto
{
    public int BaselineValidators { get; set; } = 48;
    public double BaselineFeesPotBalance { get; set; } = 403162.33;
    public double BaselineMonthlyGasInflowHmnd { get; set; } = 15840.0;
    public double BaselineAvgBatchPayoutHmnd { get; set; } = 49078.4;
    public double BaselinePriceUsd { get; set; } = 0.045;
    public double BaselineVpsCostUsd { get; set; } = 15.0;
}

public class SimulationInputDto
{
    public int ValidatorCount { get; set; } = 48;
    public double VolumeMultiplier { get; set; } = 1.0;
    public double HmndPriceUsd { get; set; } = 0.045;
    public double VpsCostPerMonth { get; set; } = 15.0;
}

public class SimulationResultDto
{
    public double RewardPerRoundHmnd { get; set; }
    public double MonthlyTotalHmnd { get; set; }
    public double MonthlyGrossUsd { get; set; }
    public double MonthlyNetUsd { get; set; }
    public double AnnualNetUsd { get; set; }
    public double AnnualRoiPercent { get; set; }
    public bool IsProfitable { get; set; }
    public double RunwayMonths { get; set; }
    public double MonthlyFeesPotInflowHmnd { get; set; }
    public double MonthlyFeesPotOutflowHmnd { get; set; }
    public double NetMonthlyFeesPotDeltaHmnd { get; set; }
}

public class EqualityRepository : IEqualityRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private static EqualityMetricsDto? _cached;
    private static DateTime _cacheTime = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(15);

    public EqualityRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<EqualityMetricsDto> GetEqualityMetricsAsync()
    {
        if (_cached != null && DateTime.UtcNow - _cacheTime < CacheDuration)
        {
            return _cached;
        }

        using var connection = _dbFactory.CreateConnection();

        // 1. Fetch positive balances across all accounts
        const string balanceSql = @"
            SELECT balance_hmnd FROM (
                SELECT target as address, SUM(value_hmnd) as balance_hmnd
                FROM substrate_extrinsics
                WHERE target > '' AND status = 1
                GROUP BY target
                UNION ALL
                SELECT to_address as address, SUM(value_hmnd) as balance_hmnd
                FROM transactions
                WHERE to_address > '' AND status = 1
                GROUP BY to_address
            )
            WHERE balance_hmnd > 0.01
            ORDER BY balance_hmnd ASC";

        var rawBalances = (await connection.QueryAsync<double>(balanceSql)).ToList();

        // Overlay with wallet_balances_cache for accuracy
        const string cacheSql = "SELECT balance_hmnd FROM wallet_balances_cache WHERE balance_hmnd > 0.01";
        var cachedBalances = (await connection.QueryAsync<double>(cacheSql)).ToList();

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

        string rating;
        string desc;
        if (gini < 0.40)
        {
            rating = "Yüksek Eşitlik / Düşük Merkezileşme";
            desc = "Humanode ağındaki servet dağılımı blokzincir standartlarına göre oldukça dengeli ve tabana yayılmıştır.";
        }
        else if (gini < 0.65)
        {
            rating = "Dengeli / Tipik Kripto Seviyesi";
            desc = "Borsa sıcak cüzdanları ve kurumsal havuzların etkisiyle servet dağılımı tipik Layer-1 seviyesindedir.";
        }
        else
        {
            rating = "Yüksek Servet Yoğunlaşması (Balina & Borsa Hakimiyeti)";
            desc = "KuCoin sıcak kasası ve vakıf rezervleri toplam bakiyenin önemli bir bölümünü elinde tutmaktadır.";
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
        const string valSql = @"
            SELECT COUNT(DISTINCT signer)
            FROM substrate_extrinsics
            WHERE pallet = 'bioauth' AND timestamp >= @thirtyDaysAgo";
        var thirtyDaysAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (30 * 86400);
        int activeVals = await connection.ExecuteScalarAsync<int>(valSql, new { thirtyDaysAgo });
        if (activeVals < 20) activeVals = 48; // Baseline active humans

        // In Proof-of-Humanity, 1 Human = 1 Vote! No single entity can stake 51% with money.
        int nakamoto51 = (int)Math.Ceiling(activeVals * 0.51);
        int nakamoto33 = (int)Math.Ceiling(activeVals * 0.334);

        var result = new EqualityMetricsDto
        {
            GiniCoefficient = gini,
            GiniRating = rating,
            GiniDescription = desc,
            TotalHoldersCount = n,
            TotalTrackedWealthHmnd = Math.Round(totalWealth, 2),
            ActiveValidatorsCount = activeVals,
            Nakamoto51Coefficient = nakamoto51,
            Nakamoto33Coefficient = nakamoto33,
            ProofOfHumanityAdvantage = "Geleneksel Proof-of-Stake ağlarında (Ethereum, Solana vb.) 2-3 staking havuzu %51 güce ulaşabilirken, Humanode'da biyometrik eşitlik sayesinde konsensüsü durdurmak için en az " + nakamoto33 + " bağımsız gerçek insanın, ağı ele geçirmek için ise en az " + nakamoto51 + " insanın anlaşması gerekir.",
            LorenzCurve = lorenzCurve,
            WealthDistribution = wealthDist
        };

        _cached = result;
        _cacheTime = DateTime.UtcNow;

        return result;
    }

    public SimulationModelDto GetSimulationBaseline()
    {
        return new SimulationModelDto();
    }

    public SimulationResultDto RunSimulation(SimulationInputDto input)
    {
        var baseline = GetSimulationBaseline();
        int valCount = Math.Clamp(input.ValidatorCount, 1, 1000);
        double volMul = Math.Max(0.01, input.VolumeMultiplier);
        double price = Math.Max(0.001, input.HmndPriceUsd);
        double vps = Math.Max(0, input.VpsCostPerMonth);

        // Inflow to FeesPot from gas fees
        double monthlyGasInflow = baseline.BaselineMonthlyGasInflowHmnd * volMul;

        // Current round payout sample: ~49,000 HMND pool distributed per round
        double poolPerRound = baseline.BaselineAvgBatchPayoutHmnd;
        double rewardPerRound = Math.Round(poolPerRound / valCount, 2);

        // 2.14 rounds per month (~14 days per round)
        double monthlyRounds = 2.14;
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
