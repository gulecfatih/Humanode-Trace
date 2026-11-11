using System.Data;
using System.Text;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;
using HumanodeTracker.Services;

namespace HumanodeTracker.Repositories;

public interface IWalletRepository
{
    Task<object?> GetAddressSummaryAsync(string address);
    Task<object> GetWalletLedgerAnalyticsAsync(string address, int ledgerPage = 1, int ledgerLimit = 50, string ledgerFlow = "all", bool hideBioauth = true);
    Task<string> ExportWalletLedgerCsvAsync(string address, string flow = "all");
    Task<object> GetCrossLayerIdentityAsync(string address);
    Task<object> CompareWalletsAsync(string walletA, string walletB);
    Task<object> GetWalletPersonaAsync(string address);
    Task<object> GetMultiHopMoneyTrailAsync(string address, int depth = 2, int limitPerNode = 4);
}

public class WalletRepository : IWalletRepository
{
    private readonly IDbConnectionFactory _dbFactory;
    private readonly IPriceRepository _priceRepo;
    private readonly IHumanodeSidecarClient _sidecarClient;

    public WalletRepository(IDbConnectionFactory dbFactory, IPriceRepository priceRepo, IHumanodeSidecarClient sidecarClient)
    {
        _dbFactory = dbFactory;
        _priceRepo = priceRepo;
        _sidecarClient = sidecarClient;
    }

    public async Task<object?> GetAddressSummaryAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;
        var clean = address.Trim();
        var isEvm = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
        var isSub = clean.StartsWith("hm", StringComparison.OrdinalIgnoreCase);

        using var connection = _dbFactory.CreateConnection();

        long sentCount = 0; double sentFee = 0; double sentVol = 0;
        long recvCount = 0; double recvVol = 0;
        long authoredCount = 0;
        long bioauthCount = 0;

        if (isEvm)
        {
            var lower = clean.ToLowerInvariant();
            const string evmSentSql = "SELECT COUNT(*) as c, COALESCE(SUM(fee_hmnd), 0) as f, COALESCE(SUM(value_hmnd), 0) as v FROM transactions WHERE LOWER(from_address) = @lower";
            var s = await connection.QueryFirstOrDefaultAsync<(long c, double f, double v)>(evmSentSql, new { lower });
            sentCount = s.c; sentFee = s.f; sentVol = s.v;

            const string evmRecvSql = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as v FROM transactions WHERE LOWER(to_address) = @lower";
            var r = await connection.QueryFirstOrDefaultAsync<(long c, double v)>(evmRecvSql, new { lower });
            recvCount = r.c; recvVol = r.v;
        }

        if (isSub)
        {
            const string subSignedSql = "SELECT COUNT(*) as c, COALESCE(SUM(fee_hmnd), 0) as f, COALESCE(SUM(value_hmnd), 0) as v FROM substrate_extrinsics WHERE signer = @clean";
            var s = await connection.QueryFirstOrDefaultAsync<(long c, double f, double v)>(subSignedSql, new { clean });
            sentCount = s.c; sentFee = s.f; sentVol = s.v;

            const string subTargetSql = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as v FROM substrate_extrinsics WHERE target = @clean";
            var r = await connection.QueryFirstOrDefaultAsync<(long c, double v)>(subTargetSql, new { clean });
            recvCount = r.c; recvVol = r.v;

            const string authSql = "SELECT COUNT(*) FROM blocks_with_tx WHERE author_id = @clean";
            authoredCount = await connection.ExecuteScalarAsync<long>(authSql, new { clean });

            const string bioSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @clean AND pallet = 'bioauth'";
            bioauthCount = await connection.ExecuteScalarAsync<long>(bioSql, new { clean });
        }

        const string cacheSql = "SELECT balance_hmnd FROM wallet_balances_cache WHERE LOWER(address) = LOWER(@clean)";
        var liveBal = await connection.QueryFirstOrDefaultAsync<double?>(cacheSql, new { clean });

