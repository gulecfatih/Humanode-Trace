using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class SystemConfigRepository
{
    private readonly SqliteConnectionFactory _dbFactory;
    private List<SystemConfigEntry> _cache = new();
    private DateTime _lastRefresh = DateTime.MinValue;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);

    public SystemConfigRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<string> GetConfigAsync(string key, string fallback = "")
    {
        await EnsureCacheLoadedAsync();
        var entry = _cache.FirstOrDefault(c => c.Key.Equals(key, StringComparison.OrdinalIgnoreCase));
        return entry?.Value ?? fallback;
    }

    public async Task<double> GetDoubleConfigAsync(string key, double fallback = 0.0)
    {
        var val = await GetConfigAsync(key);
        if (double.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var num))
        {
            return num;
        }
        return fallback;
    }

    public async Task<List<SystemConfigEntry>> GetAllConfigsAsync()
    {
        await EnsureCacheLoadedAsync();
        return _cache.ToList();
    }

    public async Task<bool> SetConfigAsync(string key, string value, string description = "")
    {
        using var connection = _dbFactory.CreateConnection();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        await connection.ExecuteAsync(StoredProcedures.UpsertSystemConfig, new { Key = key, Value = value, Description = description, UpdatedAt = now });
        _lastRefresh = DateTime.MinValue;
        return true;
    }

    private async Task EnsureCacheLoadedAsync()
    {
        if (_cache.Count > 0 && (DateTime.UtcNow - _lastRefresh) < _cacheDuration)
            return;

        try
        {
            using var connection = _dbFactory.CreateConnection();
            var rows = (await connection.QueryAsync<SystemConfigEntry>(StoredProcedures.GetAllSystemConfigs)).ToList();
            if (rows.Count > 0)
            {
                _cache = rows;
                _lastRefresh = DateTime.UtcNow;
            }
        }
        catch
        {
            // Transient fallback
        }
    }
}
