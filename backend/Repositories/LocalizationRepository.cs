using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ILocalizationRepository
{
    Task<List<LanguageItemDto>> GetLanguagesAsync();
    Task<Dictionary<string, string>> GetTranslationsAsync(string lang);
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
        var cleanLang = (lang ?? "tr").Trim().ToLower();
        using var connection = _dbFactory.CreateConnection();

        // 1. First fetch default language (English or Turkish) as base fallback
        const string fallbackSql = @"
            SELECT translation_key, translation_value
            FROM app_translations
            WHERE lang_code = 'tr'";
        var fallbackRows = await connection.QueryAsync<(string key, string val)>(fallbackSql);

        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in fallbackRows)
        {
            if (!string.IsNullOrEmpty(r.key))
                result[r.key] = r.val;
        }

        // 2. Overlay requested language if not 'tr'
        if (cleanLang != "tr")
        {
            const string langSql = @"
                SELECT translation_key, translation_value
                FROM app_translations
                WHERE lang_code = @cleanLang";
            var langRows = await connection.QueryAsync<(string key, string val)>(langSql, new { cleanLang });

            foreach (var r in langRows)
            {
                if (!string.IsNullOrEmpty(r.key))
                    result[r.key] = r.val;
            }
        }

        return result;
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