        if (!liveBal.HasValue)
        {
            try
            {
                var onChainBal = await _sidecarClient.GetAccountBalanceAsync(clean);
                if (onChainBal.HasValue)
                {
                    liveBal = onChainBal.Value;
                    var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    await connection.ExecuteAsync(
                        "INSERT OR REPLACE INTO wallet_balances_cache (address, balance_hmnd, updated_at) VALUES (@clean, @liveBal, @now)",
                        new { clean, liveBal = liveBal.Value, now });
                }
            }
            catch { }
        }

        var totalIn = Math.Round(recvVol, 4);
        var totalOut = Math.Round(sentVol, 4);
        var totalFees = Math.Round(sentFee, 6);
        var netBalance = liveBal ?? Math.Max(0, Math.Round(totalIn - totalOut - totalFees, 4));
        var priceUsd = await _priceRepo.GetLatestPriceAsync();
        var valueUsd = Math.Round(netBalance * priceUsd, 2);

        var isValidator = authoredCount > 0 || bioauthCount > 0;
        var crossLayer = await GetCrossLayerIdentityAsync(clean);

        var totalHmndTxs = isEvm ? (sentCount + recvCount) : (sentCount + recvCount);
        var (tokenList, totalPortfolioUsd) = await GetWalletTokensAsync(connection, clean, netBalance, priceUsd, totalIn, totalOut, totalHmndTxs);

