# 📜 Sıfır Hardcode Politikası (Zero Hardcoding & Dynamic i18n Architecture)

Humanode-Trace platformunda **hiçbir dilde (C#, React/JSX, Node.js)** `"tr"`, `"en"`, `isTr`, `isEn`, `lang === 'tr'` veya benzeri hardcoded dil kontrolleri **kesinlikle bulunamaz ve eklenemez**. 

Tüm diller, varsayılan sistem dili ve sayfa bazlı alanlar **%100 SQLite veritabanı** (`app_languages` ve `app_translations`) üzerinden dinamik olarak yönetilir.

---

## 🏛️ Temel Mimari Prensipler

### 1. Tek Doğruluk Kaynağı: SQLite (`humanode_tracker.db`)
* **Diller:** Sistemde hangi dillerin desteklendiği `app_languages` tablosundan (`GET /api/languages`) okunur.
* **Varsayılan Dil:** Varsayılan dil, `app_languages` tablosundaki `is_default = 1` kaydıdır. Kod içerisinde `"tr"` veya `"en"` varsayılanı yazılmaz.
* **Çeviriler ve Alanlar:** Tüm metinler, başlıklar, etiketler ve açıklamalar `app_translations` tablosunda saklanır.

---

### 2. Backend Seviyesinde: Saf Bildirimsel SQL (Zero Procedural If/Else)
C# veya Node.js katmanında hiçbir `if (lang == "tr")` veya dil bazlı dallanma yer almaz.
Dil geri çekilmesi (fallback), tek bir saf SQL sorgusu ile veritabanı seviyesinde çözülür:

```sql
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
  );
```

* **Sonuç:** Yeni bir dil eklendiğinde veya varsayılan dil değiştirildiğinde backend kodunda tek bir satır dahi değiştirilmez.

---

### 3. React Layout Seviyesinde: `ModuleLayout` Sarmallayıcısı
* **Konum:** `components/ModuleLayout.jsx`
* **İşleyiş:**
  * Uygulamanın tüm sekmelerini sarmallar.
  * Kullanıcı sekme (`activeTab`) veya dil (`lang`) değiştirdiğinde C# Kestrel SQL API'sine (`/api/localization/page?page={activeTab}&lang={lang}`) anında istek atar.
  * SQLite'tan gelen taze alanları `ModuleContext` (`useModuleFields()`) üzerinden tüm alt modüllere aktarır.

---

### 4. UI Modülleri Seviyesinde: Dilden Bağımsız Bileşenler (Agnostic Components)
Bileşenlerin içinde asla şu kalıplar kullanılamaz:
```jsx
// ❌ YASAK / ANTI-PATTERN:
<Title>{lang === 'tr' ? 'Balina Radarı' : 'Whale Radar'}</Title>
const locStr = lang === 'tr' ? 'tr-TR' : 'en-US';

//  ZORUNLU / DATABASE-DRIVEN:
const { t, fields } = useModuleFields();
<Title>{t('whales_title')}</Title>
const locStr = lang; // veya doğrudan Number(...).toLocaleString(lang)
```

---

### 5. Sayı ve Tarih Biçimlendirme Standardı
* **Sayılar:** `amount.toLocaleString(lang)` doğrudan JavaScript motorunun standart ISO dil desteğini kullanır (Türkçe, İngilizce, Almanca, Rusça, İspanyolca, Çince vb. tüm dillerde doğru ayracı otomatik uygular).
* **Göreli Zaman:** `timeAgo` fonksiyonu `Intl.RelativeTimeFormat(lang)` standardını kullanır; hardcoded metin barındırmaz.

---

## 🛠️ Yeni Dil Ekleme veya Alan Güncelleme

Yeni bir dil (örneğin Fransızca `fr` veya Japonca `ja`) eklemek için:
1. `app_languages` tablosuna dil kaydı eklenir:
   ```sql
   INSERT INTO app_languages (code, flag, label, native_name, country, is_default, display_order)
   VALUES ('fr', '🇫🇷', 'Français', 'Français', 'France', 0, 6);
   ```
2. `app_translations` tablosuna anahtarlar girilir:
   ```sql
   INSERT INTO app_translations (lang_code, translation_key, translation_value, updated_at)
   VALUES ('fr', 'whales_title', 'Radar de Baleines', strftime('%s', 'now'));
   ```
3. **Hiçbir C# veya React kodunu yeniden derlemeye gerek kalmadan** yeni dil anında sistemde çalışır!
