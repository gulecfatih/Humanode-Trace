using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class LocalizationRepository
{
    private readonly SqliteConnectionFactory _dbFactory;

    public LocalizationRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<List<LanguageItemDto>> GetLanguagesAsync()
    {
        using var connection = _dbFactory.CreateConnection();
        var list = (await connection.QueryAsync<LanguageItemDto>(StoredProcedures.GetAppLanguagesList)).ToList();
        return list;
    }

    public async Task<List<TranslationItemDto>> GetTranslationsAsync(string lang)
    {
        var cleanLang = (lang ?? "").Trim().ToLower();
        using var connection = _dbFactory.CreateConnection();

        var rows = await connection.QueryAsync<(string key, string val)>(StoredProcedures.GetTranslationsWithDefaultFallback, new { cleanLang });
        var result = new List<TranslationItemDto>();
        foreach (var r in rows)
        {
            if (!string.IsNullOrEmpty(r.key))
                result.Add(new TranslationItemDto { Key = r.key, Value = r.val });
        }

        return result;
    }

    public async Task<List<TranslationItemDto>> GetPageLocalizationAsync(string page, string lang)
    {
        var cleanLang = (lang ?? "").Trim().ToLower();
        var cleanPage = string.IsNullOrWhiteSpace(page) ? "overview" : page.Trim().ToLower();
        using var connection = _dbFactory.CreateConnection();

        var rows = await connection.QueryAsync<(string key, string val)>(StoredProcedures.GetTranslationsWithDefaultFallback, new { cleanLang });
        var list = new List<TranslationItemDto>();

        var prefixUnderscore = cleanPage + "_";
        var prefixDot = cleanPage + ".";
        var prefixPageUnderscore = "page_" + cleanPage + "_";

        foreach (var r in rows)
        {
            if (string.IsNullOrEmpty(r.key)) continue;
            list.Add(new TranslationItemDto { Key = r.key, Value = r.val });

            // Direct page aliases (e.g. whales_title -> title for whales page)
            if (r.key.StartsWith(prefixUnderscore, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixUnderscore.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    list.Add(new TranslationItemDto { Key = shortKey, Value = r.val });
            }
            else if (r.key.StartsWith(prefixDot, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixDot.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    list.Add(new TranslationItemDto { Key = shortKey, Value = r.val });
            }
            else if (r.key.StartsWith(prefixPageUnderscore, StringComparison.OrdinalIgnoreCase))
            {
                var shortKey = r.key.Substring(prefixPageUnderscore.Length);
                if (!string.IsNullOrEmpty(shortKey))
                    list.Add(new TranslationItemDto { Key = shortKey, Value = r.val });
            }
        }

        return list;
    }

    public async Task<bool> UpsertTranslationAsync(string lang, string key, string value)
    {
        if (string.IsNullOrWhiteSpace(lang) || string.IsNullOrWhiteSpace(key))
            return false;

        using var connection = _dbFactory.CreateConnection();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var rows = await connection.ExecuteAsync(StoredProcedures.UpsertAppTranslation, new { lang = lang.Trim().ToLower(), key = key.Trim(), value, now });
        return rows > 0;
    }
}
