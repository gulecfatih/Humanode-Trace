-- =============================================================
-- HUMANODE TRACKER - SQLITE DATABASE SCHEMA & SEED DATA
-- =============================================================

CREATE TABLE address_labels (
        address TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        color TEXT DEFAULT '#4f46e5',
        notes TEXT DEFAULT '',
        is_watched INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

CREATE TABLE app_languages (
    code TEXT PRIMARY KEY,
    flag TEXT NOT NULL,
    label TEXT NOT NULL,
    native_name TEXT NOT NULL,
    country TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE app_translations (
    lang_code TEXT NOT NULL,
    translation_key TEXT NOT NULL,
    translation_value TEXT NOT NULL,
    updated_at INTEGER,
    PRIMARY KEY (lang_code, translation_key)
);

CREATE TABLE blocks_with_tx (
        number INTEGER PRIMARY KEY,
        timestamp INTEGER,
        tx_count INTEGER,
        gas_used INTEGER,
        total_fees_hmnd REAL
      , author_id TEXT DEFAULT '');

CREATE TABLE cross_layer_links (
    substrate_address TEXT NOT NULL,
    evm_address TEXT NOT NULL,
    total_swapped_hmnd REAL DEFAULT 0,
    swap_count INTEGER DEFAULT 0,
    first_swap_block INTEGER,
    last_swap_block INTEGER,
    first_swap_ts INTEGER,
    last_swap_ts INTEGER,
    PRIMARY KEY (substrate_address, evm_address)
  );

CREATE TABLE hmnd_daily_prices (
    day TEXT PRIMARY KEY,
    price_usd REAL NOT NULL,
    swaps_count INTEGER DEFAULT 0,
    source TEXT DEFAULT 'DEX_SWAP'
  );

CREATE TABLE substrate_extrinsics (
        hash TEXT PRIMARY KEY,
        block_number INTEGER,
        timestamp INTEGER,
        pallet TEXT,
        method TEXT,
        signer TEXT,
        target TEXT,
        value_hmnd REAL,
        fee_hmnd REAL,
        status INTEGER,
        details TEXT
      );

CREATE TABLE sync_state (
        key TEXT PRIMARY KEY,
        value TEXT
      );

CREATE TABLE token_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_hash TEXT,
        block_number INTEGER,
        timestamp INTEGER,
        token_address TEXT,
        token_symbol TEXT,
        from_address TEXT,
        to_address TEXT,
        amount REAL
      );

CREATE TABLE tokens_cache (
        address TEXT PRIMARY KEY,
        symbol TEXT,
        decimals INTEGER,
        name TEXT
      );

CREATE TABLE transactions (
        hash TEXT PRIMARY KEY,
        block_number INTEGER,
        timestamp INTEGER,
        from_address TEXT,
        to_address TEXT,
        value_wei TEXT,
        value_hmnd REAL,
        gas_used INTEGER,
        effective_gas_price TEXT,
        fee_wei TEXT,
        fee_hmnd REAL,
        status INTEGER
      );

CREATE TABLE wallet_balances_cache (
        address TEXT PRIMARY KEY,
        balance_hmnd REAL NOT NULL,
        updated_at INTEGER NOT NULL
      );

CREATE INDEX idx_app_translations_lang ON app_translations (lang_code);

CREATE INDEX idx_b_author ON blocks_with_tx(author_id, timestamp);

CREATE INDEX idx_b_timestamp ON blocks_with_tx(timestamp);

CREATE INDEX idx_cl_evm ON cross_layer_links(evm_address);

CREATE INDEX idx_cl_sub ON cross_layer_links(substrate_address);

CREATE INDEX idx_hmnd_price_day ON hmnd_daily_prices(day);

CREATE INDEX idx_labels_category ON address_labels(category);

CREATE INDEX idx_labels_updated ON address_labels(updated_at DESC);

CREATE INDEX idx_labels_watched ON address_labels(is_watched) WHERE is_watched = 1;

CREATE INDEX idx_sub_active_val ON substrate_extrinsics(timestamp, fee_hmnd, value_hmnd) WHERE fee_hmnd > 0 OR value_hmnd > 0;

CREATE INDEX idx_sub_bioauth ON substrate_extrinsics(signer, method, timestamp) WHERE pallet = 'bioauth';

CREATE INDEX idx_sub_block ON substrate_extrinsics(block_number);

CREATE INDEX idx_sub_eco_pallets ON substrate_extrinsics(pallet, timestamp DESC, block_number DESC, signer, value_hmnd, status) WHERE pallet IN ('vesting', 'tokenClaims', 'nativeToEvmSwap', 'currencySwap', 'multisig');

CREATE INDEX idx_sub_fee_pos ON substrate_extrinsics(block_number DESC, timestamp, pallet, fee_hmnd, value_hmnd, status) WHERE fee_hmnd > 0.000001;

CREATE INDEX idx_sub_pallet ON substrate_extrinsics(pallet);

CREATE INDEX idx_sub_pallet_signer_val ON substrate_extrinsics(pallet, signer, value_hmnd);

CREATE INDEX idx_sub_pallet_ts ON substrate_extrinsics(pallet, timestamp DESC);

CREATE INDEX idx_sub_session ON substrate_extrinsics(signer, method, timestamp) WHERE pallet = 'session';

CREATE INDEX idx_sub_signer ON substrate_extrinsics(signer);

CREATE INDEX idx_sub_signer_active ON substrate_extrinsics(signer, value_hmnd, fee_hmnd, timestamp) WHERE signer > '';

CREATE INDEX idx_sub_signer_cov ON substrate_extrinsics(signer, value_hmnd, fee_hmnd, timestamp, target);

CREATE INDEX idx_sub_signer_ts ON substrate_extrinsics(signer, timestamp DESC, block_number DESC);

CREATE INDEX idx_sub_target ON substrate_extrinsics(target);

CREATE INDEX idx_sub_target_cov ON substrate_extrinsics(target, value_hmnd, timestamp, signer);

CREATE INDEX idx_sub_target_ts ON substrate_extrinsics(target, timestamp DESC, block_number DESC);

CREATE INDEX idx_sub_timestamp ON substrate_extrinsics(timestamp);

CREATE INDEX idx_sub_val_pos ON substrate_extrinsics(value_hmnd, signer, target, timestamp, block_number) WHERE value_hmnd > 0;

CREATE INDEX idx_tt_from ON token_transfers(from_address);

CREATE INDEX idx_tt_from_cov ON token_transfers(from_address, token_address, amount, token_symbol);

CREATE INDEX idx_tt_from_ts ON token_transfers(from_address, timestamp DESC, block_number DESC);

CREATE INDEX idx_tt_hash ON token_transfers(tx_hash);

CREATE INDEX idx_tt_timestamp ON token_transfers(timestamp);

CREATE INDEX idx_tt_to ON token_transfers(to_address);

CREATE INDEX idx_tt_to_cov ON token_transfers(to_address, token_address, amount, token_symbol);

CREATE INDEX idx_tt_to_ts ON token_transfers(to_address, timestamp DESC, block_number DESC);

CREATE INDEX idx_tt_token ON token_transfers(token_address);

CREATE INDEX idx_tx_block ON transactions(block_number);

CREATE INDEX idx_tx_fee_pos ON transactions(block_number DESC, timestamp, fee_hmnd, value_hmnd, status) WHERE fee_hmnd > 0.000001;

CREATE INDEX idx_tx_from ON transactions(from_address);

CREATE INDEX idx_tx_from_cov ON transactions(from_address, to_address, value_hmnd, fee_hmnd, timestamp);

CREATE INDEX idx_tx_from_ts ON transactions(from_address, timestamp DESC, block_number DESC);

CREATE INDEX idx_tx_timestamp ON transactions(timestamp);

CREATE INDEX idx_tx_to ON transactions(to_address);

CREATE INDEX idx_tx_to_cov ON transactions(to_address, from_address, value_hmnd, timestamp);

CREATE INDEX idx_tx_to_ts ON transactions(to_address, timestamp DESC, block_number DESC);

CREATE INDEX idx_tx_val_pos ON transactions(value_hmnd, from_address, to_address, timestamp, block_number) WHERE value_hmnd > 0;


-- -------------------------------------------------------------
-- Initial Seed Data: app_languages
-- -------------------------------------------------------------

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('tr', '🇹🇷', 'Türkçe', 'Türkçe', 'Türkiye', 1, 0);

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('en', '🇬🇧', 'English', 'English', 'Global / UK', 0, 1);

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('de', '🇩🇪', 'Deutsch', 'Deutsch', 'Deutschland', 0, 2);

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('ru', '🇷🇺', 'Русский', 'Русский', 'Россия', 0, 3);

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('es', '🇪🇸', 'Español', 'Español', 'España', 0, 4);

INSERT OR REPLACE INTO app_languages (code, flag, label, native_name, country, is_default, display_order) VALUES ('zh', '🇨🇳', '简体中文', '简体中文', '中国', 0, 5);


-- -------------------------------------------------------------
-- Initial Seed Data: app_translations (Core UI Strings)
-- -------------------------------------------------------------

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'appTitle', 'Humanode Takip Paneli');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'search', 'Arama');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'searchPlaceholder', 'Adres, İşlem Hash veya Blok # ara...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'refresh', 'Sayfayı Yenile');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'menuTitle', 'Menü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'collapseMenu', 'Menüyü Daralt');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'expandMenu', 'Menüyü Genişlet');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'selectLanguage', 'DİL SEÇİN');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'copied', 'Kopyalandı!');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'copy', 'Kopyala');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'preview', 'Önizle');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'inspect', 'İncele');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'close', 'Kapat');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'actions', 'Eylemler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'loading', 'Yükleniyor...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCatNetwork', 'AĞ & BLOKLAR');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCatEconomics', 'EKONOMİ & ARZ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCatValidators', 'BİYOMETRİ & VALİDATÖR');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCatTokens', 'TOKENLAR & DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCatWallets', 'CÜZDAN & İZ SÜRME');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navOverview', 'Ağ Takibi & Bloklar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navDirectory', 'Borsa & Önemli Cüzdanlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navWhales', 'Balina Radarı & Watchlist');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navLeaderboard', 'Lider Tablosu (Top 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navTokens', 'Dolaşımdaki Tokenlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navTokenomics', 'Token Ekonomisi (400M)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navValidators', 'Biyometri & Validatörler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navFeesPot', 'FeesPot & Kârlılık');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navGovernance', 'DAO & Sudo Masası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navHeatmap', '7x24 Gas Isı Haritası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navLedger', 'Cüzdan Hesap Defteri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navMoneytrail', 'Para İzi (Multi-Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navCompare', 'Cüzdan Karşılaştır');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navRates', 'Tarihsel Kurlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navUnlocks', 'Kilit Açılımı & Vesting');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navBridge', 'Çift Katman Köprüsü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navHodlers', 'Cüzdan Sahipleri (Hodlers)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navEquality', 'Biyometrik Adalet');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navBiomapper', 'Biomapper (20+ Ağ Kontratı)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'navDexDepth', 'DEX Derinlik & 4-Byte');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'addrZeroLabel', 'Sıfır Adres (Genesis/Burn)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'addrFeespotLabel', 'FeesPot Ödül Kasası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'addrSystemReserveLabel', 'Sistem Rezerv Dağıtıcı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'copyAddress', 'Adresi Kopyala');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'scrollToTop', 'Yukarı Dön');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdPlaceholder', 'Cüzdan adresi (0x... veya hm...), Tx Hash veya Blok #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdQuickNav', 'HIZLI SEKME GEÇİŞİ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdGo', 'Git ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdBlockResult', 'Blok Arama Sonucu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdWalletResult', 'Cüzdan Arama Sonucu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdTxResult', 'İşlem Arama Sonucu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdInspectWallet', 'Bu adresi Hesap Defterinde ve Profilde İncele ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdInspectBlock', 'Bu bloğu ve içindeki tüm işlemleri incele ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'cmdInspectTx', 'Bu işlemin gaz, transfer ve yürütme detayları ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekTitle', 'Cüzdan Hızlı Önizleme');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekEvm', 'EVM Katmanı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekSub', 'Substrate Katmanı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekAddress', 'CÜZDAN ADRESİ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekNetBalance', 'NET BAKİYE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekTotalTxs', 'TOPLAM İŞLEM');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekInflow', 'GELEN TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekOutflow', 'GİDEN TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekPaidGas', 'ÖDENEN GAZ (FEE)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekOpenLedger', 'Hesap Defterini Aç');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekTraceMoney', 'Para İzini Takip Et');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'quickPeekAddToCompare', 'Karşılaştırmaya Ekle');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'syncStatus', 'İndeksleme Durumu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'blocksPerSec', 'blok/sn');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalEvmTx', 'Toplam EVM İşlemleri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalEvmTxSub', 'Akıllı Sözleşmeler & Takaslar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalSubExtrinsics', 'Substrate Extrinsikleri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalSubExtrinsicsSub', 'Biyometri & Konsensüs');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridgeTransfers', 'Substrate ➔ EVM Aktarımı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridgeTransfersSub', 'hm... Cüzdanından 0x... Cüzdanına Geçen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalBurnedGas', 'Toplam Gas Ücreti (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalBurnedGasSub', 'Kümülatif Borsa Kurlarıyla:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_totalBurnedCoins', 'Toplam Yakılan Coin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalBurnedCoins', 'Toplam Yakılan Coin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_burnedCoins', 'Yakılan Coin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_burnContract', 'Yakma Kontratı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_burnTxCountSuffix', 'işlem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unifiedTitle', 'Ağ Blokları, İşlemler ve Gas Analiz Masası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unifiedDesc', 'Tarih aralığı, katman ve modül filtreleriyle tam uyumlu kümülatif gas ve aktivite raporu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'viewBlocks', 'Bloklar (Gruplu)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'viewTxs', 'Tekil İşlemler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dateRangePresets', '📅 Tarih Aralığı & Hızlı Dönem Filtreleri:');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'presetAll', 'Tümü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'presetToday', 'Bugün');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'presetYesterday', 'Dün');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'preset7d', 'Son 7 Gün');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'preset30d', 'Son 30 Gün');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'preset1y', '2026 (Bu Yıl)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'startDate', 'Başlangıç Tarih & Saati');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'endDate', 'Bitiş Tarih & Saati');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layer', 'Katman');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layerAll', 'Tüm Katmanlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layerEvm', 'Katman 2: EVM (0x...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layerSub', 'Katman 1: Substrate (hm...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'module', 'Protokol / Modül');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'moduleAll', 'Tüm Modüller');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'hideZeroFee', 'Sıfır Ücretli Kalp Atışlarını Gizle');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'resetFilters', 'Filtreleri Temizle');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiReportTitle', 'Seçili Dönem: Bloklar & Gas Ücreti Hesaplama Raporu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiBurnedGas', '⛽ Gas Ücreti');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiBurnedGasSub', 'Dönem içi günlük borsa kurlarıyla kümülatif net hesaplama');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalBlocks', '📦 Toplam Blok');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalBlocksSub', 'Dizilen ve filtrelenen blok adedi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalTxs', '⚡ Toplam İşlem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalVol', '💰 Toplam Hacim');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalVolSub', 'Transfer edilen toplam miktar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiAvgGas', '⛽ Blok Başına Gas');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiAvgGasSub', 'Blok başına ortalama gas masrafı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'chartTitle', 'Dönemsel Dağılım Çizelgesi (Grafik çubuğuna tıklayarak o dönemin bloklarını süzebilirsiniz)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'metricFee', 'Gas Ücreti');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'metricCount', 'İşlem Sayısı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'metricVol', 'Hacim');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'intervalDay', 'Günlük');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'intervalWeek', 'Haftalık');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'intervalMonth', 'Aylık');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'intervalYear', 'Yıllık');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'chartLoading', 'Aktivite ve gas verileri hesaplanıyor...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'chartEmpty', 'Bu filtre için çizelge verisi bulunamadı.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'searchPlaceholderOverview', 'Blok # (örn: 20448544), 0x... veya hm... cüzdanı, Tx Hash...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'filterAndSearch', 'Filtrele & Ara');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'blocksTableTitle', '📦 Ağ Blokları (Canlı Gruplu Blok Akışı)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'blocksTableTitleFiltered', '📦 Belirlenen Tarihteki Ağ Blokları');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txsTableTitle', '⚡ İşlemler & Extrinsikler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'pageInfo', 'Sayfa {page} / {totalPages} (Toplam {total} kayıt)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colBlock', 'Blok #');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colTimestamp', 'Zaman Damgası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colTxCount', 'İşlem Sayısı & Dağılım');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colPallets', 'Protokol / Palletler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colBlockVol', 'Blok Transfer Hacmi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colBlockFee', 'Bu Bloktaki Gas Ücreti (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colActions', 'Eylemler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colTxHash', 'İşlem Hash / Extrinsic');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colLayerPallet', 'Katman & Metot');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colSender', 'Gönderen (Signer)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colRecipient', 'Alıcı / Hedef');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colAmount', 'Transfer Tutarı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colFee', 'Ödenen Gas (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colStatus', 'Durum');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'statusSuccess', 'BAŞARILI');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'statusFailed', 'BAŞARISIZ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirTitle', 'Borsa, Hazine & Önemli Cüzdanlar Dizini');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirSubtitle', 'Merkezi borsa sıcak cüzdanları (CEX), Humanode sistem/hazine kasaları, büyük balinalar ve DEX/köprü sözleşmeleri — kopyalayabilir veya doğrudan inceleyebilirsiniz.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirSearchPlaceholder', 'Borsa adı, etiket veya cüzdan adresi ara...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirRegisteredWallets', '{count} Kayıtlı Cüzdan');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirExchangeCard', '🏦 Borsa Cüzdanları (CEX)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirExchangeCount', '{count} Borsa Havuzu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirSystemCard', '🏛️ Sistem & Hazine Kasaları');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirSystemCount', '{count} Sistem Hesabı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirWhaleCard', '🐋 Büyük Balina & Likidite');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirWhaleCount', '{count} Balina Cüzdanı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirContractCard', '🔄 DEX, Köprü & Kontratlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirContractCount', '{count} Akıllı Sözleşme');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColCategory', 'Kategori & Katman');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColName', 'Cüzdan / Kurum Adı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColAddress', 'Cüzdan Adresi (Tam Kopyalanabilir)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColTxCount', 'İşlem Sayısı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColFlow', 'Gelen / Giden Akış');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColBalance', 'Mevcut Net Bakiye');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColVolume', 'Toplam Hacim');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dirColActions', 'İnceleme Araçları');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'catAll', 'Tümü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'catExchange', '🏦 Borsa (CEX)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'catSystem', '🏛️ Sistem & Hazine');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'catWhale', '🐋 Balinalar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'catContracts', '🔄 DEX & Köprü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbTitle', '🏆 Ağ Liderlik Tablosu (En Zengin Cüzdanlar & Balinalar)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbDesc', 'Ağ genelinde en yüksek bakiye taşıyan, en çok transfer yapan ve en çok gas harcayan adresler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbBalance', '💰 İçindeki Para Miktarı (Bakiye)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbSenders', '⚡ En Çok İşlem Yapanlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbVolume', '📊 Transfer Hacmi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbFees', '🔥 En Çok Gas Harcayanlar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbSubTab', '⚡ Substrate Katmanı (hm... Cüzdanları)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbEvmTab', '⚡ EVM Katmanı (0x... Cüzdanları)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'recordsRanked', 'CÜZDAN SIRALANDI');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbRank', 'Sıra');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbAddress', 'Cüzdan Adresi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbTxs', 'Toplam İşlem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbVol', 'Hacim (HMND)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbColBalance', 'İçindeki Para Miktarı (Mevcut Bakiye)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'lbPaidFee', 'Ödenen Gas/Fee');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensTitle', 'Ağda Dolaşan Tokenlar (ERC-20 Directory)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensSubtitle', 'İndekslenen tüm ERC-20 tokenların dolaşım hacimleri, transfer adetleri ve sözleşmeleri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensTotalCount', 'Toplam Token Sayısı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensTotalTransfers', 'Toplam Token Transferi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensTopVolumeToken', 'En Çok Transfer Edilen Token');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensDexPools', 'DEX LP Likidite Havuzları');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenCategoryAll', 'Tümü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenCategoryDEX', 'DEX LP Havuzları');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenCategoryStable', 'Sabit & Kripto (USDC, WETH, WBTC)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenCategoryMeme', 'Meme & Topluluk');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenCategoryEco', 'Humanode Ekosistem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColAsset', 'Varlık (Token)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColSymbol', 'Sembol');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColName', 'Token Adı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColContract', 'Sözleşme');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColTransfers', 'Transfer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColVolume', 'Kümülatif Hacim');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColHolders', 'Gönderici / Alıcı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColActions', 'İncele');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenColInspect', 'İncele');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenSearchPlaceholder', 'Token sembolü, adı veya sözleşme adresi ara...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokensSearchPlaceholder', 'Token sembolü, adı veya sözleşme adresi ara...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valTitle', 'Biyometrik Validatör Düğümleri (Proof-of-Humanity)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valSubtitle', 'Humanode "1 Human = 1 Node = 1 Vote" konsensüs aktörleri, aktif blok üreticileri ve geçmiş doğrulayıcılar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valActiveCard', '🟢 Aktif Doğrulayıcı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valActiveCardSub', 'Son epochta blok üreten ve bioauth onaylı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valHistoricalCard', '👥 Tarihsel Toplam Doğrulayıcı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valHistoricalCardSub', 'Ağ başlangıcından bu yana görev almış düğümler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valPassiveCard', '○ Geçmiş / Pasif Doğrulayıcı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valPassiveCardSub', 'Bioauth süresi dolmuş veya çevrimdışı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valBioauthCard', '🧬 Toplam Biyometrik Onay');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valBioauthCardSub', 'Ağ genelinde tamamlanan Proof-of-Humanity taraması');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valSearchPlaceholder', 'Validatör adresi ara (hm...)...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valTabActive', '🟢 Aktif Doğrulayıcılar ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valTabPassive', '○ Geçmiş / Pasif Doğrulayıcılar ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valTabAll', 'Tümü ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColRank', 'Sıra');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColAddress', 'Validatör Adresi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColStatus', 'Durum');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColBlocks', 'Üretilen Blok');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColLastActive', 'Son Aktif');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColEpochTime', 'Epoch Kalan Süre');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valColActions', 'İşlemler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valStatusActive', '🟢 AKTİF');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valStatusPassive', '○ PASİF');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valExplainerTitle', 'Validatör Ödülleri Gerçekte Nasıl Çalışır? (Runtime & FeesPot Mimarisi)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule1', '1. 168 Saat (42 Epoch) Bioauth & Sıfır Kesinti');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule1Desc', 'Her biyometrik onay 7 gün (168 saat = 42 Epoch) geçerlidir. 1 Epoch bile çevrimdışı kalan düğüm anında deauthenticate edilir.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule2', '2. Sabit Arz & FeesPot Eşit Dağıtımı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule2Desc', 'Blok başına yeni token basılmaz. Tüm ağ ücretleri FeesPot havuzunda toplanır ve eşit dağıtılır.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule3', '3. Era Uptime Sınırı & Muhasebe Penceresi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'valRule3Desc', '14 günlük (%97.6) uptime sağlayan düğümler tur ödülüne hak kazanır.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerTitle', 'Cüzdan Hesap Defteri (Finansal Ekstre)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerSearchPlaceholder', 'Cüzdan adresi girin (0x... veya hm...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerInspectBtn', 'İncele 🔍');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerHideZero', 'Sıfır Ücretli Kalp Atışlarını Gizle (bioauth:authenticate)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerNetBalance', 'NET BAKİYE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerInflow', 'GELEN TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerOutflow', 'GİDEN TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerTxCount', 'İŞLEM ADEDİ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerBurnedFee', 'TOPLAM GAS ÜCRETİ (FEE)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerTabStatement', 'Hesap Ekstresi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerTabTokens', 'Varlık & Token Bakiyeleri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerTabAnalytics', 'Akış & İstatistikler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerDownloadCsv', 'CSV Olarak İndir');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailTitle', 'Çok Kademeli Para İzi Analizi (Multi-Hop Flow)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailSubtitle', 'Bir cüzdandan çıkan fonların hangi ara duraklardan geçerek nereye ulaştığını görselleştirin');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailStartAddr', 'Başlangıç Cüzdanı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailHops', 'Kademe Derinliği (Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailMinAmount', 'Min. Transfer Tutarı');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'trailTraceBtn', 'İzi Sür 🚀');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compareTitle', 'İkili Cüzdan Karşılaştırma & Akış Analizi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compareSubtitle', 'İki cüzdan arasındaki doğrudan para akışını, bakiye, hacim ve işlem farklarını karşılaştırın');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compareAddrA', '1. Cüzdan Adresi (A)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compareAddrB', '2. Cüzdan Adresi (B)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compareBtn', 'Karşılaştır ⚖️');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'heatmapTitle', '7x24 Ağ Gas Masrafı & Yoğunluk Haritası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'heatmapSubtitle', 'Haftanın her günü ve günün her saati gas ücreti yoğunluğu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'mon', 'Pzt');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tue', 'Sal');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'wed', 'Çar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'thu', 'Per');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'fri', 'Cum');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'sat', 'Cmt');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'sun', 'Paz');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ratesTitle', 'HMND Tarihsel Piyasa Kurları & Fiyat Endeksi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ratesSubtitle', 'CoinGecko ve borsa günlük kapanış kurları, piyasa hacmi ve kümülatif gas değerlemesi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unlocksTitle', 'Kilit Açılımı, Token Talepleri, Çapraz Katman Köprüsü & Çoklu İmza');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unlocksSubtitle', 'Substrate yerel katmanında gerçekleşen vesting kilit açılımları, tokenClaim hak edişleri, nativeToEvmSwap çapraz katman köprü geçişleri ve multisig işlemleri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'appTitle', 'Humanode Network Tracker');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'search', 'Search');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'searchPlaceholder', 'Search address, transaction hash, or block #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'refresh', 'Refresh Page');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'menuTitle', 'Menu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'collapseMenu', 'Collapse Sidebar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'expandMenu', 'Expand Sidebar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'selectLanguage', 'SELECT LANGUAGE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'copied', 'Copied!');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'copy', 'Copy');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'preview', 'Preview');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'inspect', 'Inspect');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'close', 'Close');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'actions', 'Actions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'loading', 'Loading...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCatNetwork', 'NETWORK & BLOCKS');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCatEconomics', 'ECONOMY & SUPPLY');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCatValidators', 'BIOMETRICS & VALIDATORS');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCatTokens', 'TOKENS & DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCatWallets', 'WALLETS & TRACKING');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navOverview', 'Network & Blocks');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navDirectory', 'Exchange & Major Wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navWhales', 'Whale Radar & Watchlist');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navLeaderboard', 'Leaderboard (Top 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navTokens', 'Tokens & DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navTokenomics', 'Tokenomics (400M Supply)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navValidators', 'Biometrics & Validators');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navFeesPot', 'FeesPot & Profitability');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navGovernance', 'DAO & Governance Hub');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navHeatmap', '24/7 Gas Heatmap');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navLedger', 'Wallet Ledger');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navMoneytrail', 'Money Trail (Multi-Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navCompare', 'Compare Wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navRates', 'Historical Rates');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navUnlocks', 'Token Unlocks & Vesting');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navBridge', 'Dual-Layer Bridge');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navHodlers', 'Wallet Hodlers & Distribution');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navEquality', 'Biometric Equality');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navBiomapper', 'Biomapper (20+ Chains)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'navDexDepth', 'DEX Depth & 4-Byte');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'addrZeroLabel', 'Zero Address (Genesis/Burn)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'addrFeespotLabel', 'FeesPot Reward Treasury');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'addrSystemReserveLabel', 'System Reserve Distributor');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'copyAddress', 'Copy Address');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'scrollToTop', 'Back to Top');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdPlaceholder', 'Search address (0x... or hm...), Tx Hash or Block #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdQuickNav', 'QUICK NAVIGATION');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdGo', 'Go ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdBlockResult', 'Block Search Result');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdWalletResult', 'Wallet Search Result');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdTxResult', 'Transaction Search Result');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdInspectWallet', 'Inspect this address in Ledger & Profile ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdInspectBlock', 'Inspect this block and its transactions ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'cmdInspectTx', 'Inspect gas, transfer and execution details ↗');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekTitle', 'Wallet Quick Peek');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekEvm', 'EVM Layer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekSub', 'Substrate Layer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekAddress', 'WALLET ADDRESS');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekNetBalance', 'NET BALANCE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekTotalTxs', 'TOTAL TRANSACTIONS');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekInflow', 'TOTAL INFLOW');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekOutflow', 'TOTAL OUTFLOW');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekPaidGas', 'TOTAL PAID GAS (FEE)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekOpenLedger', 'Open Wallet Ledger');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekTraceMoney', 'Trace Money Trail');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'quickPeekAddToCompare', 'Add to Comparison');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'syncStatus', 'Indexing Status');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'blocksPerSec', 'blocks/sec');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalEvmTx', 'Total EVM Transactions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalEvmTxSub', 'Smart Contracts & Swaps');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalSubExtrinsics', 'Substrate Extrinsics');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalSubExtrinsicsSub', 'Biometrics & Consensus');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridgeTransfers', 'Substrate ➔ EVM Bridge');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridgeTransfersSub', 'Transferred from hm... to 0x...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalBurnedGas', 'Total Gas Fees');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalBurnedGasSub', 'With Cumulative Market Rates:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_totalBurnedCoins', 'Total Burned Coins');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalBurnedCoins', 'Total Burned Coins');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_burnedCoins', 'Burned Coins');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_burnContract', 'Burn Contract');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_burnTxCountSuffix', 'tx');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unifiedTitle', 'Network Blocks, Transactions and Gas Analytics Desk');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unifiedDesc', 'Cumulative gas and activity report fully synced with date range, layer and module filters');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'viewBlocks', 'Blocks (Grouped)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'viewTxs', 'Single Transactions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dateRangePresets', '📅 Date Range & Quick Presets:');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'presetAll', 'All Time');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'presetToday', 'Today');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'presetYesterday', 'Yesterday');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'preset7d', 'Last 7 Days');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'preset30d', 'Last 30 Days');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'preset1y', '2026 (This Year)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'startDate', 'Start Date & Time');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'endDate', 'End Date & Time');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layer', 'Layer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layerAll', 'All Layers');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layerEvm', 'Layer 2: EVM (0x...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layerSub', 'Layer 1: Substrate (hm...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'module', 'Protocol / Module');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'moduleAll', 'All Modules');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'hideZeroFee', 'Hide Zero-Fee Heartbeats');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'resetFilters', 'Reset Filters');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiReportTitle', 'Selected Period: Blocks & Gas Fee Report');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiBurnedGas', '⛽ Gas Fee');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiBurnedGasSub', 'Cumulative net calculation using daily exchange rates');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiTotalBlocks', '📦 Total Blocks');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiTotalBlocksSub', 'Indexed and filtered blocks count');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiTotalTxs', '⚡ Total Transactions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiTotalVol', '💰 Total Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiTotalVolSub', 'Total transferred amount');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiAvgGas', '⛽ Gas per Block');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiAvgGasSub', 'Average burned fee per block');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'chartTitle', 'Periodic Distribution Chart (Click any bar to filter its blocks below)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'metricFee', 'Gas Fee');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'metricCount', 'Tx Count');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'metricVol', 'Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'intervalDay', 'Daily');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'intervalWeek', 'Weekly');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'intervalMonth', 'Monthly');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'intervalYear', 'Yearly');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'chartLoading', 'Calculating activity and gas metrics...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'chartEmpty', 'No chart records found for this filter.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'searchPlaceholderOverview', 'Block # (e.g. 20448544), 0x... or hm... address, Tx Hash...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'filterAndSearch', 'Filter & Search');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'blocksTableTitle', '📦 Network Blocks (Live Grouped Stream)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'blocksTableTitleFiltered', '📦 Network Blocks in Selected Period');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txsTableTitle', '⚡ Transactions & Extrinsics');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'pageInfo', 'Page {page} / {totalPages} (Total {total} records)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colBlock', 'Block #');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colTimestamp', 'Timestamp');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colTxCount', 'Tx Count & Breakdown');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colPallets', 'Protocols / Pallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colBlockVol', 'Block Transfer Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colBlockFee', 'Gas Fee in Block');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colActions', 'Actions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colTxHash', 'Tx Hash / Extrinsic');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colLayerPallet', 'Layer & Method');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colSender', 'Sender (Signer)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colRecipient', 'Recipient / Target');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colAmount', 'Transferred Amount');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colFee', 'Paid Gas (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colStatus', 'Status');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'statusSuccess', 'SUCCESS');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'statusFailed', 'FAILED');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirTitle', 'Exchange, Treasury & Major Wallets Directory');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirSubtitle', 'Centralized exchange hot wallets (CEX), Humanode system/treasury vaults, major whales and DEX/bridge contracts — copy or inspect directly.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirSearchPlaceholder', 'Search exchange name, label or address...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirRegisteredWallets', '{count} Registered Wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirExchangeCard', '🏦 Exchange Wallets (CEX)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirExchangeCount', '{count} Exchange Pools');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirSystemCard', '🏛️ System & Treasury Vaults');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirSystemCount', '{count} System Accounts');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirWhaleCard', '🐋 Major Whales & Liquidity');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirWhaleCount', '{count} Whale Wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirContractCard', '🔄 DEX, Bridge & Contracts');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirContractCount', '{count} Smart Contracts');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColCategory', 'Category & Layer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColName', 'Wallet / Entity Name');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColAddress', 'Wallet Address (Full / Copyable)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColTxCount', 'Tx Count');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColFlow', 'Inflow / Outflow');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColBalance', 'Current Net Balance');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColVolume', 'Total Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dirColActions', 'Actions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'catAll', 'All');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'catExchange', '🏦 Exchange (CEX)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'catSystem', '🏛️ System & Treasury');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'catWhale', '🐋 Whales');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'catContracts', '🔄 DEX & Bridge');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbTitle', '🏆 Network Leaderboard (Wealthiest Wallets & Whales)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbDesc', 'Top ranked addresses across Substrate and EVM by wallet balance, transaction count and gas fees');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbBalance', '💰 Wallet Balance (Holding)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbSenders', '⚡ Top Transactors');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbVolume', '📊 Transfer Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbFees', '🔥 Top Fee Spenders');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbSubTab', '⚡ Substrate Layer (hm... Wallets)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbEvmTab', '⚡ EVM Layer (0x... Wallets)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'recordsRanked', 'WALLETS RANKED');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbRank', 'Rank');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbAddress', 'Wallet Address');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbTxs', 'Total Txs');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbVol', 'Volume (HMND)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbColBalance', 'Wallet Balance (Current Holding)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'lbPaidFee', 'Paid Gas/Fee');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensTitle', 'Network Circulating Tokens (ERC-20 Directory)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensSubtitle', 'Indexed ERC-20 tokens circulating volumes, transfer counts and contracts');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensTotalCount', 'Total Tokens Count');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensTotalTransfers', 'Total Token Transfers');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensTopVolumeToken', 'Most Transferred Token');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensDexPools', 'DEX LP Liquidity Pools');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenCategoryAll', 'All');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenCategoryDEX', 'DEX LP Pools');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenCategoryStable', 'Stable & Wrapped (USDC, WETH, WBTC)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenCategoryMeme', 'Meme & Community');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenCategoryEco', 'Humanode Ecosystem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColAsset', 'Asset (Token)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColSymbol', 'Symbol');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColName', 'Token Name');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColContract', 'Contract');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColTransfers', 'Transfers');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColVolume', 'Cumulative Volume');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColHolders', 'Senders / Holders');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColActions', 'Inspect');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenColInspect', 'Inspect');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenSearchPlaceholder', 'Search token symbol, name or contract address...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokensSearchPlaceholder', 'Search token symbol, name or contract address...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valTitle', 'Biometric Validator Nodes (Proof-of-Humanity)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valSubtitle', 'Humanode "1 Human = 1 Node = 1 Vote" consensus actors, live block producers and historical validators');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valActiveCard', '🟢 Active Validators');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valActiveCardSub', 'Producing blocks with valid bioauth');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valHistoricalCard', '👥 Total Historical Validators');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valHistoricalCardSub', 'Nodes that served since network genesis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valPassiveCard', '○ Past / Inactive Validators');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valPassiveCardSub', 'Bioauth expired or currently offline');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valBioauthCard', '🧬 Total Biometric Authorizations');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valBioauthCardSub', 'Proof-of-Humanity authentications completed');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valSearchPlaceholder', 'Search validator address (hm...)...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valTabActive', '🟢 Active Validators ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valTabPassive', '○ Past / Inactive Validators ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valTabAll', 'All ({count})');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColRank', 'Rank');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColAddress', 'Validator Address');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColStatus', 'Status');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColBlocks', 'Blocks Authored');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColLastActive', 'Last Active');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColEpochTime', 'Epoch Remaining Time');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valColActions', 'Actions');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valStatusActive', '🟢 ACTIVE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valStatusPassive', '○ INACTIVE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valExplainerTitle', 'How Validator Rewards Actually Work? (Runtime & FeesPot Architecture)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule1', '1. 168 Hours (42 Epochs) Bioauth & Zero Slashing');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule1Desc', 'Each biometric authentication lasts 7 days (168h = 42 Epochs). Missing even 1 Epoch triggers immediate deauthentication.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule2', '2. Fixed Supply & FeesPot Equal Distribution');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule2Desc', 'No new tokens are minted per block. All network fees pool into FeesPot and are split equally among qualified nodes.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule3', '3. Era Uptime Threshold & Accounting Window');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'valRule3Desc', 'Nodes maintaining 97.6% uptime over 14 days qualify for era distribution.');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerTitle', 'Wallet Ledger (Financial Statement)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerSearchPlaceholder', 'Enter wallet address (0x... or hm...)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerInspectBtn', 'Inspect 🔍');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerHideZero', 'Hide Zero-Fee Heartbeats (bioauth:authenticate)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerNetBalance', 'NET BALANCE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerInflow', 'TOTAL INFLOW');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerOutflow', 'TOTAL OUTFLOW');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerTxCount', 'TOTAL TX COUNT');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerBurnedFee', 'TOTAL GAS FEES');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerTabStatement', 'Account Statement');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerTabTokens', 'Asset & Token Balances');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerTabAnalytics', 'Flow & Analytics');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerDownloadCsv', 'Download CSV');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailTitle', 'Multi-Hop Money Trail Analysis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailSubtitle', 'Visualize how funds flow through intermediate hops and reach destination addresses');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailStartAddr', 'Starting Wallet');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailHops', 'Hop Depth');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailMinAmount', 'Min. Transfer Amount');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'trailTraceBtn', 'Trace Trail 🚀');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compareTitle', 'Dual Wallet Comparison & Flow Analysis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compareSubtitle', 'Compare direct flow, balance, volume and activity differences between two wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compareAddrA', '1st Wallet Address (A)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compareAddrB', '2nd Wallet Address (B)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compareBtn', 'Compare ⚖️');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'heatmapTitle', '24/7 Network Gas Fee & Intensity Heatmap');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'heatmapSubtitle', 'Gas fees intensity across each day of the week and hour of the day');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'mon', 'Mon');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tue', 'Tue');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'wed', 'Wed');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'thu', 'Thu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'fri', 'Fri');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'sat', 'Sat');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'sun', 'Sun');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ratesTitle', 'HMND Historical Market Rates & Price Index');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ratesSubtitle', 'CoinGecko and exchange daily close rates, market volume and cumulative gas valuation');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unlocksTitle', 'Token Unlocks, Claims, Cross-Layer Bridge & Multi-Sig');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unlocksSubtitle', 'Substrate native vesting unlocks, tokenClaims, nativeToEvmSwap bridge transfers and multisig operations');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'appTitle', 'Humanode Netzwerk-Tracker');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'search', 'Suche');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'searchPlaceholder', 'Adresse, Transaktions-Hash oder Block # suchen...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'refresh', 'Seite aktualisieren');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'menuTitle', 'Menü');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'collapseMenu', 'Seitenleiste einklappen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'expandMenu', 'Seitenleiste ausklappen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'selectLanguage', 'SPRACHE WÄHLEN');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'copied', 'Kopiert!');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'copy', 'Kopieren');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'inspect', 'Überprüfen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'close', 'Schließen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'actions', 'Aktionen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'loading', 'Wird geladen...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCatNetwork', 'NETZWERK & BLÖCKE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCatEconomics', 'WIRTSCHAFT & ANGEBOT');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCatValidators', 'BIOMETRIE & VALIDATOREN');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCatTokens', 'TOKEN & DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCatWallets', 'WALLETS & VERFOLGUNG');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navOverview', 'Netzwerk & Blöcke');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navDirectory', 'Börsen & Wichtige Wallets');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navWhales', 'Wal-Radar & Beobachtungsliste');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navLeaderboard', 'Bestenliste (Top 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navTokens', 'Token & DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navTokenomics', 'Tokenomics (400M Angebot)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navValidators', 'Biometrie & Validatoren');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navFeesPot', 'FeesPot & Rentabilität');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navGovernance', 'DAO & Governance');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navHeatmap', '24/7 Gas-Heatmap');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navLedger', 'Wallet-Hauptbuch');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navMoneytrail', 'Geldspur (Multi-Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navCompare', 'Wallets vergleichen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navRates', 'Historische Kurse');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navUnlocks', 'Token-Freischaltungen & Vesting');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navBridge', 'Zwei-Schichten-Brücke');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navHodlers', 'Wallet-Hodler & Verteilung');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navEquality', 'Biometrische Gleichheit');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navBiomapper', 'Biomapper (20+ Chains)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'navDexDepth', 'DEX-Tiefe & 4-Byte');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'addrZeroLabel', 'Nulladresse (Genesis/Burn)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'addrFeespotLabel', 'FeesPot-Belohnungskasse');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'addrSystemReserveLabel', 'Systemreserve-Verteiler');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'copyAddress', 'Adresse kopieren');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'scrollToTop', 'Nach oben');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdPlaceholder', 'Adresse (0x... oder hm...), Tx Hash oder Block # suchen...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdQuickNav', 'SCHNELLNAVIGATION');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdGo', 'Los ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdBlockResult', 'Block-Suchergebnis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdWalletResult', 'Wallet-Suchergebnis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'cmdTxResult', 'Transaktions-Suchergebnis');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekTitle', 'Wallet-Schnellansicht');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekEvm', 'EVM-Schicht');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekSub', 'Substrate-Schicht');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekAddress', 'WALLET-ADRESSE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekNetBalance', 'NETTO-GUTHABEN');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekTotalTxs', 'GESAMTE TRANSAKTIONEN');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekInflow', 'EINGEHENDER TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekOutflow', 'AUSGEHENDER TRANSFER');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekPaidGas', 'GEZAHLTE GEBÜHREN (GAS)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekOpenLedger', 'Hauptbuch öffnen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekTraceMoney', 'Geldspur verfolgen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'quickPeekAddToCompare', 'Zum Vergleich hinzufügen');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'appTitle', 'Панель мониторинга Humanode');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'search', 'Поиск');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'searchPlaceholder', 'Поиск адреса, хеша транзакции или блока #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'refresh', 'Обновить страницу');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'menuTitle', 'Меню');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'collapseMenu', 'Свернуть меню');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'expandMenu', 'Развернуть меню');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'selectLanguage', 'ВЫБЕРИТЕ ЯЗЫК');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'copied', 'Скопировано!');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'copy', 'Копировать');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'inspect', 'Проверить');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'close', 'Закрыть');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'actions', 'Действия');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'loading', 'Загрузка...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCatNetwork', 'СЕТЬ И БЛОКИ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCatEconomics', 'ЭКОНОМИКА И ЭМИССИЯ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCatValidators', 'БИОМЕТРИЯ И ВАЛИДАТОРЫ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCatTokens', 'ТОКЕНЫ И DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCatWallets', 'КОШЕЛЬКИ И ТРЕКИНГ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navOverview', 'Сеть и блоки');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navDirectory', 'Биржи и ключевые кошельки');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navWhales', 'Радар китов и список наблюдения');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navLeaderboard', 'Таблица лидеров (Топ 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navTokens', 'Токены и DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navTokenomics', 'Токеномика (400M эмиссия)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navValidators', 'Биометрия и валидаторы');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navFeesPot', 'FeesPot и доходность');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navGovernance', 'DAO и управление');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navHeatmap', '24/7 Тепловая карта газа');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navLedger', 'Книга кошелька (Ledger)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navMoneytrail', 'Денежный след (Multi-Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navCompare', 'Сравнить кошельки');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navRates', 'Исторические курсы');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navUnlocks', 'Разлоки и вестинг');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navBridge', 'Двухслойный мост');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navHodlers', 'Держатели (Hodlers)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navEquality', 'Биометрическое равенство');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navBiomapper', 'Biomapper (20+ сетей)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'navDexDepth', 'DEX глубина и 4-Byte');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'addrZeroLabel', 'Нулевой адрес (Genesis/Burn)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'addrFeespotLabel', 'Казна наград FeesPot');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'addrSystemReserveLabel', 'Системный резерв');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'copyAddress', 'Скопировать адрес');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'scrollToTop', 'Наверх');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdPlaceholder', 'Адрес кошелька (0x... или hm...), Tx хеш или блок #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdQuickNav', 'БЫСТРЫЙ ПЕРЕХОД');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdGo', 'Перейти ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdBlockResult', 'Результат поиска блока');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdWalletResult', 'Результат поиска кошелька');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'cmdTxResult', 'Результат поиска транзакции');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekTitle', 'Быстрый просмотр кошелька');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekEvm', 'Уровень EVM');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekSub', 'Уровень Substrate');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekAddress', 'АДРЕС КОШЕЛЬКА');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekNetBalance', 'ЧИСТЫЙ БАЛАНС');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekTotalTxs', 'ВСЕГО ТРАНЗАКЦИЙ');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekInflow', 'ВХОДЯЩИЙ ПОТОК');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekOutflow', 'ИСХОДЯЩИЙ ПОТОК');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekPaidGas', 'ОПЛАЧЕННЫЙ ГАЗ (КОМИССИЯ)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekOpenLedger', 'Открыть книгу кошелька');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekTraceMoney', 'Отследить перевод');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'quickPeekAddToCompare', 'Добавить к сравнению');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'appTitle', 'Panel de Seguimiento Humanode');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'search', 'Buscar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'searchPlaceholder', 'Buscar dirección, hash de tx o bloque #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'refresh', 'Actualizar página');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'menuTitle', 'Menú');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'collapseMenu', 'Colapsar barra lateral');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'expandMenu', 'Expandir barra lateral');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'selectLanguage', 'SELECCIONAR IDIOMA');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'copied', '¡Copiado!');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'copy', 'Copiar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'inspect', 'Inspeccionar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'close', 'Cerrar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'actions', 'Acciones');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'loading', 'Cargando...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCatNetwork', 'RED Y BLOQUES');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCatEconomics', 'ECONOMÍA Y OFERTA');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCatValidators', 'BIOMETRÍA Y VALIDADORES');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCatTokens', 'TOKENS Y DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCatWallets', 'BILLETERAS Y RASTREO');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navOverview', 'Red y Bloques');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navDirectory', 'Bolsas y Billeteras Clave');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navWhales', 'Radar de Ballenas y Seguimiento');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navLeaderboard', 'Clasificación (Top 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navTokens', 'Tokens y DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navTokenomics', 'Tokenomics (400M Oferta)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navValidators', 'Biometría y Validadores');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navFeesPot', 'FeesPot y Rentabilidad');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navGovernance', 'DAO y Gobernanza');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navHeatmap', 'Mapa de Calor de Gas 24/7');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navLedger', 'Libro Contable de Billetera');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navMoneytrail', 'Rastro de Dinero (Multi-Hop)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navCompare', 'Comparar Billeteras');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navRates', 'Tarifas Históricas');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navUnlocks', 'Desbloqueos y Vesting');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navBridge', 'Puente de Doble Capa');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navHodlers', 'Poseedores (Hodlers)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navEquality', 'Igualdad Biométrica');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navBiomapper', 'Biomapper (20+ Redes)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'navDexDepth', 'Profundidad DEX y 4-Byte');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'addrZeroLabel', 'Dirección Cero (Genesis/Burn)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'addrFeespotLabel', 'Tesorería FeesPot');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'addrSystemReserveLabel', 'Distribuidor de Reserva');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'copyAddress', 'Copiar Dirección');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'scrollToTop', 'Volver arriba');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdPlaceholder', 'Buscar dirección (0x... o hm...), Tx Hash o Bloque #...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdQuickNav', 'NAVEGACIÓN RÁPIDA');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdGo', 'Ir ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdBlockResult', 'Resultado de Búsqueda de Bloque');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdWalletResult', 'Resultado de Búsqueda de Billetera');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'cmdTxResult', 'Resultado de Búsqueda de Transacción');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekTitle', 'Vista Rápida de Billetera');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekEvm', 'Capa EVM');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekSub', 'Capa Substrate');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekAddress', 'DIRECCIÓN DE BILLETERA');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekNetBalance', 'SALDO NETO');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekTotalTxs', 'TRANSACCIONES TOTALES');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekInflow', 'TRANSFERENCIA ENTRANTE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekOutflow', 'TRANSFERENCIA SALIENTE');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekPaidGas', 'GAS PAGADO (COMISIÓN)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekOpenLedger', 'Abrir Libro Contable');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekTraceMoney', 'Rastrear Fondos');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'quickPeekAddToCompare', 'Añadir a Comparación');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'appTitle', 'Humanode 网络追踪面板');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'search', '搜索');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'searchPlaceholder', '搜索钱包地址、交易哈希或区块号...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'refresh', '刷新页面');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'menuTitle', '菜单');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'collapseMenu', '收起侧边栏');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'expandMenu', '展开侧边栏');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'selectLanguage', '选择语言');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'copied', '已复制！');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'copy', '复制');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'inspect', '查看详情');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'close', '关闭');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'actions', '操作');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'loading', '加载中...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCatNetwork', '网络与区块');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCatEconomics', '代币经济与供应');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCatValidators', '生物识别与验证者');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCatTokens', '代币与 DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCatWallets', '钱包与资金追踪');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navOverview', '网络概览与区块');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navDirectory', '交易所与核心钱包');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navWhales', '巨鲸雷达与自选监控');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navLeaderboard', '排行榜 (前 50)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navTokens', '代币与 DEX');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navTokenomics', '代币经济 (4亿总量)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navValidators', '生物识别与验证者');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navFeesPot', 'FeesPot 与收益分析');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navGovernance', 'DAO 与治理中心');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navHeatmap', '7x24小时 Gas 热力图');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navLedger', '钱包账本');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navMoneytrail', '资金追踪 (多跳)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navCompare', '钱包对比分析');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navRates', '历史汇率行情');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navUnlocks', '代币解锁与归属 (Vesting)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navBridge', '双层跨链桥');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navHodlers', '持币地址榜 (Hodlers)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navEquality', '生物识别平等');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navBiomapper', 'Biomapper (20+ 跨链合约)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'navDexDepth', 'DEX深度与4-Byte解码');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'addrZeroLabel', '零地址 (创世/销毁)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'addrFeespotLabel', 'FeesPot 奖励金库');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'addrSystemReserveLabel', '系统储备分发');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'copyAddress', '复制地址');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'scrollToTop', '返回顶部');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdPlaceholder', '输入钱包地址 (0x... 或 hm...)、交易哈希或区块号...');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdQuickNav', '快速跳转');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdGo', '前往 ↵');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdBlockResult', '区块搜索结果');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdWalletResult', '钱包搜索结果');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'cmdTxResult', '交易搜索结果');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekTitle', '钱包快速预览');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekEvm', 'EVM 层');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekSub', 'Substrate 原生层');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekAddress', '钱包地址');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekNetBalance', '净资产余额');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekTotalTxs', '交易总数');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekInflow', '资金流入');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekOutflow', '资金流出');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekPaidGas', '累计消耗 Gas (手续费)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekOpenLedger', '打开钱包账本');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekTraceMoney', '追踪资金流向');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'quickPeekAddToCompare', '加入对比');


