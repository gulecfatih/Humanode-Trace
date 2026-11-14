using System.Data;
using Microsoft.Data.Sqlite;

namespace HumanodeTracker.Data;

public class SqliteConnectionFactory
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
        EnsureDatabaseInitialized(resolvedDb);
        _connectionString = $"Data Source={resolvedDb};Mode=ReadWrite;Cache=Shared;";
    }

    private static void EnsureDatabaseInitialized(string dbPath)
    {
        if (File.Exists(dbPath) && new FileInfo(dbPath).Length > 0)
        {
            return;
        }

        var schemaCandidates = new List<string>
        {
            Path.GetFullPath("database_schema.sql"),
            Path.GetFullPath("../database_schema.sql"),
            Path.Combine(AppContext.BaseDirectory, "database_schema.sql"),
            Path.Combine(AppContext.BaseDirectory, "..", "database_schema.sql"),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "database_schema.sql")
        };

        var schemaPath = schemaCandidates.FirstOrDefault(File.Exists);
        if (schemaPath == null)
        {
            return;
        }

        using var connection = new SqliteConnection($"Data Source={dbPath};Mode=ReadWriteCreate;");
        connection.Open();

        using var tx = connection.BeginTransaction();
        try
        {
            var sql = File.ReadAllText(schemaPath);
            using var cmd = connection.CreateCommand();
            cmd.Transaction = tx;
            cmd.CommandText = sql;
            cmd.ExecuteNonQuery();
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
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