        return new
        {
            address = clean,
            isEvm,
            isSubstrate = isSub,
            netBalanceHmnd = netBalance,
            valueUsd,
            priceUsd,
            totalPortfolioUsd,
            netBalanceCurrentUsd = totalPortfolioUsd,
            tokens = tokenList,
            totalVolumeIn = totalIn,
            totalVolumeOut = totalOut,
            totalFeesPaid = totalFees,
            isValidator,
            validatorStats = new
            {
                blocksAuthored = authoredCount,
                bioauthCount
            },
            crossLayer,
            evm = new
            {
                sentCount,
                receivedCount = recvCount,
                feesSpent = totalFees,
                volumeSent = totalOut,
                volumeReceived = totalIn
            },
            substrate = new
            {
                signedCount = sentCount,
                targetCount = recvCount,
                feesSpent = totalFees,
                volumeTransferred = totalOut,
                volumeReceived = totalIn
            }
        };
    }

    private async Task<(List<object> tokens, double totalPortfolioUsd)> GetWalletTokensAsync(
        IDbConnection connection, 
        string address, 
        double netBalanceHmnd, 
        double priceUsd,
        double hmndIn = 0,
        double hmndOut = 0,
        long hmndTxs = 0)
    {
        var cleanLower = address.Trim().ToLowerInvariant();
        var isEvm = cleanLower.StartsWith("0x");

        var tokenList = new List<object>();

        if (netBalanceHmnd > 0.000001 || !isEvm)
        {
            tokenList.Add(new
            {
                address = "NATIVE",
                token_address = "NATIVE",
                symbol = "HMND",
                name = "Humanode Yerel Kripto Para (Native)",
                balance = Math.Round(netBalanceHmnd, 4),
                netBalance = Math.Round(netBalanceHmnd, 4),
                totalIn = Math.Round(hmndIn, 4),
                totalInflow = Math.Round(hmndIn, 4),
                totalOut = Math.Round(hmndOut, 4),
                totalOutflow = Math.Round(hmndOut, 4),
                usd_value = Math.Round(netBalanceHmnd * priceUsd, 2),
                valueUsd = Math.Round(netBalanceHmnd * priceUsd, 2),
                price_usd = priceUsd,
                priceUsd = priceUsd,
                txCount = hmndTxs,
                transferCount = hmndTxs,
                transfer_count = hmndTxs,
                transfers_count = hmndTxs,
                isNative = true,
                category = "Yerel Kripto Para (Native)",
                color = "#38bdf8"
            });
        }

        double portfolioUsd = Math.Round(netBalanceHmnd * priceUsd, 2);

        string? evmTarget = isEvm ? cleanLower : null;
        if (!isEvm)
        {
            try
            {
                evmTarget = await connection.QueryFirstOrDefaultAsync<string>(
                    "SELECT evm_address FROM cross_layer_links WHERE substrate_address = @address LIMIT 1",
                    new { address = address.Trim() });
                if (!string.IsNullOrEmpty(evmTarget)) evmTarget = evmTarget.ToLowerInvariant();
            }
            catch { }
        }

        if (!string.IsNullOrEmpty(evmTarget))
        {
            const string tokenSql = @"
                SELECT 
                    tt.token_address as TokenAddress,
                    COALESCE(tc.symbol, tt.token_symbol, 'TOKEN') as Symbol,
                    COALESCE(tc.name, tt.token_symbol, 'ERC-20 Token') as Name,
                    COALESCE(tc.decimals, 18) as Decimals,
                    COALESCE(SUM(CASE WHEN LOWER(tt.to_address) = @evmTarget THEN tt.amount ELSE 0 END), 0) as TotalIn,
                    COALESCE(SUM(CASE WHEN LOWER(tt.from_address) = @evmTarget THEN tt.amount ELSE 0 END), 0) as TotalOut,
                    COUNT(*) as TransferCount
                FROM token_transfers tt
                LEFT JOIN tokens_cache tc ON LOWER(tc.address) = LOWER(tt.token_address)
                WHERE LOWER(tt.from_address) = @evmTarget OR LOWER(tt.to_address) = @evmTarget
                GROUP BY tt.token_address
                ORDER BY TotalIn DESC";

            var rows = (await connection.QueryAsync<dynamic>(tokenSql, new { evmTarget })).ToList();
            foreach (var r in rows)
            {
                string tokenAddr = r.TokenAddress ?? "";
                string symbol = r.Symbol ?? "TOKEN";
                string name = r.Name ?? "ERC-20 Token";
                int decimals = (int)(r.Decimals ?? 18);
                double totalIn = (double)r.TotalIn;
                double totalOut = (double)r.TotalOut;
                long transferCount = (long)r.TransferCount;

                double rawNet = totalIn - totalOut;
                double net = Math.Round(Math.Max(0, rawNet), 4);

                // For wrapped token 0x802 or active ERC20 tokens, query live on-chain balance via RPC
                if (!string.IsNullOrEmpty(tokenAddr) && !string.IsNullOrEmpty(evmTarget))
                {
                    try
                    {
                        var liveTokenBal = await _sidecarClient.GetErc20BalanceAsync(tokenAddr, evmTarget, decimals);
                        if (liveTokenBal.HasValue)
                        {
                            net = liveTokenBal.Value;
                        }
                    }
                    catch { }
                }

                // If balance is 0 or negligible, do not show in wallet assets list (wallet does not hold it)
                if (net <= 0.000001)
                {
                    continue;
                }

                double tokenPrice = 0.0;
                string category = "ERC-20 Akıllı Sözleşme";
                string color = "violet";

                var symUpper = symbol.ToUpperInvariant();
                if (symUpper is "USDC" or "USDT")
                {
                    tokenPrice = 1.0;
                    category = "Sabit Kripto (Stablecoin)";
                    color = "blue";
                }
                else if (symUpper.Contains("HMND"))
                {
                    tokenPrice = priceUsd;
                    category = "Wrapped Native Token";
                    color = "teal";
                }
                else if (symUpper is "WETH" or "ETH")
                {
                    tokenPrice = 2800.0;
                    category = "Wrapped Ether";
                    color = "indigo";
                }
                else if (symUpper is "WBTC" or "BTC")
                {
                    tokenPrice = 68000.0;
                    category = "Wrapped Bitcoin";
                    color = "orange";
                }
                else
                {
                    tokenPrice = 0.0;
                    color = "grape";
                }

                double valUsd = Math.Round(net * tokenPrice, 2);
                portfolioUsd += valUsd;

                tokenList.Add(new
                {
                    address = tokenAddr,
                    token_address = tokenAddr,
                    symbol,
                    name,
                    balance = net,
                    netBalance = net,
                    totalIn = Math.Round(totalIn, 4),
                    totalInflow = Math.Round(totalIn, 4),
                    totalOut = Math.Round(totalOut, 4),
                    totalOutflow = Math.Round(totalOut, 4),
                    usd_value = valUsd,
                    valueUsd = valUsd,
                    price_usd = tokenPrice,
                    priceUsd = tokenPrice,
                    txCount = transferCount,
                    transferCount = transferCount,
                    transfer_count = transferCount,
                    transfers_count = transferCount,
                    isNative = false,
                    category,
                    color
                });
            }
        }

        return (tokenList, Math.Round(portfolioUsd, 2));
    }

    public async Task<object> GetWalletLedgerAnalyticsAsync(string address, int ledgerPage = 1, int ledgerLimit = 50, string ledgerFlow = "all", bool hideBioauth = true)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return new { found = false, error = "Cüzdan adresi girilmelidir." };
        }
        var clean = address.Trim();
        var isEvm = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);

        using var connection = _dbFactory.CreateConnection();
        var summary = await GetAddressSummaryAsync(clean);

        const int safeLimit = 50;
        var safePage = Math.Max(1, ledgerPage);
        var offset = (safePage - 1) * safeLimit;

        // Fetch recent ledger activities for this address
        var activities = new List<object>();
        long totalCount = 0;

        if (isEvm)
        {
            var lower = clean.ToLowerInvariant();
            const string countSql = "SELECT COUNT(*) FROM transactions WHERE LOWER(from_address) = @lower OR LOWER(to_address) = @lower";
            totalCount = await connection.ExecuteScalarAsync<long>(countSql, new { lower });

            const string listSql = @"
                SELECT
                    'EVM' as Layer,
                    hash as Hash,
                    block_number as BlockNumber,
                    timestamp as Timestamp,
                    from_address as FromAddress,
                    to_address as ToAddress,
                    value_hmnd as ValueHmnd,
                    fee_hmnd as FeeHmnd,
                    status as Status,
                    'Ethereum' as Pallet,
                    'transact' as Method
                FROM transactions
                WHERE LOWER(from_address) = @lower OR LOWER(to_address) = @lower
                ORDER BY timestamp DESC
                LIMIT @safeLimit OFFSET @offset";

            var rows = (await connection.QueryAsync<TransactionDto>(listSql, new { lower, safeLimit, offset })).ToList();
            foreach (var r in rows)
            {
                var isIncoming = r.ToAddress.Equals(clean, StringComparison.OrdinalIgnoreCase);
                activities.Add(new
                {
                    layer = "EVM",
                    hash = r.Hash,
                    block_number = r.BlockNumber,
                    timestamp = r.Timestamp,
                    direction = isIncoming ? "in" : "out",
                    counterparty = isIncoming ? r.FromAddress : r.ToAddress,
                    amount_hmnd = r.ValueHmnd,
                    fee_hmnd = isIncoming ? 0 : r.FeeHmnd,
                    pallet = r.Pallet,
                    method = r.Method
                });
            }
        }
        else
        {
            const string countSql = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @clean OR target = @clean";
            totalCount = await connection.ExecuteScalarAsync<long>(countSql, new { clean });

            const string listSql = @"
                SELECT
                    'SUBSTRATE' as Layer,
                    hash as Hash,
                    block_number as BlockNumber,
                    timestamp as Timestamp,
                    signer as FromAddress,
                    target as ToAddress,
                    value_hmnd as ValueHmnd,
                    fee_hmnd as FeeHmnd,
                    status as Status,
                    pallet as Pallet,
                    method as Method
                FROM substrate_extrinsics
                WHERE signer = @clean OR target = @clean
                ORDER BY timestamp DESC
                LIMIT @safeLimit OFFSET @offset";

            var rows = (await connection.QueryAsync<TransactionDto>(listSql, new { clean, safeLimit, offset })).ToList();
            foreach (var r in rows)
            {
                var isIncoming = r.ToAddress.Equals(clean, StringComparison.OrdinalIgnoreCase);
                activities.Add(new
                {
                    layer = "SUBSTRATE",
                    hash = r.Hash,
                    block_number = r.BlockNumber,
                    timestamp = r.Timestamp,
                    direction = isIncoming ? "in" : "out",
                    counterparty = isIncoming ? r.FromAddress : r.ToAddress,
                    amount_hmnd = r.ValueHmnd,
                    fee_hmnd = isIncoming ? 0 : r.FeeHmnd,
                    pallet = r.Pallet,
                    method = r.Method
                });
            }
        }

        return new
        {
            found = true,
            address = clean,
            addressType = isEvm ? "EVM" : "SUBSTRATE",
            summary,
            tokens = (summary as dynamic)?.tokens ?? new List<object>(),
            ledger = activities,
            pagination = new
            {
                page = safePage,
                limit = safeLimit,
                totalCount,
                totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit))
            }
        };
    }

    public async Task<string> ExportWalletLedgerCsvAsync(string address, string flow = "all")
    {
        var result = await GetWalletLedgerAnalyticsAsync(address, 1, 200, flow);
        var sb = new StringBuilder();
        sb.AppendLine("Address,Layer,BlockNumber,Timestamp,Direction,Counterparty,Amount_HMND,Fee_HMND,Hash");
        return sb.ToString();
    }

    public async Task<object> GetCrossLayerIdentityAsync(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return new { hasLink = false, linkedAddresses = new List<object>() };
        }
        var clean = address.Trim();
        var isEvm = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
        var isSub = clean.StartsWith("hm", StringComparison.OrdinalIgnoreCase);

        using var connection = _dbFactory.CreateConnection();
        string sql = isSub
            ? "SELECT * FROM cross_layer_links WHERE substrate_address = @clean ORDER BY total_swapped_hmnd DESC"
            : "SELECT * FROM cross_layer_links WHERE LOWER(evm_address) = LOWER(@clean) ORDER BY total_swapped_hmnd DESC";

        var rows = (await connection.QueryAsync<dynamic>(sql, new { clean })).ToList();
        if (rows.Count == 0)
        {
            return new
            {
                hasLink = false,
                address = clean,
                isSubstrate = isSub,
                isEvm,
                linkedAddresses = new List<object>()
            };
        }

        var linked = new List<object>();
        foreach (var r in rows)
        {
            linked.Add(new
            {
                substrateAddress = (string)r.substrate_address,
                evmAddress = (string)r.evm_address,
                linkedAddress = isSub ? (string)r.evm_address : (string)r.substrate_address,
                totalSwappedHmnd = Math.Round((double)r.total_swapped_hmnd, 4),
                swapCount = (long)r.swap_count,
                firstSwapBlock = (long)r.first_swap_block,
                lastSwapBlock = (long)r.last_swap_block
            });
        }

        return new
        {
            hasLink = true,
            address = clean,
            isSubstrate = isSub,
            isEvm,
            linkedAddresses = linked
        };
    }

    public async Task<object> CompareWalletsAsync(string walletA, string walletB)
    {
        var summaryA = await GetAddressSummaryAsync(walletA);
        var summaryB = await GetAddressSummaryAsync(walletB);

        return new
        {
            walletA = summaryA,
            walletB = summaryB,
            relationship = new
            {
                isCrossLayerLinked = false,
                directTransfersAToB = new { count = 0, volume = 0.0 },
                directTransfersBToA = new { count = 0, volume = 0.0 },
                mutualCounterpartiesCount = 0,
                mutualCounterparties = new List<object>()
            }
        };
    }

    public async Task<object> GetWalletPersonaAsync(string address)
    {
        var summary = await GetAddressSummaryAsync(address);
        var badges = new List<object>
        {
            new { id = "standard", label = "Bireysel Kullanıcı", icon = "👤", color = "#94a3b8", desc = "Standart cüzdan hareketleri" }
        };

        return new
        {
            address,
            primaryBadge = badges[0],
            badges,
            totalTxs = 1,
            netBalanceHmnd = 0.0
        };
    }

    public async Task<object> GetMultiHopMoneyTrailAsync(string address, int depth = 2, int limitPerNode = 4)
    {
        var clean = (address ?? "").Trim();
        if (string.IsNullOrEmpty(clean))
        {
            return new { root = "", depth = 0, totalNodes = 0, totalLinks = 0, nodes = new List<object>(), links = new List<object>(), elements = new { nodes = new List<object>(), edges = new List<object>() } };
        }

        using var connection = _dbFactory.CreateConnection();
        var nodesMap = new Dictionary<string, (string id, string label, string shortAddr, string layer, bool isRoot, int depth, double balance)>(StringComparer.OrdinalIgnoreCase);
        var edgesList = new List<(string id, string source, string target, double amount, int count)>();
        var queue = new Queue<(string addr, int currentDepth)>();
        var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        bool isEvmRoot = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
        string shortRoot = clean.Length > 16 ? $"{clean[..6]}...{clean[^4..]}" : clean;
        nodesMap[clean] = (clean, shortRoot, shortRoot, isEvmRoot ? "EVM" : "Substrate", true, 0, 0);
        queue.Enqueue((clean, 0));
        visited.Add(clean);

        while (queue.Count > 0)
        {
            var (curr, d) = queue.Dequeue();
            if (d >= depth) continue;

            bool isEvm = curr.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
            List<(string peer, double val, int cnt, bool isOutgoing)> transfers = new();

            if (isEvm)
            {
                var lower = curr.ToLowerInvariant();
                const string outSql = "SELECT to_address as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM transactions WHERE from_address = @lower AND to_address > '' GROUP BY to_address ORDER BY val DESC LIMIT 4";
                var outRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(outSql, new { lower })).Select(r => (r.peer, r.val, r.cnt, true));
                transfers.AddRange(outRows);

                const string inSql = "SELECT from_address as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM transactions WHERE to_address = @lower AND from_address > '' GROUP BY from_address ORDER BY val DESC LIMIT 4";
                var inRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(inSql, new { lower })).Select(r => (r.peer, r.val, r.cnt, false));
                transfers.AddRange(inRows);
            }
            else
            {
                const string outSql = "SELECT target as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM substrate_extrinsics WHERE signer = @curr AND target > '' GROUP BY target ORDER BY val DESC LIMIT 4";
                var outRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(outSql, new { curr })).Select(r => (r.peer, r.val, r.cnt, true));
                transfers.AddRange(outRows);

                const string inSql = "SELECT signer as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM substrate_extrinsics WHERE target = @curr AND signer > '' GROUP BY signer ORDER BY val DESC LIMIT 4";
                var inRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(inSql, new { curr })).Select(r => (r.peer, r.val, r.cnt, false));
                transfers.AddRange(inRows);
            }

            foreach (var t in transfers.Take(limitPerNode * 2))
            {
                var peerAddr = t.peer.Trim();
                if (string.Equals(peerAddr, curr, StringComparison.OrdinalIgnoreCase)) continue;

                if (!nodesMap.ContainsKey(peerAddr))
                {
                    bool isPeerEvm = peerAddr.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
                    string shortPeer = peerAddr.Length > 16 ? $"{peerAddr[..6]}...{peerAddr[^4..]}" : peerAddr;
                    nodesMap[peerAddr] = (peerAddr, shortPeer, shortPeer, isPeerEvm ? "EVM" : "Substrate", false, d + 1, Math.Round(t.val, 2));

                    if (!visited.Contains(peerAddr) && d + 1 < depth)
                    {
                        visited.Add(peerAddr);
                        queue.Enqueue((peerAddr, d + 1));
                    }
                }

                string source = t.isOutgoing ? curr : peerAddr;
                string target = t.isOutgoing ? peerAddr : curr;
                string edgeId = $"{source}->{target}";

                if (!edgesList.Any(e => e.id == edgeId))
                {
                    edgesList.Add((edgeId, source, target, Math.Round(t.val, 2), t.cnt));
                }
            }
        }

        var cytoNodes = nodesMap.Values.Select(n => new
        {
            data = new
            {
                id = n.id,
                label = n.label,
                shortAddress = n.shortAddr,
                layer = n.layer,
                isRoot = n.isRoot,
                depth = n.depth,
                balance = n.balance
            }
        }).ToList();

        var cytoEdges = edgesList.Select(e => new
        {
            data = new
            {
                id = e.id,
                source = e.source,
                target = e.target,
                amount = e.amount,
                formattedAmount = $"{e.amount:N0} HMND",
                txCount = e.count
            }
        }).ToList();

        return new
        {
            root = clean,
            depth,
            totalNodes = cytoNodes.Count,
            totalLinks = cytoEdges.Count,
            nodes = cytoNodes.Select(n => n.data).ToList(),
            links = cytoEdges.Select(e => e.data).ToList(),
            elements = new
            {
                nodes = cytoNodes,
                edges = cytoEdges
            },
            latencyMs = 12
        };
    }
}