-- FeesPot Imminent Payout countdown and status keys
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'feespot_imminentPayout', 'Dağıtım Eşiğinde');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'feespot_pendingMultisig', 'Bekleniyor');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'feespot_multisigConfirmationPending', 'Tur her an tetiklenebilir');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'feespot_imminentPayout', 'Distribution Imminent');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'feespot_pendingMultisig', 'Pending');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'feespot_multisigConfirmationPending', 'Round may trigger at any moment');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'feespot_imminentPayout', 'Ausschüttung bevorstehend');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'feespot_pendingMultisig', 'Ausstehend');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'feespot_multisigConfirmationPending', 'Runde kann jederzeit ausgelöst werden');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'feespot_imminentPayout', 'В ожидании распределения');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'feespot_pendingMultisig', 'Ожидается');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'feespot_multisigConfirmationPending', 'Раунд может начаться в любой момент');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'feespot_imminentPayout', 'Distribución Inminente');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'feespot_pendingMultisig', 'Pendiente');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'feespot_multisigConfirmationPending', 'La ronda puede activarse en cualquier momento');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'feespot_imminentPayout', '即将分发');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'feespot_pendingMultisig', '等待中');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'feespot_multisigConfirmationPending', '轮次可能随时触发');


-- Transaction & Block Modal status keys
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txLayerEvm', 'EVM Katmanı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txLayerSub', 'Substrate Katmanı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txSuccess', 'BAŞARILI');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txFailed', 'BAŞARISIZ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colBlockNumber', 'Blok Numarası');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txLayerEvm', 'EVM Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txLayerSub', 'Substrate Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txSuccess', 'SUCCESS');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txFailed', 'FAILED');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colBlockNumber', 'Block Number');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txLayerEvm', 'EVM-Schicht');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txLayerSub', 'Substrate-Schicht');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txSuccess', 'ERFOLGREICH');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txFailed', 'FEHLGESCHLAGEN');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'colBlockNumber', 'Blocknummer');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txLayerEvm', 'Слой EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txLayerSub', 'Слой Substrate');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txSuccess', 'УСПЕШНО');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txFailed', 'ОШИБКА');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'colBlockNumber', 'Номер блока');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txLayerEvm', 'Capa EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txLayerSub', 'Capa Substrate');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txSuccess', 'ÉXITO');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txFailed', 'FALLIDO');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'colBlockNumber', 'Número de Bloque');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txLayerEvm', 'EVM 层');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txLayerSub', 'Substrate 层');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txSuccess', '成功');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txFailed', '失败');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'colBlockNumber', '区块编号');

