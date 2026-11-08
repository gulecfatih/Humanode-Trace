import sqlite3
import json
import urllib.request
import urllib.error
import time
import sys

# Force UTF-8 on Windows Console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:3000"
DB_PATH = "humanode_tracker.db"

results = {
    "total_checks": 0,
    "passed": 0,
    "warnings": 0,
    "failed": 0,
    "details": []
}

def log_check(module, name, status, message, data=None):
    results["total_checks"] += 1
    if status == "PASS":
        results["passed"] += 1
    elif status == "WARN":
        results["warnings"] += 1
    else:
        results["failed"] += 1
    
    icon = "✅" if status == "PASS" else ("⚠️" if status == "WARN" else "❌")
    print(f"{icon} [{module}] {name}: {message}")
    results["details"].append({
        "module": module,
        "name": name,
        "status": status,
        "message": message,
        "data": data
    })

def fetch_api(endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "AuditScript/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode('utf-8')
            return e.code, json.loads(body)
        except:
            return e.code, None
    except Exception as e:
        return 500, str(e)

print("="*70)
print("🚀 HUMANODE E2E SYSTEM AUDIT SCRIPT STARTED")
print("="*70)

# -------------------------------------------------------------
# 1. DATABASE SANITY CHECKS
# -------------------------------------------------------------
print("\n--- 1. VERİTABANI SAĞLIK VE VERİ BÜTÜNLÜĞÜ DENETİMİ ---")
try:
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    # Block count
    block_cnt = cur.execute("SELECT count(*) FROM blocks_with_tx").fetchone()[0]
    if block_cnt > 500000:
        log_check("Database", "Block Count", "PASS", f"Toplam {block_cnt:,} blok mevcut.")
    else:
        log_check("Database", "Block Count", "WARN", f"Düşük blok sayısı: {block_cnt}")

    # Transactions & Extrinsics
    tx_cnt = cur.execute("SELECT count(*) FROM transactions").fetchone()[0]
    ext_cnt = cur.execute("SELECT count(*) FROM substrate_extrinsics").fetchone()[0]
    log_check("Database", "Transactions", "PASS", f"EVM: {tx_cnt:,} işlem, Substrate: {ext_cnt:,} extrinsic mevcut.")

    # Token transfers count
    token_tx_cnt = cur.execute("SELECT count(*) FROM token_transfers").fetchone()[0]
    distinct_tokens = cur.execute("SELECT count(DISTINCT token_address) FROM token_transfers").fetchone()[0]
    log_check("Database", "Token Transfers", "PASS", f"{distinct_tokens} farklı token türünde toplam {token_tx_cnt:,} transfer mevcut.")

    con.close()
except Exception as e:
    log_check("Database", "Connection", "FAIL", f"Veritabanı hatası: {e}")

# -------------------------------------------------------------
# 2. OVERVIEW & KPI ENDPOINTS
# -------------------------------------------------------------
print("\n--- 2. GENEL BAKIŞ & KPI SERVİSLERİ DENETİMİ ---")
status, stats = fetch_api("/api/stats")
if status == 200 and isinstance(stats, dict):
    fees = stats.get("totalFeesHmnd") or stats.get("total_network_fees") or 0
    vol = stats.get("totalVolumeHmnd") or stats.get("total_all_volume") or 0
    txs = stats.get("totalTransactions") or stats.get("total_all_transactions") or 0
    validators = stats.get("activeValidators", 0)

    if fees > 0 and vol > 0 and txs > 0:
        log_check("Overview", "/api/stats", "PASS", f"İşlem: {txs:,}, Gas: {fees:,.2f} HMND, Hacim: {vol:,.2f} HMND, Validatör: {validators}")
    else:
        log_check("Overview", "/api/stats", "FAIL", f"Sıfır değerli KPI tespit edildi! Fees: {fees}, Vol: {vol}, Txs: {txs}")
else:
    log_check("Overview", "/api/stats", "FAIL", f"HTTP {status} döndü.")

# Daily chart
status, daily = fetch_api("/api/daily?interval=daily")
if status == 200 and isinstance(daily, list) and len(daily) > 30:
    log_check("Overview", "/api/daily", "PASS", f"Günlük grafik için {len(daily)} gün veri mevcut.")
else:
    log_check("Overview", "/api/daily", "FAIL", f"Günlük grafik verisi yetersiz veya hatalı: len={len(daily) if isinstance(daily, list) else 0}")

# -------------------------------------------------------------
# 3. WALLET & MULTI-ASSET TOKEN PORTFOLIO CHECK
# -------------------------------------------------------------
print("\n--- 3. CÜZDAN & ÇOKLU TOKEN PORTFÖYÜ DENETİMİ ---")
# Test known multi-token address: 0xc33d4c0c59627bf2d0b22b6b3676a3f8bcafa944
test_addr = "0xc33d4c0c59627bf2d0b22b6b3676a3f8bcafa944"
status, ledger_res = fetch_api(f"/api/wallet-ledger?address={test_addr}")

if status == 200 and isinstance(ledger_res, dict):
    tokens = ledger_res.get("tokens")
    summary = ledger_res.get("summary", {})
    hmnd_bal = summary.get("netBalanceHmnd", 0)

    if tokens is None:
        log_check("Wallet Ledger", "Token List Exposure", "FAIL", 
                  f"KRİTİK AÇIK: {test_addr} cüzdanı veritabanında USDC ve WeHMND tutmasına rağmen API 'tokens' listesini hiç döndürmüyor (undefined)!")
    elif len(tokens) == 0:
        log_check("Wallet Ledger", "Token List Exposure", "FAIL", 
                  f"KRİTİK AÇIK: {test_addr} için 'tokens' dizisi boş (0) döndü! Gerçek varlıklar gösterilemiyor.")
    else:
        symbols = [t.get("symbol") or t.get("token_symbol") for t in tokens]
        log_check("Wallet Ledger", "Token List Exposure", "PASS", 
                  f"Cüzdan başarıyla {len(tokens)} token gösteriyor: {', '.join(symbols)}")
else:
    log_check("Wallet Ledger", "Endpoint Response", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 4. MAJOR & LABELED WALLETS
# -------------------------------------------------------------
print("\n--- 4. RESMİ & ETİKETLİ BÜYÜK CÜZDANLAR DENETİMİ ---")
status, majors = fetch_api("/api/major-wallets")
if status == 200 and isinstance(majors, dict):
    items = majors.get("items", [])
    if len(items) >= 20:
        log_check("Major Wallets", "/api/major-wallets", "PASS", 
                  f"Toplam {len(items)} etiketli cüzdan listeleniyor.")
    else:
        log_check("Major Wallets", "/api/major-wallets", "WARN", f"Beklenenden az cüzdan listelendi: {len(items)}")
else:
    log_check("Major Wallets", "/api/major-wallets", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 5. WHALES & RADAR
# -------------------------------------------------------------
print("\n--- 5. BALİNA RADARI & SIRALAMA DENETİMİ ---")
# HMND Whales
status, hmnd_whales = fetch_api("/api/whales?asset=hmnd&minHmnd=50000")
if status == 200 and isinstance(hmnd_whales, list):
    log_check("Whales", "HMND Whales", "PASS", f"50K+ HMND balina işlemi sayısı: {len(hmnd_whales)}")
else:
    log_check("Whales", "HMND Whales", "FAIL", f"HTTP {status} döndü.")

# USDC Whales
status, usdc_whales = fetch_api("/api/whales?asset=usdc&minHmnd=1000")
if status == 200 and isinstance(usdc_whales, list):
    log_check("Whales", "USDC Whales", "PASS", f"USDC balina işlemi sayısı: {len(usdc_whales)}")
else:
    log_check("Whales", "USDC Whales", "FAIL", f"USDC filtresi başarısız HTTP {status}")

# Leaderboard
status, lboard = fetch_api("/api/leaderboard")
if status == 200 and isinstance(lboard, dict):
    senders = lboard.get("topSenders", [])
    log_check("Leaderboard", "Top Senders", "PASS", f"En aktif cüzdan sayısı: {len(senders)}")
else:
    log_check("Leaderboard", "/api/leaderboard", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 6. VALIDATORS & BIOMETRICS
# -------------------------------------------------------------
print("\n--- 6. VALİDATÖRLER & BİYOMETRİK SAĞLIK DENETİMİ ---")
status, val_res = fetch_api("/api/validators")
if status == 200 and isinstance(val_res, dict):
    val_list = val_res.get("validators", [])
    active_cnt = val_res.get("activeValidators", 0)

    if active_cnt >= 48:
        first_val = val_list[0].get("address")
        e_status, econ = fetch_api(f"/api/validator-economics?address={first_val}")
        if e_status == 200 and econ.get("isValidator") is True:
            log_check("Validators", "Validator List & Economics", "PASS", 
                      f"Aktif validatör ({active_cnt}) ve toplam kayıt ({len(val_list)}) eksiksiz. İlk validatör ({first_val[:12]}...) blok: {econ.get('totalBlocks')}, bioauth: {econ.get('bioauthCount')}")
        else:
            log_check("Validators", "Validator Economics", "FAIL", f"Validatör ekonomi sorgusu başarısız HTTP {e_status}")
    else:
        log_check("Validators", "Validator Count", "WARN", f"Düşük aktif validatör sayısı: {active_cnt}")
else:
    log_check("Validators", "/api/validators", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 7. FEESPOT & VALIDATOR PROFITABILITY
# -------------------------------------------------------------
print("\n--- 7. FEESPOT & KÂRLILIK DENETİMİ ---")
status, fpot = fetch_api("/api/fees-pot-analytics")
if status == 200 and isinstance(fpot, dict):
    pot_bal = fpot.get("currentBalance", 0)
    burned = fpot.get("burnedTotal", 0)
    batches = fpot.get("totalBatches", 0)
    log_check("FeesPot", "/api/fees-pot-analytics", "PASS", 
              f"FeesPot Havuz Bakiyesi: {pot_bal:,.2f} HMND, Yakılan: {burned:,.2f} HMND, Dağıtım Turu: {batches}")
else:
    log_check("FeesPot", "/api/fees-pot-analytics", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 8. BIOMAPPER & MULTI-CHAIN REGISTRY
# -------------------------------------------------------------
print("\n--- 8. BIOMAPPER & 20+ AĞ KONTRATLARI DENETİMİ ---")
status, bio = fetch_api("/api/biomapper")
if status == 200 and isinstance(bio, dict):
    chains = bio.get("chains", [])
    feed_items = bio.get("bioauthFeed", {}).get("items", [])
    total_feed = bio.get("bioauthFeed", {}).get("pagination", {}).get("totalCount", 0)
    if len(chains) >= 20 and len(feed_items) > 0:
        log_check("Biomapper", "Multi-Chain Registry", "PASS", 
                  f"Kayıtlı Ağ: {len(chains)} adet, Canlı Doğrulama Akışı: {len(feed_items)} sayfa içi, {total_feed:,} toplam kayıt.")
    else:
        log_check("Biomapper", "Multi-Chain Registry", "FAIL", 
                  f"Eksik ağ veya boş feed: {len(chains)} ağ, {len(feed_items)} feed")
else:
    log_check("Biomapper", "/api/biomapper", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 9. TOKENS & DEX LIQUIDITY DEPTH
# -------------------------------------------------------------
print("\n--- 9. TOKENLAR & DEX LİKİDİTE DERİNLİĞİ DENETİMİ ---")
status, tokens_res = fetch_api("/api/tokens")
if status == 200 and isinstance(tokens_res, dict):
    tk_list = tokens_res.get("tokens", [])
    top_pools = tokens_res.get("topPools", [])
    log_check("Tokens", "ERC-20 Directory", "PASS", 
              f"Toplam Token: {len(tk_list)} adet, Aktif Havuz: {len(top_pools)} adet.")
else:
    log_check("Tokens", "/api/tokens", "FAIL", f"HTTP {status} döndü.")

status, dex_depth = fetch_api("/api/dex-depth")
if status == 200 and isinstance(dex_depth, dict):
    r0 = dex_depth.get("reserveToken0", 0)
    r1 = dex_depth.get("reserveToken1", 0)
    log_check("DexDepth", "Orderbook & Reserves", "PASS", 
              f"Havuz: {dex_depth.get('pairName')}, Rezerv 0: {r0:,.2f}, Rezerv 1: {r1:,.2f}")
else:
    log_check("DexDepth", "/api/dex-depth", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# 10. BRIDGE, HODLERS & UNLOCKS DENETİMİ
# -------------------------------------------------------------
print("\n--- 10. KÖPRÜ, HODLERS & KİLİT AÇILIMI DENETİMİ ---")
status, cross = fetch_api(f"/api/cross-layer-link?address={test_addr}")
if status == 200 and isinstance(cross, dict):
    has_link = cross.get("hasLink")
    log_check("Bridge", "Cross-Layer Identity", "PASS", f"Çapraz katman link sorgusu yanıt verdi: hasLink={has_link}")
else:
    log_check("Bridge", "Cross-Layer Identity", "FAIL", f"HTTP {status} döndü.")

status, bridge_data = fetch_api("/api/bridge")
if status == 200 and isinstance(bridge_data, dict):
    k = bridge_data.get("kpis", {})
    vol = k.get("total_volume_hmnd", 0)
    swaps = k.get("total_swaps", 0)
    items = bridge_data.get("items", [])
    log_check("Bridge", "/api/bridge (Çift Katman Köprüsü)", "PASS", f"Köprü Hacmi: {vol:,.2f} HMND, Toplam Swap: {swaps:,}, {len(items)} satır veri listelendi.")
else:
    log_check("Bridge", "/api/bridge (Çift Katman Köprüsü)", "FAIL", f"HTTP {status} döndü.")

status, hodlers_data = fetch_api("/api/hodlers")
if status == 200 and isinstance(hodlers_data, dict):
    k = hodlers_data.get("kpis", {})
    tot = k.get("total_holders", 0)
    sub = k.get("substrate_holders", 0)
    evm = k.get("evm_holders", 0)
    items = hodlers_data.get("items", [])
    log_check("Hodlers", "/api/hodlers (Cüzdan Sahipleri)", "PASS", f"Toplam Cüzdan: {tot}, Substrate: {sub}, EVM: {evm}, {len(items)} satır listelendi.")
else:
    log_check("Hodlers", "/api/hodlers (Cüzdan Sahipleri)", "FAIL", f"HTTP {status} döndü.")

status, unlocks_data = fetch_api("/api/unlocks")
if status == 200 and isinstance(unlocks_data, dict):
    k = unlocks_data.get("kpis", {})
    vest = k.get("vesting_amount_hmnd", 0)
    claims = k.get("tokenClaims_amount_hmnd", 0)
    items = unlocks_data.get("items", [])
    log_check("Unlocks", "/api/unlocks (Kilit Açılımı & Vesting)", "PASS", f"Vesting: {vest:,.2f} HMND, Claims: {claims:,.2f} HMND, {len(items)} satır listelendi.")
else:
    log_check("Unlocks", "/api/unlocks (Kilit Açılımı & Vesting)", "FAIL", f"HTTP {status} döndü.")

# -------------------------------------------------------------
# SUMMARY SCORECARD
# -------------------------------------------------------------
print("\n" + "="*70)
print(f"📊 DENETİM SONUÇ KARNESİ: Toplam {results['total_checks']} Kontrol")
print(f"   ✅ BAŞARILI: {results['passed']}")
print(f"   ⚠️  UYARI:    {results['warnings']}")
print(f"   ❌ BAŞARISIZ: {results['failed']}")
print("="*70)

with open("audit_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Sonuçlar audit_results.json dosyasına kaydedildi.")
