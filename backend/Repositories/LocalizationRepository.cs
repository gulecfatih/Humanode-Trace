using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ILocalizationRepository
{
    Task<List<LanguageItemDto>> GetLanguagesAsync();
    Task<Dictionary<string, string>> GetTranslationsAsync(string lang);
    Task<Dictionary<string, string>> GetPageLocalizationAsync(string page, string lang);
    Task<bool> UpsertTranslationAsync(string lang, string key, string value);
}

public class LocalizationRepository : ILocalizationRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public LocalizationRepository(IDbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<List<LanguageItemDto>> GetLanguagesAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        const string sql = @"
            SELECT
                code AS Code,
                flag AS Flag,
                label AS Label,
                native_name AS NativeName,
                country AS Country,
                is_default = 1 AS IsDefault
            FROM app_languages
            ORDER BY display_order ASC";

        var list = (await connection.QueryAsync<LanguageItemDto>(sql)).ToList();
        return list;
    }

    public async Task<Dictionary<string, string>> GetTranslationsAsync(string lang)
    {
        var cleanLang = (lang ?? "").Trim().ToLower();
        using var connection = _dbFactory.CreateConnection();

        // Declarative SQL fallback: 100% database-driven using is_default in app_languages, zero procedural if/else
        const string sql = @"
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

        var rows = await connection.QueryAsync<(string key, string val)>(sql, new { cleanLang });
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            if (!string.IsNullOrEmpty(r.key))
                result[r.key] = r.val;
        }

        return result;
    }

    public async Task<Dictionary<string, string>> GetPageLocalizationAsync(string page, string lang)
    {
        var cleanLang = (lang ?? "").Trim().ToLower();
        var cleanPage = string.IsNullOrWhiteSpace(page) ? "overview" : page.Trim().ToLower();
        using var connection = _dbFactory.CreateConnection();

        // 100% database-driven declarative SQL query with fallback to is_default = 1
        const string sql = @"
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

        var rows = await connection.QueryAsync<(string key, string val)>(sql, new { cleanLang });
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var prefixUnderscore = cleanPage + "_";
        var prefixDot = cleanPage + ".";
        var prefixPageUnderscore = "page_" + cleanPage + "_";

        foreach (var r in rows)
        {
            if (string.IsNullOrEmpty(r.key)) continue;
            dict[r.key] = r.val;

            // Direct page aliases (e.g. whales_title -> title for whales page)
            if (r.key.StartsWith(prefixUnderscore, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixUnderscore.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    dict[shortKey] = r.val;
            }
            else if (r.key.StartsWith(prefixDot, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixDot.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    dict[shortKey] = r.val;
            }
            else if (r.key.StartsWith(prefixPageUnderscore, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixPageUnderscore.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    dict[shortKey] = r.val;
            }
        }

        return dict;
    }

    public async Task<bool> UpsertTranslationAsync(string lang, string key, string value)
    {
        if (string.IsNullOrWhiteSpace(lang) || string.IsNullOrWhiteSpace(key))
            return false;

        using var connection = _dbFactory.CreateConnection();
        const string sql = @"
            INSERT INTO app_translations (lang_code, translation_key, translation_value, updated_at)
            VALUES (@lang, @key, @value, @now)
            ON CONFLICT(lang_code, translation_key) DO UPDATE SET
                translation_value = excluded.translation_value,
                updated_at = excluded.updated_at";

        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var rows = await connection.ExecuteAsync(sql, new { lang = lang.Trim().ToLower(), key = key.Trim(), value, now });
        return rows > 0;
    }
}
