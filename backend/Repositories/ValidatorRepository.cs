using System.Data;
using System.Text.Json;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface IValidatorRepository
{
    Task<ValidatorHealthDto> GetValidatorHealthAsync();
    Task<object> GetValidatorEconomicsAsync(string address);
    void UpdateActiveAuthentications(Dictionary<string, long> activeAuth);
}

public class ValidatorRepository : IValidatorRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IConfiguration _config;
    private readonly IPriceRepository _priceRepo;
    private readonly string _payoutsPath;
    private Dictionary<string, long> _activeAuthentications = new(StringComparer.OrdinalIgnoreCase);

    public ValidatorRepository(IDbConnectionFactory dbFactory, IConfiguration config, IPriceRepository priceRepo)
    {
        _dbFactory = dbFactory;
        _config = config;
        _priceRepo = priceRepo;

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

    public void UpdateActiveAuthentications(Dictionary<string, long> activeAuth)
    {
        _activeAuthentications = activeAuth;
    }

    private Dictionary<string, (int count, double totalHmnd, long lastTs, double lastHmnd, long lastBlock)> LoadPayoutsIndex()
    {
        var dict = new Dictionary<string, (int, double, long, double, long)>(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(_payoutsPath)) return dict;

        try
        {
            var json = File.ReadAllText(_payoutsPath);
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
                                if (dict.TryGetValue(addr, out var existing))
                                {
                                    dict[addr] = (existing.Item1 + 1, existing.Item2 + hmnd, Math.Max(existing.Item3, tsSec), hmnd, blk);
                                }
                                else
                                {
                                    dict[addr] = (1, hmnd, tsSec, hmnd, blk);
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

        return dict;
    }

    public async Task<ValidatorHealthDto> GetValidatorHealthAsync()
    {
        using var connection = _dbFactory.CreateConnection();

        // 1. Current height timestamp
        var maxTs = await connection.ExecuteScalarAsync<long?>("SELECT MAX(timestamp) FROM substrate_extrinsics") ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var thirtyDaysBefore = maxTs - (30 * 86400);

        // 2. Total Registered Validators
        const string totalValSql = @"
            SELECT COUNT(DISTINCT signer)
            FROM substrate_extrinsics
            WHERE pallet = 'session' AND method = 'setKeys' AND signer > ''";
        var totalValidators = await connection.ExecuteScalarAsync<int>(totalValSql);

        // 3. Active in 30 days
        const string activeValSql = @"
            SELECT COUNT(DISTINCT addr) FROM (
                SELECT author_id as addr FROM blocks_with_tx WHERE timestamp >= @thirtyDaysBefore AND author_id > ''
                UNION
                SELECT signer as addr FROM substrate_extrinsics WHERE pallet IN ('session', 'bioauth') AND timestamp >= @thirtyDaysBefore AND signer > ''
            )";
        var activeValidators = await connection.ExecuteScalarAsync<int>(activeValSql, new { thirtyDaysBefore });

        // 4. Total Bioauth
        const string totalBioSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE pallet = 'bioauth' AND method = 'authenticate'";
        var totalBioauth = await connection.ExecuteScalarAsync<int>(totalBioSql);

        // 5. Total Heartbeats (imOnline)
        const string heartbeatsSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE pallet = 'imOnline'";
        var totalHeartbeats = await connection.ExecuteScalarAsync<int>(heartbeatsSql);

        // 6. Candidate Validators
        const string recentSql = @"
            WITH recent_activity AS (
                SELECT author_id AS address, MAX(timestamp) AS last_seen, COUNT(*) as recent_blocks
                FROM blocks_with_tx
                WHERE timestamp >= @thirtyDaysBefore AND author_id > ''
                GROUP BY author_id
                UNION ALL
                SELECT signer AS address, MAX(timestamp) AS last_seen, 0 as recent_blocks
                FROM substrate_extrinsics
                WHERE pallet IN ('bioauth', 'session') AND signer > '' AND timestamp >= @thirtyDaysBefore
                GROUP BY signer
            )
            SELECT
                address,
                MAX(last_seen) AS last_seen,
                SUM(recent_blocks) AS recent_blocks
            FROM recent_activity
            GROUP BY address
            ORDER BY last_seen DESC
            LIMIT 100";

        var candidates = (await connection.QueryAsync<(string address, long last_seen, int recent_blocks)>(recentSql, new { thirtyDaysBefore })).ToList();

        var payouts = LoadPayoutsIndex();
        var validatorItems = new List<ValidatorItemDto>();
        var nowWall = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        foreach (var c in candidates)
        {
            const string authSql = "SELECT COUNT(*) as c, MIN(timestamp) as min_ts, MAX(timestamp) as max_ts FROM blocks_with_tx WHERE author_id = @addr";
            var auth = await connection.QueryFirstOrDefaultAsync<(int c, long? min_ts, long? max_ts)>(authSql, new { addr = c.address });

            const string bioSql = "SELECT COUNT(*) as c, MAX(timestamp) as max_ts FROM substrate_extrinsics WHERE signer = @addr AND pallet = 'bioauth'";
            var bio = await connection.QueryFirstOrDefaultAsync<(int c, long? max_ts)>(bioSql, new { addr = c.address });

            const string sessSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @addr AND pallet = 'session'";
            var sessCount = await connection.ExecuteScalarAsync<int>(sessSql, new { addr = c.address });

            payouts.TryGetValue(c.address, out var pInfo);

            long? expiresAtSec = null;
            long? secondsLeft = null;
            if (_activeAuthentications.TryGetValue(c.address, out var exp))
            {
                expiresAtSec = exp;
                secondsLeft = Math.Max(0, exp - nowWall);
            }
            else if (bio.max_ts.HasValue && bio.max_ts.Value > 0)
            {
                expiresAtSec = bio.max_ts.Value + (168 * 3600);
                secondsLeft = Math.Max(0, expiresAtSec.Value - nowWall);
            }

            var isBioValid = secondsLeft.HasValue && secondsLeft.Value > 0;
            var isActive = isBioValid || c.last_seen >= thirtyDaysBefore;
            int epoch = isBioValid ? Math.Clamp(42 - (int)(secondsLeft!.Value / (4 * 3600)), 1, 42) : 0;
            double cadenceHours = c.recent_blocks > 1 ? Math.Round((30.0 * 24.0) / c.recent_blocks, 1) : 4.0;

            validatorItems.Add(new ValidatorItemDto
            {
                Address = c.address,
                IsActive = isActive,
                StatusLabel = isActive ? (isBioValid ? "Aktif (Doğrulanmış)" : "Aktif (Süre Doldu)") : "Pasif",
                BlocksAuthored = auth.c,
                RecentBlocks = c.recent_blocks,
                IsBioValid = isBioValid,
                TotalBioauth = bio.c,
                BioCurrentEpoch = epoch,
                TotalEarnedHmnd = Math.Round(pInfo.totalHmnd, 2),
                PayoutRounds = pInfo.count,
                LastPayoutHmnd = Math.Round(pInfo.lastHmnd, 2),
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
                BalanceHmnd = Math.Round(pInfo.totalHmnd, 2)
            });
        }

        return new ValidatorHealthDto
        {
            TotalValidators = totalValidators,
            ActiveValidators = activeValidators,
            OfflineCount = Math.Max(0, totalValidators - activeValidators),
            TotalBioauth = totalBioauth,
            TotalHeartbeats = totalHeartbeats,
            FeesPotAddress = "hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk",
            FeesPotBalanceHmnd = 403162.33,
            LastPayoutBlock = 20447782,
            LastPayoutTs = 1793211744,
            LastPayoutPerValidator = 613.48,
            EstRoundPerValidator = 613.48,
            Validators = validatorItems
        };
    }

    public async Task<object> GetValidatorEconomicsAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return new { isValidator = false };
        var clean = address.Trim();

        using var connection = _dbFactory.CreateConnection();

        const string authSql = "SELECT COUNT(*) as total_blocks, MIN(timestamp) as first_block_ts, MAX(timestamp) as last_block_ts FROM blocks_with_tx WHERE author_id = @clean";
        var blocks = await connection.QueryFirstOrDefaultAsync<(int total_blocks, long? first_block_ts, long? last_block_ts)>(authSql, new { clean });

        const string bioSql = "SELECT COUNT(*) as bio_count, MAX(timestamp) as last_bio_ts FROM substrate_extrinsics WHERE signer = @clean AND pallet = 'bioauth'";
        var bio = await connection.QueryFirstOrDefaultAsync<(int bio_count, long? last_bio_ts)>(bioSql, new { clean });

        var payouts = LoadPayoutsIndex();
        payouts.TryGetValue(clean, out var pInfo);

        if (blocks.total_blocks == 0 && bio.bio_count == 0 && pInfo.count == 0)
        {
            return new { isValidator = false, address = clean };
        }

        var thirtyDaysAgo = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (30 * 86400);
        const string recentSql = "SELECT COUNT(*) FROM blocks_with_tx WHERE author_id = @clean AND timestamp >= @thirtyDaysAgo";
        var recentBlocks = await connection.ExecuteScalarAsync<int>(recentSql, new { clean, thirtyDaysAgo });

        double cadenceHours = recentBlocks > 1 ? Math.Round((30.0 * 24.0) / recentBlocks, 1) : (blocks.total_blocks > 5 ? 12.0 : 24.0);
        int estMonthlyBlocks = cadenceHours > 0 ? (int)Math.Round((30.0 * 24.0) / cadenceHours) : 0;
        double estPerRoundHmnd = 595.0;
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
            cadenceText = $"~{cadenceHours} saatte 1 blok",
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