-- Batch Localization Update: All remaining modal, overview & component translation keys

-- Translations: [tr]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'blockModalTitle', 'Blok #{block} Detayları');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'btnTraceMoneyTrail', 'Para İzini Takip Et');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'btnViewSenderLedger', 'Gönderen Defteri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'btnViewTargetLedger', 'Alıcı Defteri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colDetail', 'Detay');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colFromTo', 'Gönderen ➔ Alıcı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'fromLabel', 'Gönderen (Giden / Signer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'toLabel', 'Hedef / Alıcı (Gelen / To)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'transferAmount', 'Transfer Tutarı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'gasFeeLabel', 'Ödenen Gas (Fee)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'gasUsedLabel', 'Kullanılan Gaz');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txGasUsed', 'Kullanılan Gaz');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txHashLabel', 'İşlem Hash / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'txModalTitle', 'Ayrıntılı İşlem Bilgisi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenTransfersTitle', '🪙 Dahili Token Transferleri & Swaplar');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'historicalRate', '≈ ${rate} USD (İşlem Anındaki Kur)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledger', 'Hesap Defteri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'moneyTrail', 'Para İzi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'header_dualLayerStatusTooltip', 'Humanode Çift Katmanlı Ağ Durumu: Senkronize ve Canlı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'header_glossaryTooltip', 'Ağ Kılavuzu & Terimler Sözlüğü');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'validators_exportCsvTooltip', 'Filtrelenmiş validatör listesini CSV olarak indir');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_enterAddressPlaceholder', '0x... cüzdan adresi girin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'compare_addressPlaceholder', '0x... veya hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_calldataPlaceholder', '0x... hex calldata veya 4-byte metot seçici girin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simStatus', 'Durum:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simBiomappedUnique', '🟢 BİOMAPPED (TEKİL İNSAN)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simUnverified', '🔴 DOĞRULANMAMIŞ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simActiveGen', 'Aktif Jenerasyon:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simEnclaveAttestation', 'Enklav Doğrulaması:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_simPointer', 'Biomapping Pointer:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_paramName', 'Parametre');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_paramType', 'Tür (Type)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_paramDecodedValue', 'Ayrıştırılmış Değer (Decoded Value)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'governance_runtimeUpgradeForkless', 'Runtime Upgrade (Forksuz Güncelleme)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'governance_palletModuleParameters', 'Pallet & Modül Parametreleri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'governance_successfulExecutionsCount', '1.076 Başarılı Yürütme');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_exchangesAndTreasuries', 'Borsalar & Kasalar');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_nodeOperators', 'Düğüm Sahipleri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_defiParticipants', 'DeFi Katılımcıları');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_communityMembers', 'Topluluk');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_whaleDesc', 'KuCoin, BitMart, Vakıf Hazine Kasası ve ilk tohum yatırımcıları.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_sharkDesc', 'Uzun vadeli validatör işletmecileri ve birikim yapan doğrulayıcılar.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_dolphinDesc', 'Impossible Finance LP sağlayıcıları ve aktif token takası yapanlar.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_shrimpDesc', 'Biyometrik testnet katılımcıları, airdrop sahipleri ve mikro transferler.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colToken', 'Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unlocks_tokenClaimsTitle', 'Token Talepleri (Airdrop)');

-- Translations: [en]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'blockModalTitle', 'Block #{block} Details');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'btnTraceMoneyTrail', 'Trace Money Trail');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'btnViewSenderLedger', 'Sender Ledger');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'btnViewTargetLedger', 'Recipient Ledger');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colDetail', 'Detail');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colFromTo', 'From ➔ To');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'fromLabel', 'Sender (From / Signer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'toLabel', 'Recipient / Target (To)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'transferAmount', 'Transfer Amount');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'gasFeeLabel', 'Paid Gas (Fee)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'gasUsedLabel', 'Gas Used');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txGasUsed', 'Gas Used');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txHashLabel', 'Transaction Hash / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'txModalTitle', 'Detailed Transaction Information');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenTransfersTitle', '🪙 Internal Token Transfers & Swaps');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'historicalRate', '≈ ${rate} USD (Historical Rate)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledger', 'Wallet Ledger');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'moneyTrail', 'Money Trail');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'header_dualLayerStatusTooltip', 'Humanode Dual-Layer Network Status: Synchronized & Live');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'header_glossaryTooltip', 'Network Guide & Glossary');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'validators_exportCsvTooltip', 'Download filtered validator list as CSV');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_enterAddressPlaceholder', 'Enter 0x... wallet address');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'compare_addressPlaceholder', '0x... or hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_calldataPlaceholder', 'Enter 0x... hex calldata or 4-byte method selector');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simStatus', 'Status:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simBiomappedUnique', '🟢 BIOMAPPED (UNIQUE HUMAN)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simUnverified', '🔴 UNVERIFIED');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simActiveGen', 'Active Generation:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simEnclaveAttestation', 'Enclave Attestation:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_simPointer', 'Biomapping Pointer:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_paramName', 'Parameter');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_paramType', 'Type');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_paramDecodedValue', 'Decoded Value');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'governance_runtimeUpgradeForkless', 'Runtime Upgrade (Forkless Update)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'governance_palletModuleParameters', 'Pallet & Module Parameters');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'governance_successfulExecutionsCount', '1,076 Successful Executions');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_exchangesAndTreasuries', 'Exchanges & Treasuries');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_nodeOperators', 'Node Operators');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_defiParticipants', 'DeFi Participants');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_communityMembers', 'Community');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_whaleDesc', 'KuCoin, BitMart, Foundation Treasury Vault, and seed investors.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_sharkDesc', 'Long-term validator operators and accumulating nodes.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_dolphinDesc', 'Impossible Finance LP providers and active token swappers.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_shrimpDesc', 'Biometric testnet participants, airdrop recipients, and micro transfers.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colToken', 'Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unlocks_tokenClaimsTitle', 'Token Claims (Airdrop)');

-- Translations: [de]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'blockModalTitle', 'Block #{block} Details');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'btnTraceMoneyTrail', 'Geldspur verfolgen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'btnViewSenderLedger', 'Absender-Hauptbuch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'btnViewTargetLedger', 'Empfänger-Hauptbuch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'colDetail', 'Detail');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'colFromTo', 'Von ➔ An');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'fromLabel', 'Absender (Von / Signer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'toLabel', 'Empfänger / Ziel (An)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'transferAmount', 'Transferbetrag');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'gasFeeLabel', 'Gezahlte Gasgebühr');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'gasUsedLabel', 'Verbrauchtes Gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txGasUsed', 'Verbrauchtes Gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txHashLabel', 'Transaktions-Hash / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'txModalTitle', 'Detaillierte Transaktionsinformationen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenTransfersTitle', '🪙 Interne Token-Transfers & Swaps');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'historicalRate', '≈ ${rate} USD (Historischer Kurs)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'ledger', 'Wallet-Hauptbuch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'moneyTrail', 'Geldspur');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'header_dualLayerStatusTooltip', 'Humanode Dual-Layer-Netzwerkstatus: Synchronisiert & Live');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'header_glossaryTooltip', 'Netzwerk-Leitfaden & Glossar');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'validators_exportCsvTooltip', 'Gefilterte Validator-Liste als CSV herunterladen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_enterAddressPlaceholder', '0x... Wallet-Adresse eingeben');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'compare_addressPlaceholder', '0x... oder hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_calldataPlaceholder', '0x... Hex-Calldata oder 4-Byte-Methodenselektor eingeben');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simStatus', 'Status:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simBiomappedUnique', '🟢 BIOMAPPED (EINZIGARTIGER MENSCH)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simUnverified', '🔴 UNVERIFIZIERT');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simActiveGen', 'Aktive Generation:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simEnclaveAttestation', 'Enklave-Beglaubigung:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_simPointer', 'Biomapping-Zeiger:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_paramName', 'Parameter');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_paramType', 'Typ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_paramDecodedValue', 'Dekodierter Wert');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'governance_runtimeUpgradeForkless', 'Runtime-Upgrade (Forkloses Update)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'governance_palletModuleParameters', 'Pallet- & Modulparameter');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'governance_successfulExecutionsCount', '1.076 Erfolgreiche Ausführungen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_exchangesAndTreasuries', 'Börsen & Schatzkammern');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_nodeOperators', 'Knotenbetreiber');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_defiParticipants', 'DeFi-Teilnehmer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_communityMembers', 'Gemeinschaft');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_whaleDesc', 'KuCoin, BitMart, Stiftungsschatzkammer und Seed-Investoren.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_sharkDesc', 'Langfristige Validator-Betreiber und akkumulierende Prüfer.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_dolphinDesc', 'Impossible Finance LP-Anbieter und aktive Token-Händler.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_shrimpDesc', 'Biometrische Testnet-Teilnehmer, Airdrop-Empfänger und Mikrotransfers.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'colToken', 'Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'unlocks_tokenClaimsTitle', 'Token-Ansprüche (Airdrop)');

-- Translations: [ru]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'blockModalTitle', 'Детали блока #{block}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'btnTraceMoneyTrail', 'Отследить перевод');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'btnViewSenderLedger', 'Книга отправителя');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'btnViewTargetLedger', 'Книга получателя');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'colDetail', 'Детали');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'colFromTo', 'От ➔ Кому');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'fromLabel', 'Отправитель (Signer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'toLabel', 'Получатель / Цель (Кому)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'transferAmount', 'Сумма перевода');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'gasFeeLabel', 'Оплаченный газ (комиссия)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'gasUsedLabel', 'Использованный газ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txGasUsed', 'Использованный газ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txHashLabel', 'Хэш транзакции / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'txModalTitle', 'Подробная информация о транзакции');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenTransfersTitle', '🪙 Внутренние переводы токенов и свопы');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'historicalRate', '≈ ${rate} USD (Курс на момент транзакции)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'ledger', 'Книга кошелька');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'moneyTrail', 'Движение средств');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'header_dualLayerStatusTooltip', 'Статус двухуровневой сети Humanode: Синхронизирована и активна');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'header_glossaryTooltip', 'Руководство по сети и глоссарий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'validators_exportCsvTooltip', 'Скачать отфильтрованный список валидаторов в формате CSV');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_enterAddressPlaceholder', 'Введите адрес кошелька 0x...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'compare_addressPlaceholder', '0x... или hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_calldataPlaceholder', 'Введите 0x... hex calldata или 4-байтовый селектор метода');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simStatus', 'Статус:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simBiomappedUnique', '🟢 BIOMAPPED (УНИКАЛЬНЫЙ ЧЕЛОВЕК)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simUnverified', '🔴 НЕ ВЕРИФИЦИРОВАНО');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simActiveGen', 'Активное поколение:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simEnclaveAttestation', 'Аттестация анклава:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_simPointer', 'Указатель биомаппинга:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_paramName', 'Параметр');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_paramType', 'Тип');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_paramDecodedValue', 'Декодированное значение');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'governance_runtimeUpgradeForkless', 'Обновление среды выполнения (без форка)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'governance_palletModuleParameters', 'Параметры паллетов и модулей');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'governance_successfulExecutionsCount', '1 076 успешных выполнений');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_exchangesAndTreasuries', 'Биржи и казначейства');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_nodeOperators', 'Операторы узлов');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_defiParticipants', 'Участники DeFi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_communityMembers', 'Сообщество');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_whaleDesc', 'KuCoin, BitMart, казначейство фонда и первые инвесторы.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_sharkDesc', 'Долгосрочные операторы валидаторов и накапливающие узлы.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_dolphinDesc', 'Провайдеры ликвидности Impossible Finance и активные трейдеры.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_shrimpDesc', 'Участники биометрического тестнета, получатели аирдропов и микропереводы.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'colToken', 'Токен');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'unlocks_tokenClaimsTitle', 'Клеймы токенов (Airdrop)');

