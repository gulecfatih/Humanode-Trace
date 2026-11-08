using System.Text.Json.Serialization;

namespace HumanodeTracker.Models;

// 1. Overview & Stats
public class StatsDto
{
    [JsonPropertyName("total_blocks")]
    public long TotalBlocks { get; set; }

    [JsonPropertyName("total_transactions")]
    public long TotalTransactions { get; set; }

    [JsonPropertyName("total_extrinsics")]
    public long TotalExtrinsics { get; set; }

    [JsonPropertyName("total_token_transfers")]
    public long TotalTokenTransfers { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("total_fees_usd")]
    public double TotalFeesUsd { get; set; }

    [JsonPropertyName("active_validators")]
    public int ActiveValidators { get; set; }

    [JsonPropertyName("active_tokens_count")]
    public int ActiveTokensCount { get; set; }

    [JsonPropertyName("last_block_number")]
    public long LastBlockNumber { get; set; }

    [JsonPropertyName("last_block_time")]
    public long LastBlockTime { get; set; }

    [JsonPropertyName("chain_status")]
    public string ChainStatus { get; set; } = "healthy";

    [JsonPropertyName("hmnd_price_usd")]
    public double HmndPriceUsd { get; set; }

    [JsonPropertyName("circulating_supply")]
    public double CirculatingSupply { get; set; }

    [JsonPropertyName("bridge_swap_volume_hmnd")]
    public double BridgeSwapVolumeHmnd { get; set; }

    [JsonPropertyName("bridge_swap_count")]
    public long BridgeSwapCount { get; set; }

    [JsonPropertyName("evm_fees_hmnd")]
    public double EvmFeesHmnd { get; set; }

    [JsonPropertyName("evm_volume_hmnd")]
    public double EvmVolumeHmnd { get; set; }

    [JsonPropertyName("sub_fees_hmnd")]
    public double SubFeesHmnd { get; set; }

    [JsonPropertyName("sub_volume_hmnd")]
    public double SubVolumeHmnd { get; set; }
}

public class DailyStatsDto
{
    [JsonPropertyName("day")]
    public string Day { get; set; } = "";

    [JsonPropertyName("period")]
    public string Period { get; set; } = "";

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("tx_count")]
    public long TxCount { get; set; }

    [JsonPropertyName("extrinsics_count")]
    public long ExtrinsicsCount { get; set; }

    [JsonPropertyName("token_tx_count")]
    public long TokenTxCount { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("fees_usd")]
    public double FeesUsd { get; set; }

    [JsonPropertyName("total_fees_usd")]
    public double TotalFeesUsd { get; set; }

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; }
}

// 2. Transactions & Blocks
public class TransactionDto
{
    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "EVM";

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("from_address")]
    public string FromAddress { get; set; } = "";

    [JsonPropertyName("to_address")]
    public string ToAddress { get; set; } = "";

    [JsonPropertyName("value_hmnd")]
    public double ValueHmnd { get; set; }

    [JsonPropertyName("fee_hmnd")]
    public double FeeHmnd { get; set; }

    [JsonPropertyName("gas_used")]
    public long GasUsed { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("pallet")]
    public string? Pallet { get; set; }

    [JsonPropertyName("method")]
    public string? Method { get; set; }

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "HMND";

    [JsonPropertyName("tokenTransfers")]
    public List<TokenTransferItemDto>? TokenTransfers { get; set; }
}

public class TokenTransferItemDto
{
    [JsonPropertyName("token_address")]
    public string TokenAddress { get; set; } = "";

    [JsonPropertyName("token_symbol")]
    public string TokenSymbol { get; set; } = "";

    [JsonPropertyName("from_address")]
    public string FromAddress { get; set; } = "";

    [JsonPropertyName("to_address")]
    public string ToAddress { get; set; } = "";

    [JsonPropertyName("amount")]
    public double Amount { get; set; }
}

public class BlockDto
{
    [JsonPropertyName("number")]
    public long Number { get; set; }

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("parent_hash")]
    public string? ParentHash { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("evm_tx_count")]
    public int EvmTxCount { get; set; }

    [JsonPropertyName("sub_tx_count")]
    public int SubTxCount { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("author")]
    public string? Author { get; set; }

    [JsonPropertyName("transactions")]
    public List<TransactionDto>? Transactions { get; set; }
}

// 3. Whale Transactions
public class WhaleTransactionDto
{
    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "SUBSTRATE";

    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block_number")]
    public long BlockNumber { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("pallet")]
    public string? Pallet { get; set; }

    [JsonPropertyName("method")]
    public string? Method { get; set; }

    [JsonPropertyName("sender")]
    public string Sender { get; set; } = "";

    [JsonPropertyName("target")]
    public string Target { get; set; } = "";

