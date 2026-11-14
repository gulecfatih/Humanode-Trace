namespace HumanodeTracker.Data;

/// <summary>
/// Centralized Stored Procedures and View Catalog
/// Eliminates all inline SQL strings from repositories and services
/// </summary>
public static class StoredProcedures
{
    // ========================================================================
    // PRE-COMPILED DATABASE VIEWS
    // ========================================================================
    public const string GetNetworkStats = "SELECT * FROM vw_network_stats";
    public const string GetTopWhales = "SELECT * FROM vw_top_whales WHERE balance >= @MinHmnd ORDER BY balance DESC LIMIT @Limit";
    public const string GetTopWhalesByLayer = "SELECT * FROM vw_top_whales WHERE balance >= @MinHmnd AND layer = @Layer ORDER BY balance DESC LIMIT @Limit";
    public const string GetActiveValidatorsView = "SELECT * FROM vw_active_validators";
    public const string GetActiveValidatorsCount = "SELECT COUNT(DISTINCT address) FROM vw_active_validators";
    public const string GetTokenDirectoryView = "SELECT * FROM vw_token_directory ORDER BY transfer_count DESC";
    public const string GetFeesPotAnalyticsView = "SELECT * FROM vw_feespot_analytics ORDER BY block_number DESC LIMIT 10";
    public const string GetBiomapperChainsView = "SELECT * FROM vw_biomapper_chains ORDER BY id ASC";
    public const string GetGovernanceProposalsView = "SELECT * FROM vw_governance_proposals ORDER BY block_number DESC LIMIT @Limit";

    public const string GetGovernanceSudoCalls = @"
        SELECT block_number, timestamp, signer, method, details
        FROM substrate_extrinsics
        WHERE pallet = 'sudo'
        ORDER BY block_number DESC
        LIMIT 20";

    public const string GetGovernanceMultisigStats = @"
        SELECT COUNT(*) as total_txs, COUNT(DISTINCT signer) as unique_signers
        FROM substrate_extrinsics
        WHERE pallet = 'multisig'";

    public const string GetGovernanceRecentMultisigCalls = @"
        SELECT block_number, timestamp, signer, method, details, fee_hmnd
        FROM substrate_extrinsics
        WHERE pallet = 'multisig'
        ORDER BY block_number DESC
        LIMIT 15";