-- Translations: [es]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'blockModalTitle', 'Detalles del Bloque #{block}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'btnTraceMoneyTrail', 'Rastrear Fondos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'btnViewSenderLedger', 'Libro del Emisor');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'btnViewTargetLedger', 'Libro del Destinatario');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'colDetail', 'Detalle');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'colFromTo', 'De ➔ Para');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'fromLabel', 'Remitente (De / Firmante)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'toLabel', 'Destinatario / Objetivo (Para)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'transferAmount', 'Monto de Transferencia');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'gasFeeLabel', 'Gas Pagado (Comisión)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'gasUsedLabel', 'Gas Utilizado');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txGasUsed', 'Gas Utilizado');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txHashLabel', 'Hash de Transacción / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'txModalTitle', 'Información Detallada de la Transacción');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenTransfersTitle', '🪙 Transferencias y Swaps Internos de Tokens');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'historicalRate', '≈ ${rate} USD (Tasa Histórica)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'ledger', 'Libro de Billetera');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'moneyTrail', 'Rastro de Fondos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'header_dualLayerStatusTooltip', 'Estado de Red Doble Capa Humanode: Sincronizada y Activa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'header_glossaryTooltip', 'Guía de Red y Glosario');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'validators_exportCsvTooltip', 'Descargar lista filtrada de validadores como CSV');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_enterAddressPlaceholder', 'Ingrese dirección de billetera 0x...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'compare_addressPlaceholder', '0x... o hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_calldataPlaceholder', 'Ingrese 0x... calldata hexadecimal o selector de método de 4 bytes');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simStatus', 'Estado:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simBiomappedUnique', '🟢 BIOMAPPED (HUMANO ÚNICO)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simUnverified', '🔴 NO VERIFICADO');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simActiveGen', 'Generación Activa:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simEnclaveAttestation', 'Certificación de Enclave:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_simPointer', 'Puntero de Biomapping:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_paramName', 'Parámetro');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_paramType', 'Tipo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_paramDecodedValue', 'Valor Decodificado');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'governance_runtimeUpgradeForkless', 'Actualización de Runtime (Sin Fork)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'governance_palletModuleParameters', 'Parámetros de Pallets y Módulos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'governance_successfulExecutionsCount', '1.076 Ejecuciones Exitosas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_exchangesAndTreasuries', 'Intercambios y Tesorerías');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_nodeOperators', 'Operadores de Nodos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_defiParticipants', 'Participantes de DeFi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_communityMembers', 'Comunidad');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_whaleDesc', 'KuCoin, BitMart, Tesorería de la Fundación e inversores semilla.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_sharkDesc', 'Operadores de validadores a largo plazo y nodos acumuladores.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_dolphinDesc', 'Proveedores de liquidez de Impossible Finance y operadores activos.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_shrimpDesc', 'Participantes de testnet biométrica, receptores de airdrop y microtransferencias.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'colToken', 'Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'unlocks_tokenClaimsTitle', 'Reclamaciones de Tokens (Airdrop)');

-- Translations: [zh]
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'blockModalTitle', '区块 #{block} 详情');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'btnTraceMoneyTrail', '追踪资金流向');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'btnViewSenderLedger', '发送方账本');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'btnViewTargetLedger', '接收方账本');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'colDetail', '详情');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'colFromTo', '发送方 ➔ 接收方');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'fromLabel', '发送方 (签名者)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'toLabel', '接收方 / 目标');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'transferAmount', '转账金额');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'gasFeeLabel', '消耗 Gas (手续费)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'gasUsedLabel', '已用 Gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txGasUsed', '已用 Gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txHashLabel', '交易哈希 / Extrinsic');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'txModalTitle', '交易详细信息');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenTransfersTitle', '🪙 内部代币转账与闪兑');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'historicalRate', '≈ ${rate} USD (历史成交汇率)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'ledger', '钱包账本');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'moneyTrail', '资金追踪');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'header_dualLayerStatusTooltip', 'Humanode 双层网络状态：已同步并实时在线');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'header_glossaryTooltip', '网络指南与术语词汇表');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'validators_exportCsvTooltip', '以 CSV 格式导出已筛选的验证节点列表');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_enterAddressPlaceholder', '输入 0x... 钱包地址');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'compare_addressPlaceholder', '0x... 或 hm...');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_calldataPlaceholder', '输入 0x... 十六进制 calldata 或 4 字节方法选择器');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simStatus', '状态：');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simBiomappedUnique', '🟢 BIOMAPPED (唯一真实人类)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simUnverified', '🔴 未经生物识别验证');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simActiveGen', '活跃代系：');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simEnclaveAttestation', '安全飞地证明：');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_simPointer', '生物映射指针：');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_paramName', '参数');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_paramType', '类型 (Type)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_paramDecodedValue', '解析值 (Decoded Value)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'governance_runtimeUpgradeForkless', '运行时无分叉升级 (Runtime Upgrade)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'governance_palletModuleParameters', 'Pallet 与模块系统参数');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'governance_successfulExecutionsCount', '1,076 次成功执行');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_exchangesAndTreasuries', '交易所与官方金库');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_nodeOperators', '验证节点运营者');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_defiParticipants', 'DeFi 参与者');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_communityMembers', '生态社区');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_whaleDesc', 'KuCoin、BitMart、基金会官方金库及早期种子轮投资者。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_sharkDesc', '长期验证节点运营者与稳健积累的验证者。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_dolphinDesc', 'Impossible Finance 流动性提供者 (LP) 与活跃代币交易者。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_shrimpDesc', '生物识别测试网参与者、空投持有者及微额转账地址。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'colToken', '代币 (Token)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'unlocks_tokenClaimsTitle', '代币申领 (Airdrop)');

-- Added ledgerShowZeroBalances
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'ledgerShowZeroBalances', 'Sıfır Bakiyeleri Göster', 1794429844440);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'ledgerShowZeroBalances', 'Show Zero Balances', 1794429844440);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'ledgerShowZeroBalances', 'Nullsalden anzeigen', 1794429844440);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'ledgerShowZeroBalances', 'Показать нулевые балансы', 1794429844440);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'ledgerShowZeroBalances', 'Mostrar saldos cero', 1794429844440);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'ledgerShowZeroBalances', '显示零余额', 1794429844440);

INSERT OR REPLACE INTO address_labels (address, label, category, color, notes, is_watched, updated_at) VALUES ('0x2248100d4d0950B06C1973b601f6DFD8Fb149e45', 'Humanode Burn Contract', 'burn', '#f97316', 'Humanode Resmi Coin Yakma Sözleşmesi (Official Coin Burn Contract)', 1, 1794530000);

-- =============================================================
-- ZERO-HARDCODING I18N ENHANCEMENT SEEDS
-- =============================================================
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_modalTitle', 'Humanode Ağ Kılavuzu & Terimler Sözlüğü');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_modalTitle', 'Humanode Network Guide & Glossary');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_modalTitle', 'Humanode Netzwerkhandbuch & Glossar');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_modalTitle', 'Руководство сети Humanode и глоссарий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_modalTitle', 'Guía de Red y Glosario de Humanode');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_modalTitle', 'Humanode 网络指南与词汇表');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_modalSubtitle', 'Proof-of-Humanity ve Çift Katmanlı Blokzincir Kavramları Rehberi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_modalSubtitle', 'Guide to Proof-of-Humanity and Dual-Layer Blockchain Concepts');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_modalSubtitle', 'Leitfaden für Proof-of-Humanity- und Dual-Layer-Blockchain-Konzepte');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_modalSubtitle', 'Руководство по концепциям Proof-of-Humanity и двухуровневого блокчейна');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_modalSubtitle', 'Guía de conceptos de Proof-of-Humanity y blockchain de doble capa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_modalSubtitle', '人性证明与双层区块链概念指南');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_modalIntro', 'Humanode-Trace kaşifinde gezinirken sıkça karşılaşacağınız teknik metriklerin ve ağ mekaniklerinin sadeleştirilmiş açıklamaları:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_modalIntro', 'Simplified explanations of technical metrics and network mechanics you will frequently encounter while browsing the Humanode-Trace explorer:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_modalIntro', 'Vereinfachte Erklärungen technischer Metriken und Netzwerkmechaniken im Humanode-Trace Explorer:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_modalIntro', 'Упрощенные пояснения технических показателей и сетевой механики в обозревателе Humanode-Trace:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_modalIntro', 'Explicaciones simplificadas de métricas técnicas y mecánicas de red en el explorador Humanode-Trace:');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_modalIntro', 'Humanode-Trace 浏览器中常用技术指标和网络机制的通俗解释：');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_networkStatusLive', 'Ağ Durumu: Canlı ({count} Düğüm)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_networkStatusLive', 'Network Status: Live ({count} Nodes)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_networkStatusLive', 'Netzwerkstatus: Live ({count} Knoten)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_networkStatusLive', 'Состояние сети: В сети ({count} узлов)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_networkStatusLive', 'Estado de la red: En vivo ({count} nodos)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_networkStatusLive', '网络状态：运行中 ({count} 节点)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_pohTitle', 'Proof-of-Humanity (1 İnsan = 1 Düğüm)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_pohTitle', 'Proof-of-Humanity (1 Human = 1 Node)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_pohTitle', 'Proof-of-Humanity (1 Mensch = 1 Knoten)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_pohTitle', 'Proof-of-Humanity (1 человек = 1 узел)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_pohTitle', 'Proof-of-Humanity (1 Humano = 1 Nodo)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_pohTitle', '人性证明 (1人 = 1节点)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_pohBadge', 'Konsensüs');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_pohBadge', 'Consensus');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_pohBadge', 'Konsens');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_pohBadge', 'Консенсус');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_pohBadge', 'Consenso');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_pohBadge', '共识');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_pohSummary', 'Stake miktarı ne kadar büyük olursa olsun kimsenin ağda fazladan oy veya blok hakkı elde edemediği eşitlikçi konsensüs modelidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_pohSummary', 'Egalitarian consensus model where no one gets extra voting power or block authoring rights regardless of stake.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_pohSummary', 'Egalitäres Konsensmodell, bei dem niemand unabhängig von der Beteiligung zusätzliche Stimmrechte erhält.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_pohSummary', 'Эгалитарная модель консенсуса, где никто не получает дополнительных голосов независимо от ставки.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_pohSummary', 'Modelo de consenso igualitario donde nadie obtiene votos adicionales sin importar el capital.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_pohSummary', '人人平等的共识机制，无论质押多少代币，任何人都不会获得额外的投票权或出块权。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_pohDetails', 'Humanode ağında her validatör tekil bir insana aittir. Zenginlik (PoS) veya saf işlem gücü (PoW) değil, kriptografik olarak kanıtlanmış tekil insan varlığı doğrulama yetkisini belirler.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_pohDetails', 'In Humanode, every validator belongs to a unique human. Cryptographically verified unique human existence determines validation authority.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_pohDetails', 'Im Humanode-Netzwerk gehört jeder Validator einem einzigartigen Menschen. Kryptografisch verifizierte Existenz bestimmt die Autorität.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_pohDetails', 'В Humanode каждый валидатор принадлежит уникальному человеку. Криптографически доказанное присутствие определяет валидацию.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_pohDetails', 'En Humanode, cada validador pertenece a un humano único. La presencia humana criptográficamente probada determina la validación.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_pohDetails', '在 Humanode 网络中，每个验证者都对应一个独立的人类。验证权限由密码学生物证明决定，而非财富 (PoS) 或算力 (PoW)。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_bioauthTitle', 'Biyometrik Doğrulama & 168 Saat (42 Epoch)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_bioauthTitle', 'Biometric Verification & 168 Hours (42 Epochs)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_bioauthTitle', 'Biometrische Verifizierung & 168 Stunden (42 Epochen)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_bioauthTitle', 'Биометрическая верификация и 168 часов (42 эпохи)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_bioauthTitle', 'Verificación Biométrica y 168 Horas (42 Épocas)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_bioauthTitle', '生物特征验证与 168 小时 (42 周期)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_bioauthBadge', 'Doğrulama');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_bioauthBadge', 'Verification');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_bioauthBadge', 'Verifizierung');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_bioauthBadge', 'Верификация');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_bioauthBadge', 'Verificación');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_bioauthBadge', '身份验证');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_bioauthSummary', 'Validatörlerin insan olduklarını ve aktifliklerini ispatladıkları periyodik biyometrik döngüdür.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_bioauthSummary', 'Periodic biometric cycle where validators prove uniqueness and ongoing liveness.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_bioauthSummary', 'Periodischer biometrischer Zyklus, in dem Validatoren ihre Einzigartigkeit und Aktivität beweisen.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_bioauthSummary', 'Периодический биометрический цикл, в котором валидаторы подтверждают подлинность и активность.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_bioauthSummary', 'Ciclo biométrico periódico en el que los validadores demuestran su actividad y humanidad.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_bioauthSummary', '验证者定期证明其唯一真实存在并保持在线的生物识别周期。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_bioauthDetails', 'Her validatörün bioauth süresi 168 saat (yaklaşık 7 gün / 42 Epoch) olarak geri sayar. Bu süre dolmadan validatör yüz canlılık testini (liveness) yenilemelidir; aksi takdirde düğüm pasife düşer.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_bioauthDetails', 'Every validator has a 168-hour (approx 7 days / 42 epochs) countdown. Liveness must be renewed before expiration; otherwise the node becomes inactive.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_bioauthDetails', 'Jeder Validator hat einen 168-Stunden-Countdown. Die Lebendigkeitsprüfung muss vor Ablauf erneuert werden.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_bioauthDetails', 'У каждого валидатора идет обратный отсчет 168 часов. Проверку живости необходимо обновлять вовремя.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_bioauthDetails', 'Cada validador tiene una cuenta regresiva de 168 horas. La prueba de vida debe renovarse antes del vencimiento.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_bioauthDetails', '每个验证者的生物认证有效期为 168 小时（约 7 天 / 42 纪元）。必须在倒计时归零前重新完成 3D 活体检测，否则节点将被停用。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_feespotTitle', 'FeesPot (Ücret Dağıtım Havuzu)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_feespotTitle', 'FeesPot (Fee Distribution Pool)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_feespotTitle', 'FeesPot (Gebührenverteilungspool)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_feespotTitle', 'FeesPot (Пул распределения комиссий)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_feespotTitle', 'FeesPot (Fondo de Distribución de Tarifas)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_feespotTitle', 'FeesPot (费用分配资金池)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_feespotBadge', 'Ekonomi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_feespotBadge', 'Economics');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_feespotBadge', 'Wirtschaft');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_feespotBadge', 'Экономика');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_feespotBadge', 'Economía');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_feespotBadge', '经济模型');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_feespotSummary', 'Ağ genelinde toplanan işlem ve transfer ücretlerinin biriktiği merkezi olmayan akıllı havuzdur.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_feespotSummary', 'Decentralized smart pool accumulating all transaction and transfer fees collected across the network.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_feespotSummary', 'Dezentraler Smart-Pool, in dem alle Transaktionsgebühren des Netzwerks gesammelt werden.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_feespotSummary', 'Децентрализованный пул, аккумулирующий все транзакционные комиссии сети.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_feespotSummary', 'Fondo inteligente descentralizado que acumula todas las tarifas de transacción de la red.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_feespotSummary', '汇集全网所有转账和交易手续费的去中心化智能资金池。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_feespotDetails', 'FeesPot bakiyesi periyodik olarak tüm aktif biyometrik validatörlere eşit oranda paylaştırılır. Bu sayede validatörler işlem hacminden bağımsız olarak istikrarlı bir ödül akışı elde eder.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_feespotDetails', 'FeesPot balance is periodically distributed equally to all active biometric validators, providing a steady reward stream.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_feespotDetails', 'Das FeesPot-Guthaben wird periodisch zu gleichen Teilen an alle aktiven Validatoren verteilt.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_feespotDetails', 'Баланс FeesPot периодически распределяется поровну между всеми активными валидаторами.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_feespotDetails', 'El saldo de FeesPot se distribuye periódicamente en partes iguales a todos los validadores activos.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_feespotDetails', 'FeesPot 池中的资金会定期均等发放给所有活跃的人性验证节点，不受单个节点处理交易量影响。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_tokenomicsTitle', '400M Sabit Arz (Tokenomics)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_tokenomicsTitle', '400M Fixed Supply (Tokenomics)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_tokenomicsTitle', '400M Festes Gesamtangebot (Tokenomics)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_tokenomicsTitle', '400M Фиксированное предложение (Токеномика)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_tokenomicsTitle', '400M Suministro Fijo (Tokenómica)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_tokenomicsTitle', '400M 固定代币总量 (代币经济)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_tokenomicsBadge', 'Token Arzı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_tokenomicsBadge', 'Token Supply');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_tokenomicsBadge', 'Token-Angebot');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_tokenomicsBadge', 'Предложение');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_tokenomicsBadge', 'Suministro');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_tokenomicsBadge', '代币供应');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_tokenomicsSummary', 'Humanode ağının enflasyonsuz, 400.000.000 HMND ile sınırlandırılmış sabit maksimum arz mimarisidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_tokenomicsSummary', 'Humanode network non-inflationary fixed maximum supply architecture capped at 400,000,000 HMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_tokenomicsSummary', 'Nicht-inflationäre feste maximale Angebotsarchitektur des Humanode-Netzwerks, begrenzt auf 400.000.000 HMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_tokenomicsSummary', 'Неинфляционная модель общего предложения Humanode с жестким лимитом в 400 000 000 HMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_tokenomicsSummary', 'Arquitectura de suministro máximo fijo sin inflación limitada a 400.000.000 HMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_tokenomicsSummary', 'Humanode 网络的零通胀模型，代币硬顶严格限制为 400,000,000 HMND。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_tokenomicsDetails', 'Hiçbir koşulda 400M üzerinde token basılamaz. Ağda yakılan coinler (burn) toplam arzı deflasyonist olarak azaltır.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_tokenomicsDetails', 'Under no circumstances can more than 400M tokens be minted. Burned coins permanently reduce effective supply.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_tokenomicsDetails', 'Unter keinen Umständen können mehr als 400 Millionen Token geprägt werden. Verbrannte Coins reduzieren das Angebot dauerhaft.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_tokenomicsDetails', 'Ни при каких обстоятельствах не может быть выпущено более 400 млн токенов. Сжигание уменьшает предложение.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_tokenomicsDetails', 'Bajo ninguna circunstancia se pueden emitir más de 400M de tokens. Las monedas quemadas reducen el suministro permanentemente.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_tokenomicsDetails', '任何情况下都不会增发超过 4 亿枚代币。发送至销毁合约的代币将永久降低实际流通总量。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_subToEvmTitle', 'Precompile 0x900 (Katmanlar Arası Köprü)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_subToEvmTitle', 'Precompile 0x900 (Cross-Layer Bridge)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_subToEvmTitle', 'Precompile 0x900 (Schichtübergreifende Brücke)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_subToEvmTitle', 'Precompile 0x900 (Межслойный мост)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_subToEvmTitle', 'Precompile 0x900 (Puente entre capas)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_subToEvmTitle', 'Precompile 0x900 (原生跨层桥)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_subToEvmBadge', 'Köprü');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_subToEvmBadge', 'Bridge');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_subToEvmBadge', 'Brücke');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_subToEvmBadge', 'Мост');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_subToEvmBadge', 'Puente');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_subToEvmBadge', '跨链桥');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_subToEvmSummary', 'Substrate yerel bakiyesi ile EVM WeHMND bakiyesi arasında çift yönlü anlık takas sağlayan ön-derlenmiş sistem sözleşmesidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_subToEvmSummary', 'Native precompile system contract enabling instant bi-directional swaps between Substrate and EVM WeHMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_subToEvmSummary', 'Vorkompilierter Systemvertrag für sofortige bidirektionale Swaps zwischen Substrate und EVM WeHMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_subToEvmSummary', 'Прекомпилированный системный контракт для мгновенного двустороннего обмена между Substrate и EVM WeHMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_subToEvmSummary', 'Contrato de sistema precompilado que permite intercambios bidireccionales instantáneos entre Substrate y EVM WeHMND.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_subToEvmSummary', '在 Substrate 原生代币与 EVM WeHMND 之间实现原子级双向即时兑换的原生预编译系统合约。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_subToEvmDetails', '0x0000000000000000000000000000000000000900 adresine gönderilen işlemler, harici bir üçüncü taraf köprüye ihtiyaç duymadan protokol düzeyinde atomik dönüşüm sağlar.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_subToEvmDetails', 'Transactions sent to 0x...900 achieve trustless, atomic protocol-level conversion without third-party bridges.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_subToEvmDetails', 'Transaktionen an 0x...900 bieten atomare Konvertierung auf Protokollebene ohne Drittanbieter.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_subToEvmDetails', 'Транзакции на 0x...900 обеспечивают атомарную конвертацию на уровне протокола без сторонних мостов.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_subToEvmDetails', 'Las transacciones enviadas a 0x...900 proporcionan conversión atómica a nivel de protocolo sin intermediarios.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_subToEvmDetails', '发送至 0x...900 的交易直接在底层协议中完成原子兑换，无需依赖任何第三方中心化跨链桥。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_100PercentEquality', '%100 Tam Eşitlik');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_100PercentEquality', '100% Full Equality');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_100PercentEquality', '100% Volle Gleichheit');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_100PercentEquality', '100% Полное равенство');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_100PercentEquality', '100% Igualdad Total');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_100PercentEquality', '100% 完全平等');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_3dLivenessDetection', '3D Canlılık Testi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_3dLivenessDetection', '3D Liveness Detection');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_3dLivenessDetection', '3D-Lebendigkeitsprüfung');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_3dLivenessDetection', '3D Проверка живости');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_3dLivenessDetection', 'Prueba de Vida 3D');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_3dLivenessDetection', '3D 活体检测');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_fairSharing', 'Eşit Paylaşım');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_fairSharing', 'Equal Distribution');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_fairSharing', 'Gleiche Verteilung');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_fairSharing', 'Равное распределение');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_fairSharing', 'Distribución Equitativa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_fairSharing', '均等分配');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tokenomics_proofOfHumanityBadge', 'Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tokenomics_proofOfHumanityBadge', 'Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tokenomics_proofOfHumanityBadge', 'Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tokenomics_proofOfHumanityBadge', 'Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tokenomics_proofOfHumanityBadge', 'Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tokenomics_proofOfHumanityBadge', '人性证明');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'overview_evmTooltip', '{count} toplam EVM tabanlı transfer ve akıllı sözleşme çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'overview_evmTooltip', '{count} total EVM-based transfers and smart contract calls');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'overview_evmTooltip', '{count} EVM-Transfers und Smart-Contract-Aufrufe insgesamt');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'overview_evmTooltip', '{count} транзакций EVM и вызовов смарт-контрактов');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'overview_evmTooltip', '{count} transferencias basadas en EVM y llamadas de contratos inteligentes');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'overview_evmTooltip', '共 {count} 笔 EVM 转账与智能合约调用');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'overview_substrateTooltip', '{count} toplam Substrate extrinsic ve konsensüs çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'overview_substrateTooltip', '{count} total Substrate extrinsics and consensus calls');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'overview_substrateTooltip', '{count} Substrate-Extrinsics und Konsensaufrufe insgesamt');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'overview_substrateTooltip', '{count} транзакций Substrate и вызовов консенсуса');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'overview_substrateTooltip', '{count} llamadas extrínsecas y de consenso de Substrate');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'overview_substrateTooltip', '共 {count} 笔 Substrate 外部调用与共识交易');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'overview_bridgeTooltip', 'Köprü üzerinden taşınan toplam hacim: {count} işlem');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'overview_bridgeTooltip', 'Total volume routed across bridge: {count} transactions');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'overview_bridgeTooltip', 'Über die Brücke transferiertes Gesamtvolumen: {count} Transaktionen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'overview_bridgeTooltip', 'Общий объем через мост: {count} транзакций');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'overview_bridgeTooltip', 'Volumen total a través del puente: {count} transacciones');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'overview_bridgeTooltip', '跨链桥累计流转量：{count} 笔交易');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'overview_burnedGasTooltip', 'Ağ genelindeki toplam gas komisyonu: {amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'overview_burnedGasTooltip', 'Total network gas fees: {amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'overview_burnedGasTooltip', 'Gesamte Netzwerk-Gasgebühren: {amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'overview_burnedGasTooltip', 'Всего комиссий сети за газ: {amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'overview_burnedGasTooltip', 'Comisiones totales de gas de red: {amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'overview_burnedGasTooltip', '全网累计 Gas 费用：{amount} HMND');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'header_nodeCount', '{count} Düğüm');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'header_nodeCount', '{count} Nodes');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'header_nodeCount', '{count} Knoten');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'header_nodeCount', '{count} Узлов');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'header_nodeCount', '{count} Nodos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'header_nodeCount', '{count} 节点');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'header_networkGuide', 'Ağ Kılavuzu');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'header_networkGuide', 'Network Guide');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'header_networkGuide', 'Netzwerkhandbuch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'header_networkGuide', 'Руководство сети');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'header_networkGuide', 'Guía de Red');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'header_networkGuide', '网络指南');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layer_evm', 'EVM Katmanı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layer_evm', 'EVM Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'layer_evm', 'EVM-Schicht');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'layer_evm', 'Уровень EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'layer_evm', 'Capa EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'layer_evm', 'EVM 层');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'layer_substrate', 'Substrate Katmanı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'layer_substrate', 'Substrate Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'layer_substrate', 'Substrate-Schicht');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'layer_substrate', 'Уровень Substrate');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'layer_substrate', 'Capa Substrate');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'layer_substrate', 'Substrate 层');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridge_subToEvm', 'Substrate ➔ EVM Köprüsü');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridge_subToEvm', 'Substrate ➔ EVM Bridge');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'bridge_subToEvm', 'Substrate ➔ EVM Brücke');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'bridge_subToEvm', 'Мост Substrate ➔ EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'bridge_subToEvm', 'Puente Substrate ➔ EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'bridge_subToEvm', 'Substrate ➔ EVM 跨链桥');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridge_evmToSub', 'EVM ➔ Substrate (Precompile)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridge_evmToSub', 'EVM ➔ Substrate (Precompile)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'bridge_evmToSub', 'EVM ➔ Substrate (Precompile)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'bridge_evmToSub', 'EVM ➔ Substrate (Прекомпиляция)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'bridge_evmToSub', 'EVM ➔ Substrate (Precompilación)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'bridge_evmToSub', 'EVM ➔ Substrate (预编译)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'badge_active', 'AKTİF');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'badge_active', 'ACTIVE');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'badge_active', 'AKTIV');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'badge_active', 'АКТИВНО');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'badge_active', 'ACTIVO');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'badge_active', '活跃');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'leaderboard_rank1', '#1 LİDER (ALTIN)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'leaderboard_rank1', '#1 LEADER (GOLD)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'leaderboard_rank1', '#1 LEADER (GOLD)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'leaderboard_rank1', '#1 ЛИДЕР (ЗОЛОТО)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'leaderboard_rank1', '#1 LÍDER (ORO)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'leaderboard_rank1', '#1 冠军 (金牌)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'leaderboard_rank2', '#2 GÜMÜŞ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'leaderboard_rank2', '#2 SILVER');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'leaderboard_rank2', '#2 SILBER');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'leaderboard_rank2', '#2 СЕРЕБРО');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'leaderboard_rank2', '#2 PLATA');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'leaderboard_rank2', '#2 亚军 (银牌)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (Ana Ağ Otoritesi & Yerel CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (Mainnet Authority & Native CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (Hauptnetz-Autorität & CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (Основная сеть и CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (Autoridad Mainnet y CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_optHumanodeRoot', '🧬 Humanode Root L1 (主网权威与原生 CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_optCrossLayer', '🛡️ Çapraz Katman Eşleşmesi (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_optCrossLayer', '🛡️ Cross-Layer Matching (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_optCrossLayer', '🛡️ Cross-Layer-Abgleich (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_optCrossLayer', '🛡️ Кросс-слойное соответствие (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_optCrossLayer', '🛡️ Emparejamiento entre capas (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_optCrossLayer', '🛡️ 跨层地址绑定 (hm... ⇄ 0x... EVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_targetVerifications', '{network} hedef köprü doğrulamaları');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_targetVerifications', '{network} target bridge verifications');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_targetVerifications', '{network} Zielbrücken-Verifizierungen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_targetVerifications', 'Верификации целевого моста {network}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_targetVerifications', 'Verificaciones de puente de destino {network}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_targetVerifications', '{network} 目标跨链桥验证');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'hodlers_optCrossLayer', '🔗 Çift Katman Eşleşmeli');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'hodlers_optCrossLayer', '🔗 Dual-Layer Matched');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'hodlers_optCrossLayer', '🔗 Dual-Layer Zugeordnet');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'hodlers_optCrossLayer', '🔗 Двухуровневое соответствие');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'hodlers_optCrossLayer', '🔗 Emparejado de Doble Capa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'hodlers_optCrossLayer', '🔗 双层匹配');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_lpFee', 'LP Ücreti: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_lpFee', 'LP Fee: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_lpFee', 'LP-Gebühr: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_lpFee', 'Комиссия LP: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_lpFee', 'Tarifa de LP: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_lpFee', '流动性池费用: {amount}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'dex_signaturesGlossary', '100.000+ İMZA SÖZLÜĞÜ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'dex_signaturesGlossary', '100,000+ SIGNATURE DICTIONARY');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'dex_signaturesGlossary', '100.000+ SIGNATUR-WÖRTERBUCH');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'dex_signaturesGlossary', '100 000+ СЛОВАРЬ СИГНАТУР');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'dex_signaturesGlossary', 'DICCIONARIO DE 100.000+ FIRMAS');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'dex_signaturesGlossary', '100,000+ 函数签名词典');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'equality_walletCount', '{count} Cüzdan');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'equality_walletCount', '{count} Wallets');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'equality_walletCount', '{count} Wallets');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'equality_walletCount', '{count} Кошельков');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'equality_walletCount', '{count} Billeteras');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'equality_walletCount', '{count} 个钱包');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'feespot_gasFees', 'Ağ Gas İşlem Komisyonları');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'feespot_gasFees', 'Network Gas Transaction Fees');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'feespot_gasFees', 'Netzwerk-Gastransaktionsgebühren');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'feespot_gasFees', 'Комиссии сети за газ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'feespot_gasFees', 'Comisiones de gas de transacción de red');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'feespot_gasFees', '网络 Gas 交易手续费');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'amount_exactValue', 'Tam Değer: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'amount_exactValue', 'Exact Value: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'amount_exactValue', 'Genauer Wert: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'amount_exactValue', 'Точное значение: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'amount_exactValue', 'Valor Exacto: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'amount_exactValue', '精确数值: {amount} {unit}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tx_actionCalled', '{pallet}:{method} işlemi çağrıldı.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tx_actionCalled', '{pallet}:{method} action executed.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tx_actionCalled', '{pallet}:{method} ausgeführt.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tx_actionCalled', 'Действие {pallet}:{method} выполнено.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tx_actionCalled', 'Acción {pallet}:{method} ejecutada.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tx_actionCalled', '{pallet}:{method} 操作已执行。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tx_multisigCall', 'Çoklu imza yürütme çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tx_multisigCall', 'Multisig execution call');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tx_multisigCall', 'Multisig-Ausführungsaufruf');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tx_multisigCall', 'Вызов выполнения мультиподписи');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tx_multisigCall', 'Llamada de ejecución multifirma');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tx_multisigCall', '多签执行调用');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'tx_rootCall', 'Root yetkili protokol çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'tx_rootCall', 'Root authorized protocol call');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'tx_rootCall', 'Root-autorisierter Protokollaufruf');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'tx_rootCall', 'Протокольный вызов с правами root');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'tx_rootCall', 'Llamada de protocolo autorizada por root');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'tx_rootCall', 'Root 权限协议调用');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_low', 'Düşük');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_low', 'Low');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_low', 'Niedrig');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_low', 'Низкий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_low', 'Bajo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_low', '低');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_medium', 'Orta');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_medium', 'Medium');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_medium', 'Mittel');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_medium', 'Средний');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_medium', 'Medio');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_medium', '中');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_high', 'Yüksek');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_high', 'High');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_high', 'Hoch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_high', 'Высокий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_high', 'Alto');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_high', '高');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_biomapperTitle', 'Biomapper (Çapraz Zincir Kimlik)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_biomapperTitle', 'Biomapper (Cross-Chain Identity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_biomapperTitle', 'Biomapper (Cross-Chain-Identität)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_biomapperTitle', 'Biomapper (Кросс-чейн идентификация)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_biomapperTitle', 'Biomapper (Identidad Cross-Chain)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_biomapperTitle', 'Biomapper (跨链身份认证)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_biomapperBadge', 'Çapraz Zincir');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_biomapperBadge', 'Cross-Chain');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_biomapperBadge', 'Cross-Chain');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_biomapperBadge', 'Кросс-чейн');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_biomapperBadge', 'Cross-Chain');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_biomapperBadge', '跨链技术');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_biomapperSummary', 'Humanode biyometrisini Ethereum, Arbitrum, Optimism gibi 25+ farklı EVM ağına güvenle bağlayan kimlik köprüsüdür.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_biomapperSummary', 'Identity bridge connecting Humanode biometrics to 25+ different EVM networks securely.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_biomapperSummary', 'Identitätsbrücke, die Humanode-Biometrie mit 25+ verschiedenen EVM-Netzwerken verbindet.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_biomapperSummary', 'Мост идентификации, связывающий биометрию Humanode с 25+ сетями EVM.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_biomapperSummary', 'Puente de identidad que conecta la biometría de Humanode con 25+ redes EVM de forma segura.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_biomapperSummary', '将 Humanode 生物认证安全桥接至以太坊、Arbitrum 等 25+ 条主流 EVM 网络的身份枢纽。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_biomapperDetails', 'Kullanıcının biyometrik verisi hiçbir zaman ağa sızdırılmaz. Sıfır bilgi kanıtı ve kriptografik eşleme ile harici cüzdanın tekil bir insana ait olduğu doğrulanır.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_biomapperDetails', 'Biometric data is never leaked. Zero-knowledge proofs and cryptographic binding prove that an external wallet belongs to a unique human.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_biomapperDetails', 'Biometrische Daten werden niemals weitergegeben. Zero-Knowledge-Beweise verifizieren die Einzigartigkeit.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_biomapperDetails', 'Биометрические данные никогда не передаются в сеть. Доказательства с нулевым разглашением гарантируют уникальность.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_biomapperDetails', 'Los datos biométricos nunca se filtran. Las pruebas de conocimiento cero garantizan que la billetera pertenece a un humano único.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_biomapperDetails', '用户的生物特征永远不会泄露到网络中。通过零知识证明与加密绑定，证明外部链上钱包归属于独立的自然人，抵御女巫攻击。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_dualLayerTitle', 'Substrate & EVM Çift Katmanı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_dualLayerTitle', 'Substrate & EVM Dual-Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_dualLayerTitle', 'Substrate & EVM Dual-Layer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_dualLayerTitle', 'Двухуровневая архитектура Substrate и EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_dualLayerTitle', 'Doble Capa Substrate y EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_dualLayerTitle', 'Substrate & EVM 双层架构');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_dualLayerBadge', 'Mimari');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_dualLayerBadge', 'Architecture');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_dualLayerBadge', 'Architektur');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_dualLayerBadge', 'Архитектура');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_dualLayerBadge', 'Arquitectura');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_dualLayerBadge', '核心架构');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_dualLayerSummary', 'Humanode hem Substrate tabanlı yerel konsensüs katmanını hem de Ethereum Sanal Makinesini (EVM) eşzamanlı çalıştırır.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_dualLayerSummary', 'Humanode simultaneously operates both a Substrate-based native consensus layer and the Ethereum Virtual Machine (EVM).');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_dualLayerSummary', 'Humanode betreibt gleichzeitig eine Substrate-basierte native Konsensschicht und die EVM.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_dualLayerSummary', 'Humanode одновременно поддерживает собственный уровень консенсуса Substrate и EVM.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_dualLayerSummary', 'Humanode opera simultáneamente una capa de consenso nativa de Substrate y la EVM.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_dualLayerSummary', 'Humanode 同时原生运行基于 Substrate 的底层共识层与以太坊虚拟机 (EVM)。');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'glossary_dualLayerDetails', 'Substrate katmanı biyometri, validatör oturumları ve hazine gibi temel sistem işlemlerini yönetirken; EVM katmanı standart Solidity akıllı sözleşmelerini yürütür.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'glossary_dualLayerDetails', 'Substrate manages biometrics, validator sessions, and treasury, while EVM executes standard Solidity contracts and ERC-20 tokens.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'glossary_dualLayerDetails', 'Substrate verwaltet Biometrie und Validatoren, während die EVM Solidity-Verträge ausführt.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'glossary_dualLayerDetails', 'Substrate управляет биометрией и валидаторами, а EVM исполняет смарт-контракты Solidity.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'glossary_dualLayerDetails', 'Substrate gestiona la biometría y validadores, mientras que la EVM ejecuta contratos inteligentes de Solidity.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'glossary_dualLayerDetails', 'Substrate 层专门调度生物认证、验证者纪元与金库 extrinsics；EVM 层则运行标准的 Solidity 智能合约与 ERC-20 生态代币。');

