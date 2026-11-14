using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;
using System.Text.Json;

namespace HumanodeTracker.Repositories;

public class BiomapperRepository
{
    private readonly SqliteConnectionFactory _dbFactory;

    public BiomapperRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    private async Task<List<BiomapperChainDto>> GetChainsAsync(System.Data.IDbConnection conn)
    {
        var rows = await conn.QueryAsync<dynamic>(StoredProcedures.GetBiomapperChains);
        var list = new List<BiomapperChainDto>();
        foreach (var r in rows)
        {
            var features = new List<string>();
            try
            {
                if (r.FeaturesJson != null)
                {
                    features = JsonSerializer.Deserialize<List<string>>((string)r.FeaturesJson) ?? new();
                }
            }
            catch { }

            list.Add(new BiomapperChainDto
            {
                Id = r.Id,
                Name = r.Name,
                ShortName = r.ShortName,
                ChainId = (int)r.ChainId,
                Type = r.Type,
                Category = r.Category,
                ContractAddress = r.ContractAddress,
                ExplorerName = r.ExplorerName,
                ExplorerUrl = r.ExplorerUrl,
                Status = r.Status,
                IconColor = r.IconColor,
                GenerationsSupported = r.GenerationsSupported,
                SdkInterface = r.SdkInterface,
                Features = features
            });
        }
        return list;
    }

    public async Task<BiomapperResponseDto> GetBiomapperAnalyticsAsync(BiomapperQueryRequest req)
    {
        req ??= new BiomapperQueryRequest();
        using var conn = _dbFactory.CreateConnection();
        var safePage = Math.Max(1, req.Page);
        var safeLimit = Math.Clamp(req.Limit, 1, 100);
        var cleanQ = (req.Q ?? "").Trim().ToLowerInvariant();
        var cat = (req.NetworkType ?? "all").Trim().ToLowerInvariant();
        var feedNet = (req.FeedNetwork ?? "all").Trim().ToLowerInvariant();

        // 1. Total Bioauth Operations
        var totalBioauth = await conn.ExecuteScalarAsync<long>(StoredProcedures.GetBioauthPalletCount);

        // 2. Active human validators
        var thirtyDaysBefore = DateTimeOffset.UtcNow.ToUnixTimeSeconds() - (30 * 86400);
        var activeValidators = await conn.ExecuteScalarAsync<int>(StoredProcedures.GetActiveValidators30d, new { thirtyDaysBefore });

        // 3. Cross layer matched count
        int crossMatched = 0;
        try
        {
            crossMatched = await conn.ExecuteScalarAsync<int>(StoredProcedures.GetCrossLayerLinksCount);
        }
        catch { }

        var allChains = await GetChainsAsync(conn);

        var kpis = new BiomapperKpisDto
        {
            TotalSupportedChains = allChains.Count,
            TotalBioauthOperations = totalBioauth,
            ActiveHumanValidators = activeValidators,
            ActiveGeneration = 4,
            ActiveGenerationLabel = "biomapper_activeGenLabel",
            CrossLayerMatchedWallets = crossMatched,
            PrivacyEngine = "biomapper_cvmEnclave",
            SecurityStandard = "biomapper_securityStandard"
        };

        // 4. Filter chains
        var filteredChains = allChains.AsEnumerable();
        if (cat != "all")
        {
            filteredChains = filteredChains.Where(c => c.Category.Equals(cat, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(cleanQ))
        {
            filteredChains = filteredChains.Where(c =>
                c.Name.ToLowerInvariant().Contains(cleanQ) ||
                c.ShortName.ToLowerInvariant().Contains(cleanQ) ||
                c.ContractAddress.ToLowerInvariant().Contains(cleanQ) ||
                c.ChainId.ToString().Contains(cleanQ) ||
                c.Type.ToLowerInvariant().Contains(cleanQ));
        }
        var chainsList = filteredChains.ToList();

        // 5. Bioauth Extrinsics Feed
        var whereBio = "WHERE b.pallet = 'bioauth'";
        var param = new DynamicParameters();
        if (!string.IsNullOrWhiteSpace(cleanQ))
        {
            whereBio += " AND (b.signer LIKE @q OR b.hash LIKE @q OR CAST(b.block_number AS TEXT) LIKE @q OR c.evm_address LIKE @q)";
            param.Add("q", "%" + cleanQ + "%");
        }

        if (feedNet == "cross_layer")
        {
            whereBio += " AND c.evm_address IS NOT NULL";
        }

        var countSql = $"{StoredProcedures.GetBioauthFeedCountBase} {whereBio}";

        var totalBioFiltered = await conn.ExecuteScalarAsync<long>(countSql, param);
        var totalBioPages = (int)Math.Ceiling((double)totalBioFiltered / safeLimit);
        if (totalBioPages < 1) totalBioPages = 1;
        var offset = (safePage - 1) * safeLimit;

        param.Add("limit", safeLimit);
        param.Add("offset", offset);

        var feedSql = string.Format(StoredProcedures.GetBioauthFeedBase, whereBio);

        var items = (await conn.QueryAsync<BioauthFeedItemDto>(feedSql, param)).ToList();

        return new BiomapperResponseDto
        {
            Kpis = kpis,
            Chains = chainsList,
            TotalChainsCount = chainsList.Count,
            BioauthFeed = new BioauthFeedDto
            {
                Items = items,
                Pagination = new PaginationDto
                {
                    Page = safePage,
                    Limit = safeLimit,
                    TotalCount = totalBioFiltered,
                    TotalPages = totalBioPages,
                    HasNextPage = safePage < totalBioPages,
                    HasPrevPage = safePage > 1
                }
            }
        };
    }
}