    public const string GetKpiVesting = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val 
        FROM substrate_extrinsics 
        WHERE pallet = 'vesting' 
           OR (signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault') AND pallet = 'balances' AND value_hmnd > 0)";

    public const string GetKpiTokenClaims = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'tokenClaims'";
    public const string GetKpiNativeToEvmSwaps = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'nativeToEvmSwap'";
    public const string GetKpiCurrencySwaps = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'currencySwap'";
    public const string GetKpiMultisigCalls = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as val FROM substrate_extrinsics WHERE pallet = 'multisig'";

    // Additional Specialized View & Query Constants
    public const string GetSyncStates = "SELECT key, value FROM sync_state";
    public const string GetEvmTxsCount = "SELECT COUNT(*) FROM transactions";
    public const string GetSubstrateExtrinsicsCount = "SELECT COUNT(*) FROM substrate_extrinsics";
    public const string GetTokenTransfersCount = "SELECT COUNT(*) FROM token_transfers";
    public const string GetBlocksCount = "SELECT COUNT(*) FROM blocks_with_tx";
    public const string GetLatestBlockHeader = "SELECT number, timestamp FROM blocks_with_tx ORDER BY number DESC LIMIT 1";
    public const string GetActiveTokensCount = "SELECT COUNT(DISTINCT token_address) FROM token_transfers";
    public const string GetDistinctPallets = "SELECT DISTINCT pallet FROM substrate_extrinsics WHERE pallet > '' ORDER BY pallet ASC";

    public const string GetWhaleEvmTransactions = @"
        SELECT
            'EVM' as Layer,
            hash as Hash,
            block_number as BlockNumber,
            timestamp as Timestamp,
            'Ethereum' as Pallet,
            'Transact' as Method,
            from_address as Sender,
            to_address as Target,
            value_hmnd as ValueHmnd,
            fee_hmnd as FeeHmnd,
            gas_used as GasUsed,
            status as Status,
            'HMND' as Symbol,
            'EVM Yerel HMND Transferi' as Details
        FROM transactions
        WHERE value_hmnd >= @MinHmnd
        ORDER BY timestamp DESC
        LIMIT @Limit";

    public const string GetWhaleSubstrateTransactions = @"
        SELECT
            'Substrate' as Layer,
            hash as Hash,
            block_number as BlockNumber,
            timestamp as Timestamp,
            pallet as Pallet,
            method as Method,
            signer as Sender,
            target as Target,
            value_hmnd as ValueHmnd,
            fee_hmnd as FeeHmnd,
            0 as GasUsed,
            status as Status,
            'HMND' as Symbol,
            (pallet || '.' || method) as Details
        FROM substrate_extrinsics
        WHERE value_hmnd >= @MinHmnd AND pallet IN ('balances', 'nativeToEvmSwap')
        ORDER BY timestamp DESC
        LIMIT @Limit";

    public const string GetWhaleTokenTransfers = @"
        SELECT
            'EVM Token' as Layer,
            tx_hash as Hash,
            block_number as BlockNumber,
            timestamp as Timestamp,
            'ERC20' as Pallet,
            'transfer' as Method,
            from_address as Sender,
            to_address as Target,
            amount as ValueHmnd,
            0 as FeeHmnd,
            0 as GasUsed,
            1 as Status,
            token_symbol as Symbol,
            (token_symbol || ' Token Transferi') as Details
        FROM token_transfers
        WHERE amount >= @MinHmnd
        ORDER BY timestamp DESC
        LIMIT @Limit";

    public const string GetBlockDetailsEvmTxs = @"
        SELECT
            'EVM' AS Layer,
            t.hash AS Hash,
            t.block_number AS BlockNumber,
            t.timestamp AS Timestamp,
            'Ethereum' AS Pallet,
            'transact' AS Method,
            t.from_address AS FromAddress,
            lf.label AS FromLabel,
            t.to_address AS ToAddress,
            lt.label AS ToLabel,
            t.value_hmnd AS ValueHmnd,
            t.gas_used AS GasUsed,
            t.fee_hmnd AS FeeHmnd,
            t.status AS Status,
            '' AS Details,
            'HMND' AS Symbol
        FROM transactions t
        LEFT JOIN address_labels lf ON LOWER(t.from_address) = LOWER(lf.address)
        LEFT JOIN address_labels lt ON LOWER(t.to_address) = LOWER(lt.address)
        WHERE t.block_number = @BlockNumber
        ORDER BY t.timestamp DESC";

    public const string GetBlockDetailsSubExtrinsics = @"
        SELECT
            'SUBSTRATE' AS Layer,
            s.hash AS Hash,
            s.block_number AS BlockNumber,
            s.timestamp AS Timestamp,
            s.pallet AS Pallet,
            s.method AS Method,
            s.signer AS FromAddress,
            lf.label AS FromLabel,
            s.target AS ToAddress,
            lt.label AS ToLabel,
            s.value_hmnd AS ValueHmnd,
            0 AS GasUsed,
            s.fee_hmnd AS FeeHmnd,
            s.status AS Status,
            s.details AS Details,
            'HMND' AS Symbol
        FROM substrate_extrinsics s
        LEFT JOIN address_labels lf ON LOWER(s.signer) = LOWER(lf.address)
        LEFT JOIN address_labels lt ON LOWER(s.target) = LOWER(lt.address)
        WHERE s.block_number = @BlockNumber
        ORDER BY s.timestamp DESC";

    public const string GetBlocksWithTxPaged = @"
        SELECT number as Number, timestamp as Timestamp, tx_count as TxCount, total_fees_hmnd as TotalFeesHmnd
        FROM blocks_with_tx
        ORDER BY number DESC
        LIMIT @SafeLimit OFFSET @Offset";

    public const string GetBlockHeaderByNumber = @"
        SELECT number AS Number, timestamp AS Timestamp, total_fees_hmnd AS TotalFeesHmnd, author_id AS AuthorId, tx_count AS TxCount
        FROM blocks_with_tx
        WHERE number = @BlockNumber";

    public const string GetTokenTransfersByTxHash = @"
        SELECT
            token_address as TokenAddress,
            token_symbol as TokenSymbol,
            from_address as FromAddress,
            to_address as ToAddress,
            amount as Amount
        FROM token_transfers
        WHERE LOWER(tx_hash) = LOWER(@Hash)";

    public const string GetLeaderboardBalances = @"
        SELECT
            b.address as Address,
            b.balance_hmnd as BalanceHmnd,
            b.layer as Layer,
            l.label as Label,
            l.category as Category
        FROM balances b
        LEFT JOIN address_labels l ON LOWER(b.address) = LOWER(l.address)
        WHERE b.balance_hmnd > 0
        ORDER BY b.balance_hmnd DESC
        LIMIT @Limit";

    public const string GetLeaderboardSendersEvm = @"
        SELECT
            from_address as Address,
            'EVM' as Layer,
            COUNT(*) as TotalTxs,
            COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
            COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
            MAX(timestamp) as LastSeen
        FROM transactions
        WHERE from_address > ''
        GROUP BY from_address
        ORDER BY TotalTxs DESC
        LIMIT 50";

    public const string GetLeaderboardSendersSubstrate = @"
        SELECT
            signer as Address,
            'Substrate' as Layer,
            COUNT(*) as TotalTxs,
            COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
            COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
            MAX(timestamp) as LastSeen
        FROM substrate_extrinsics
        WHERE signer > ''
        GROUP BY signer
        ORDER BY TotalTxs DESC
        LIMIT 50";

    public const string GetLeaderboardVolumeEvm = @"
        SELECT
            address as Address,
            'EVM' as Layer,
            SUM(tx_count) as TotalTxs,
            SUM(vol) as TotalVolumeHmnd,
            MAX(last_active) as LastSeen
        FROM (
            SELECT from_address as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM transactions WHERE value_hmnd > 0 GROUP BY from_address
            UNION ALL
            SELECT to_address as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM transactions WHERE value_hmnd > 0 GROUP BY to_address
        )
        WHERE address > ''
        GROUP BY address
        ORDER BY TotalVolumeHmnd DESC
        LIMIT 50";

    public const string GetLeaderboardVolumeSubstrate = @"
        SELECT
            address as Address,
            'Substrate' as Layer,
            SUM(tx_count) as TotalTxs,
            SUM(vol) as TotalVolumeHmnd,
            MAX(last_active) as LastSeen
        FROM (
            SELECT signer as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM substrate_extrinsics WHERE value_hmnd > 0 GROUP BY signer
            UNION ALL
            SELECT target as address, COUNT(*) as tx_count, SUM(value_hmnd) as vol, MAX(timestamp) as last_active FROM substrate_extrinsics WHERE value_hmnd > 0 GROUP BY target
        )
        WHERE address > ''
        GROUP BY address
        ORDER BY TotalVolumeHmnd DESC
        LIMIT 50";

    public const string GetLeaderboardFeesEvm = @"
        SELECT
            from_address as Address,
            'EVM' as Layer,
            COUNT(*) as TotalTxs,
            COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
            COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
            MAX(timestamp) as LastSeen
        FROM transactions
        WHERE fee_hmnd > 0.000001 AND from_address > ''
        GROUP BY from_address
        ORDER BY TotalFeesHmnd DESC
        LIMIT 50";

    public const string GetLeaderboardFeesSubstrate = @"
        SELECT
            signer as Address,
            'Substrate' as Layer,
            COUNT(*) as TotalTxs,
            COALESCE(SUM(fee_hmnd), 0) as TotalFeesHmnd,
            COALESCE(SUM(value_hmnd), 0) as TotalVolumeHmnd,
            MAX(timestamp) as LastSeen
        FROM substrate_extrinsics
        WHERE fee_hmnd > 0.000001 AND signer > ''
        GROUP BY signer
        ORDER BY TotalFeesHmnd DESC
        LIMIT 50";

    public const string GetLeaderboardBalancesEvm = @"
        SELECT
            address as Address,
            'EVM' as Layer,
            SUM(inflow - outflow - fee) as BalanceHmnd,
            SUM(inflow + outflow) as TotalVolumeHmnd,
            SUM(fee) as TotalFeesHmnd,
            SUM(tx_count) as TotalTxs,
            MAX(last_seen) as LastSeen
        FROM (
            SELECT to_address as address, SUM(value_hmnd) as inflow, 0.0 as outflow, 0.0 as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
            FROM transactions WHERE to_address > '' AND status = 1 AND value_hmnd > 0 GROUP BY to_address
            UNION ALL
            SELECT from_address as address, 0.0 as inflow, SUM(value_hmnd) as outflow, SUM(fee_hmnd) as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
            FROM transactions WHERE from_address > '' AND status = 1 GROUP BY from_address
        )
        WHERE address LIKE '0x%'
        GROUP BY address
        HAVING BalanceHmnd > 0
        ORDER BY BalanceHmnd DESC
        LIMIT 50";

    public const string GetLeaderboardBalancesSubstrate = @"
        SELECT
            address as Address,
            'Substrate' as Layer,
            SUM(inflow - outflow - fee) as BalanceHmnd,
            SUM(inflow + outflow) as TotalVolumeHmnd,
            SUM(fee) as TotalFeesHmnd,
            SUM(tx_count) as TotalTxs,
            MAX(last_seen) as LastSeen
        FROM (
            SELECT target as address, SUM(value_hmnd) as inflow, 0.0 as outflow, 0.0 as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
            FROM substrate_extrinsics WHERE target > '' AND status = 1 AND value_hmnd > 0 GROUP BY target
            UNION ALL
            SELECT signer as address, 0.0 as inflow, SUM(value_hmnd) as outflow, SUM(fee_hmnd) as fee, COUNT(*) as tx_count, MAX(timestamp) as last_seen
            FROM substrate_extrinsics WHERE signer > '' AND status = 1 GROUP BY signer
        )
        WHERE address LIKE 'hm%'
        GROUP BY address
        HAVING BalanceHmnd > 0
        ORDER BY BalanceHmnd DESC
        LIMIT 50";

    public const string GetWalletBalancesCache = "SELECT address, balance_hmnd FROM wallet_balances_cache";

    public const string GetHodlerDistributionBalances = @"
        SELECT address, balance_hmnd, layer
        FROM balances
        WHERE balance_hmnd > 0
        ORDER BY balance_hmnd DESC";

    public const string GetSubToEvmTotal = @"
        SELECT COUNT(*) as cnt, COALESCE(SUM(value_hmnd), 0) as vol
        FROM substrate_extrinsics
        WHERE pallet = 'nativeToEvmSwap' AND status = 1";

    public const string GetSubToEvmTransfers = @"
        SELECT
            hash,
            block_number as BlockNumber,
            timestamp,
            signer as Sender,
            target as Recipient,
            value_hmnd as AmountHmnd,
            fee_hmnd as FeeHmnd,
            status as Status
        FROM substrate_extrinsics
        WHERE pallet = 'nativeToEvmSwap'
        ORDER BY block_number DESC
        LIMIT @Limit";

    public const string GetYearlyHeatmap = @"
        SELECT 
            DATE(timestamp, 'unixepoch') as day, 
            COUNT(*) as cnt, 
            ROUND(COALESCE(SUM(fee_hmnd), 0), 6) as fee
        FROM (
            SELECT timestamp, fee_hmnd FROM transactions WHERE timestamp >= @startOfYear AND timestamp <= @endOfYear
            UNION ALL
            SELECT timestamp, fee_hmnd FROM substrate_extrinsics WHERE timestamp >= @startOfYear AND timestamp <= @endOfYear
        )
        WHERE timestamp > 0
        GROUP BY day
        ORDER BY day ASC";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: BLOCKS & TRANSACTIONS
    // ========================================================================
    public const string GetRecentBlocks = @"
        SELECT number as Number, timestamp as Timestamp, tx_count as TxCount, gas_used as GasUsed, total_fees_hmnd as TotalFeesHmnd, author_id as AuthorId
        FROM blocks_with_tx
        ORDER BY number DESC
        LIMIT @Limit";

    public const string GetBlockByNumber = @"
        SELECT number as Number, timestamp as Timestamp, tx_count as TxCount, gas_used as GasUsed, total_fees_hmnd as TotalFeesHmnd, author_id as AuthorId
        FROM blocks_with_tx
        WHERE number = @Number";

    public const string GetTransactionByHash = @"
        SELECT hash as Hash, block_number as BlockNumber, timestamp as Timestamp, from_address as FromAddress, to_address as ToAddress,
               value_hmnd as ValueHmnd, fee_hmnd as FeeHmnd, gas_used as GasUsed, status as Status, tx_type as TxType, input as Input
        FROM transactions
        WHERE hash = @Hash";

    public const string GetTransactionDetailsEvm = @"
        SELECT
            'EVM' as Layer,
            t.hash as Hash,
            t.block_number as BlockNumber,
            t.timestamp as Timestamp,
            t.from_address as FromAddress,
            lf.label as FromLabel,
            t.to_address as ToAddress,
            lt.label as ToLabel,
            t.value_hmnd as ValueHmnd,
            t.gas_used as GasUsed,
            t.fee_hmnd as FeeHmnd,
            t.status as Status,
            'Ethereum' as Pallet,
            'transact' as Method,
            'HMND' as Symbol
        FROM transactions t
        LEFT JOIN address_labels lf ON LOWER(t.from_address) = LOWER(lf.address)
        LEFT JOIN address_labels lt ON LOWER(t.to_address) = LOWER(lt.address)
        WHERE LOWER(t.hash) = LOWER(@cleanHash)";

    public const string GetTransactionDetailsSubstrate = @"
        SELECT
            'SUBSTRATE' as Layer,
            s.hash as Hash,
            s.block_number as BlockNumber,
            s.timestamp as Timestamp,
            s.pallet as Pallet,
            s.method as Method,
            s.signer as FromAddress,
            lf.label as FromLabel,
            s.target as ToAddress,
            lt.label as ToLabel,
            s.value_hmnd as ValueHmnd,
            0 as GasUsed,
            s.fee_hmnd as FeeHmnd,
            s.status as Status,
            s.details as Details,
            'HMND' as Symbol
        FROM substrate_extrinsics s
        LEFT JOIN address_labels lf ON LOWER(s.signer) = LOWER(lf.address)
        LEFT JOIN address_labels lt ON LOWER(s.target) = LOWER(lt.address)
        WHERE LOWER(s.hash) = LOWER(@cleanHash)";

    public const string GetExtrinsicByHash = @"
        SELECT hash as Hash, block_number as BlockNumber, extrinsic_index as ExtrinsicIndex, pallet as Pallet, method as Method,
               signer as Signer, target as Target, value_hmnd as ValueHmnd, fee_hmnd as FeeHmnd, timestamp as Timestamp, status as Status, args_json as ArgsJson
        FROM substrate_extrinsics
        WHERE hash = @Hash";

    public const string GetTransactionsRecent = @"
        SELECT hash as Hash, block_number as BlockNumber, timestamp as Timestamp, from_address as FromAddress, to_address as ToAddress,
               value_hmnd as ValueHmnd, fee_hmnd as FeeHmnd, status as Status, tx_type as TxType, 'evm' as SourceType
        FROM transactions
        ORDER BY block_number DESC
        LIMIT @Limit";

    public const string GetExtrinsicsRecent = @"
        SELECT hash as Hash, block_number as BlockNumber, timestamp as Timestamp, signer as FromAddress, target as ToAddress,
               value_hmnd as ValueHmnd, fee_hmnd as FeeHmnd, status as Status, (pallet || '.' || method) as TxType, 'substrate' as SourceType
        FROM substrate_extrinsics
        ORDER BY block_number DESC
        LIMIT @Limit";

    public const string GetTransactionsByAddress = @"
        SELECT hash as Hash, block_number as BlockNumber, timestamp as Timestamp, from_address as FromAddress, to_address as ToAddress,
               value_hmnd as ValueHmnd, fee_hmnd as FeeHmnd, gas_used as GasUsed, status as Status, tx_type as TxType, input as Input
        FROM transactions
        WHERE from_address = @Address OR to_address = @Address
        ORDER BY block_number DESC
        LIMIT @Limit";

    public const string GetDailyStats = @"
        SELECT strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as Date,
               COUNT(*) as BlockCount,
               COALESCE(SUM(tx_count), 0) as TxCount,
               ROUND(COALESCE(SUM(total_fees_hmnd), 0), 4) as TotalFeesHmnd
        FROM blocks_with_tx
        WHERE timestamp >= @StartTs AND timestamp <= @EndTs
        GROUP BY Date
        ORDER BY Date ASC";

    public const string SearchBlock = "SELECT number FROM blocks_with_tx WHERE number = @Number LIMIT 1";
    public const string SearchTransaction = "SELECT hash FROM transactions WHERE hash = @Hash LIMIT 1";
    public const string SearchExtrinsic = "SELECT hash FROM substrate_extrinsics WHERE hash = @Hash LIMIT 1";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: VALIDATORS & FEE POT
    // ========================================================================
    public const string GetSubstrateMaxTimestamp = "SELECT MAX(timestamp) FROM substrate_extrinsics";

    public const string GetTotalRegisteredValidators = @"
        SELECT COUNT(DISTINCT signer)
        FROM substrate_extrinsics
        WHERE pallet = 'session' AND method = 'setKeys' AND signer > ''";

    public const string GetActiveValidators30d = @"
        SELECT COUNT(DISTINCT addr) FROM (
            SELECT author_id as addr FROM blocks_with_tx WHERE timestamp >= @thirtyDaysBefore AND author_id > ''
            UNION
            SELECT signer as addr FROM substrate_extrinsics WHERE pallet IN ('session', 'bioauth') AND timestamp >= @thirtyDaysBefore AND signer > ''
        )";

    public const string GetTotalBioauthCount = "SELECT COUNT(*) FROM substrate_extrinsics WHERE pallet = 'bioauth' AND method = 'authenticate'";
    public const string GetTotalHeartbeatsCount = "SELECT COUNT(*) FROM substrate_extrinsics WHERE pallet = 'imOnline'";
    public const string GetFeesPotBalance = @"
        SELECT balance_hmnd FROM balances 
        WHERE address = (SELECT config_value FROM system_config WHERE config_key = 'fees_pot_address')";

    public const string GetValidatorCandidateActivity = @"
        WITH recent_activity AS (
            SELECT author_id AS address, MAX(timestamp) AS last_seen, COUNT(*) as recent_blocks
            FROM blocks_with_tx
            WHERE timestamp >= @ThirtyDaysBefore AND author_id > ''
            GROUP BY author_id
            UNION ALL
            SELECT signer AS address, MAX(timestamp) AS last_seen, 0 as recent_blocks
            FROM substrate_extrinsics
            WHERE pallet IN ('bioauth', 'session') AND signer > '' AND timestamp >= @ThirtyDaysBefore
            GROUP BY signer
        )
        SELECT address, MAX(last_seen) AS last_seen, SUM(recent_blocks) AS recent_blocks
        FROM recent_activity
        GROUP BY address
        ORDER BY last_seen DESC
        LIMIT 100";

    public const string GetValidatorPayoutsSummary = @"
        WITH ranked AS (
            SELECT validator_address, amount_hmnd,
                   ROW_NUMBER() OVER (PARTITION BY validator_address ORDER BY block_number DESC) as rn
            FROM validator_payouts
        ),
        aggregated AS (
            SELECT validator_address, COUNT(*) as cnt, SUM(amount_hmnd) as tot, MAX(timestamp) as last_ts, MAX(block_number) as last_blk
            FROM validator_payouts
            GROUP BY validator_address
        )
        SELECT a.validator_address, a.cnt, a.tot, a.last_ts, r.amount_hmnd as last_hmnd, a.last_blk
        FROM aggregated a
        JOIN ranked r ON a.validator_address = r.validator_address AND r.rn = 1";

    public const string GetValidatorEconomicsSingle = @"
        SELECT 
            COUNT(*) as count, 
            COALESCE(SUM(amount_hmnd), 0) as totalHmnd, 
            COALESCE(MAX(timestamp), 0) as lastTs, 
            COALESCE((SELECT amount_hmnd FROM validator_payouts WHERE validator_address = @Clean ORDER BY block_number DESC LIMIT 1), 0) as lastHmnd,
            COALESCE(MAX(block_number), 0) as lastBlock
        FROM validator_payouts
        WHERE validator_address = @Clean";

    public const string GetValidatorAuthorStats = @"
        SELECT COUNT(*) as total_blocks, MIN(timestamp) as first_block_ts, MAX(timestamp) as last_block_ts
        FROM blocks_with_tx
        WHERE author_id = @Clean";

    public const string GetValidatorBioStats = @"
        SELECT COUNT(*) as bio_count, MAX(timestamp) as last_bio_ts
        FROM substrate_extrinsics
        WHERE signer = @Clean AND pallet = 'bioauth'";

    public const string GetValidatorSessionCount = @"
        SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @Clean AND pallet = 'session'";

    public const string GetValidatorRecentBlocksCount = @"
        SELECT COUNT(*) FROM blocks_with_tx WHERE author_id = @Clean AND timestamp >= @ThirtyDaysAgo";

    public const string GetLatestPayoutBatch = @"
        SELECT block_number, timestamp, AVG(amount_hmnd) as avg_amt 
        FROM validator_payouts 
        WHERE block_number = (SELECT MAX(block_number) FROM validator_payouts) 
        GROUP BY block_number, timestamp";

    public const string GetBurnedEvm = @"
        SELECT COALESCE(SUM(value_hmnd), 0)
        FROM transactions
        WHERE (to_address = @addr OR to_address = @addrLower) AND (status = 1 OR status IS NULL)";

    public const string GetBurnedSubstrate = @"
        SELECT COALESCE(SUM(value_hmnd), 0)
        FROM substrate_extrinsics
        WHERE (target = @addr OR target = @addrLower) AND (status = 1 OR status IS NULL)";

    public const string GetBurnedTxsCount = @"
        SELECT COUNT(*)
        FROM transactions
        WHERE (to_address = @addr OR to_address = @addrLower) AND (status = 1 OR status IS NULL)";

    public const string GetBurnedTotalFees = "SELECT COALESCE(SUM(total_fees_hmnd), 0) FROM blocks_with_tx";

    public const string GetFeesPotIncomingTransfers = @"
        SELECT hash, block_number as Block, timestamp, signer, value_hmnd as Amount, pallet, method
        FROM substrate_extrinsics
        WHERE target = @addr
        ORDER BY block_number DESC";

    public const string GetFeesPotBatchesCount = "SELECT COUNT(DISTINCT block_number) FROM validator_payouts";

    public const string GetFeesPotPayoutHistory = @"
        SELECT 
            block_number as Block, 
            timestamp as Timestamp, 
            COUNT(*) as RecipientCount, 
            ROUND(SUM(amount_hmnd), 2) as TotalDistributed, 
            ROUND(AVG(amount_hmnd), 2) as SamplePerValidator
        FROM validator_payouts
        GROUP BY block_number, timestamp
        ORDER BY block_number DESC
        LIMIT 10";

    public const string GetTaxReportPayouts = @"
        SELECT 
            batch_index as BatchNumber,
            block_number as BlockNumber,
            timestamp as Timestamp,
            amount_hmnd as AmountHmnd
        FROM validator_payouts
        WHERE validator_address = @Clean
        ORDER BY block_number ASC";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: TOKENS & METADATA
    // ========================================================================
    public const string GetTokensMetadata = @"
        SELECT token_address as Address, symbol as Symbol, name as Name, category_code as Category, color as Color, decimals as Decimals
        FROM tokens_metadata";

    public const string GetTokenTransfersSummary = @"
        SELECT
            t.token_symbol as Symbol,
            t.token_address as TokenAddress,
            COUNT(*) as TransferCount,
            COALESCE(SUM(t.amount), 0) as TotalVolume,
            COUNT(DISTINCT t.from_address) as UniqueSenders,
            COUNT(DISTINCT t.to_address) as UniqueHolders,
            MIN(t.timestamp) as FirstSeen,
            MAX(t.timestamp) as LastSeen
        FROM token_transfers t
        GROUP BY t.token_address, t.token_symbol
        ORDER BY TransferCount DESC";

    public const string GetTopPools = @"
        SELECT
            to_address as PoolAddress,
            COUNT(*) as SwapCount,
            COUNT(DISTINCT token_symbol) as TokenTypes,
            GROUP_CONCAT(DISTINCT token_symbol) as TokensInvolved,
            SUM(amount) as TotalTokenVolume,
            MAX(timestamp) as LastActive
        FROM token_transfers
        GROUP BY to_address
        ORDER BY SwapCount DESC
        LIMIT 15";

    public const string GetEvmMethodSignatures = @"
        SELECT selector, function_name, signature, category_code, description_key
        FROM evm_method_signatures";

    public const string GetQuerySandboxPresets = @"
        SELECT id as Id, title_key as TitleKey, description_key as DescriptionKey, sql_query as Sql, display_order as DisplayOrder
        FROM query_sandbox_presets
        ORDER BY display_order ASC";

    public const string GetWalletPersonas = @"
        SELECT id, label_key, desc_key, icon, color, min_balance, min_volume, min_txs, is_validator_required, is_bridge_required
        FROM wallet_personas";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: ADDRESS LABELS & DIRECTORY
    // ========================================================================
    public const string GetCuratedAddresses = @"
        SELECT address as Address, label as Label, category as Category, color as Color, notes as Notes, is_watched as IsWatched
        FROM address_labels
        WHERE is_watched = 1
        ORDER BY category ASC, label ASC";

    public const string GetAllAddressLabels = @"
        SELECT address, label, category, color, notes, is_watched, updated_at
        FROM address_labels";

    public const string UpsertAddressLabel = @"
        INSERT INTO address_labels (address, label, category, color, notes, is_watched, updated_at)
        VALUES (@Address, @Label, @Category, @Color, @Notes, @IsWatched, @UpdatedAt)
        ON CONFLICT(address) DO UPDATE SET
            label = excluded.label,
            category = excluded.category,
            color = excluded.color,
            notes = excluded.notes,
            is_watched = excluded.is_watched,
            updated_at = excluded.updated_at";

    public const string DeleteAddressLabel = "DELETE FROM address_labels WHERE LOWER(address) = LOWER(@Address)";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: LOCALIZATION
    // ========================================================================
    public const string GetAppLanguagesList = @"
        SELECT
            code AS Code,
            flag AS Flag,
            label AS Label,
            native_name AS NativeName,
            country AS Country,
            is_default = 1 AS IsDefault
        FROM app_languages
        ORDER BY display_order ASC";

    public const string GetTranslationsWithDefaultFallback = @"
        WITH default_lang AS (
            SELECT code FROM app_languages WHERE is_default = 1 LIMIT 1
        )
        SELECT translation_key, translation_value
        FROM app_translations
        WHERE lang_code = @cleanLang
        UNION
        SELECT translation_key, translation_value
        FROM app_translations
        WHERE lang_code = (SELECT code FROM default_lang)
          AND translation_key NOT IN (
              SELECT translation_key FROM app_translations WHERE lang_code = @cleanLang
          )";

    public const string UpsertAppTranslation = @"
        INSERT INTO app_translations (lang_code, translation_key, translation_value, updated_at)
        VALUES (@lang, @key, @value, @now)
        ON CONFLICT(lang_code, translation_key) DO UPDATE SET
            translation_value = excluded.translation_value,
            updated_at = excluded.updated_at";

    public const string GetAppTranslations = @"
        SELECT translation_key as [Key], translation_value as [Value]
        FROM app_translations
        WHERE lang_code = @LangCode";

    public const string GetPageTranslations = @"
        SELECT translation_key as [Key], translation_value as [Value]
        FROM app_translations
        WHERE lang_code = @LangCode AND (translation_key LIKE @Prefix OR translation_key LIKE 'nav%')";

    public const string GetAppLanguages = @"
        SELECT code, name, native_name, flag, is_active
        FROM app_languages
        WHERE is_active = 1";

    // ========================================================================
    // STORED QUERIES & PROCEDURES: WALLET, CLUSTERS & MONEY TRAIL
    // ========================================================================
    public const string GetWalletEvmSent = "SELECT COUNT(*) as c, COALESCE(SUM(fee_hmnd), 0) as f, COALESCE(SUM(value_hmnd), 0) as v FROM transactions WHERE LOWER(from_address) = @lower";
    public const string GetWalletEvmRecv = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as v FROM transactions WHERE LOWER(to_address) = @lower";
    public const string GetWalletSubSigned = "SELECT COUNT(*) as c, COALESCE(SUM(fee_hmnd), 0) as f, COALESCE(SUM(value_hmnd), 0) as v FROM substrate_extrinsics WHERE signer = @clean";
    public const string GetWalletSubTarget = "SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as v FROM substrate_extrinsics WHERE target = @clean";
    public const string GetWalletAuthoredCount = "SELECT COUNT(*) FROM blocks_with_tx WHERE author_id = @clean";
    public const string GetWalletBioauthCount = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @clean AND pallet = 'bioauth'";
    public const string GetWalletBalanceCache = "SELECT balance_hmnd FROM wallet_balances_cache WHERE LOWER(address) = LOWER(@clean)";
    public const string UpsertWalletBalanceCache = "INSERT OR REPLACE INTO wallet_balances_cache (address, balance_hmnd, updated_at) VALUES (@clean, @liveBal, @now)";
    public const string UpsertWalletBalanceCacheStandard = @"
        INSERT INTO wallet_balances_cache (address, balance_hmnd, updated_at)
        VALUES (@Address, @Balance, @UpdatedAt)
        ON CONFLICT(address) DO UPDATE SET
            balance_hmnd = excluded.balance_hmnd,
            updated_at = excluded.updated_at";

    public const string GetTopSubstrateAddressesForCache = @"
        SELECT address FROM (
            SELECT target as address, SUM(value_hmnd) as vol FROM substrate_extrinsics WHERE target > '' AND status = 1 GROUP BY target
            UNION
            SELECT signer as address, SUM(value_hmnd) as vol FROM substrate_extrinsics WHERE signer > '' AND status = 1 GROUP BY signer
        ) WHERE address LIKE 'hm%' ORDER BY vol DESC LIMIT 25";
    public const string GetCrossLayerLinkEvm = "SELECT evm_address FROM cross_layer_links WHERE substrate_address = @address LIMIT 1";

    public const string GetWalletTokenTransfers = @"
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

    public const string GetWalletLedgerEvmCount = "SELECT COUNT(*) FROM transactions WHERE LOWER(from_address) = @lower OR LOWER(to_address) = @lower";

    public const string GetWalletLedgerEvmPaged = @"
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

    public const string GetWalletLedgerSubCount = "SELECT COUNT(*) FROM substrate_extrinsics WHERE signer = @clean OR target = @clean";

    public const string GetWalletLedgerSubPaged = @"
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

    public const string GetWalletTopSourcesEvm = @"
        SELECT from_address AS counterparty, COUNT(*) AS tx_count, SUM(value_hmnd) AS total_amount
        FROM transactions
        WHERE LOWER(to_address) = @lower
        GROUP BY from_address
        ORDER BY total_amount DESC
        LIMIT 10";

    public const string GetWalletTopSourcesSub = @"
        SELECT signer AS counterparty, COUNT(*) AS tx_count, SUM(value_hmnd) AS total_amount
        FROM substrate_extrinsics
        WHERE target = @clean
        GROUP BY signer
        ORDER BY total_amount DESC
        LIMIT 10";

    public const string GetWalletTopDestsEvm = @"
        SELECT to_address AS counterparty, COUNT(*) AS tx_count, SUM(value_hmnd) AS total_amount
        FROM transactions
        WHERE LOWER(from_address) = @lower
        GROUP BY to_address
        ORDER BY total_amount DESC
        LIMIT 10";

    public const string GetWalletTopDestsSub = @"
        SELECT target AS counterparty, COUNT(*) AS tx_count, SUM(value_hmnd) AS total_amount
        FROM substrate_extrinsics
        WHERE signer = @clean
        GROUP BY target
        ORDER BY total_amount DESC
        LIMIT 10";

    public const string GetCrossLayerLinksBySub = "SELECT * FROM cross_layer_links WHERE substrate_address = @clean ORDER BY total_swapped_hmnd DESC";
    public const string GetCrossLayerLinksByEvm = "SELECT * FROM cross_layer_links WHERE LOWER(evm_address) = LOWER(@clean) ORDER BY total_swapped_hmnd DESC";

    public const string GetMoneyTrailEvmOut = "SELECT to_address as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM transactions WHERE from_address = @lower AND to_address > '' GROUP BY to_address ORDER BY val DESC LIMIT 4";
    public const string GetMoneyTrailEvmIn = "SELECT from_address as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM transactions WHERE to_address = @lower AND from_address > '' GROUP BY from_address ORDER BY val DESC LIMIT 4";
    public const string GetMoneyTrailSubOut = "SELECT target as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM substrate_extrinsics WHERE signer = @curr AND target > '' GROUP BY target ORDER BY val DESC LIMIT 4";
    public const string GetMoneyTrailSubIn = "SELECT signer as peer, SUM(value_hmnd) as val, COUNT(*) as cnt FROM substrate_extrinsics WHERE target = @curr AND signer > '' GROUP BY signer ORDER BY val DESC LIMIT 4";

    public const string GetAddressLabelByAddress = "SELECT label, category, color, notes FROM address_labels WHERE LOWER(address) = LOWER(@clean)";
    public const string GetContractCallersCount = "SELECT COUNT(DISTINCT from_address) as senders, COUNT(*) as total FROM transactions WHERE LOWER(to_address) = LOWER(@clean)";

    public const string GetClusterInflowEvm = @"
        SELECT from_address as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
        FROM transactions
        WHERE to_address = @lower AND from_address > ''
        GROUP BY from_address
        ORDER BY TotalHmnd DESC
        LIMIT 5";

    public const string GetClusterOutflowEvm = @"
        SELECT to_address as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
        FROM transactions
        WHERE from_address = @lower AND to_address > ''
        GROUP BY to_address
        ORDER BY TotalHmnd DESC
        LIMIT 5";

    public const string GetClusterInflowSub = @"
        SELECT signer as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
        FROM substrate_extrinsics
        WHERE target = @clean AND signer > ''
        GROUP BY signer
        ORDER BY TotalHmnd DESC
        LIMIT 5";

    public const string GetClusterOutflowSub = @"
        SELECT target as Counterparty, SUM(value_hmnd) as TotalHmnd, COUNT(*) as TxCount
        FROM substrate_extrinsics
        WHERE signer = @clean AND target > ''
        GROUP BY target
        ORDER BY TotalHmnd DESC
        LIMIT 5";

    public const string GetSubstrateTransfersOut = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
        FROM substrate_extrinsics
        WHERE signer = @Address AND status = 1";

    public const string GetSubstrateTransfersIn = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
        FROM substrate_extrinsics
        WHERE target = @Address AND status = 1";

    public const string GetEvmTransfersOut = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
        FROM transactions
        WHERE from_address = @Address AND status = 1";

    public const string GetEvmTransfersIn = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol
        FROM transactions
        WHERE to_address = @Address AND status = 1";

    public const string GetCrossLayerLink = @"
        SELECT evm_address, substrate_address
        FROM cross_layer_links
        WHERE LOWER(evm_address) = LOWER(@Address) OR substrate_address = @Address
        LIMIT 1";

    public const string GetSnapshotBlockByTimestamp = "SELECT number FROM blocks_with_tx WHERE timestamp <= @targetTs ORDER BY number DESC LIMIT 1";
    public const string GetSnapshotTimestampByBlock = "SELECT timestamp FROM blocks_with_tx WHERE number <= @targetBlock ORDER BY number DESC LIMIT 1";
    public const string GetSnapshotPriceByDate = "SELECT price_usd FROM hmnd_daily_prices WHERE day <= @dateStr ORDER BY day DESC LIMIT 1";
    public const string GetSnapshotCumulativeBlocks = "SELECT COUNT(*) FROM blocks_with_tx WHERE number <= @targetBlock";
    public const string GetSnapshotCumulativeTxs = "SELECT (SELECT COUNT(*) FROM transactions WHERE block_number <= @targetBlock) + (SELECT COUNT(*) FROM substrate_extrinsics WHERE block_number <= @targetBlock)";

    public const string GetSnapshotTopHolders = @"
        SELECT address, 'Substrate' as layer, SUM(inflow - outflow) as bal
        FROM (
            SELECT target as address, SUM(value_hmnd) as inflow, 0.0 as outflow
            FROM substrate_extrinsics
            WHERE block_number <= @targetBlock AND target > '' AND status = 1
            GROUP BY target
            UNION ALL
            SELECT signer as address, 0.0 as inflow, SUM(value_hmnd) as outflow
            FROM substrate_extrinsics
            WHERE block_number <= @targetBlock AND signer > '' AND status = 1
            GROUP BY signer
        )
        GROUP BY address
        HAVING bal > 1000
        ORDER BY bal DESC
        LIMIT 10";

    public const string GetDexPoolReservesIn = @"
        SELECT token_symbol as symbol, SUM(amount) as total
        FROM token_transfers
        WHERE to_address = @cleanPool
        GROUP BY token_symbol";

    public const string GetDexPoolReservesOut = @"
        SELECT token_symbol as symbol, SUM(amount) as total
        FROM token_transfers
        WHERE from_address = @cleanPool
        GROUP BY token_symbol";

    public const string GetDexPool24hVolume = @"
        SELECT COALESCE(SUM(amount), 0)
        FROM token_transfers
        WHERE (to_address = @cleanPool OR from_address = @cleanPool)
          AND timestamp >= @dayAgo";

    public const string GetBioauthPalletCount = "SELECT COUNT(*) FROM substrate_extrinsics WHERE pallet = 'bioauth'";
    public const string GetCrossLayerLinksCount = "SELECT COUNT(*) FROM cross_layer_links";
    public const string GetBridgeEvmToSubKpi = @"
        SELECT COUNT(*) as c, COALESCE(SUM(value_hmnd), 0) as vol 
        FROM transactions 
        WHERE to_address = (SELECT config_value FROM system_config WHERE config_key = 'bridge_precompile_address')";

    public const string GetHodlerCacheBalances = @"
        SELECT address, balance_hmnd, updated_at
        FROM wallet_balances_cache
        WHERE balance_hmnd > 0
        ORDER BY balance_hmnd DESC";

    public const string GetHodlerAddressLabels = "SELECT address, label, category FROM address_labels";
    public const string GetHodlerCrossLayerLinks = "SELECT substrate_address, evm_address FROM cross_layer_links";

    public const string GetBiomapperChains = @"
        SELECT 
            id as Id,
            name as Name,
            short_name as ShortName,
            chain_id as ChainId,
            type_key as Type,
            category as Category,
            contract_address as ContractAddress,
            explorer_name as ExplorerName,
            explorer_url as ExplorerUrl,
            status_key as Status,
            icon_color as IconColor,
            generations_supported as GenerationsSupported,
            sdk_interface as SdkInterface,
            features_json as FeaturesJson
        FROM biomapper_chains
        ORDER BY display_order ASC";

    public const string GetEqualityBalances = @"
        SELECT balance_hmnd
        FROM balances
        WHERE balance_hmnd > 0
        ORDER BY balance_hmnd ASC";

    public const string GetEqualityRawBalances = @"
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

    public const string GetEqualityCachedBalances = "SELECT balance_hmnd FROM wallet_balances_cache WHERE balance_hmnd > 0.01";

    public const string GetEqualityActiveBioauthValidators = @"
        SELECT COUNT(DISTINCT signer)
        FROM substrate_extrinsics
        WHERE pallet = 'bioauth' AND timestamp >= @ThirtyDaysAgo";

    public const string GetDailyPrices = @"
        SELECT day as Date, price_usd as PriceUsd
        FROM hmnd_daily_prices
        ORDER BY day ASC";

    public const string GetLatestDailyPrice = @"
        SELECT price_usd
        FROM hmnd_daily_prices
        ORDER BY day DESC
        LIMIT 1";

    // ========================================================================
    // MUTATION PROCEDURES: NATIVE BLOCKCHAIN INDEXER
    // ========================================================================
    public const string InsertIndexedBlock = @"
        INSERT OR REPLACE INTO blocks_with_tx (number, timestamp, tx_count, gas_used, total_fees_hmnd, author_id)
        VALUES (@Number, @Timestamp, @TxCount, @GasUsed, @TotalFeesHmnd, @AuthorId)";

    public const string InsertIndexedTransaction = @"
        INSERT OR REPLACE INTO transactions (hash, block_number, timestamp, from_address, to_address, value_wei, value_hmnd, fee_hmnd, gas_used, status, tx_type, input)
        VALUES (@Hash, @BlockNumber, @Timestamp, @FromAddress, @ToAddress, @ValueWei, @ValueHmnd, @FeeHmnd, @GasUsed, @Status, @TxType, @Input)";

    public const string InsertIndexedExtrinsic = @"
        INSERT INTO substrate_extrinsics (block_number, extrinsic_index, hash, pallet, method, signer, target, value_hmnd, fee_hmnd, timestamp, status, args_json)
        VALUES (@BlockNumber, @ExtrinsicIndex, @Hash, @Pallet, @Method, @Signer, @Target, @ValueHmnd, @FeeHmnd, @Timestamp, @Status, @ArgsJson)";

    public const string InsertTokenTransfer = @"
        INSERT INTO token_transfers (tx_hash, block_number, timestamp, token_address, token_symbol, from_address, to_address, amount)
        VALUES (@TxHash, @BlockNumber, @Timestamp, @TokenAddress, @TokenSymbol, @FromAddress, @ToAddress, @Amount)";

    public const string UpdateBalance = @"
        INSERT INTO balances (address, balance_hmnd, layer, updated_at)
        VALUES (@Address, @BalanceHmnd, @Layer, CURRENT_TIMESTAMP)
        ON CONFLICT(address) DO UPDATE SET
            balance_hmnd = excluded.balance_hmnd,
            updated_at = excluded.updated_at";

    // ========================================================================
    // CONSOLIDATED REPOSITORY PROCEDURES & SYSTEM CONSTANTS
    // ========================================================================
    public const string GetDailyPricesCountBase = "SELECT COUNT(*) FROM hmnd_daily_prices";
    public const string GetDailyPricesRatedBase = @"
        WITH rated AS (
            SELECT
                day, price_usd, swaps_count, source,
                LAG(price_usd) OVER (ORDER BY day ASC) AS prev_price
            FROM hmnd_daily_prices
            {0}
        )
        SELECT
            day, price_usd, swaps_count, source,
            CASE
                WHEN prev_price IS NOT NULL AND prev_price > 0
                THEN ((price_usd - prev_price) / prev_price) * 100
                ELSE 0
            END AS change_pct
        FROM rated
        {1}
        ORDER BY day DESC
        LIMIT @safeLimit OFFSET @offset";
    public const string GetCoingeckoAthPrice = "SELECT day, price_usd FROM hmnd_daily_prices WHERE source = 'COINGECKO' ORDER BY price_usd DESC LIMIT 1";
    public const string GetCoingeckoAtlPrice = "SELECT day, price_usd FROM hmnd_daily_prices WHERE source = 'COINGECKO' ORDER BY price_usd ASC LIMIT 1";
    public const string GetDailyPricesTotalDays = "SELECT COUNT(*) FROM hmnd_daily_prices";
    public const string GetCoingeckoSwapDays = "SELECT COUNT(*) FROM hmnd_daily_prices WHERE source = 'COINGECKO'";
    public const string GetEvmStatsSummaryBase = "SELECT COUNT(*) as cnt, COALESCE(SUM(fee_hmnd), 0) as fees, COALESCE(SUM(value_hmnd), 0) as vol FROM transactions";
    public const string GetSubstrateStatsSummaryBase = "SELECT COUNT(*) as cnt, COALESCE(SUM(fee_hmnd), 0) as fees, COALESCE(SUM(value_hmnd), 0) as vol FROM substrate_extrinsics";
    public const string GetBridgeNativeToEvmSwapsKpi = "SELECT COUNT(*) as cnt, COALESCE(SUM(value_hmnd), 0) as vol FROM substrate_extrinsics WHERE pallet = 'nativeToEvmSwap' AND status = 1";
    public const string GetAddressLabelsCountBase = "SELECT COUNT(*) FROM address_labels";
    public const string GetAddressLabelsBase = "SELECT address as Address, label as Label, category as Category, color as Color, notes as Notes, is_watched as IsWatched, updated_at as UpdatedAt FROM address_labels";
    public const string GetSubstrateExtrinsicsCountBase = "SELECT COUNT(*) FROM substrate_extrinsics";
    public const string GetGovernanceExtrinsicsBase = @"
        SELECT
            hash, block_number, timestamp,
            CASE 
                WHEN pallet = 'balances' AND signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault')
                THEN 'vesting'
                ELSE pallet
            END AS pallet,
            CASE 
                WHEN pallet = 'balances' AND signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault')
                THEN 'vestingTransfer'
                ELSE method
            END AS method,
            signer, target,
            value_hmnd, fee_hmnd, status,
            CASE 
                WHEN pallet = 'balances' AND signer IN (SELECT address FROM address_labels WHERE category = 'vesting_vault')
                THEN 'Vesting:unlock'
                ELSE details
            END AS details
        FROM substrate_extrinsics";
    public const string GetTransactionsCountBase = "SELECT COUNT(*) FROM transactions";

    public const string GetUnifiedTransactionsUnionTemplate = @"
        SELECT * FROM (
            SELECT * FROM (
                SELECT
                    'EVM' AS Layer,
                    hash AS Hash,
                    block_number AS BlockNumber,
                    timestamp AS Timestamp,
                    'Ethereum' AS Pallet,
                    'transact' AS Method,
                    from_address AS FromAddress,
                    to_address AS ToAddress,
                    value_hmnd AS ValueHmnd,
                    gas_used AS GasUsed,
                    fee_hmnd AS FeeHmnd,
                    status AS Status,
                    '' AS Details,
                    'HMND' AS Symbol
                FROM transactions
                {0}
                ORDER BY block_number DESC, timestamp DESC
                LIMIT @innerWindow
            )
            UNION ALL
            SELECT * FROM (
                SELECT
                    'SUBSTRATE' AS Layer,
                    hash AS Hash,
                    block_number AS BlockNumber,
                    timestamp AS Timestamp,
                    pallet AS Pallet,
                    method AS Method,
                    signer AS FromAddress,
                    target AS ToAddress,
                    value_hmnd AS ValueHmnd,
                    0 AS GasUsed,
                    fee_hmnd AS FeeHmnd,
                    status AS Status,
                    details AS Details,
                    'HMND' AS Symbol
                FROM substrate_extrinsics
                {1}
                ORDER BY block_number DESC, timestamp DESC
                LIMIT @innerWindow
            )
        )
        ORDER BY BlockNumber DESC, Timestamp DESC
        LIMIT @safeLimit OFFSET @offset";

    public const string GetUnifiedTransactionsEvmTemplate = @"
        SELECT
            'EVM' AS Layer,
            hash AS Hash,
            block_number AS BlockNumber,
            timestamp AS Timestamp,
            'Ethereum' AS Pallet,
            'transact' AS Method,
            from_address AS FromAddress,
            to_address AS ToAddress,
            value_hmnd AS ValueHmnd,
            gas_used AS GasUsed,
            fee_hmnd AS FeeHmnd,
            status AS Status,
            '' AS Details,
            'HMND' AS Symbol
        FROM transactions
        {0}
        ORDER BY block_number DESC, timestamp DESC
        LIMIT @safeLimit OFFSET @offset";

    public const string GetUnifiedTransactionsSubstrateTemplate = @"
        SELECT
            'SUBSTRATE' AS Layer,
            hash AS Hash,
            block_number AS BlockNumber,
            timestamp AS Timestamp,
            pallet AS Pallet,
            method AS Method,
            signer AS FromAddress,
            target AS ToAddress,
            value_hmnd AS ValueHmnd,
            0 AS GasUsed,
            fee_hmnd AS FeeHmnd,
            status AS Status,
            details AS Details,
            'HMND' AS Symbol
        FROM substrate_extrinsics
        {0}
        ORDER BY block_number DESC, timestamp DESC
        LIMIT @safeLimit OFFSET @offset";

    public const string GetAllSystemConfigs = "SELECT config_key as Key, config_value as Value, description as Description, updated_at as UpdatedAt FROM system_config";
    public const string GetSystemConfigByKey = "SELECT config_key as Key, config_value as Value, description as Description, updated_at as UpdatedAt FROM system_config WHERE config_key = @Key LIMIT 1";
    public const string UpsertSystemConfig = @"
        INSERT INTO system_config (config_key, config_value, description, updated_at)
        VALUES (@Key, @Value, @Description, @UpdatedAt)
        ON CONFLICT(config_key) DO UPDATE SET
            config_value = excluded.config_value,
            description = excluded.description,
            updated_at = excluded.updated_at";
    public const string GetDexPoolAddresses = "SELECT address FROM address_labels WHERE category = 'dex'";
    public const string GetVestingVaultAddresses = "SELECT address FROM address_labels WHERE category = 'vesting_vault'";
    public const string GetValidatorPayoutsTotals = "SELECT COUNT(*) as c, COALESCE(SUM(amount_hmnd), 0) as vol FROM validator_payouts";
    public const string WhaleTokenTransfersSubquery = "SELECT tx_hash FROM token_transfers WHERE amount >= 100000";

    public const string GetBioauthFeedCountBase = @"
        SELECT COUNT(*) 
        FROM substrate_extrinsics b
        LEFT JOIN cross_layer_links c ON b.signer = c.substrate_address";

    public const string GetBioauthFeedBase = @"
        SELECT 
            b.hash as TxHash,
            b.block_number as BlockNumber,
            b.timestamp as Timestamp,
            b.signer as Signer,
            b.method as Method,
            b.status as Status,
            COALESCE(b.details, 'Proof-of-Humanity') as Details,
            'Humanode Root L1' as Network,
            c.evm_address as EvmCounterpart
        FROM substrate_extrinsics b
        LEFT JOIN cross_layer_links c ON b.signer = c.substrate_address
        {0}
        ORDER BY b.block_number DESC
        LIMIT @limit OFFSET @offset";

    public const string GetChartUnionEvmBase = "SELECT 'EVM' as layer, timestamp, fee_hmnd as fee, value_hmnd as val FROM transactions";
    public const string GetChartUnionSubstrateBase = "SELECT 'SUB' as layer, timestamp, fee_hmnd as fee, value_hmnd as val FROM substrate_extrinsics";
    public const string GetUnifiedChartGroupTemplate = @"
        SELECT 
            {0} as Day,
            {0} as Period,
            MIN(timestamp) as Timestamp,
            SUM(CASE WHEN layer = 'EVM' THEN 1 ELSE 0 END) as TxCount,
            SUM(CASE WHEN layer = 'SUB' THEN 1 ELSE 0 END) as ExtrinsicsCount,
            ROUND(COALESCE(SUM(fee), 0), 4) as TotalFeesHmnd,
            ROUND(COALESCE(SUM(val), 0), 2) as TotalVolumeHmnd
        FROM (
            {1}
        )
        GROUP BY Day
        ORDER BY Day ASC";
}