-- Additional Zero Hardcoding Translations
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'leaderboard_rank3', '#3 BRONZ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'leaderboard_rank3', '#3 BRONZE');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'leaderboard_rank3', '#3 BRONZE');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'leaderboard_rank3', '#3 БРОНЗА');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'leaderboard_rank3', '#3 BRONCE');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'leaderboard_rank3', '#3 季军 (铜牌)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'hodlers_substrateNetwork', '⚡ Substrate Ağı (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'hodlers_substrateNetwork', '⚡ Substrate Network (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'hodlers_substrateNetwork', '⚡ Substrate-Netzwerk (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'hodlers_substrateNetwork', '⚡ Сеть Substrate (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'hodlers_substrateNetwork', '⚡ Red Substrate (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'hodlers_substrateNetwork', '⚡ Substrate 网络 (hm...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'hodlers_evmNetwork', '🌐 EVM Ağı (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'hodlers_evmNetwork', '🌐 EVM Network (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'hodlers_evmNetwork', '🌐 EVM-Netzwerk (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'hodlers_evmNetwork', '🌐 Сеть EVM (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'hodlers_evmNetwork', '🌐 Red EVM (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'hodlers_evmNetwork', '🌐 EVM 网络 (0x...)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'perPage', '{count} / sayfa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'perPage', '{count} / page');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'perPage', '{count} / Seite');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'perPage', '{count} / стр.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'perPage', '{count} / pág.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'perPage', '{count} / 页');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'gov_multisigExecutionCall', 'Çoklu imza yürütme çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'gov_multisigExecutionCall', 'Multisig execution call');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'gov_multisigExecutionCall', 'Multisig-Ausführungsaufruf');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'gov_multisigExecutionCall', 'Вызов выполнения мультиподписи');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'gov_multisigExecutionCall', 'Llamada de ejecución multifirma');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'gov_multisigExecutionCall', '多签执行调用');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'gov_rootAuthorizedCall', 'Root yetkili protokol çağrısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'gov_rootAuthorizedCall', 'Root authorized protocol call');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'gov_rootAuthorizedCall', 'Root-autorisierter Protokollaufruf');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'gov_rootAuthorizedCall', 'Вызов протокола с правами Root');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'gov_rootAuthorizedCall', 'Llamada de protocolo autorizada por Root');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'gov_rootAuthorizedCall', 'Root 权限协议调用');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_low', 'Düşük');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_low', 'Low');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_low', 'Niedrig');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_low', 'Низкий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_low', 'Bajo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_low', '低');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_medium', 'Orta');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_medium', 'Medium');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_medium', 'Mittel');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_medium', 'Средний');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_medium', 'Medio');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_medium', '中');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_high', 'Yüksek');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_high', 'High');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_high', 'Hoch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_high', 'Высокий');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_high', 'Alto');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_high', '高');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'risk_verified', 'Doğrulanmış / Güvenli');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'risk_verified', 'Verified / Secure');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'risk_verified', 'Verifiziert / Sicher');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'risk_verified', 'Проверено / Безопасно');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'risk_verified', 'Verificado / Seguro');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'risk_verified', '已验证 / 安全');

