using System.Data;
using System.Text.Json;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ITokenomicsRepository
{
    Task<TokenomicsDto> GetTokenomicsAsync();
    Task<FeesPotAnalyticsDto> GetFeesPotAnalyticsAsync();
    void UpdateFeesPotBalance(double balance);
    void UpdateCirculatingSupply(double supply);
    double CurrentFeesPotBalance { get; }
    double CurrentCirculatingSupply { get; }
}

public class TokenomicsRepository : ITokenomicsRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IConfiguration _config;
    private double _cachedFeesPotBalance = 403162.33;
    private double _cachedCirculatingSupply = 285970432.10;
    private const string FeesPotPalletAddress = "hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk";
    private readonly string _payoutsPath;

    public double CurrentFeesPotBalance => _cachedFeesPotBalance;
    public double CurrentCirculatingSupply => _cachedCirculatingSupply;

    public TokenomicsRepository(IDbConnectionFactory dbFactory, IConfiguration config)
    {
        _dbFactory = dbFactory;
        _config = config;

        var configuredPath = _config["DataFiles:ValidatorPayouts"] ?? "Data/validator_payouts.json";
        if (File.Exists(configuredPath))
            _payoutsPath = configuredPath;
        else if (File.Exists(Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json")))
            _payoutsPath = Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json");
        else if (File.Exists("../src/data/validator_payouts.json"))
            _payoutsPath = "../src/data/validator_payouts.json";
        else
            _payoutsPath = "Data/validator_payouts.json";
    }

    public void UpdateFeesPotBalance(double balance)
    {
        if (balance > 1000)
        {
            _cachedFeesPotBalance = balance;
        }
    }

    public void UpdateCirculatingSupply(double supply)
    {
        if (supply > 1000000)
        {
            _cachedCirculatingSupply = supply;
        }
    }

    public async Task<TokenomicsDto> GetTokenomicsAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        const double totalIssuance = 400000000.0;

        const string burnedSql = "SELECT COALESCE(SUM(total_fees_hmnd), 0) FROM blocks_with_tx";
        var burnedTotal = Math.Round(await connection.ExecuteScalarAsync<double>(burnedSql), 2);
        if (burnedTotal == 0) burnedTotal = 690246.0;

        var effectiveSupply = Math.Round(totalIssuance - burnedTotal, 2);
        const double claimableAirdrop = 14114881.07;
        var feesPot = Math.Round(_cachedFeesPotBalance, 2);
        var circulating = Math.Round(_cachedCirculatingSupply, 2);
        var lockedVesting = Math.Round(Math.Max(0, totalIssuance - circulating - claimableAirdrop - feesPot - burnedTotal), 2);

        return new TokenomicsDto
        {
            TotalIssuance = totalIssuance,
            BurnedTotal = burnedTotal,
            EffectiveSupply = effectiveSupply,
            ClaimableAirdrop = claimableAirdrop,
            FeesPotBalance = feesPot,
            LockedVesting = lockedVesting,
            CirculatingEstimate = circulating,
            Source = "Official Humanode Native Supply API (supply-api.mainnet.stages.humanode.io)"
        };
    }

    public async Task<FeesPotAnalyticsDto> GetFeesPotAnalyticsAsync()
    {
        using var connection = _dbFactory.CreateConnection();

        const string burnedSql = "SELECT COALESCE(SUM(total_fees_hmnd), 0) FROM blocks_with_tx";
        var burnedTotal = Math.Round(await connection.ExecuteScalarAsync<double>(burnedSql), 2);
        if (burnedTotal == 0) burnedTotal = 690246.0;

        var currentBalance = Math.Round(_cachedFeesPotBalance, 2);

        var history = new List<PayoutBatchItemDto>();
        int totalBatches = 112;
        long lastBatchBlock = 20447782;
        long lastBatchTs = 1793211744;
        int lastBatchRecipients = 80;
        double samplePerValidator = 613.48;

        if (File.Exists(_payoutsPath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(_payoutsPath);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("payouts", out var payoutsArr))
                {
                    totalBatches = payoutsArr.GetArrayLength();
                    var allBatches = new List<JsonElement>();
                    foreach (var elem in payoutsArr.EnumerateArray())
                    {
                        allBatches.Add(elem);
                    }

                    if (allBatches.Count > 0)
                    {
                        var last = allBatches[^1];
                        lastBatchBlock = last.GetProperty("block").GetInt64();
                        var rawTs = last.GetProperty("ts").GetInt64();
                        lastBatchTs = rawTs > 100_000_000_000 ? rawTs / 1000 : rawTs;

                        // Take last 10 reverse
                        var slice = allBatches.TakeLast(10).Reverse().ToList();
                        foreach (var b in slice)
                        {
                            var blk = b.GetProperty("block").GetInt64();
                            var bts = b.GetProperty("ts").GetInt64();
                            var tsSec = bts > 100_000_000_000 ? bts / 1000 : bts;
                            double totDistributed = 0;
                            double sampleVal = 613.48;
                            int count = 0;

                            if (b.TryGetProperty("recipients", out var recs))
                            {
                                count = recs.GetArrayLength();
                                foreach (var r in recs.EnumerateArray())
                                {
                                    if (r.ValueKind == JsonValueKind.Array && r.GetArrayLength() > 1)
                                    {
                                        var amt = r[1].GetDouble();
                                        totDistributed += amt;
                                        sampleVal = amt;
                                    }
                                    else if (r.ValueKind == JsonValueKind.Object && r.TryGetProperty("hmnd", out var hProp))
                                    {
                                        var amt = hProp.GetDouble();
                                        totDistributed += amt;
                                        sampleVal = amt;
                                    }
                                }
                            }

                            history.Add(new PayoutBatchItemDto
                            {
                                Block = blk,
                                Timestamp = tsSec,
                                RecipientCount = count,
                                TotalDistributed = Math.Round(totDistributed, 2),
                                SamplePerValidator = Math.Round(sampleVal, 2)
                            });
                        }

                        if (history.Count > 0)
                        {
                            lastBatchRecipients = history[0].RecipientCount;
                            samplePerValidator = history[0].SamplePerValidator;
                        }
                    }
                }
            }
            catch
            {
                // Fallback to defaults
            }
        }

        var avgCost = history.Count > 0 ? (history.Sum(h => h.TotalDistributed) / history.Count) : 49000.0;
        var remainingRounds = Math.Round(currentBalance / Math.Max(1.0, avgCost), 1);
        var remainingDays = (int)Math.Round(remainingRounds * 14);
        var nextEstimatedTs = lastBatchTs + (14 * 86400);

        var incomingTransfers = new List<IncomingTransferItemDto>();
        double directInflowHmnd = 0;
        try
        {
            const string inSql = @"
                SELECT hash, block_number as Block, timestamp, signer, value_hmnd as Amount, pallet, method
                FROM substrate_extrinsics
                WHERE target = @addr
                ORDER BY block_number DESC";
            var inRows = (await connection.QueryAsync<dynamic>(inSql, new { addr = FeesPotPalletAddress })).ToList();
            foreach (var r in inRows)
            {
                double amt = r.Amount != null ? (double)r.Amount : 0.0;
                directInflowHmnd += amt;
                long ts = r.timestamp != null ? (long)r.timestamp : 0;
                incomingTransfers.Add(new IncomingTransferItemDto
                {
                    Hash = r.hash?.ToString() ?? "",
                    Block = r.Block != null ? (long)r.Block : 0,
                    Timestamp = ts > 100_000_000_000 ? ts / 1000 : ts,
                    Signer = r.signer?.ToString() ?? "",
                    Amount = Math.Round(amt, 2),
                    Pallet = r.pallet?.ToString() ?? "",
                    Method = r.method?.ToString() ?? "",
                    Type = "DIRECT_TRANSFER"
                });
            }
        }
        catch
        {
        }

        var genesisReserveHmnd = Math.Max(0.0, Math.Round(currentBalance - directInflowHmnd, 2));
        var totalInflowHmnd = Math.Round(burnedTotal + directInflowHmnd + genesisReserveHmnd, 2);

        return new FeesPotAnalyticsDto
        {
            FeesPotAddress = FeesPotPalletAddress,
            CurrentBalance = currentBalance,
            TotalBatches = totalBatches,
            BurnedTotal = burnedTotal,
            TotalInflowHmnd = totalInflowHmnd,
            DirectTransfersHmnd = Math.Round(directInflowHmnd, 2),
            GenesisReserveHmnd = genesisReserveHmnd,
            IncomingTransfers = incomingTransfers,
            RunwayRounds = remainingRounds,
            RunwayDays = remainingDays,
            LastBatch = new PayoutBatchSummaryDto
            {
                Block = lastBatchBlock,
                Timestamp = lastBatchTs,
                RecipientCount = lastBatchRecipients,
                SamplePerValidator = samplePerValidator
            },
            NextEstimatedTs = nextEstimatedTs,
            History = history
        };
    }
}