    [JsonPropertyName("value_hmnd")]
    public double ValueHmnd { get; set; }

    [JsonPropertyName("fee_hmnd")]
    public double FeeHmnd { get; set; }

    [JsonPropertyName("gas_used")]
    public long GasUsed { get; set; }

    [JsonPropertyName("status")]
    public int Status { get; set; } = 1;

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "HMND";

    [JsonPropertyName("details")]
    public string? Details { get; set; }

    [JsonPropertyName("tier")]
    public string Tier { get; set; } = "whale";

    [JsonPropertyName("tag")]
    public string Tag { get; set; } = "🐋 Balina";

    [JsonPropertyName("price_usd")]
    public double PriceUsd { get; set; }

    [JsonPropertyName("usd_est")]
    public double UsdEst { get; set; }
}

// 4. Tokenomics
public class TokenomicsDto
{
    [JsonPropertyName("totalIssuance")]
    public double TotalIssuance { get; set; } = 400000000;

    [JsonPropertyName("burnedTotal")]
    public double BurnedTotal { get; set; }

    [JsonPropertyName("effectiveSupply")]
    public double EffectiveSupply { get; set; }

    [JsonPropertyName("claimableAirdrop")]
    public double ClaimableAirdrop { get; set; } = 14114881.07;

    [JsonPropertyName("feesPotBalance")]
    public double FeesPotBalance { get; set; } = 403162.33;

    [JsonPropertyName("lockedVesting")]
    public double LockedVesting { get; set; }

    [JsonPropertyName("circulatingEstimate")]
    public double CirculatingEstimate { get; set; } = 285970432.10;

    [JsonPropertyName("source")]
    public string Source { get; set; } = "Official Humanode Native Supply API (supply-api.mainnet.stages.humanode.io)";
}

// 5. Tokens Directory
public class TokenDto
{
    [JsonPropertyName("token_address")]
    public string TokenAddress { get; set; } = "";

    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "";

    [JsonPropertyName("token_symbol")]
    public string TokenSymbol { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("token_name")]
    public string TokenName { get; set; } = "";

    [JsonPropertyName("decimals")]
    public int Decimals { get; set; } = 18;

    [JsonPropertyName("transfer_count")]
    public long TransferCount { get; set; }

    [JsonPropertyName("total_volume")]
    public double TotalVolume { get; set; }

    [JsonPropertyName("unique_senders")]
    public int UniqueSenders { get; set; }

    [JsonPropertyName("unique_holders")]
    public int UniqueHolders { get; set; }

    [JsonPropertyName("first_seen")]
    public long FirstSeen { get; set; }

    [JsonPropertyName("last_seen")]
    public long LastSeen { get; set; }

    [JsonPropertyName("category")]
    public string Category { get; set; } = "ERC-20 Token";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "violet";
}

// 6. Leaderboard
public class LeaderboardDto
{
    [JsonPropertyName("topBalances")]
    public List<LeaderboardItemDto> TopBalances { get; set; } = new();

    [JsonPropertyName("topBalancesEvm")]
    public List<LeaderboardItemDto> TopBalancesEvm { get; set; } = new();

    [JsonPropertyName("topBalancesSubstrate")]
    public List<LeaderboardItemDto> TopBalancesSubstrate { get; set; } = new();

    [JsonPropertyName("topSenders")]
    public List<LeaderboardItemDto> TopSenders { get; set; } = new();

    [JsonPropertyName("topSendersEvm")]
    public List<LeaderboardItemDto> TopSendersEvm { get; set; } = new();

    [JsonPropertyName("topSendersSubstrate")]
    public List<LeaderboardItemDto> TopSendersSubstrate { get; set; } = new();

    [JsonPropertyName("topVolume")]
    public List<LeaderboardItemDto> TopVolume { get; set; } = new();

    [JsonPropertyName("topVolumeEvm")]
    public List<LeaderboardItemDto> TopVolumeEvm { get; set; } = new();

    [JsonPropertyName("topVolumeSubstrate")]
    public List<LeaderboardItemDto> TopVolumeSubstrate { get; set; } = new();

    [JsonPropertyName("topFeeSpenders")]
    public List<LeaderboardItemDto> TopFeeSpenders { get; set; } = new();

    [JsonPropertyName("topFeeSpendersEvm")]
    public List<LeaderboardItemDto> TopFeeSpendersEvm { get; set; } = new();

    [JsonPropertyName("topFeeSpendersSubstrate")]
    public List<LeaderboardItemDto> TopFeeSpendersSubstrate { get; set; } = new();
}

