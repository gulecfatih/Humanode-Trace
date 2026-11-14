using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public class LabelRepository
{
    private readonly SqliteConnectionFactory _dbFactory;

    public LabelRepository(SqliteConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<(List<AddressLabelDto> labels, int total)> GetAddressLabelsAsync(bool watchedOnly = false, string category = "all", string search = "")
    {
        using var connection = _dbFactory.CreateConnection();
        var p = new DynamicParameters();
        var where = "WHERE 1=1";

        if (watchedOnly)
        {
            where += " AND is_watched = 1";
        }

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            where += " AND category = @category";
            p.Add("category", category);
        }

        if (!string.IsNullOrEmpty(search))
        {
            where += " AND (LOWER(address) LIKE @q OR LOWER(label) LIKE @q OR LOWER(notes) LIKE @q)";
            p.Add("q", $"%{search.ToLowerInvariant()}%");
        }

        var total = await connection.ExecuteScalarAsync<int>($"{StoredProcedures.GetAddressLabelsCountBase} {where}", p);

        string sql = $@"{StoredProcedures.GetAddressLabelsBase}
            {where}
            ORDER BY is_watched DESC, updated_at DESC";

        var list = (await connection.QueryAsync<AddressLabelDto>(sql, p)).ToList();
        return (list, total);
    }

    public async Task<AddressLabelDto> SaveAddressLabelAsync(AddressLabelDto label)
    {
        using var connection = _dbFactory.CreateConnection();
        label.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        await connection.ExecuteAsync(StoredProcedures.UpsertAddressLabel, label);
        return label;
    }

    public async Task<bool> DeleteAddressLabelAsync(string address)
    {
        using var connection = _dbFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(StoredProcedures.DeleteAddressLabel, new { Address = address });
        return affected > 0;
    }
}
