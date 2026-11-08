using System.Data;
using Dapper;
using HumanodeTracker.Data;

namespace HumanodeTracker.Repositories;

public interface IHodlersRepository
{
    Task<object> GetHodlersAnalyticsAsync(string network = "all", int page = 1, int limit = 50, string q = "");
}

public class HodlersRepository : IHodlersRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public HodlersRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<object> GetHodlersAnalyticsAsync(string network = "all", int page = 1, int limit = 50, string q = "")
    {
        var safePage = Math.Max(1, page);
        var safeLimit = Math.Clamp(limit, 1, 200);
        var cleanQ = (q ?? "").Trim().ToLower();
        var net = (network ?? "all").Trim().ToLower();

        const double circulatingSupply = 285970432.10;

        using var connection = _dbFactory.CreateConnection();

        // 1. Load balances
        const string balanceSql = @"
            SELECT address, balance_hmnd, updated_at
            FROM wallet_balances_cache
            WHERE balance_hmnd > 0
            ORDER BY balance_hmnd DESC";
        var allRows = (await connection.QueryAsync<(string address, double balance_hmnd, long? updated_at)>(balanceSql)).ToList();

        // 2. Load address labels
        const string labelsSql = "SELECT address, label, category FROM address_labels";
        var labelRows = await connection.QueryAsync<(string address, string label, string category)>(labelsSql);
        var labelsMap = new Dictionary<string, (string label, string category)>(StringComparer.OrdinalIgnoreCase);
        foreach (var l in labelRows)
        {
            if (!string.IsNullOrEmpty(l.address))
                labelsMap[l.address] = (l.label, l.category);
        }

        // 3. Load cross-layer links
        const string linksSql = "SELECT substrate_address, evm_address FROM cross_layer_links";
        var links = await connection.QueryAsync<(string sub, string evm)>(linksSql);
        var subToEvmMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var evmToSubMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var link in links)
        {
            if (!string.IsNullOrEmpty(link.sub) && !string.IsNullOrEmpty(link.evm))
            {
                subToEvmMap[link.sub] = link.evm;
                evmToSubMap[link.evm] = link.sub;
            }
        }

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
                subToEvmMap.TryGetValue(addr, out counterpart);
                subCount++;
                subTotal += balance;
            }
            else if (isEvm)
            {
                evmToSubMap.TryGetValue(addr, out counterpart);
                evmCount++;
                evmTotal += balance;
            }

            if (!string.IsNullOrEmpty(counterpart))
            {
                crossCount++;
            }

            labelsMap.TryGetValue(addr, out var labelInfo);
            double sharePercent = Math.Round((balance / circulatingSupply) * 100.0, 4);

            processed.Add(new
            {
                rank = i + 1,
                address = addr,
                layer,
                balance_hmnd = Math.Round(balance, 2),
                share_percent = sharePercent,
                label = labelInfo.label,
                category = labelInfo.category,
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