public class LeaderboardItemDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "";

    [JsonPropertyName("total_txs")]
    public long TotalTxs { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("total_fees_hmnd")]
    public double TotalFeesHmnd { get; set; }

    [JsonPropertyName("balance_hmnd")]
    public double BalanceHmnd { get; set; }

    [JsonPropertyName("last_seen")]
    public long LastSeen { get; set; }
}

// 7. FeesPot & Validator Economics
public class FeesPotAnalyticsDto
{
    [JsonPropertyName("feesPotAddress")]
    public string FeesPotAddress { get; set; } = "";

    [JsonPropertyName("currentBalance")]
    public double CurrentBalance { get; set; }

    [JsonPropertyName("totalBatches")]
    public int TotalBatches { get; set; }

    [JsonPropertyName("burnedTotal")]
    public double BurnedTotal { get; set; }

    [JsonPropertyName("totalInflowHmnd")]
    public double TotalInflowHmnd { get; set; }

    [JsonPropertyName("directTransfersHmnd")]
    public double DirectTransfersHmnd { get; set; }

    [JsonPropertyName("genesisReserveHmnd")]
    public double GenesisReserveHmnd { get; set; }

    [JsonPropertyName("incomingTransfers")]
    public List<IncomingTransferItemDto> IncomingTransfers { get; set; } = new();

    [JsonPropertyName("runwayRounds")]
    public double RunwayRounds { get; set; }

    [JsonPropertyName("runwayDays")]
    public int RunwayDays { get; set; }

    [JsonPropertyName("lastBatch")]
    public PayoutBatchSummaryDto? LastBatch { get; set; }

    [JsonPropertyName("nextEstimatedTs")]
    public long NextEstimatedTs { get; set; }

    [JsonPropertyName("history")]
    public List<PayoutBatchItemDto> History { get; set; } = new();
}

public class PayoutBatchSummaryDto
{
    [JsonPropertyName("block")]
    public long Block { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("recipientCount")]
    public int RecipientCount { get; set; }

    [JsonPropertyName("samplePerValidator")]
    public double SamplePerValidator { get; set; }
}

public class PayoutBatchItemDto
{
    [JsonPropertyName("block")]
    public long Block { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("recipientCount")]
    public int RecipientCount { get; set; }

    [JsonPropertyName("totalDistributed")]
    public double TotalDistributed { get; set; }

    [JsonPropertyName("samplePerValidator")]
    public double SamplePerValidator { get; set; }
}

public class IncomingTransferItemDto
{
    [JsonPropertyName("hash")]
    public string Hash { get; set; } = "";

    [JsonPropertyName("block")]
    public long Block { get; set; }

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("signer")]
    public string Signer { get; set; } = "";

    [JsonPropertyName("amount")]
    public double Amount { get; set; }

    [JsonPropertyName("pallet")]
    public string Pallet { get; set; } = "";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "DIRECT_TRANSFER";
}

public class ValidatorHealthDto
{
    [JsonPropertyName("totalValidators")]
    public int TotalValidators { get; set; }

    [JsonPropertyName("activeValidators")]
    public int ActiveValidators { get; set; }

    [JsonPropertyName("offlineCount")]
    public int OfflineCount { get; set; }

    [JsonPropertyName("totalBioauth")]
    public int TotalBioauth { get; set; }

    [JsonPropertyName("totalHeartbeats")]
    public int TotalHeartbeats { get; set; }

    [JsonPropertyName("fees_pot_address")]
    public string FeesPotAddress { get; set; } = "";

    [JsonPropertyName("fees_pot_balance_hmnd")]
    public double FeesPotBalanceHmnd { get; set; }

    [JsonPropertyName("last_payout_block")]
    public long LastPayoutBlock { get; set; }

    [JsonPropertyName("last_payout_ts")]
    public long LastPayoutTs { get; set; }

    [JsonPropertyName("last_payout_per_validator")]
    public double LastPayoutPerValidator { get; set; }

    [JsonPropertyName("est_round_per_validator")]
    public double EstRoundPerValidator { get; set; }

    [JsonPropertyName("validators")]
    public List<ValidatorItemDto> Validators { get; set; } = new();
}

