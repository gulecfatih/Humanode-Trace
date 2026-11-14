using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class HodlersRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly SystemConfigRepository _configRepo;

    public HodlersRepository(SqliteConnectionFactory dbFactory, SystemConfigRepository configRepo)
    {
        _dbFactory = dbFactory;
        _configRepo = configRepo;
    }

    public async Task<object> GetHodlersAnalyticsAsync(HodlersQueryRequest request)
    {
        request ??= new HodlersQueryRequest();
        var safePage = Math.Max(1, request.Page);
        var safeLimit = Math.Clamp(request.Limit, 1, 200);
        var cleanQ = (request.Q ?? "").Trim().ToLower();
        var net = (request.Network ?? "all").Trim().ToLower();

        var circulatingSupply = await _configRepo.GetDoubleConfigAsync("circulating_supply_baseline");

        using var connection = _dbFactory.CreateConnection();

        // 1. Load balances
        var allRows = (await connection.QueryAsync<(string address, double balance_hmnd, long? updated_at)>(StoredProcedures.GetHodlerCacheBalances)).ToList();

        // 2. Load address labels
        var labelRows = (await connection.QueryAsync<(string address, string label, string category)>(StoredProcedures.GetHodlerAddressLabels)).ToList();

        // 3. Load cross-layer links
        var links = (await connection.QueryAsync<(string sub, string evm)>(StoredProcedures.GetHodlerCrossLayerLinks)).ToList();

        long subCount = 0;
        double subTotal = 0;
        long evmCount = 0;
        double evmTotal = 0;
        long crossCount = 0;

        var processed = new List<dynamic>(allRows.Count);

        for (int i = 0; i < allRows.Count; i++)
        {
            var row = allRows[i];
            var addr = row.address ?? "";
            bool isEvm = addr.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
            bool isSub = addr.StartsWith("hm", StringComparison.OrdinalIgnoreCase);
            string layer = isEvm ? "EVM" : (isSub ? "Substrate" : "Bilinmeyen");
            double balance = row.balance_hmnd;

            string? counterpart = null;
            if (isSub)
            {
                var match = links.FirstOrDefault(l => l.sub.Equals(addr, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrEmpty(match.evm)) counterpart = match.evm;
                subCount++;
                subTotal += balance;
            }
            else if (isEvm)
            {
                var match = links.FirstOrDefault(l => l.evm.Equals(addr, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrEmpty(match.sub)) counterpart = match.sub;
                evmCount++;
                evmTotal += balance;
            }

            if (!string.IsNullOrEmpty(counterpart))
            {
                crossCount++;
            }

            var labelMatch = labelRows.FirstOrDefault(l => l.address.Equals(addr, StringComparison.OrdinalIgnoreCase));
            string? lbl = !string.IsNullOrEmpty(labelMatch.address) ? labelMatch.label : null;
            string? cat = !string.IsNullOrEmpty(labelMatch.address) ? labelMatch.category : null;
            double sharePercent = Math.Round((balance / circulatingSupply) * 100.0, 4);

            processed.Add(new
            {
                rank = i + 1,
                address = addr,
                layer,
                balance_hmnd = Math.Round(balance, 2),
                share_percent = sharePercent,
                label = lbl,
                category = cat,
                counterpart,
                updated_at = row.updated_at
            });
        }

        var totalHolders = allRows.Count;
        var totalBalance = subTotal + evmTotal;
        var top1Share = processed.Count > 0 ? (double)processed[0].share_percent : 0;

        var kpis = new
        {
            total_holders = totalHolders,
            total_balance_hmnd = Math.Round(totalBalance, 2),
            substrate_holders = subCount,
            substrate_balance_hmnd = Math.Round(subTotal, 2),
            substrate_share_percent = Math.Round((subTotal / circulatingSupply) * 100.0, 2),
            evm_holders = evmCount,
            evm_balance_hmnd = Math.Round(evmTotal, 2),
            evm_share_percent = Math.Round((evmTotal / circulatingSupply) * 100.0, 2),
            cross_layer_matched = crossCount,
            top_holder_share = top1Share,
            circulating_supply = circulatingSupply
        };

        // Filter
        IEnumerable<dynamic> filtered = processed;
        if (net == "substrate")
        {
            filtered = filtered.Where(x => (string)x.layer == "Substrate");
        }
        else if (net == "evm")
        {
            filtered = filtered.Where(x => (string)x.layer == "EVM");
        }
        else if (net == "cross_layer")
        {
            filtered = filtered.Where(x => !string.IsNullOrEmpty((string?)x.counterpart));
        }

        if (!string.IsNullOrEmpty(cleanQ))
        {
            filtered = filtered.Where(x =>
            {
                string a = ((string)x.address).ToLower();
                string l = ((string?)x.label ?? "").ToLower();
                string c = ((string?)x.counterpart ?? "").ToLower();
                return a.Contains(cleanQ) || l.Contains(cleanQ) || c.Contains(cleanQ);
            });
        }

        var filteredList = filtered.ToList();
        var totalFiltered = filteredList.Count;
        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalFiltered / safeLimit));
        var paginated = filteredList.Skip((safePage - 1) * safeLimit).Take(safeLimit).ToList();

        return new
        {
            kpis,
            items = paginated,
            pagination = new
            {
                page = safePage,
                limit = safeLimit,
                totalCount = totalFiltered,
                totalPages
            }
        };
    }
}
