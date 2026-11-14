using System.Data;
using System.Text.Json;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class ValidatorRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly SystemConfigRepository _configRepo;
    private readonly string _payoutsPath;
    private List<ActiveAuthDto> _activeAuthentications = new();

    public ValidatorRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _configRepo = configRepo;

        var configuredPath = "Data/validator_payouts.json";
        if (File.Exists(configuredPath))
            _payoutsPath = configuredPath;
        else if (File.Exists(Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json")))
            _payoutsPath = Path.Combine(AppContext.BaseDirectory, "Data", "validator_payouts.json");
        else if (File.Exists("../src/data/validator_payouts.json"))
            _payoutsPath = "../src/data/validator_payouts.json";
        else
            _payoutsPath = "Data/validator_payouts.json";
    }

    public void UpdateActiveAuthentications(List<ActiveAuthDto> activeAuth)
    {
        _activeAuthentications = activeAuth;
    }

    private async Task<List<ValidatorPayoutStatDto>> LoadPayoutsIndexAsync(IDbConnection connection)
    {
        var list = new List<ValidatorPayoutStatDto>();
        try
        {
            var rows = await connection.QueryAsync<(string validator_address, int cnt, double tot, long last_ts, double last_hmnd, long last_blk)>(StoredProcedures.GetValidatorPayoutsSummary);
            foreach (var r in rows)
            {
                list.Add(new ValidatorPayoutStatDto
                {
                    Address = r.validator_address,
                    Count = r.cnt,
                    TotalHmnd = r.tot,
                    LastTs = r.last_ts,
                    LastHmnd = r.last_hmnd,
                    LastBlock = r.last_blk
                });
            }

            if (list.Count > 0) return list;
        }
        catch
        {
            // Table may not exist or error, fallback to JSON
        }

        if (!File.Exists(_payoutsPath)) return list;

        try
        {
            var json = await File.ReadAllTextAsync(_payoutsPath);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("payouts", out var payoutsArr))
            {
                foreach (var b in payoutsArr.EnumerateArray())
                {
                    var blk = b.GetProperty("block").GetInt64();
                    var rawTs = b.GetProperty("ts").GetInt64();
                    var tsSec = rawTs > 100_000_000_000 ? rawTs / 1000 : rawTs;

                    if (b.TryGetProperty("recipients", out var recs))
                    {
                        foreach (var r in recs.EnumerateArray())
                        {
                            string addr = "";
                            double hmnd = 0;

                            if (r.ValueKind == JsonValueKind.Array && r.GetArrayLength() > 1)
                            {
                                addr = r[0].GetString() ?? "";
                                hmnd = r[1].GetDouble();
                            }
                            else if (r.ValueKind == JsonValueKind.Object)
                            {
                                if (r.TryGetProperty("address", out var aProp)) addr = aProp.GetString() ?? "";
                                if (r.TryGetProperty("hmnd", out var hProp)) hmnd = hProp.GetDouble();
                            }

                            if (!string.IsNullOrEmpty(addr))
                            {
                                var existing = list.FirstOrDefault(x => x.Address.Equals(addr, StringComparison.OrdinalIgnoreCase));
                                if (existing != null)
                                {
                                    existing.Count++;
                                    existing.TotalHmnd += hmnd;
                                    existing.LastTs = Math.Max(existing.LastTs, tsSec);
                                    existing.LastHmnd = hmnd;
                                    existing.LastBlock = blk;
                                }
                                else
                                {
                                    list.Add(new ValidatorPayoutStatDto
                                    {
                                        Address = addr,
                                        Count = 1,
                                        TotalHmnd = hmnd,
                                        LastTs = tsSec,
                                        LastHmnd = hmnd,
                                        LastBlock = blk
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        catch
        {
            // Ignore load errors
        }

        return list;
    }

    public async Task<ValidatorHealthDto> GetValidatorHealthAsync()
    {
        using var connection = _dbFactory.CreateConnection();

        // 1. Current height timestamp
        var maxTs = await connection.ExecuteScalarAsync<long?>(StoredProcedures.GetSubstrateMaxTimestamp) ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var thirtyDaysBefore = maxTs - (30 * 86400);

        // 2. Total Registered Validators
        var totalValidators = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetTotalRegisteredValidators);

        // 3. Active in 30 days
        var activeValidators = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetActiveValidators30d, new { thirtyDaysBefore });

        // 4. Total Bioauth
        var totalBioauth = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetTotalBioauthCount);

        // 5. Total Heartbeats (imOnline)
        var totalHeartbeats = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetTotalHeartbeatsCount);

        // 6. Candidate Validators
        var candidates = (await connection.QueryAsync<(string address, long last_seen, int recent_blocks)>(StoredProcedures.GetValidatorCandidateActivity, new { ThirtyDaysBefore = thirtyDaysBefore })).ToList();

        var payouts = await LoadPayoutsIndexAsync(connection);
        var validatorItems = new List<ValidatorItemDto>();
        var nowWall = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        foreach (var c in candidates)
        {
            var auth = await connection.QueryFirstOrDefaultAsync<(int c, long? min_ts, long? max_ts)>(StoredProcedures.GetValidatorAuthorStats, new { Clean = c.address });
            var bio = await connection.QueryFirstOrDefaultAsync<(int c, long? max_ts)>(StoredProcedures.GetValidatorBioStats, new { Clean = c.address });
            var sessCount = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetValidatorSessionCount, new { Clean = c.address });

            var pInfo = payouts.FirstOrDefault(p => p.Address.Equals(c.address, StringComparison.OrdinalIgnoreCase));

            long? expiresAtSec = null;
            long? secondsLeft = null;
            var exp = _activeAuthentications.FirstOrDefault(a => a.Address.Equals(c.address, StringComparison.OrdinalIgnoreCase));
            if (exp != null)
            {
                expiresAtSec = exp.ExpiresAt;
                secondsLeft = Math.Max(0, exp.ExpiresAt - nowWall);
            }
            else if (bio.max_ts.HasValue && bio.max_ts.Value > 0)
            {
                expiresAtSec = bio.max_ts.Value + (168 * 3600);
                secondsLeft = Math.Max(0, expiresAtSec.Value - nowWall);
            }

            var isBioValid = secondsLeft.HasValue && secondsLeft.Value > 0;
            var isActive = isBioValid || c.last_seen >= thirtyDaysBefore;
            int epoch = isBioValid ? Math.Clamp(42 - (int)(secondsLeft!.Value / (4 * 3600)), 1, 42) : 0;
            double cadenceHours = c.recent_blocks > 1 ? Math.Round((30.0 * 24.0) / c.recent_blocks, 1) : 0.0;

            validatorItems.Add(new ValidatorItemDto
            {
                Address = c.address,
                IsActive = isActive,
                StatusLabel = isActive ? (isBioValid ? "active_verified" : "active_expired") : "passive",
                BlocksAuthored = auth.c,
                RecentBlocks = c.recent_blocks,
                IsBioValid = isBioValid,
                TotalBioauth = bio.c,
                BioCurrentEpoch = epoch,
                TotalEarnedHmnd = Math.Round(pInfo?.TotalHmnd ?? 0, 2),
                PayoutRounds = pInfo?.Count ?? 0,
                LastPayoutHmnd = Math.Round(pInfo?.LastHmnd ?? 0, 2),
                CadenceHours = cadenceHours,
                LastSeen = c.last_seen,
                LastAuthoredBlock = null,
                LastAuthoredTs = auth.max_ts,
                LastHeartbeatTs = null,
                LastBioauthTs = bio.max_ts,
                ExpiresAtSec = expiresAtSec,
                SecondsLeft = secondsLeft,
                KeyUpdates = sessCount,
                TotalOps = auth.c + bio.c + sessCount,
                BalanceHmnd = Math.Round(pInfo?.TotalHmnd ?? 0, 2)
            });
        }

        long lastPayoutBlock = 0;
        long lastPayoutTs = 0;
        double lastPayoutPerValidator = 0.0;
        try
        {
            var lp = await connection.QueryFirstOrDefaultAsync<(long block_number, long timestamp, double avg_amt)?>(StoredProcedures.GetLatestPayoutBatch);
            if (lp.HasValue && lp.Value.block_number > 0)
            {
                lastPayoutBlock = lp.Value.block_number;
                lastPayoutTs = lp.Value.timestamp;
                lastPayoutPerValidator = Math.Round(lp.Value.avg_amt, 2);
            }
        }
        catch { }

        double feesPotBalance = await _configRepo.GetDoubleConfigAsync("fees_pot_baseline");
        try
        {
            var potBal = await connection.ExecuteScalarAsync<double?>(StoredProcedures.GetFeesPotBalance);
            if (potBal.HasValue && potBal.Value > 0) feesPotBalance = potBal.Value;
        }
        catch { }

        return new ValidatorHealthDto
        {
            TotalValidators = totalValidators,
            ActiveValidators = activeValidators,
            OfflineCount = Math.Max(0, totalValidators - activeValidators),
            TotalBioauth = totalBioauth,
            TotalHeartbeats = totalHeartbeats,
            FeesPotAddress = await _configRepo.GetConfigAsync("fees_pot_address"),
            FeesPotBalanceHmnd = feesPotBalance,
            LastPayoutBlock = lastPayoutBlock,
            LastPayoutTs = lastPayoutTs,
            LastPayoutPerValidator = lastPayoutPerValidator,
            EstRoundPerValidator = lastPayoutPerValidator,
            Validators = validatorItems
        };
    }

    public async Task<object> GetValidatorEconomicsAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return new { isValidator = false };
        var clean = address.Trim();

        using var connection = _dbFactory.CreateConnection();

        var blocks = await connection.QueryFirstOrDefaultAsync<(int total_blocks, long? first_block_ts, long? last_block_ts)>(StoredProcedures.GetValidatorAuthorStats, new { Clean = clean });
        var bio = await connection.QueryFirstOrDefaultAsync<(int bio_count, long? last_bio_ts)>(StoredProcedures.GetValidatorBioStats, new { Clean = clean });

        (int count, double totalHmnd, long lastTs, double lastHmnd, long lastBlock) pInfo = default;
        try
        {
            pInfo = await connection.QueryFirstOrDefaultAsync<(int, double, long, double, long)>(StoredProcedures.GetValidatorEconomicsSingle, new { Clean = clean });
        }
        catch
        {
            var payouts = await LoadPayoutsIndexAsync(connection);
            var match = payouts.FirstOrDefault(p => p.Address.Equals(clean, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                pInfo = (match.Count, match.TotalHmnd, match.LastTs, match.LastHmnd, match.LastBlock);
            }
        }

        if (blocks.total_blocks == 0 && bio.bio_count == 0 && pInfo.count == 0)
        {
            return new { isValidator = false, address = clean };
        }

        var thirtyDaysAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (30 * 86400);
        var recentBlocks = await connection.ExecuteScalarAsync<int>(StoredProcedures.GetValidatorRecentBlocksCount, new { Clean = clean, ThirtyDaysAgo = thirtyDaysAgo });

        double cadenceHours = recentBlocks > 1 ? Math.Round((30.0 * 24.0) / recentBlocks, 1) : 0.0;
        int estMonthlyBlocks = cadenceHours > 0 ? (int)Math.Round((30.0 * 24.0) / cadenceHours) : 0;
        double estPerRoundHmnd = 0.0;
        try
        {
            var lp = await connection.QueryFirstOrDefaultAsync<(long block_number, long timestamp, double avg_amt)?>(StoredProcedures.GetLatestPayoutBatch);
            if (lp.HasValue && lp.Value.avg_amt > 0) estPerRoundHmnd = Math.Round(lp.Value.avg_amt, 2);
        }
        catch { }
        double estMonthlyHmnd = estPerRoundHmnd * 2.0;
        double currentPriceUsd = await _priceRepo.GetLatestPriceAsync();
        double estMonthlyUsd = Math.Round(estMonthlyHmnd * currentPriceUsd, 2);
        double totalEarnedHmnd = Math.Round(pInfo.totalHmnd, 2);

        return new
        {
            isValidator = true,
            address = clean,
            totalBlocks = blocks.total_blocks,
            bioCount = bio.bio_count,
            payoutRounds = pInfo.count,
            firstBlockTs = blocks.first_block_ts ?? 0,
            lastBlockTs = blocks.last_block_ts ?? 0,
            lastBioauthTs = bio.last_bio_ts ?? 0,
            cadenceHours,
            cadenceKey = "validators_cadence_desc",
            economics = new
            {
                estMonthlyBlocks,
                estPerRoundHmnd,
                estMonthlyHmnd,
                estMonthlyUsd,
                currentPriceUsd,
                payoutRounds = pInfo.count,
                lastPayoutHmnd = Math.Round(pInfo.lastHmnd, 2),
                lastPayoutTs = pInfo.lastTs,
                estimatedTotalEarnedHmnd = totalEarnedHmnd,
                estimatedTotalEarnedUsd = Math.Round(totalEarnedHmnd * currentPriceUsd, 2)
            }
        };
    }
}
