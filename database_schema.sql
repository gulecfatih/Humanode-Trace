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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalBurnedGas', 'Toplam Yakılan Gas (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'totalBurnedGasSub', 'Kümülatif Borsa Kurlarıyla:');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'unifiedTitle', 'Ağ Blokları, İşlemler ve Yakılan Gas Analiz Masası');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiReportTitle', 'Seçili Dönem: Bloklar & Yakılan Gas Hesaplama Raporu');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiBurnedGas', '🔥 Yakılan Toplam Gas');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiBurnedGasSub', 'Dönem içi günlük borsa kurlarıyla kümülatif net hesaplama');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalBlocks', '📦 Toplam Blok');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalBlocksSub', 'Dizilen ve filtrelenen blok adedi');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalTxs', '⚡ Toplam İşlem');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalVol', '💰 Toplam Hacim');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiTotalVolSub', 'Transfer edilen toplam miktar');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiAvgGas', '⛽ Blok Başına Gas');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'kpiAvgGasSub', 'Blok başına yakılan masraf');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'colBlockFee', 'Bu Blokta Yakılan Fee');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'ledgerBurnedFee', 'YAKILAN GAS (FEE)');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('tr', 'heatmapSubtitle', 'Haftanın her günü ve günün her saati yakılan gas yoğunluğu');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalBurnedGas', 'Total Burned Gas (Fee)');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'totalBurnedGasSub', 'With Cumulative Market Rates:');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'unifiedTitle', 'Network Blocks, Transactions & Burned Gas Analysis');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiReportTitle', 'Selected Period: Blocks & Burned Gas Report');

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'kpiBurnedGas', '🔥 Total Burned Gas');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'colBlockFee', 'Burned Fee in Block');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'ledgerBurnedFee', 'BURNED GAS (FEE)');

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

INSERT OR REPLACE INTO app_translations (lang_code, translation_key, translation_value) VALUES ('en', 'heatmapSubtitle', 'Gas burned across each day of the week and hour of the day');

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
