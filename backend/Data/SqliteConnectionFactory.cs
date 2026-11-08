using System.Data;
using Microsoft.Data.Sqlite;

namespace HumanodeTracker.Data;

public interface IDbConnectionFactory
{
    SqliteConnection CreateConnection();
    string GetDbPath();
}

public class SqliteConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;
    private readonly string _dbPath;

    public SqliteConnectionFactory(IConfiguration configuration)
    {
        string? resolvedDb = null;
        var candidates = new[]
        {
            Path.GetFullPath("humanode_tracker.db"),
            Path.GetFullPath("../humanode_tracker.db"),
            Path.Combine(AppContext.BaseDirectory, "humanode_tracker.db"),
            Path.Combine(AppContext.BaseDirectory, "..", "humanode_tracker.db"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "humanode_tracker.db"),
            @"c:\Users\gulec\Desktop\humannode\humanode_tracker.db"
        };

        foreach (var c in candidates)
        {
            if (File.Exists(c) && new FileInfo(c).Length > 100_000_000)
            {
                resolvedDb = c;
                break;
            }
        }

        if (resolvedDb == null)
        {
            foreach (var c in candidates)
            {
                if (File.Exists(c))
                {
                    resolvedDb = c;
                    break;
                }
            }
        }

        resolvedDb ??= Path.GetFullPath("humanode_tracker.db");
        _dbPath = resolvedDb;
        _connectionString = $"Data Source={resolvedDb};Mode=ReadWrite;Cache=Shared;";
    }

    public SqliteConnection CreateConnection()
    {
        var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 10000; PRAGMA cache_size = -64000; PRAGMA temp_store = MEMORY;";
        cmd.ExecuteNonQuery();

        return connection;
    }

    public string GetDbPath() => _dbPath;
}
