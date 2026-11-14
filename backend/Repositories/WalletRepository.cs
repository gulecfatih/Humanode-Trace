using System.Data;
using System.Text;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;
using HumanodeTracker.Services;

namespace HumanodeTracker.Repositories;

public class WalletRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private readonly PriceRepository _priceRepo;
    private readonly HumanodeSidecarClient _sidecarClient;

    public WalletRepository(SqliteConnectionFactory dbFactory, PriceRepository priceRepo, HumanodeSidecarClient sidecarClient)
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
            var s = await connection.QueryFirstOrDefaultAsync<(long c, double f, double v)>(StoredProcedures.GetWalletEvmSent, new { lower });
            sentCount = s.c; sentFee = s.f; sentVol = s.v;

            var r = await connection.QueryFirstOrDefaultAsync<(long c, double v)>(StoredProcedures.GetWalletEvmRecv, new { lower });
            recvCount = r.c; recvVol = r.v;
        }

        if (isSub)
        {
            var s = await connection.QueryFirstOrDefaultAsync<(long c, double f, double v)>(StoredProcedures.GetWalletSubSigned, new { clean });
            sentCount = s.c; sentFee = s.f; sentVol = s.v;

            var r = await connection.QueryFirstOrDefaultAsync<(long c, double v)>(StoredProcedures.GetWalletSubTarget, new { clean });
            recvCount = r.c; recvVol = r.v;

            authoredCount = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetWalletAuthoredCount, new { clean });
            bioauthCount = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetWalletBioauthCount, new { clean });
        }

        var liveBal = await connection.QueryFirstOrDefaultAsync<double?>(StoredProcedures.GetWalletBalanceCache, new { clean });

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
                        StoredProcedures.UpsertWalletBalanceCache,
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
        var (tokenList, totalPortfolioUsd) = await GetWalletTokensAsync(connection, new WalletTokensContext
        {
            Address = clean,
            NetBalance = netBalance,
            PriceUsd = priceUsd,
            TotalIn = totalIn,
            TotalOut = totalOut,
            TotalHmndTxs = (int)totalHmndTxs
        });

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
            totalInHmnd = totalIn,
            totalOutHmnd = totalOut,
            totalFeesHmnd = totalFees,
            totalInCount = recvCount,
            totalOutCount = sentCount,
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
        WalletTokensContext ctx)
    {
        var cleanLower = ctx.Address.Trim().ToLowerInvariant();
        var isEvm = cleanLower.StartsWith("0x");

        var tokenList = new List<object>();

        if (ctx.NetBalance > 0.000001 || !isEvm)
        {
            tokenList.Add(new
            {
                address = "NATIVE",
                token_address = "NATIVE",
                symbol = "HMND",
                name = "Humanode Yerel Kripto Para (Native)",
                balance = Math.Round(ctx.NetBalance, 4),
                netBalance = Math.Round(ctx.NetBalance, 4),
                totalIn = Math.Round(ctx.TotalIn, 4),
                totalInflow = Math.Round(ctx.TotalIn, 4),
                totalOut = Math.Round(ctx.TotalOut, 4),
                totalOutflow = Math.Round(ctx.TotalOut, 4),
                usd_value = Math.Round(ctx.NetBalance * ctx.PriceUsd, 2),
                valueUsd = Math.Round(ctx.NetBalance * ctx.PriceUsd, 2),
                price_usd = ctx.PriceUsd,
                priceUsd = ctx.PriceUsd,
                txCount = ctx.TotalHmndTxs,
                transferCount = ctx.TotalHmndTxs,
                transfer_count = ctx.TotalHmndTxs,
                transfers_count = ctx.TotalHmndTxs,
                isNative = true,
                category = "native",
                categoryKey = "token_category_native",
                color = "#38bdf8"
            });
        }

        double portfolioUsd = Math.Round(ctx.NetBalance * ctx.PriceUsd, 2);

        string? evmTarget = isEvm ? cleanLower : null;
        if (!isEvm)
        {
            try
            {
                evmTarget = await connection.QueryFirstOrDefaultAsync<string>(
                    StoredProcedures.GetCrossLayerLinkEvm,
                    new { address = ctx.Address.Trim() });
                if (!string.IsNullOrEmpty(evmTarget)) evmTarget = evmTarget.ToLowerInvariant();
            }
            catch { }
        }

        if (!string.IsNullOrEmpty(evmTarget))
        {
            var configs = (await connection.QueryAsync<SystemConfigEntry>(StoredProcedures.GetAllSystemConfigs)).ToList();
            var refWeth = double.TryParse(configs.FirstOrDefault(c => c.Key == "price_ref_weth")?.Value, out var v1) ? v1 : 0.0;
            var refWbtc = double.TryParse(configs.FirstOrDefault(c => c.Key == "price_ref_wbtc")?.Value, out var v2) ? v2 : 0.0;
            var refUsdc = double.TryParse(configs.FirstOrDefault(c => c.Key == "price_ref_usdc")?.Value, out var v3) ? v3 : 0.0;

            var rows = (await connection.QueryAsync<dynamic>(StoredProcedures.GetWalletTokenTransfers, new { evmTarget })).ToList();
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
                string category = "contract";
                string categoryKey = "token_category_contract";
                string color = "violet";

                var symUpper = symbol.ToUpperInvariant();
                if (symUpper is "USDC" or "USDT")
                {
                    tokenPrice = refUsdc;
                    category = "stablecoin";
                    categoryKey = "token_category_stablecoin";
                    color = "blue";
                }
                else if (symUpper.Contains("HMND"))
                {
                    tokenPrice = ctx.PriceUsd;
                    category = "wrapped";
                    categoryKey = "token_category_wrapped";
                    color = "teal";
                }
                else if (symUpper is "WETH" or "ETH")
                {
                    tokenPrice = refWeth;
                    category = "wrapped";
                    categoryKey = "token_category_wrapped";
                    color = "indigo";
                }
                else if (symUpper is "WBTC" or "BTC")
                {
                    tokenPrice = refWbtc;
                    category = "wrapped";
                    categoryKey = "token_category_wrapped";
                    color = "orange";
                }
                else
                {
                    tokenPrice = 0.0;
                    categoryKey = "token_category_contract";
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
                    categoryKey,
                    color
                });
            }
        }

        return (tokenList, Math.Round(portfolioUsd, 2));
    }

    public async Task<object> GetWalletLedgerAnalyticsAsync(WalletLedgerQueryRequest req)
    {
        req ??= new WalletLedgerQueryRequest();
        var addr = !string.IsNullOrEmpty(req.Address) ? req.Address : req.Addr;
        if (string.IsNullOrWhiteSpace(addr))
        {
            return new { found = false, error = "Wallet address is required." };
        }
        var clean = addr.Trim();
        var isEvm = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);

        using var connection = _dbFactory.CreateConnection();
        var summary = await GetAddressSummaryAsync(clean);
        var priceUsd = await _priceRepo.GetLatestPriceAsync();
        var lower = clean.ToLowerInvariant();

        const int safeLimit = 50;
        var safePage = Math.Max(1, req.LedgerPage);
        var offset = (safePage - 1) * safeLimit;

        // Fetch recent ledger activities for this address
        var activities = new List<object>();
        long totalCount = 0;

        if (isEvm)
        {
            totalCount = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetWalletLedgerEvmCount, new { lower });
            var rows = (await connection.QueryAsync<TransactionDto>(StoredProcedures.GetWalletLedgerEvmPaged, new { lower, safeLimit, offset })).ToList();
            foreach (var r in rows)
            {
                var isIncoming = r.ToAddress.Equals(clean, StringComparison.OrdinalIgnoreCase);
                var amt = r.ValueHmnd;
                var fee = isIncoming ? 0 : r.FeeHmnd;
                activities.Add(new
                {
                    layer = "EVM",
                    hash = r.Hash,
                    block_number = r.BlockNumber,
                    timestamp = r.Timestamp,
                    direction = isIncoming ? "in" : "out",
                    counterparty = isIncoming ? r.FromAddress : r.ToAddress,
                    amount = amt,
                    amount_hmnd = amt,
                    fee = fee,
                    fee_hmnd = fee,
                    value_usd = Math.Round(amt * priceUsd, 2),
                    usd_value = Math.Round(amt * priceUsd, 2),
                    pallet = r.Pallet,
                    method = r.Method
                });
            }
        }
        else
        {
            totalCount = await connection.ExecuteScalarAsync<long>(StoredProcedures.GetWalletLedgerSubCount, new { clean });
            var rows = (await connection.QueryAsync<TransactionDto>(StoredProcedures.GetWalletLedgerSubPaged, new { clean, safeLimit, offset })).ToList();
            foreach (var r in rows)
            {
                var isIncoming = r.ToAddress.Equals(clean, StringComparison.OrdinalIgnoreCase);
                var amt = r.ValueHmnd;
                var fee = isIncoming ? 0 : r.FeeHmnd;
                activities.Add(new
                {
                    layer = "SUBSTRATE",
                    hash = r.Hash,
                    block_number = r.BlockNumber,
                    timestamp = r.Timestamp,
                    direction = isIncoming ? "in" : "out",
                    counterparty = isIncoming ? r.FromAddress : r.ToAddress,
                    amount = amt,
                    amount_hmnd = amt,
                    fee = fee,
                    fee_hmnd = fee,
                    value_usd = Math.Round(amt * priceUsd, 2),
                    usd_value = Math.Round(amt * priceUsd, 2),
                    pallet = r.Pallet,
                    method = r.Method
                });
            }
        }

        // Top Sources (inflow)
        var srcList = new List<object>();
        if (isEvm)
        {
            var srcRows = await connection.QueryAsync<dynamic>(StoredProcedures.GetWalletTopSourcesEvm, new { lower });
            foreach (var r in srcRows)
            {
                srcList.Add(new {
                    counterparty = (string)r.counterparty,
                    tx_count = (long)r.tx_count,
                    total_amount = (double)r.total_amount
                });
            }
        }
        else
        {
            var srcRows = await connection.QueryAsync<dynamic>(StoredProcedures.GetWalletTopSourcesSub, new { clean });
            foreach (var r in srcRows)
            {
                srcList.Add(new {
                    counterparty = (string)r.counterparty,
                    tx_count = (long)r.tx_count,
                    total_amount = (double)r.total_amount
                });
            }
        }

        // Top Destinations (outflow)
        var dstList = new List<object>();
        if (isEvm)
        {
            var dstRows = await connection.QueryAsync<dynamic>(StoredProcedures.GetWalletTopDestsEvm, new { lower });
            foreach (var r in dstRows)
            {
                dstList.Add(new {
                    counterparty = (string)r.counterparty,
                    tx_count = (long)r.tx_count,
                    total_amount = (double)r.total_amount
                });
            }
        }
        else
        {
            var dstRows = await connection.QueryAsync<dynamic>(StoredProcedures.GetWalletTopDestsSub, new { clean });
            foreach (var r in dstRows)
            {
                dstList.Add(new {
                    counterparty = (string)r.counterparty,
                    tx_count = (long)r.tx_count,
                    total_amount = (double)r.total_amount
                });
            }
        }

        var totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / safeLimit));
        var pag = new
        {
            page = safePage,
            limit = safeLimit,
            totalCount,
            totalPages
        };

        return new
        {
            found = true,
            address = clean,
            addressType = isEvm ? "EVM" : "SUBSTRATE",
            summary,
            tokens = (summary as dynamic)?.tokens ?? new List<object>(),
            // Both object with items/pagination and direct list for 100% backward compatibility
            ledger = new
            {
                items = activities,
                pagination = pag
            },
            activities,
            pagination = pag,
            sources = new { items = srcList },
            destinations = new { items = dstList },
            priceUsd
        };
    }

    public async Task<string> ExportWalletLedgerCsvAsync(string address, string flow = "all")
    {
        var result = await GetWalletLedgerAnalyticsAsync(new WalletLedgerQueryRequest { Address = address, LedgerPage = 1, LedgerLimit = 200, Flow = flow });
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
            ? StoredProcedures.GetCrossLayerLinksBySub
            : StoredProcedures.GetCrossLayerLinksByEvm;

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
            new { id = "standard", label = "Individual Account", icon = "👤", color = "#94a3b8", desc = "Standard wallet activity" }
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
        var nodesList = new List<WalletNodeDto>();
        var edgesList = new List<(string id, string source, string target, double amount, int count)>();
        var queue = new Queue<(string addr, int currentDepth)>();
        var visited = new List<string>();

        bool isEvmRoot = clean.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
        string shortRoot = clean.Length > 16 ? $"{clean[..6]}...{clean[^4..]}" : clean;
        nodesList.Add(new WalletNodeDto
        {
            Id = clean,
            Label = shortRoot,
            ShortAddr = shortRoot,
            Layer = isEvmRoot ? "EVM" : "Substrate",
            IsRoot = true,
            Depth = 0,
            Balance = 0
        });
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
                var outRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(StoredProcedures.GetMoneyTrailEvmOut, new { lower })).Select(r => (r.peer, r.val, r.cnt, true));
                transfers.AddRange(outRows);

                var inRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(StoredProcedures.GetMoneyTrailEvmIn, new { lower })).Select(r => (r.peer, r.val, r.cnt, false));
                transfers.AddRange(inRows);
            }
            else
            {
                var outRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(StoredProcedures.GetMoneyTrailSubOut, new { curr })).Select(r => (r.peer, r.val, r.cnt, true));
                transfers.AddRange(outRows);

                var inRows = (await connection.QueryAsync<(string peer, double val, int cnt)>(StoredProcedures.GetMoneyTrailSubIn, new { curr })).Select(r => (r.peer, r.val, r.cnt, false));
                transfers.AddRange(inRows);
            }

            foreach (var t in transfers.Take(limitPerNode * 2))
            {
                var peerAddr = t.peer.Trim();
                if (string.Equals(peerAddr, curr, StringComparison.OrdinalIgnoreCase)) continue;

                if (!nodesList.Any(n => n.Id.Equals(peerAddr, StringComparison.OrdinalIgnoreCase)))
                {
                    bool isPeerEvm = peerAddr.StartsWith("0x", StringComparison.OrdinalIgnoreCase);
                    string shortPeer = peerAddr.Length > 16 ? $"{peerAddr[..6]}...{peerAddr[^4..]}" : peerAddr;
                    nodesList.Add(new WalletNodeDto
                    {
                        Id = peerAddr,
                        Label = shortPeer,
                        ShortAddr = shortPeer,
                        Layer = isPeerEvm ? "EVM" : "Substrate",
                        IsRoot = false,
                        Depth = d + 1,
                        Balance = Math.Round(t.val, 2)
                    });

                    if (!visited.Contains(peerAddr, StringComparer.OrdinalIgnoreCase) && d + 1 < depth)
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

        var cytoNodes = nodesList.Select(n => new
        {
            data = new
            {
                id = n.Id,
                label = n.Label,
                shortAddress = n.ShortAddr,
                layer = n.Layer,
                isRoot = n.IsRoot,
                depth = n.Depth,
                balance = n.Balance
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
                valueHmnd = e.amount,
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