-- Semantic Codes & Extrinsic Zero Hardcoding Translations
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (Net Çıkış)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (Net Outflow)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (Nettoabfluss)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (Чистый отток)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (Salida neta)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'bridge_subToEvmNetOutflow', 'Substrate ➔ EVM (净流出)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (Net Giriş)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (Net Inflow)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (Nettozufluss)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (Чистый приток)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (Entrada neta)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'bridge_evmToSubNetInflow', 'EVM ➔ Substrate (净流入)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'val_status_active_verified', 'Aktif (Doğrulanmış)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'val_status_active_verified', 'Active (Verified)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'val_status_active_verified', 'Aktiv (Verifiziert)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'val_status_active_verified', 'Активен (Проверен)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'val_status_active_verified', 'Activo (Verificado)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'val_status_active_verified', '活跃 (已验证)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'val_status_active_expired', 'Aktif (Süresi Doldu)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'val_status_active_expired', 'Active (Expired)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'val_status_active_expired', 'Aktiv (Abgelaufen)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'val_status_active_expired', 'Активен (Истек)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'val_status_active_expired', 'Activo (Expirado)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'val_status_active_expired', '活跃 (已过期)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'val_status_passive', 'Pasif');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'val_status_passive', 'Passive');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'val_status_passive', 'Passiv');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'val_status_passive', 'Пассивен');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'val_status_passive', 'Pasivo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'val_status_passive', '不活跃');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'whale_tier_whale', '🐋 Balina');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'whale_tier_whale', '🐋 Whale');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'whale_tier_whale', '🐋 Wal');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'whale_tier_whale', '🐋 Кит');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'whale_tier_whale', '🐋 Ballena');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'whale_tier_whale', '🐋 巨鲸');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'whale_tier_dolphin', '🐬 Yunus');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'whale_tier_dolphin', '🐬 Dolphin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'whale_tier_dolphin', '🐬 Delphin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'whale_tier_dolphin', '🐬 Дельфин');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'whale_tier_dolphin', '🐬 Delfín');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'whale_tier_dolphin', '🐬 海豚');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'whale_tier_fish', '🐟 Balık');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'whale_tier_fish', '🐟 Fish');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'whale_tier_fish', '🐟 Fisch');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'whale_tier_fish', '🐟 Рыба');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'whale_tier_fish', '🐟 Pez');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'whale_tier_fish', '🐟 小鱼');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_stablecoin', 'Sabit Kripto (Stablecoin)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_stablecoin', 'Stablecoin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_stablecoin', 'Stablecoin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_stablecoin', 'Стейблкоин');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_stablecoin', 'Moneda Estable (Stablecoin)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_stablecoin', '稳定币 (Stablecoin)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_wrapped', 'Sarılmış Kripto (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_wrapped', 'Wrapped Asset');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_wrapped', 'Gepackter Krypto-Asset (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_wrapped', 'Обернутый актив (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_wrapped', 'Activo Envuelto (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_wrapped', '封装资产 (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_dex_lp', 'DEX LP Havuzu');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_dex_lp', 'DEX LP Pool');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_dex_lp', 'DEX-LP-Pool');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_dex_lp', 'Пул ликвидности DEX LP');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_dex_lp', 'Fondo de Liquidez DEX LP');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_dex_lp', '流动性池 (DEX LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_meme', 'Meme Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_meme', 'Meme Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_meme', 'Meme-Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_meme', 'Мем-токен');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_meme', 'Token Meme');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_meme', '模因币 (Meme)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_gamefi', 'GameFi / Oyun');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_gamefi', 'GameFi / Gaming');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_gamefi', 'GameFi / Gaming');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_gamefi', 'GameFi / Игры');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_gamefi', 'GameFi / Juegos');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_gamefi', '游戏金融 (GameFi)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_ai_bot', 'Yapay Zeka / Bot');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_ai_bot', 'AI / Bot');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_ai_bot', 'KI / Bot');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_ai_bot', 'ИИ / Бот');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_ai_bot', 'IA / Bot');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_ai_bot', '人工智能 / 机器人');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_cross_dex', 'Çapraz Ağ DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_cross_dex', 'Cross-Chain DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_cross_dex', 'Cross-Chain-DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_cross_dex', 'Кросс-чейн DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_cross_dex', 'DEX Entre Cadenas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_cross_dex', '跨链去中心化交易所');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_eco', 'Ekosistem Tokenı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_eco', 'Ecosystem Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_eco', 'Ökosystem-Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_eco', 'Токен экосистемы');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_eco', 'Token de Ecosistema');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_eco', '生态系统代币');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_utility', 'Fayda Tokenı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_utility', 'Utility Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_utility', 'Utility-Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_utility', 'Утилитарный токен');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_utility', 'Token de Utilidad');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_utility', '实用型代币');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_staking', 'Staking Türevi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_staking', 'Staking Derivative');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_staking', 'Staking-Derivat');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_staking', 'Дериватив стейкинга');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_staking', 'Derivado de Staking');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_staking', '质押衍生品');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_cat_contract', 'ERC-20 Sözleşmesi');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_cat_contract', 'ERC-20 Contract');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_cat_contract', 'ERC-20-Vertrag');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_cat_contract', 'Контракт ERC-20');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_cat_contract', 'Contrato ERC-20');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_cat_contract', 'ERC-20 合约');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_validator_label', 'Biyometrik Validatör');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_validator_label', 'Biometric Validator');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_validator_label', 'Biometrischer Validator');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_validator_label', 'Биометрический валидатор');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_validator_label', 'Validador Biométrico');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_validator_label', '生物特征验证节点');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_validator_desc', 'Blok üreten ve Proof-of-Humanity doğrulaması yapan aktif konsensüs düğümü');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_validator_desc', 'Active consensus node producing blocks and validating Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_validator_desc', 'Aktiver Konsensknoten, der Blöcke produziert und Proof-of-Humanity verifiziert');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_validator_desc', 'Активный узел консенсуса, создающий блоки и проверяющий Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_validator_desc', 'Nodo de consenso activo que produce bloques y valida Proof-of-Humanity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_validator_desc', '出块并验证人类证明 (Proof-of-Humanity) 的活跃共识节点');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_whale_label', 'Ağ Balinası (Whale)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_whale_label', 'Network Whale');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_whale_label', 'Netzwerk-Wal (Whale)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_whale_label', 'Кит сети (Whale)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_whale_label', 'Ballena de Red (Whale)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_whale_label', '网络巨鲸 (Whale)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_whale_desc', 'Ağdaki en yüksek hacimli veya en büyük bakiye tutan cüzdanlardan biri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_whale_desc', 'One of the wallets holding the largest balance or highest volume on the network');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_whale_desc', 'Eines der Wallets mit dem höchsten Guthaben oder Volumen im Netzwerk');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_whale_desc', 'Один из кошельков с наибольшим балансом или наибольшим объемом в сети');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_whale_desc', 'Una de las billeteras con mayor saldo o mayor volumen en la red');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_whale_desc', '网络中持有最大余额或交易量最大的核心钱包之一');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_bridge_label', 'Köprü Gezgini (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_bridge_label', 'Bridge Explorer (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_bridge_label', 'Brücken-Explorer (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_bridge_label', 'Исследователь моста (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_bridge_label', 'Explorador de Puente (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_bridge_label', '跨层流动性先锋 (Cross-Layer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_bridge_desc', 'Substrate ve EVM katmanları arasında nativeToEvmSwap köprü takası gerçekleştirmiş');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_bridge_desc', 'Executed cross-layer bridge swaps between Substrate and EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_bridge_desc', 'Hat Cross-Layer-Bridge-Swaps zwischen Substrate und EVM durchgeführt');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_bridge_desc', 'Совершал кросс-слойные свопы между Substrate и EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_bridge_desc', 'Ha ejecutado intercambios de puente entre Substrate y EVM');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_bridge_desc', '在 Substrate 与 EVM 之间执行了跨层原生桥接兑换');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_dex_label', 'DEX & Token Takasçısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_dex_label', 'DEX & Token Trader');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_dex_label', 'DEX & Token-Händler');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_dex_label', 'Трейдер DEX и токенов');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_dex_label', 'Comerciante de DEX y Tokens');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_dex_label', '去中心化交易者 (DEX & Token)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_dex_desc', 'ERC-20 token transferleri ve DEX takas havuzlarıyla etkileşimde bulunmuş');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_dex_desc', 'Interacted with ERC-20 token transfers and DEX liquidity pools');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_dex_desc', 'Interagiert mit ERC-20-Token-Transfers und DEX-Liquiditätspools');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_dex_desc', 'Взаимодействовал с переводами токенов ERC-20 и пулами DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_dex_desc', 'Interactuó con transferencias de tokens ERC-20 y fondos de DEX');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_dex_desc', '频繁参与 ERC-20 代币转账与去中心化流动性池兑换');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_high_frequency_label', 'Yüksek Frekanslı Aktör');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_high_frequency_label', 'High-Frequency Trader');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_high_frequency_label', 'Hochfrequenz-Akteur');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_high_frequency_label', 'Высокочастотный участник');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_high_frequency_label', 'Operador de Alta Frecuencia');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_high_frequency_label', '高频交易核心');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_high_frequency_desc', '50 adetten fazla işlem gerçekleştirmiş yoğun ağ kullanıcısı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_high_frequency_desc', 'Active power user with over 50 on-chain transactions');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_high_frequency_desc', 'Aktiver Power-User mit über 50 On-Chain-Transaktionen');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_high_frequency_desc', 'Активный пользователь с более чем 50 транзакциями в сети');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_high_frequency_desc', 'Usuario avanzado activo con más de 50 transacciones');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_high_frequency_desc', '链上累计执行超过 50 笔交易的极度活跃用户');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_accumulator_label', 'Birikimci (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_accumulator_label', 'Accumulator (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_accumulator_label', 'Akkumulator (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_accumulator_label', 'Накопитель (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_accumulator_label', 'Acumulador (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_accumulator_label', '长线囤币者 (HODLer)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_accumulator_desc', 'Çıkışından çok daha fazla giriş yapmış ve bakiye tutan cüzdan');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_accumulator_desc', 'Wallet holding balances with significantly more inflows than outflows');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_accumulator_desc', 'Wallet mit deutlich mehr Eingängen als Ausgängen und wachsendem Guthaben');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_accumulator_desc', 'Кошелек с существенно преобладающими входящими переводами');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_accumulator_desc', 'Billetera con significativamente más entradas que salidas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_accumulator_desc', '转入资金远多于转出并持续持有稳定余额的储备地址');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_standard_label', 'Bireysel Kullanıcı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_standard_label', 'Individual Account');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_standard_label', 'Individuelles Konto');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_standard_label', 'Индивидуальный аккаунт');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_standard_label', 'Cuenta Individual');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_standard_label', '普通独立账户');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'persona_standard_desc', 'Standart cüzdan hareketleri');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'persona_standard_desc', 'Standard wallet activity');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'persona_standard_desc', 'Standard-Wallet-Aktivität');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'persona_standard_desc', 'Стандартная активность кошелька');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'persona_standard_desc', 'Actividad estándar de billetera');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'persona_standard_desc', '标准链上钱包日常活动');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'entity_retailUser', 'Bireysel Kullanıcı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'entity_retailUser', 'Retail User');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'entity_retailUser', 'Einzelnutzer');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'entity_retailUser', 'Частный пользователь');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'entity_retailUser', 'Usuario Minorista');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'entity_retailUser', '个人零售用户');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'entity_activeValidator', 'Aktif Biyometrik Validatör');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'entity_activeValidator', 'Active Biometric Validator');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'entity_activeValidator', 'Aktiver biometrischer Validator');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'entity_activeValidator', 'Активный биометрический валидатор');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'entity_activeValidator', 'Validador Biométrico Activo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'entity_activeValidator', '活跃生物识别验证节点');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'entity_smartContract', 'Akıllı Sözleşme / Protokol');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'entity_smartContract', 'Smart Contract / Protocol');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'entity_smartContract', 'Smart Contract / Protokoll');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'entity_smartContract', 'Смарт-контракт / Протокол');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'entity_smartContract', 'Contrato Inteligente / Protocolo');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'entity_smartContract', '智能合约 / 链上协议');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'extrinsic_bioauth', 'Biyometrik İnsan Doğrulaması (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'extrinsic_bioauth', 'Biometric Human Authentication (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'extrinsic_bioauth', 'Biometrische Personen-Authentifizierung (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'extrinsic_bioauth', 'Биометрическая аутентификация человека (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'extrinsic_bioauth', 'Autenticación Humana Biométrica (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'extrinsic_bioauth', '生物特征活体人类认证 (Proof-of-Humanity)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'extrinsic_transfer', 'Yerel HMND Transferi ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'extrinsic_transfer', 'Native HMND Transfer ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'extrinsic_transfer', 'Nativer HMND-Transfer ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'extrinsic_transfer', 'Нативный перевод HMND ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'extrinsic_transfer', 'Transferencia Nativa de HMND ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'extrinsic_transfer', '原生 HMND 转账 ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'extrinsic_bridgeSwap', 'Katmanlar Arası HMND Köprü Takası ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'extrinsic_bridgeSwap', 'Cross-Layer HMND Bridge Swap ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'extrinsic_bridgeSwap', 'Cross-Layer HMND-Brückenswap ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'extrinsic_bridgeSwap', 'Кросс-слойный мостовой своп HMND ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'extrinsic_bridgeSwap', 'Intercambio de Puente HMND Entre Capas ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'extrinsic_bridgeSwap', '跨层 HMND 原生桥接兑换 ({method}) ➔ EVM: {target}');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'extrinsic_moduleCall', '{pallet} modülü çağrısı ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'extrinsic_moduleCall', '{pallet} module call ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'extrinsic_moduleCall', '{pallet}-Modulaufruf ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'extrinsic_moduleCall', 'Вызов модуля {pallet} ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'extrinsic_moduleCall', 'Llamada al módulo {pallet} ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'extrinsic_moduleCall', '{pallet} 模块调用 ({method})');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'extrinsic_imOnline', 'Ağ Canlılık Kalp Atışı (imOnline)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'extrinsic_imOnline', 'Network Liveness Heartbeat (imOnline)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'extrinsic_imOnline', 'Netzwerk-Liveness-Heartbeat (imOnline)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'extrinsic_imOnline', 'Пульс жизнеспособности сети (imOnline)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'extrinsic_imOnline', 'Latido de Actividad de Red (imOnline)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'extrinsic_imOnline', '网络节点在线心跳检测 (imOnline)');

-- Additional Cluster & Heuristics Translations
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'moneytrail_behavioral_summary', 'Sınıflandırma: {entity}. {flowCount} ana akış paterni, {memberCount} küme üyesi tespit edildi.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'moneytrail_behavioral_summary', 'Classified as {entity}. Detected {flowCount} main flow patterns and {memberCount} cluster members.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'moneytrail_behavioral_summary', 'Als {entity} klassifiziert. {flowCount} Hauptflussmuster und {memberCount} Clustermitglieder erkannt.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'moneytrail_behavioral_summary', 'Классифицировано как {entity}. Обнаружено основных паттернов: {flowCount}, участников кластера: {memberCount}.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'moneytrail_behavioral_summary', 'Clasificado como {entity}. Se detectaron {flowCount} patrones de flujo principales y {memberCount} miembros de clúster.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'moneytrail_behavioral_summary', '分类为 {entity}。检测到 {flowCount} 个主要流动模式和 {memberCount} 个集群成员。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'cluster_role_master_funder', 'Besleyici / Master Cüzdan', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'cluster_role_master_funder', 'Master / Funder Wallet', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'cluster_role_master_funder', 'Master- / Geber-Wallet', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'cluster_role_master_funder', 'Мастер / Финансирующий кошелек', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'cluster_role_master_funder', 'Billetera maestra / Financiadora', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'cluster_role_master_funder', '主控 / 资金钱包', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'cluster_role_collector_treasury', 'Toplayıcı / Kasa', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'cluster_role_collector_treasury', 'Collector / Treasury', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'cluster_role_collector_treasury', 'Sammler / Schatzkammer', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'cluster_role_collector_treasury', 'Сборщик / Казна', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'cluster_role_collector_treasury', 'Recolector / Tesorería', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'cluster_role_collector_treasury', '归集 / 金库', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'cluster_role_parent_wallet', 'Ana Finansman Kaynağı', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'cluster_role_parent_wallet', 'Primary Funding Source', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'cluster_role_parent_wallet', 'Hauptfinanzierungsquelle', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'cluster_role_parent_wallet', 'Основной источник финансирования', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'cluster_role_parent_wallet', 'Fuente principal de financiación', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'cluster_role_parent_wallet', '主要资金来源', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'cluster_role_primary_sink', 'Ana Çıkış Hedefi', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'cluster_role_primary_sink', 'Primary Outflow Sink', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'cluster_role_primary_sink', 'Hauptausflussziel', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'cluster_role_primary_sink', 'Основной получатель оттока', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'cluster_role_primary_sink', 'Destino principal de salida', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'cluster_role_primary_sink', '主要流出汇集点', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'cluster_role_shared_flow', 'Ortak Akış', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'cluster_role_shared_flow', 'Shared Flow', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'cluster_role_shared_flow', 'Gemeinsamer Fluss', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'cluster_role_shared_flow', 'Общий поток', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'cluster_role_shared_flow', 'Flujo compartido', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'cluster_role_shared_flow', '共享流动', CURRENT_TIMESTAMP);

-- Additional Gini & Equality Translations
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_rating_high_equality', 'Yüksek Eşitlik / Düşük Merkezileşme', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_rating_high_equality', 'High Equality / Low Centralization', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_rating_high_equality', 'Hohe Gleichheit / Geringe Zentralisierung', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_rating_high_equality', 'Высокое равенство / Низкая централизация', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_rating_high_equality', 'Alta igualdad / Baja centralización', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_rating_high_equality', '高平等度 / 低集中度', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_rating_moderate', 'Orta Eşitsizlik', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_rating_moderate', 'Moderate Inequality', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_rating_moderate', 'Moderate Ungleichheit', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_rating_moderate', 'Умеренное неравенство', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_rating_moderate', 'Desigualdad moderada', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_rating_moderate', '适度不平等', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_rating_high_concentration', 'Yüksek Servet Yoğunlaşması (Balina & Borsa Hakimiyeti)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_rating_high_concentration', 'High Wealth Concentration (Whale & Exchange Dominance)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_rating_high_concentration', 'Hohe Vermögenskonzentration (Wal- & Börsendominanz)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_rating_high_concentration', 'Высокая концентрация богатства (Доминирование китов и бирж)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_rating_high_concentration', 'Alta concentración de riqueza (Dominio de ballenas y exchanges)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_rating_high_concentration', '高财富集中度（巨鲸与交易所主导）', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_desc_high_equality', 'Humanode ağındaki servet dağılımı blokzincir standartlarına göre oldukça dengeli ve tabana yayılmıştır.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_desc_high_equality', 'Wealth distribution across the Humanode network is well-balanced and distributed across the base.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_desc_high_equality', 'Die Vermögensverteilung im Humanode-Netzwerk ist im Vergleich zu Blockchain-Standards sehr ausgewogen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_desc_high_equality', 'Распределение богатства в сети Humanode хорошо сбалансировано и распределено по базе.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_desc_high_equality', 'La distribución de la riqueza en la red Humanode está equilibrada y distribuida entre la base.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_desc_high_equality', 'Humanode 网络中的财富分配非常均衡且广泛分布。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_desc_moderate', 'Borsa sıcak cüzdanları ve kurumsal havuzların etkisiyle servet dağılımı tipik Layer-1 seviyesindedir.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_desc_moderate', 'Wealth distribution is at a typical Layer-1 level influenced by exchange hot wallets and institutional pools.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_desc_moderate', 'Die Vermögensverteilung liegt auf einem typischen Layer-1-Niveau, beeinflusst durch Börsen-Hot-Wallets.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_desc_moderate', 'Распределение богатства находится на типичном для Layer-1 уровне под влиянием горячих кошельков бирж.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_desc_moderate', 'La distribución de la riqueza se encuentra en un nivel típico de Capa 1 influenciado por billeteras calientes.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_desc_moderate', '受交易所热钱包和机构流动池影响，财富分配处于典型的 Layer-1 水平。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'gini_desc_high_concentration', 'KuCoin sıcak kasası ve vakıf rezervleri toplam bakiyenin önemli bir bölümünü elinde tutmaktadır.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'gini_desc_high_concentration', 'KuCoin hot wallet and foundation reserves hold a significant share of the total balance.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'gini_desc_high_concentration', 'Die KuCoin-Hot-Wallet und die Stiftungsreserven halten einen erheblichen Anteil des Gesamtbestands.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'gini_desc_high_concentration', 'Горячий кошелек KuCoin и резервы фонда удерживают значительную часть общего баланса.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'gini_desc_high_concentration', 'La billetera caliente de KuCoin y las reservas de la fundación concentran una parte significativa del saldo total.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'gini_desc_high_concentration', 'KuCoin 热钱包和基金会储备占有总余额的很大一部分。', CURRENT_TIMESTAMP);

-- =============================================================
-- CONSOLIDATED DOMAIN TABLES & METADATA REGISTRIES
-- =============================================================