public class ValidatorItemDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; }

    [JsonPropertyName("status_label")]
    public string StatusLabel { get; set; } = "Aktif (Doğrulanmış)";

    [JsonPropertyName("blocks_authored")]
    public int BlocksAuthored { get; set; }

    [JsonPropertyName("total_blocks")]
    public int TotalBlocks => BlocksAuthored;

    [JsonPropertyName("recent_blocks")]
    public int RecentBlocks { get; set; }

    [JsonPropertyName("is_bio_valid")]
    public bool IsBioValid { get; set; }

    [JsonPropertyName("bio_expires_at")]
    public long? BioExpiresAt => ExpiresAtSec;

    [JsonPropertyName("bio_remaining_seconds")]
    public long? BioRemainingSeconds => SecondsLeft;

    [JsonPropertyName("bio_remaining_hours")]
    public double? BioRemainingHours => SecondsLeft.HasValue ? Math.Round(SecondsLeft.Value / 3600.0, 1) : null;

    [JsonPropertyName("total_bioauth")]
    public int TotalBioauth { get; set; }

    [JsonPropertyName("bio_current_epoch")]
    public int BioCurrentEpoch { get; set; }

    [JsonPropertyName("total_earned_hmnd")]
    public double TotalEarnedHmnd { get; set; }

    [JsonPropertyName("payout_rounds")]
    public int PayoutRounds { get; set; }

    [JsonPropertyName("last_payout_hmnd")]
    public double LastPayoutHmnd { get; set; }

    [JsonPropertyName("cadence_hours")]
    public double CadenceHours { get; set; } = 4.0;

    [JsonPropertyName("last_seen")]
    public long? LastSeen { get; set; }

    [JsonPropertyName("last_authored_block")]
    public long? LastAuthoredBlock { get; set; }

    [JsonPropertyName("last_authored_ts")]
    public long? LastAuthoredTs { get; set; }

    [JsonPropertyName("last_heartbeat_ts")]
    public long? LastHeartbeatTs { get; set; }

    [JsonPropertyName("last_bioauth_ts")]
    public long? LastBioauthTs { get; set; }

    [JsonPropertyName("expires_at_sec")]
    public long? ExpiresAtSec { get; set; }

    [JsonPropertyName("seconds_left")]
    public long? SecondsLeft { get; set; }

    [JsonPropertyName("key_updates")]
    public int KeyUpdates { get; set; }

    [JsonPropertyName("total_ops")]
    public int TotalOps { get; set; }

    [JsonPropertyName("balance_hmnd")]
    public double BalanceHmnd { get; set; }
}

// 8. Major Wallets & Directory
public class MajorWalletDto
{
    [JsonPropertyName("category")]
    public string Category { get; set; } = "whale";

    [JsonPropertyName("layer")]
    public string Layer { get; set; } = "Substrate";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = "";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "#3b82f6";

    [JsonPropertyName("tx_count")]
    public long TxCount { get; set; }

    [JsonPropertyName("in_count")]
    public long InCount { get; set; }

    [JsonPropertyName("out_count")]
    public long OutCount { get; set; }

    [JsonPropertyName("inflow_hmnd")]
    public double InflowHmnd { get; set; }

    [JsonPropertyName("outflow_hmnd")]
    public double OutflowHmnd { get; set; }

    [JsonPropertyName("total_volume_hmnd")]
    public double TotalVolumeHmnd { get; set; }

    [JsonPropertyName("live_balance_hmnd")]
    public double LiveBalanceHmnd { get; set; }

    [JsonPropertyName("balance_usd")]
    public double BalanceUsd { get; set; }
}

// 9. Governance & Multisig
public class GovernanceAnalyticsDto
{
    [JsonPropertyName("sudoKey")]
    public string SudoKey { get; set; } = "";

    [JsonPropertyName("totalSudoCalls")]
    public int TotalSudoCalls { get; set; }

    [JsonPropertyName("recentSudoCalls")]
    public List<object> RecentSudoCalls { get; set; } = new();

    [JsonPropertyName("multisigStats")]
    public MultisigStatsDto MultisigStats { get; set; } = new();

    [JsonPropertyName("recentMultisigCalls")]
    public List<object> RecentMultisigCalls { get; set; } = new();

    [JsonPropertyName("specVersion")]
    public int SpecVersion { get; set; } = 135;

    [JsonPropertyName("chain")]
    public string Chain { get; set; } = "Humanode Mainnet";
}

public class MultisigStatsDto
{
    [JsonPropertyName("total_txs")]
    public int TotalTxs { get; set; }

    [JsonPropertyName("unique_signers")]
    public int UniqueSigners { get; set; }
}

// 10. Labels & Watchlist
public class AddressLabelDto
{
    [JsonPropertyName("address")]
    public string Address { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "custom";

    [JsonPropertyName("color")]
    public string Color { get; set; } = "cyan";

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = "";

    [JsonPropertyName("is_watched")]
    public int IsWatched { get; set; } = 1;

    [JsonPropertyName("updated_at")]
    public long UpdatedAt { get; set; }
}

// 11. Localization & Languages (SQL-Driven)
public class LanguageItemDto
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = "";

    [JsonPropertyName("flag")]
    public string Flag { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("nativeName")]
    public string NativeName { get; set; } = "";

    [JsonPropertyName("country")]
    public string Country { get; set; } = "";

    [JsonPropertyName("isDefault")]
    public bool IsDefault { get; set; }
}