CREATE TABLE IF NOT EXISTS evm_method_signatures (
    selector TEXT PRIMARY KEY,
    function_name TEXT NOT NULL,
    signature TEXT NOT NULL,
    category_code TEXT NOT NULL,
    description_key TEXT NOT NULL,
    param_names TEXT DEFAULT '',
    param_types TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS biomapper_chains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    type_key TEXT NOT NULL,
    category TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    explorer_name TEXT NOT NULL,
    explorer_url TEXT NOT NULL,
    status_key TEXT NOT NULL,
    icon_color TEXT NOT NULL,
    generations_supported TEXT NOT NULL,
    sdk_interface TEXT NOT NULL,
    features_json TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tokens_metadata (
    token_address TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    category_code TEXT NOT NULL,
    color TEXT NOT NULL,
    decimals INTEGER DEFAULT 18,
    is_curated INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS query_sandbox_presets (
    id TEXT PRIMARY KEY,
    title_key TEXT NOT NULL,
    description_key TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS validator_payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    validator_address TEXT NOT NULL,
    amount_hmnd REAL NOT NULL,
    source TEXT DEFAULT 'FeesPot'
);
CREATE INDEX IF NOT EXISTS idx_validator_payouts_val ON validator_payouts(validator_address);
CREATE INDEX IF NOT EXISTS idx_validator_payouts_block ON validator_payouts(block_number);
CREATE INDEX IF NOT EXISTS idx_validator_payouts_ts ON validator_payouts(timestamp);

CREATE TABLE IF NOT EXISTS wallet_personas (
    id TEXT PRIMARY KEY,
    label_key TEXT NOT NULL,
    desc_key TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    min_balance REAL DEFAULT 0,
    min_volume REAL DEFAULT 0,
    min_txs INTEGER DEFAULT 0,
    is_validator_required INTEGER DEFAULT 0,
    is_bridge_required INTEGER DEFAULT 0
);

-- Consolidated Translation Updates
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_erc20', 'ERC-20 Token', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_erc20', 'ERC-20 Token', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_erc20', 'ERC-20-Token', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_erc20', 'Токен ERC-20', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_erc20', 'Token ERC-20', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_erc20', 'ERC-20 代币', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_dex_swap', 'DEX Takası (Swap)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_dex_swap', 'DEX Swap', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_dex_swap', 'DEX-Swap', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_dex_swap', 'DEX Обмен', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_dex_swap', 'Swap DEX', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_dex_swap', 'DEX 兑换', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_wrapper', 'Wrapped Token (Sarmalama)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_wrapper', 'Wrapped Token', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_wrapper', 'Wrapped-Token', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_wrapper', 'Обернутый токен', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_wrapper', 'Token Envuelto', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_wrapper', '封装代币', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_dex_lp', 'Likidite Havuzu (DEX LP)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_dex_lp', 'Liquidity Pool (DEX LP)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_dex_lp', 'Liquiditätspool (DEX LP)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_dex_lp', 'Пул ликвидности', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_dex_lp', 'Fondo de Liquidez', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_dex_lp', '流动性池', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_staking', 'Staking / Verim', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_staking', 'Staking & Yield', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_staking', 'Staking & Rendite', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_staking', 'Стейкинг', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_staking', 'Staking y Rendimiento', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_staking', '质押与收益', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_rewards', 'Ödül / Hak Talebi', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_rewards', 'Rewards & Claims', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_rewards', 'Belohnungen & Ansprüche', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_rewards', 'Награды и выплаты', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_rewards', 'Recompensas', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_rewards', '奖励与领取', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_cat_general', 'Genel Çağrı', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_cat_general', 'General Call', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_cat_general', 'Allgemeiner Aufruf', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_cat_general', 'Общий вызов', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_cat_general', 'Llamada general', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_cat_general', '通用调用', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_transfer', 'Belirtilen alıcı adrese doğrudan token transferi.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_transfer', 'Direct token transfer to destination address.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_transfer', 'Direkte Token-Übertragung an die Zieladresse.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_transfer', 'Прямой перевод токенов на адрес получателя.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_transfer', 'Transferencia directa de tokens a la dirección de destino.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_transfer', '直接转账代币至目标地址。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_approve', 'Harcayıcı akıllı sözleşmeye veya adrese harcama limiti onayı tanımlar.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_approve', 'Grant token spending allowance to spender contract/account.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_approve', 'Erteilt dem Spender-Vertrag/Konto ein Ausgabenlimit.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_approve', 'Предоставляет лимит расходов смарт-контракту или адресу.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_approve', 'Otorga límite de gasto al contrato/cuenta del gastador.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_approve', '向支出方合约/账户授予代币支出额度。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_transferFrom', 'Önceden onaylanmış yetkiyle bir hesaptan diğerine token aktarımı.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_transferFrom', 'Transfer tokens using previously approved allowance.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_transferFrom', 'Überträgt Token mit zuvor genehmigtem Ausgabenlimit.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_transferFrom', 'Перевод токенов с использованием ранее утвержденного лимита.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_transferFrom', 'Transfiere tokens utilizando el límite aprobado previamente.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_transferFrom', '使用先前批准的额度转移代币。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_swapExactTokensForTokens', 'DEX likidite havuzları üzerinden token takası.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_swapExactTokensForTokens', 'DEX liquidity pool token swap across path routes.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_swapExactTokensForTokens', 'Token-Tausch über DEX-Liquiditätspools.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_swapExactTokensForTokens', 'Обмен токенов через пулы ликвидности DEX.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_swapExactTokensForTokens', 'Intercambio de tokens a través de fondos de liquidez DEX.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_swapExactTokensForTokens', '通过 DEX 流动性池进行代币兑换。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_swapExactTokensForETH', 'DEX havuzunda token satıp yerel HMND alma.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_swapExactTokensForETH', 'Sell tokens in DEX pool for native HMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_swapExactTokensForETH', 'Token im DEX-Pool gegen natives HMND verkaufen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_swapExactTokensForETH', 'Продажа токенов в пуле DEX за нативный HMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_swapExactTokensForETH', 'Vender tokens en el fondo DEX por HMND nativo.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_swapExactTokensForETH', '在 DEX 流动池中出售代币换取原生 HMND。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_swapExactETHForTokens', 'Yerel HMND ödeyerek havuzdan token satın alma.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_swapExactETHForTokens', 'Swap native HMND for tokens in DEX pool.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_swapExactETHForTokens', 'Natives HMND im DEX-Pool gegen Token tauschen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_swapExactETHForTokens', 'Обмен нативного HMND на токены в пуле DEX.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_swapExactETHForTokens', 'Intercambiar HMND nativo por tokens en el fondo DEX.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_swapExactETHForTokens', '在 DEX 流动池中支付原生 HMND 兑换代币。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_deposit', 'Yerel HMND sarıp ERC-20 WeHMND elde etme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_deposit', 'Wrap native HMND into ERC-20 WeHMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_deposit', 'Natives HMND in ERC-20 WeHMND umwandeln (Wrap).', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_deposit', 'Обертывание нативного HMND в ERC-20 WeHMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_deposit', 'Envolver HMND nativo en WeHMND ERC-20.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_deposit', '将原生 HMND 封装为 ERC-20 WeHMND。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_withdraw', 'WeHMND çözüp yerel HMND parasına geri dönüştürme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_withdraw', 'Unwrap ERC-20 WeHMND back to native HMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_withdraw', 'ERC-20 WeHMND zurück in natives HMND auflösen (Unwrap).', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_withdraw', 'Развертывание ERC-20 WeHMND обратно в нативный HMND.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_withdraw', 'Desenvolver WeHMND ERC-20 a HMND nativo.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_withdraw', '将 ERC-20 WeHMND 解包回原生 HMND。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_addLiquidity', 'Likidite havuzuna çift taraflı fon ekleme ve LP üretme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_addLiquidity', 'Add two-sided liquidity to DEX pool and mint LP.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_addLiquidity', 'Zweiseitige Liquidität zum DEX-Pool hinzufügen und LP prägen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_addLiquidity', 'Добавление двусторонней ликвидности в пул DEX и выпуск LP.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_addLiquidity', 'Agregar liquidez bilateral al fondo DEX y minar LP.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_addLiquidity', '向 DEX 流动池添加双边流动性并铸造 LP。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_removeLiquidity', 'LP tokenları yakarak yatırılan fonları geri çekme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_removeLiquidity', 'Burn LP tokens and withdraw underlying liquidity.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_removeLiquidity', 'LP-Token verbrennen und zugrundeliegende Liquidität abheben.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_removeLiquidity', 'Сжигание токенов LP и вывод ликвидности.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_removeLiquidity', 'Quemar tokens LP y retirar liquidez subyacente.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_removeLiquidity', '销毁 LP 代币并提取底层流动性。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_stake', 'Protokol staking havuzuna token kitleme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_stake', 'Stake tokens into protocol/yield staking pool.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_stake', 'Token im Protokoll-/Yield-Staking-Pool sperren.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_stake', 'Блокировка токенов в пуле стейкинга протокола.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_stake', 'Bloquear tokens en el fondo de staking del protocolo.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_stake', '将代币质押至协议收益池。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_claim', 'Hak edilen ödül veya token airdrop payını talep etme.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_claim', 'Claim accumulated rewards or airdrop entitlement.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_claim', 'Akkumulierte Belohnungen oder Airdrop-Anspruch anfordern.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_claim', 'Запрос накопленных наград или доли аирдропа.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_claim', 'Reclamar recompensas acumuladas o asignación de airdrop.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_claim', '领取累积奖励或空投份额。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_native_transfer', 'Herhangi bir akıllı sözleşme çağrısı içermeyen yerel transfer.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_native_transfer', 'Standard native balance transfer without custom calldata.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_native_transfer', 'Standardmäßige native Überweisung ohne Smart-Contract-Aufruf.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_native_transfer', 'Стандартный перевод баланса без вызова смарт-контракта.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_native_transfer', 'Transferencia nativa estándar sin llamada a contrato inteligente.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_native_transfer', '无智能合约调用的标准原生转账。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'evm_desc_unknown_call', 'Özel sözleşme yürütmesi veya henüz tescillenmemiş ABI çağrısı.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'evm_desc_unknown_call', 'Custom contract interaction or unregistered method ABI.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'evm_desc_unknown_call', 'Benutzerdefinierte Vertragsinteraktion oder unregistriertes ABI.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'evm_desc_unknown_call', 'Пользовательское взаимодействие с контрактом или незарегистрированный ABI.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'evm_desc_unknown_call', 'Interacción personalizada con contrato o ABI no registrada.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'evm_desc_unknown_call', '自定义合约交互或未注册的 ABI 调用。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_top_burners_title', 'En Çok Gas Yakan 10 Cüzdan', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_top_burners_title', 'Top 10 Gas Burner Wallets', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_top_burners_title', 'Top 10 Gas-Verbraucher-Wallets', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_top_burners_title', 'Топ-10 кошельков по расходу газа', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_top_burners_title', 'Top 10 billeteras con mayor gasto de gas', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_top_burners_title', '消耗 Gas 最多的前 10 个钱包', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_top_burners_desc', 'Ağda en yüksek işlem ücreti ödeyen cüzdanlar.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_top_burners_desc', 'Wallets that spent the highest gas fees on the network.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_top_burners_desc', 'Wallets, die die höchsten Gasgebühren im Netzwerk gezahlt haben.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_top_burners_desc', 'Кошельки, потратившие больше всего газа в сети.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_top_burners_desc', 'Billeteras que más comisiones de gas pagaron en la red.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_top_burners_desc', '网络上手续费支出最高的钱包。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_monthly_growth_title', 'Aylık Hacim & Büyüme Trendi', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_monthly_growth_title', 'Monthly Volume & Growth Trend', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_monthly_growth_title', 'Monatliches Volumen & Wachstumstrend', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_monthly_growth_title', 'Ежемесячный объем и тренд роста', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_monthly_growth_title', 'Volumen mensual y tendencia de crecimiento', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_monthly_growth_title', '月度交易量与增长趋势', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_monthly_growth_desc', 'EVM ve Substrate katmanlarının aylık işlem dökümü.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_monthly_growth_desc', 'Breakdown of monthly transaction counts for EVM and Substrate.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_monthly_growth_desc', 'Aufschlüsselung der monatlichen Transaktionen für EVM und Substrate.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_monthly_growth_desc', 'Ежемесячная разбивка транзакций EVM и Substrate.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_monthly_growth_desc', 'Desglose mensual de transacciones para EVM y Substrate.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_monthly_growth_desc', 'EVM 与 Substrate 层的月度交易细分。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_bridge_volume_title', 'Köprü Balinaları & Net Akış', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_bridge_volume_title', 'Bridge Whales & Net Volume', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_bridge_volume_title', 'Bridge-Wale & Netto-Volumen', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_bridge_volume_title', 'Крупные мостовые переводы и чистый объем', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_bridge_volume_title', 'Ballenas del puente y volumen neto', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_bridge_volume_title', '跨链巨鲸与净流动量', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_bridge_volume_desc', 'Substrate ve EVM arasında en yüksek hacimli köprü transferleri.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_bridge_volume_desc', 'Largest cross-layer bridge transfers between Substrate and EVM.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_bridge_volume_desc', 'Größte Cross-Layer-Bridge-Transfers zwischen Substrate und EVM.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_bridge_volume_desc', 'Крупнейшие мостовые переводы между Substrate и EVM.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_bridge_volume_desc', 'Mayores transferencias de puente entre Substrate y EVM.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_bridge_volume_desc', 'Substrate 与 EVM 之间最大的跨层转账。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_active_validators_title', 'Son 30 Günün Aktif Validatörleri', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_active_validators_title', 'Active Validators (Last 30 Days)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_active_validators_title', 'Aktive Validatoren (letzte 30 Tage)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_active_validators_title', 'Активные валидаторы (последние 30 дней)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_active_validators_title', 'Validadores activos (últimos 30 días)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_active_validators_title', '最近 30 天的活跃验证者', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_active_validators_desc', 'Son 30 günde blok üreten veya bioauth onaylayan doğrulayıcılar.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_active_validators_desc', 'Validators that authored blocks or submitted bioauth in the last 30 days.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_active_validators_desc', 'Validatoren, die in den letzten 30 Tagen Blöcke erzeugt haben.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_active_validators_desc', 'Валидаторы, создававшие блоки за последние 30 дней.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_active_validators_desc', 'Validadores que produjeron bloques en los últimos 30 días.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_active_validators_desc', '最近 30 天内出块或提交生物认证的验证者。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_highest_transfers_title', 'En Yüksek Değerli 20 Transfer', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_highest_transfers_title', 'Top 20 Highest Value Transfers', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_highest_transfers_title', 'Top 20 Transfers mit höchstem Wert', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_highest_transfers_title', 'Топ-20 крупнейших переводов', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_highest_transfers_title', 'Top 20 transferencias de mayor valor', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_highest_transfers_title', '金额最高的前 20 笔转账', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_highest_transfers_desc', 'Ağ tarihinde gerçekleşen en büyük HMND transferleri.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_highest_transfers_desc', 'Largest single HMND transfers recorded in network history.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_highest_transfers_desc', 'Größte einzelne HMND-Transfers in der Netzwerkgeschichte.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_highest_transfers_desc', 'Крупнейшие переводы HMND в истории сети.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_highest_transfers_desc', 'Mayores transferencias individuales de HMND en la historia de la red.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_highest_transfers_desc', '网络历史上记录的最大单笔 HMND 转账。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_token_dist_title', 'Token Dağılımı ve Transfer Özeti', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_token_dist_title', 'Token Distribution & Transfer Summary', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_token_dist_title', 'Token-Verteilung & Transfer-Zusammenfassung', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_token_dist_title', 'Распределение токенов и сводка переводов', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_token_dist_title', 'Distribución de tokens y resumen de transferencias', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_token_dist_title', '代币分布与转账摘要', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'preset_token_dist_desc', 'Tüm ERC-20 tokenlarının transfer ve sahip sayıları.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'preset_token_dist_desc', 'Transfer and holder metrics across all ERC-20 tokens.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'preset_token_dist_desc', 'Transfer- und Inhaber-Metriken aller ERC-20-Token.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'preset_token_dist_desc', 'Метрики переводов и держателей всех токенов ERC-20.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'preset_token_dist_desc', 'Métricas de transferencia y titulares de todos los tokens ERC-20.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'preset_token_dist_desc', '所有 ERC-20 代币的转账与持有人指标。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'persona_high_frequency_label', 'Yüksek Frekanslı Yatırımcı', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'persona_high_frequency_label', 'High-Frequency Trader', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'persona_high_frequency_label', 'Hochfrequenz-Händler', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'persona_high_frequency_label', 'Высокочастотный трейдер', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'persona_high_frequency_label', 'Trader de alta frecuencia', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'persona_high_frequency_label', '高频交易者', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'persona_high_frequency_desc', 'Ağda 50 adetten fazla zincir içi işlem gerçekleştiren aktif güç kullanıcısı.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'persona_high_frequency_desc', 'Active power user with over 50 on-chain transactions.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'persona_high_frequency_desc', 'Aktiver Power-User mit über 50 On-Chain-Transaktionen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'persona_high_frequency_desc', 'Активный пользователь с более чем 50 транзакциями.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'persona_high_frequency_desc', 'Usuario avanzado activo con más de 50 transacciones.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'persona_high_frequency_desc', '拥有超过 50 笔链上交易的活跃资深用户。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'persona_accumulator_label', 'Biriktirici (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'persona_accumulator_label', 'Accumulator (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'persona_accumulator_label', 'Akkumulator (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'persona_accumulator_label', 'Накопитель (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'persona_accumulator_label', 'Acumulador (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'persona_accumulator_label', '累积者 (HODLer)', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'persona_accumulator_desc', 'Giren bakiyesi çıkan bakiyesinden belirgin şekilde yüksek olan birikim cüzdanı.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'persona_accumulator_desc', 'Wallet holding balances with significantly more inflows than outflows.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'persona_accumulator_desc', 'Wallet mit deutlich mehr Zuflüssen als Abflüssen.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'persona_accumulator_desc', 'Кошелек со значительным превышением притока средств над оттоком.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'persona_accumulator_desc', 'Billetera con flujos de entrada significativamente mayores que los de salida.', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'persona_accumulator_desc', '流入量明显高于流出量的积累钱包。', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'validators_cadence_desc', '~{0} saatte 1 blok', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'validators_cadence_desc', '~1 block per {0} hours', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'validators_cadence_desc', '~1 Block alle {0} Stunden', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'validators_cadence_desc', '~1 блок каждые {0} ч', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'validators_cadence_desc', '~1 bloque cada {0} horas', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'validators_cadence_desc', '~每 {0} 小时 1 个区块', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'validators_hoursPerBlock', '~{0} sa/blok', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'validators_hoursPerBlock', '~{0} hrs/block', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'validators_hoursPerBlock', '~{0} Std./Block', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'validators_hoursPerBlock', '~{0} ч/блок', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'validators_hoursPerBlock', '~{0} h/bloque', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'validators_hoursPerBlock', '~{0} 小时/区块', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('tr', 'validators_recentBlocks30d', '30g: {0} blok', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('en', 'validators_recentBlocks30d', '30d: {0} blocks', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('de', 'validators_recentBlocks30d', '30T: {0} Blöcke', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('ru', 'validators_recentBlocks30d', '30д: {0} блоков', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('es', 'validators_recentBlocks30d', '30d: {0} bloques', CURRENT_TIMESTAMP);
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value, updated_at) VALUES ('zh', 'validators_recentBlocks30d', '30天: {0} 区块', CURRENT_TIMESTAMP);

-- ============================================================================
-- SQLITE PRE-COMPILED DATABASE VIEWS (STORED PROCEDURE & REPOSITORY OPTIMIZATION)
-- ============================================================================

CREATE VIEW IF NOT EXISTS vw_network_stats AS
SELECT 
    (SELECT MAX(number) FROM blocks_with_tx) as latest_block,
    (SELECT COUNT(*) FROM blocks_with_tx) as total_blocks,
    ((SELECT COUNT(*) FROM substrate_extrinsics) + (SELECT COUNT(*) FROM transactions)) as total_transactions,
    (SELECT COUNT(*) FROM transactions) as total_evm_transactions,
    (SELECT COUNT(*) FROM substrate_extrinsics) as total_substrate_extrinsics,
    (SELECT COALESCE(SUM(total_fees_hmnd), 0) FROM blocks_with_tx) as total_fees_hmnd;

CREATE VIEW IF NOT EXISTS vw_top_whales AS
SELECT 
    b.address as address,
    b.balance_hmnd as balance,
    b.layer as layer,
    COALESCE(l.label, '') as label,
    COALESCE(l.category, '') as category
FROM balances b
LEFT JOIN address_labels l ON LOWER(b.address) = LOWER(l.address)
WHERE b.balance_hmnd > 0;

CREATE VIEW IF NOT EXISTS vw_active_validators AS
SELECT 
    cand.address as address,
    cand.last_seen as last_seen,
    cand.recent_blocks as recent_blocks
FROM (
    SELECT author_id as address, MAX(timestamp) as last_seen, COUNT(*) as recent_blocks
    FROM blocks_with_tx
    WHERE timestamp >= (strftime('%s', 'now') - 2592000) AND author_id > ''
    GROUP BY author_id
    UNION ALL
    SELECT signer as address, MAX(timestamp) as last_seen, 0 as recent_blocks
    FROM substrate_extrinsics
    WHERE pallet IN ('bioauth', 'session') AND signer > '' AND timestamp >= (strftime('%s', 'now') - 2592000)
    GROUP BY signer
) cand;

CREATE VIEW IF NOT EXISTS vw_token_directory AS
SELECT 
    t.token_symbol,
    t.token_address,
    COUNT(*) as transfer_count,
    COALESCE(SUM(t.amount), 0) as total_volume,
    COUNT(DISTINCT t.from_address) as unique_senders,
    COUNT(DISTINCT t.to_address) as unique_holders,
    MIN(t.timestamp) as first_seen,
    MAX(t.timestamp) as last_seen,
    m.name as meta_name,
    m.category_code as meta_category,
    m.color as meta_color
FROM token_transfers t
LEFT JOIN tokens_metadata m ON LOWER(t.token_address) = LOWER(m.token_address)
GROUP BY t.token_address, t.token_symbol;

CREATE VIEW IF NOT EXISTS vw_feespot_analytics AS
SELECT 
    block_number,
    timestamp,
    COUNT(*) as recipient_count,
    ROUND(SUM(amount_hmnd), 2) as total_distributed,
    ROUND(AVG(amount_hmnd), 2) as sample_per_validator
FROM validator_payouts
GROUP BY block_number, timestamp;

CREATE VIEW IF NOT EXISTS vw_biomapper_chains AS
SELECT 
    chain_key as id,
    name,
    short_name as shortName,
    chain_id as chainId,
    type_key as type,
    category,
    contract_address as contractAddress,
    explorer_name as explorerName,
    explorer_url as explorerUrl,
    status_key as status,
    icon_color as iconColor,
    generations_supported as generationsSupported,
    sdk_interface as sdkInterface,
    features_json
FROM biomapper_chains;

CREATE VIEW IF NOT EXISTS vw_governance_proposals AS
SELECT 
    hash,
    block_number,
    timestamp,
    signer,
    pallet,
    method,
    status
FROM substrate_extrinsics
WHERE pallet IN ('democracy', 'collective', 'electionsPhragmen');


-- ========================================================================
-- SYSTEM TRANSLATIONS: ERROR MESSAGES, TOKEN CATEGORIES & SYSTEM STATUS
-- ========================================================================
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_hash_required', 'İşlem Hash parametresi zorunludur.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_hash_required', 'Transaction hash parameter is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_hash_required', 'Transaktions-Hash-Parameter ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_hash_required', 'Параметр хеша транзакции обязателен.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_hash_required', 'El parámetro hash de transacción es obligatorio.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_hash_required', '交易哈希参数为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_block_required', 'Geçerli bir blok numarası gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_block_required', 'A valid block number is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_block_required', 'Eine gültige Blocknummer ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_block_required', 'Требуется действительный номер блока.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_block_required', 'Se requiere un número de bloque válido.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_block_required', '需要有效的区块高度编号。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_validator_address_required', 'Validatör adres parametresi gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_validator_address_required', 'Validator address parameter is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_validator_address_required', 'Validator-Adressparameter ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_validator_address_required', 'Параметр адреса валидатора обязателен.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_validator_address_required', 'El parámetro de dirección de validador es obligatorio.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_validator_address_required', '验证节点地址参数为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_wallet_address_required', 'Cüzdan adresi parametresi gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_wallet_address_required', 'Wallet address parameter is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_wallet_address_required', 'Wallet-Adressparameter ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_wallet_address_required', 'Параметр адреса кошелька обязателен.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_wallet_address_required', 'El parámetro de dirección de billetera es obligatorio.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_wallet_address_required', '钱包地址参数为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_wallet_not_found', 'Cüzdan bulunamadı.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_wallet_not_found', 'Wallet not found.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_wallet_not_found', 'Wallet nicht gefunden.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_wallet_not_found', 'Кошелек не найден.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_wallet_not_found', 'Billetera no encontrada.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_wallet_not_found', '未找到该钱包。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_wallets_compare_required', 'Karşılaştırma için iki cüzdan adresi de gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_wallets_compare_required', 'Both wallet addresses are required for comparison.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_wallets_compare_required', 'Beide Wallet-Adressen sind für den Vergleich erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_wallets_compare_required', 'Оба адреса кошельков обязательны для сравнения.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_wallets_compare_required', 'Ambas direcciones de billetera son necesarias para comparar.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_wallets_compare_required', '对比需要提供两个钱包地址。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_query_empty', 'Sorgu parametresi boş olamaz.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_query_empty', 'Query parameter cannot be empty.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_query_empty', 'Abfrageparameter darf nicht leer sein.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_query_empty', 'Параметр запроса не может быть пустым.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_query_empty', 'El parámetro de consulta no puede estar vacío.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_query_empty', '查询参数不能为空。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_query_readonly_only', 'Güvenlik ilkesi: Yalnızca SELECT veya WITH ile başlayan salt okunur sorgulara izin verilir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_query_readonly_only', 'Security policy: Only read-only queries starting with SELECT or WITH are permitted.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_query_readonly_only', 'Sicherheitsrichtlinie: Nur schreibgeschützte Abfragen mit SELECT oder WITH sind zulässig.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_query_readonly_only', 'Политика безопасности: Разрешены только запросы на чтение, начинающиеся с SELECT или WITH.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_query_readonly_only', 'Política de seguridad: Solo se permiten consultas de solo lectura que comiencen con SELECT o WITH.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_query_readonly_only', '安全策略：仅允许以 SELECT 或 WITH 开头的只读查询。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_query_forbidden_keyword', 'Güvenlik ilkesi: Değiştirici anahtar kelimelere izin verilmez.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_query_forbidden_keyword', 'Security policy: Mutating keywords are not allowed.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_query_forbidden_keyword', 'Sicherheitsrichtlinie: Verändernde Schlüsselwörter sind nicht erlaubt.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_query_forbidden_keyword', 'Политика безопасности: Модифицирующие ключевые слова запрещены.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_query_forbidden_keyword', 'Política de seguridad: No se permiten palabras clave de modificación.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_query_forbidden_keyword', '安全策略：不允许包含数据修改关键字。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_input_required', 'Girdi parametresi gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_input_required', 'Input parameter is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_input_required', 'Eingabeparameter ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_input_required', 'Входной параметр обязателен.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_input_required', 'El parámetro de entrada es obligatorio.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_input_required', '输入参数为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_key_required', 'Anahtar parametresi gereklidir.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_key_required', 'Key parameter is required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_key_required', 'Schlüsselparameter ist erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_key_required', 'Параметр ключа обязателен.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_key_required', 'El parámetro de clave es obligatorio.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_key_required', '键值参数为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'err_invalid_data', 'Geçersiz veri: Cüzdan adresi ve etiket zorunludur.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'err_invalid_data', 'Invalid data: Wallet address and label are required.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'err_invalid_data', 'Ungültige Daten: Wallet-Adresse und Bezeichnung sind erforderlich.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'err_invalid_data', 'Неверные данные: Требуются адрес кошелька и метка.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'err_invalid_data', 'Datos inválidos: Se requiere dirección de billetera y etiqueta.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'err_invalid_data', '数据无效：钱包地址和标签为必填项。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_native', 'Yerel Kripto Para (Native)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_native', 'Native Cryptocurrency');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_native', 'Native Kryptowährung');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_native', 'Нативная криптовалюта');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_native', 'Criptomoneda Nativa');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_native', '原生加密货币');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_wrapped', 'Paketlenmiş Varlık (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_wrapped', 'Wrapped Asset');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_wrapped', 'Gepackter Vermögenswert (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_wrapped', 'Обернутый актив (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_wrapped', 'Activo envuelto (Wrapped)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_wrapped', '封装代币资产 (Wrapped)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_stablecoin', 'Sabit Kripto Para (Stablecoin)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_stablecoin', 'Stablecoin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_stablecoin', 'Stablecoin');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_stablecoin', 'Стейблкоин');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_stablecoin', 'Moneda estable (Stablecoin)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_stablecoin', '稳定币 (Stablecoin)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_meme', 'Meme Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_meme', 'Meme Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_meme', 'Meme-Token');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_meme', 'Мем-токен');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_meme', 'Token Meme');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_meme', 'Meme 代币');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_contract', 'Akıllı Sözleşme Varlığı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_contract', 'Smart Contract Asset');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_contract', 'Smart-Contract-Vermögenswert');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_contract', 'Актив смарт-контракта');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_contract', 'Activo de contrato inteligente');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_contract', '智能合约资产');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'token_category_dex_lp', 'DEX Likidite Havuzu (LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'token_category_dex_lp', 'DEX Liquidity Pool (LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'token_category_dex_lp', 'DEX-Liquiditätspool (LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'token_category_dex_lp', 'Пул ликвидности DEX (LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'token_category_dex_lp', 'Fondo de liquidez DEX (LP)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'token_category_dex_lp', 'DEX 流动性池 (LP)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'status_healthy', 'Sağlıklı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'status_healthy', 'Healthy');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'status_healthy', 'Gesund');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'status_healthy', 'В норме');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'status_healthy', 'Saludable');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'status_healthy', '运行正常');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'status_integrity_verified', 'Blokzinciri sürekliliği doğrulandı ve eksiksiz.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'status_integrity_verified', 'Blockchain continuity verified and complete.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'status_integrity_verified', 'Blockchain-Kontinuität verifiziert und vollständig.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'status_integrity_verified', 'Непрерывность блокчейна проверена и полна.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'status_integrity_verified', 'Continuidad de la cadena de bloques verificada y completa.');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'status_integrity_verified', '区块链连续性验证通过且完整。');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_activeGenLabel', 'Jenerasyon #4 (Aktif)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_activeGenLabel', 'Generation #4 (Head)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_activeGenLabel', 'Generation #4 (Aktiv)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_activeGenLabel', 'Поколение #4 (Активно)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_activeGenLabel', 'Generación #4 (Activo)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_activeGenLabel', '第 4 代 (当前活跃)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_cvmEnclave', 'Gizli Sanal Makine (CVM) Enklavı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_cvmEnclave', 'Confidential Virtual Machine (CVM) Enclave');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_cvmEnclave', 'Confidential Virtual Machine (CVM) Enklave');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_cvmEnclave', 'Анклав конфиденциальной виртуальной машины (CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_cvmEnclave', 'Enclave de Máquina Virtual Confidencial (CVM)');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_cvmEnclave', '机密虚拟机 (CVM) 飞地');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'biomapper_securityStandard', '1 İnsan = Jenerasyon Başına 1 Adres');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'biomapper_securityStandard', '1 Human = 1 Address per Generation');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'biomapper_securityStandard', '1 Mensch = 1 Adresse pro Generation');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'biomapper_securityStandard', '1 Человек = 1 Адрес за Поколение');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'biomapper_securityStandard', '1 Humano = 1 Dirección por Generación');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'biomapper_securityStandard', '1 个真实人类 = 每代 1 个地址');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiAvgGasSub', 'Blok başına ortalama gas masrafı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiAvgGasSub', 'Average gas fee per block');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'kpiAvgGasSub', 'Durchschnittliche Gasgebühr pro Block');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'kpiAvgGasSub', 'Средняя комиссия за газ за блок');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'kpiAvgGasSub', 'Tarifa de gas promedio por bloque');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'kpiAvgGasSub', '每个区块的平均 Gas 费用');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiBurnedGas', '⛽ Gas Ücreti');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiBurnedGas', 'Gas Fee');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'kpiBurnedGas', 'Gasgebühr');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'kpiBurnedGas', 'Комиссия за газ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'kpiBurnedGas', 'Tarifa de gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'kpiBurnedGas', 'Gas 费用');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledger_burnedNetworkGas', 'Ağ Gas Masrafı');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledger_burnedNetworkGas', 'Network Gas Fee');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('de', 'ledger_burnedNetworkGas', 'Netzwerk-Gasgebühr');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('ru', 'ledger_burnedNetworkGas', 'Комиссия сети за газ');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('es', 'ledger_burnedNetworkGas', 'Tarifa de red de gas');
INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('zh', 'ledger_burnedNetworkGas', '网络 Gas 费用');

-- ========================================================================
-- SYSTEM CONFIGURATION (DYNAMIC OPERATIONAL ADDRESSES & PARAMETERS)
-- ========================================================================
CREATE TABLE IF NOT EXISTS system_config (
    config_key TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

INSERT OR REPLACE INTO system_config (config_key, config_value, description) VALUES
('fees_pot_address', 'hmpwhPbL5XJTYPWXPMkacfqGhJ3eoQRPLKphajpvcot5Q5zkk', 'Official FeesPot validator reward pool address'),
('bridge_precompile_address', '0x0000000000000000000000000000000000000900', 'Substrate <-> EVM currency swap bridge precompile'),
('default_dex_pool_address', '0xe48cc340b8f1ac0a326577b3c2d1fe5229ebb1c2', 'Default primary DEX liquidity pool (WeHMND/USDC)'),
('burn_contract_address', '0x2248100d4d0950b06c1973b601f6dfd8fb149e45', 'Official Humanode burn contract address'),
('sudo_address', 'hmt3zuFmJpA9ohqFqbuRskS7bSKkxBtkddk6WySqwsNcYxFcY', 'Substrate network sudo authority key'),
('price_ref_weth', '2800.0', 'Fallback reference price for WETH/ETH in USD'),
('price_ref_wbtc', '68000.0', 'Fallback reference price for WBTC/BTC in USD'),
('price_ref_usdc', '1.0', 'Fallback reference price for USDC/USDT in USD'),
('circulating_supply_baseline', '285970432.10', 'Baseline circulating supply of HMND'),
('fees_pot_baseline', '403162.33', 'Baseline fees pot balance in HMND'),
('claimable_airdrop_amount', '14114881.07', 'Claimable airdrop pool amount in HMND'),
('simulation_baseline_validators', '48', 'Baseline number of human validators for simulation'),
('simulation_monthly_gas_inflow', '15840.0', 'Baseline monthly network gas inflow in HMND'),
('simulation_avg_batch_payout', '49078.4', 'Baseline average batch payout to validators in HMND'),
('simulation_vps_cost_usd', '15.0', 'Baseline VPS running cost in USD for validator node'),
('dex_baseline_wehmnd_reserve', '12734327.0', 'Baseline WeHMND primary DEX liquidity reserve'),
('dex_baseline_usdc_reserve', '573044.0', 'Baseline USDC primary DEX liquidity reserve'),
('dex_baseline_daily_volume', '48500.0', 'Baseline active daily DEX volume in HMND'),
('total_issuance_cap', '400000000.0', 'Total maximum token issuance cap of Humanode'),
('simulation_monthly_rounds', '2.14', 'Average validator payout batches per month (~14 days/batch)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES 
('tr', 'heatmap_clickOnAnyDay', '💡 Bir güne tıklayarak o günkü blokları ve gas masrafını inceleyebilirsiniz'),
('en', 'heatmap_clickOnAnyDay', '💡 Click on any day to filter its blocks and gas fees'),
('de', 'heatmap_clickOnAnyDay', '💡 Klicken Sie auf einen Tag, um dessen Blöcke und Gasgebühren zu filtern'),
('ru', 'heatmap_clickOnAnyDay', '💡 Нажмите на любой день, чтобы просмотреть его блоки и комиссии за газ'),
('es', 'heatmap_clickOnAnyDay', '💡 Haga clic en cualquier día para filtrar sus bloques y tarifas de gas'),
('zh', 'heatmap_clickOnAnyDay', '💡 点击任意日期以查看其区块和 Gas 费用'),
('tr', 'heatmapTooltip', '{date}:\n⛽ {fee} gas ücreti\n⚡ {count} işlem\n\n👉 Bu günün bloklarını açmak için tıkla'),
('en', 'heatmapTooltip', '{date}:\n⛽ {fee} gas fee\n⚡ {count} txs\n\n👉 Click to view blocks of this day'),
('de', 'heatmapTooltip', '{date}:\n⛽ {fee} Gasgebühr\n⚡ {count} Transaktionen\n\n👉 Klicken, um Blöcke dieses Tages anzuzeigen'),
('ru', 'heatmapTooltip', '{date}:\n⛽ {fee} комиссия за газ\n⚡ {count} транзакций\n\n👉 Нажмите, чтобы просмотреть блоки за этот день'),
('es', 'heatmapTooltip', '{date}:\n⛽ {fee} tarifa de gas\n⚡ {count} transacciones\n\n👉 Haga clic para ver los bloques de este día'),
('zh', 'heatmapTooltip', '{date}:\n⛽ {fee} Gas 费用\n⚡ {count} 笔交易\n\n👉 点击查看该日期的区块'),
('tr', 'tokenomics_burned', 'Yakılan Miktar'),
('en', 'tokenomics_burned', 'Burned Amount');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES 
('tr', 'tokenomics_fixedSupplyHardCap', 'Sabit Arz & 400M Maksimum Sınır'),
('en', 'tokenomics_fixedSupplyHardCap', 'Fixed Supply & 400M Hard Cap'),
('de', 'tokenomics_fixedSupplyHardCap', 'Feste Gesamtmenge & 400M Obergrenze'),
('ru', 'tokenomics_fixedSupplyHardCap', 'Фиксированное предложение и лимит в 400 млн'),
('es', 'tokenomics_fixedSupplyHardCap', 'Suministro fijo y límite estricto de 400M'),
('zh', 'tokenomics_fixedSupplyHardCap', '固定供应量与 4 亿硬顶'),
('tr', 'tokenomics_fixedSupplyDesc', 'Hiçbir koşulda 400.000.000 HMND üzerinde token basılamaz. Yakma kontratında yok edilen coinler toplam arzı deflasyonist olarak azaltır.'),
('en', 'tokenomics_fixedSupplyDesc', 'Under no circumstances can more than 400,000,000 HMND be minted. Coins burned in the burn contract permanently reduce the total supply.'),
('de', 'tokenomics_fixedSupplyDesc', 'Unter keinen Umständen können mehr als 400.000.000 HMND geprägt werden. Im Burn-Vertrag vernichtete Coins reduzieren das Gesamtangebot dauerhaft.'),
('ru', 'tokenomics_fixedSupplyDesc', 'Ни при каких обстоятельствах не может быть выпущено более 400 000 000 HMND. Монеты, сожженные в смарт-контракте, навсегда сокращают общее предложение.'),
('es', 'tokenomics_fixedSupplyDesc', 'Bajo ninguna circunstancia se pueden emitir más de 400.000.000 HMND. Las monedas quemadas en el contrato reducen permanentemente el suministro total.'),
('zh', 'tokenomics_fixedSupplyDesc', '在任何情况下都不会铸造超过 4 亿枚 HMND。在销毁合约中销毁的代币将永久减少总供应量。'),
('tr', 'tokenomics_deflationaryMechanics', 'Deflasyonist Model'),
('en', 'tokenomics_deflationaryMechanics', 'Deflationary Model'),
('de', 'tokenomics_deflationaryMechanics', 'Deflationäres Modell'),
('ru', 'tokenomics_deflationaryMechanics', 'Дефляционная модель'),
('es', 'tokenomics_deflationaryMechanics', 'Modelo deflacionario'),
('zh', 'tokenomics_deflationaryMechanics', '通缩模型');

UPDATE address_labels 
SET category = 'vesting_vault' 
WHERE address IN ('hmoSQfhjSfTma4wsprfarynvpNGiuHSgA6dGwpVnU8AYy9LMY', 'hmsQhDefepRwhF8dpGwYCnb13t18V5mHUm6AqpYDZxMvF3e4X');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES 
('tr', 'block_activitySummary', 'Blok Faaliyet Özeti'),
('en', 'block_activitySummary', 'Block Activity Summary'),
('de', 'block_activitySummary', 'Block-Aktivitätsübersicht'),
('ru', 'block_activitySummary', 'Сводка активности блока'),
('es', 'block_activitySummary', 'Resumen de Actividad del Bloque'),
('zh', 'block_activitySummary', '区块活动摘要'),
('tr', 'block_activitySwaps', '{count} DEX Takası'),
('en', 'block_activitySwaps', '{count} DEX Swaps'),
('de', 'block_activitySwaps', '{count} DEX-Swaps'),
('ru', 'block_activitySwaps', '{count} DEX свопов'),
('es', 'block_activitySwaps', '{count} Swaps de DEX'),
('zh', 'block_activitySwaps', '{count} 次 DEX 兑换'),
('tr', 'block_activityTransfers', '{count} Transfer'),
('en', 'block_activityTransfers', '{count} Transfers'),
('de', 'block_activityTransfers', '{count} Überweisungen'),
('ru', 'block_activityTransfers', '{count} переводов'),
('es', 'block_activityTransfers', '{count} Transferencias'),
('zh', 'block_activityTransfers', '{count} 笔转账'),
('tr', 'block_activityHeartbeats', '{count} Canlılık Bildirimi'),
('en', 'block_activityHeartbeats', '{count} Heartbeats'),
('de', 'block_activityHeartbeats', '{count} Heartbeats'),
('ru', 'block_activityHeartbeats', '{count} пульсов'),
('es', 'block_activityHeartbeats', '{count} Latidos de Red'),
('zh', 'block_activityHeartbeats', '{count} 次在线心跳'),
('tr', 'block_activityBioauth', '{count} Biyometrik Doğrulama'),
('en', 'block_activityBioauth', '{count} Biometric Auths'),
('de', 'block_activityBioauth', '{count} Biometrische Auths'),
('ru', 'block_activityBioauth', '{count} биометрических проверок'),
('es', 'block_activityBioauth', '{count} Autenticaciones Biométricas'),
('zh', 'block_activityBioauth', '{count} 次活体生物认证'),
('tr', 'block_activityContractCalls', '{count} Sözleşme Çağrısı'),
('en', 'block_activityContractCalls', '{count} Contract Calls'),
('de', 'block_activityContractCalls', '{count} Vertragsaufrufe'),
('ru', 'block_activityContractCalls', '{count} вызовов контрактов'),
('es', 'block_activityContractCalls', '{count} Llamadas a Contratos'),
('zh', 'block_activityContractCalls', '{count} 次合约调用'),
('tr', 'tx_actionSummaryTitle', 'İşlem Faaliyeti & Amacı'),
('en', 'tx_actionSummaryTitle', 'Transaction Action & Purpose'),
('de', 'tx_actionSummaryTitle', 'Transaktionsaktion & Zweck'),
('ru', 'tx_actionSummaryTitle', 'Действие и цель транзакции'),
('es', 'tx_actionSummaryTitle', 'Acción y Propósito de la Transacción'),
('zh', 'tx_actionSummaryTitle', '交易行为与目的'),
('tr', 'tx_action_dexSwap', 'DEX Token Takası: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('en', 'tx_action_dexSwap', 'DEX Token Swap: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('de', 'tx_action_dexSwap', 'DEX-Token-Tausch: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('ru', 'tx_action_dexSwap', 'DEX обмен: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('es', 'tx_action_dexSwap', 'Intercambio DEX: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('zh', 'tx_action_dexSwap', 'DEX 代币兑换: {soldAmount} {soldSymbol} ➔ {boughtAmount} {boughtSymbol} ({router})'),
('tr', 'tx_action_tokenTransfer', '{amount} {symbol} Token Transferi'),
('en', 'tx_action_tokenTransfer', '{amount} {symbol} Token Transfer'),
('de', 'tx_action_tokenTransfer', '{amount} {symbol} Token-Überweisung'),
('ru', 'tx_action_tokenTransfer', 'Перевод токенов {amount} {symbol}'),
('es', 'tx_action_tokenTransfer', 'Transferencia de Token {amount} {symbol}'),
('zh', 'tx_action_tokenTransfer', '{amount} {symbol} 代币转账'),
('tr', 'tx_action_nativeTransfer', '{amount} HMND Transferi'),
('en', 'tx_action_nativeTransfer', '{amount} HMND Transfer'),
('de', 'tx_action_nativeTransfer', '{amount} HMND Überweisung'),
('ru', 'tx_action_nativeTransfer', 'Перевод {amount} HMND'),
('es', 'tx_action_nativeTransfer', 'Transferencia de {amount} HMND'),
('zh', 'tx_action_nativeTransfer', '{amount} HMND 转账'),
('tr', 'tx_action_contractInteraction', 'Sözleşme Etkileşimi: {label}'),
('en', 'tx_action_contractInteraction', 'Contract Interaction: {label}'),
('de', 'tx_action_contractInteraction', 'Vertragsinteraktion: {label}'),
('ru', 'tx_action_contractInteraction', 'Взаимодействие с контрактом: {label}'),
('es', 'tx_action_contractInteraction', 'Interacción con Contrato: {label}'),
('zh', 'tx_action_contractInteraction', '智能合约交互: {label}'),
('tr', 'tx_action_contractCall', 'EVM Akıllı Sözleşme Çağrısı ({method})'),
('en', 'tx_action_contractCall', 'EVM Smart Contract Call ({method})'),
('de', 'tx_action_contractCall', 'EVM Smart-Contract-Aufruf ({method})'),
('ru', 'tx_action_contractCall', 'Вызов смарт-контракта EVM ({method})'),
('es', 'tx_action_contractCall', 'Llamada a Contrato Inteligente EVM ({method})'),
('zh', 'tx_action_contractCall', 'EVM 智能合约调用 ({method})'),
('tr', 'tx_dexRouter', 'DEX Yönlendirici'),
('en', 'tx_dexRouter', 'DEX Router'),
('de', 'tx_dexRouter', 'DEX-Router'),
('ru', 'tx_dexRouter', 'DEX Роутер'),
('es', 'tx_dexRouter', 'Enrutador DEX'),
('zh', 'tx_dexRouter', 'DEX 路由合约'),
('tr', 'tx_soldAmount', 'Verilen / Satılan'),
('en', 'tx_soldAmount', 'Sold / Sent'),
('de', 'tx_soldAmount', 'Verkauft / Gesendet'),
('ru', 'tx_soldAmount', 'Продано / Отправлено'),
('es', 'tx_soldAmount', 'Vendido / Enviado'),
('zh', 'tx_soldAmount', '卖出 / 支付'),
('tr', 'tx_boughtAmount', 'Alınan / Gelen'),
('en', 'tx_boughtAmount', 'Bought / Received'),
('de', 'tx_boughtAmount', 'Gekauft / Erhalten'),
('ru', 'tx_boughtAmount', 'Куплено / Получено'),
('es', 'tx_boughtAmount', 'Comprado / Recibido'),
('zh', 'tx_boughtAmount', '买入 / 获得'),
('tr', 'extrinsic_sessionKeys', 'Doğrulayıcı Oturum Anahtarları Güncellemesi ({method})'),
('tr', 'extrinsic_sessionKeys', 'Doğrulayıcı Oturum Anahtarları Güncellemesi ({method})'),
('en', 'extrinsic_sessionKeys', 'Validator Session Keys Update ({method})'),
('de', 'extrinsic_sessionKeys', 'Aktualisierung der Sitzungsschlüssel ({method})'),
('ru', 'extrinsic_sessionKeys', 'Обновление сессионных ключей ({method})'),
('es', 'extrinsic_sessionKeys', 'Actualización de Claves de Sesión ({method})'),
('zh', 'extrinsic_sessionKeys', '验证人会话密钥更新 ({method})'),
('tr', 'extrinsic_vestingUnlock', 'Vesting Kilit Açılımı ({method})'),
('en', 'extrinsic_vestingUnlock', 'Vesting Schedule Unlock ({method})'),
('de', 'extrinsic_vestingUnlock', 'Vesting-Freischaltung ({method})'),
('ru', 'extrinsic_vestingUnlock', 'Разблокировка вестинга ({method})'),
('es', 'extrinsic_vestingUnlock', 'Desbloqueo de Vesting ({method})'),
('zh', 'extrinsic_vestingUnlock', '代币线性释放解锁 ({method})'),
('tr', 'extrinsic_tokenClaims', 'Airdrop / Hakediş Talebi ({method})'),
('en', 'extrinsic_tokenClaims', 'Airdrop / Token Claim ({method})'),
('de', 'extrinsic_tokenClaims', 'Airdrop / Token-Anspruch ({method})'),
('ru', 'extrinsic_tokenClaims', 'Клейм аирдропа / токенов ({method})'),
('es', 'extrinsic_tokenClaims', 'Reclamación de Airdrop / Tokens ({method})'),
('zh', 'extrinsic_tokenClaims', '空投 / 代币认领 ({method})'),
('tr', 'extrinsic_currencySwap', 'Para Birimi / Precompile Takası ({method})'),
('en', 'extrinsic_currencySwap', 'Currency / Precompile Swap ({method})'),
('de', 'extrinsic_currencySwap', 'Währungs- / Precompile-Tausch ({method})'),
('ru', 'extrinsic_currencySwap', 'Своп валюты / прекомпиля ({method})'),
('es', 'extrinsic_currencySwap', 'Intercambio de Moneda / Precompilado ({method})'),
('zh', 'extrinsic_currencySwap', '原生货币 / 预编译合约兑换 ({method})'),
('tr', 'extrinsic_multisig', 'Çoklu İmza Cüzdan İşlemi ({method})'),
('en', 'extrinsic_multisig', 'Multisig Wallet Operation ({method})'),
('de', 'extrinsic_multisig', 'Multisig-Transaktion ({method})'),
('ru', 'extrinsic_multisig', 'Операция мультисиг ({method})'),
('es', 'extrinsic_multisig', 'Operación Multifirma ({method})'),
('zh', 'extrinsic_multisig', '多签钱包操作 ({method})'),
('tr', 'extrinsic_sudo', 'Ağ Yönetici (Sudo) Yetki Çağrısı'),
('en', 'extrinsic_sudo', 'Network Administrator (Sudo) Call'),
('de', 'extrinsic_sudo', 'Netzwerkadministrator (Sudo) Aufruf'),
('ru', 'extrinsic_sudo', 'Вызов администратора сети (Sudo)'),
('es', 'extrinsic_sudo', 'Llamada de Administrador (Sudo)'),
('zh', 'extrinsic_sudo', '超级管理员 (Sudo) 特权调用'),
('tr', 'extrinsic_equivocation', 'Konsensüs Çift İmza / İhlal Bildirimi'),
('en', 'extrinsic_equivocation', 'Consensus Equivocation Report'),
('de', 'extrinsic_equivocation', 'Konsens-Äquivokationsbericht'),
('ru', 'extrinsic_equivocation', 'Отчет о нарушении консенсуса'),
('es', 'extrinsic_equivocation', 'Informe de Equivocación de Consenso'),
('zh', 'extrinsic_equivocation', '共识双签违规上报');
