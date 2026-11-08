using System.Data;
using Dapper;
using HumanodeTracker.Data;
using HumanodeTracker.Models;

namespace HumanodeTracker.Repositories;

public interface ILabelRepository
{
    Task<(List<AddressLabelDto> labels, int total)> GetAddressLabelsAsync(bool watchedOnly = false, string category = "all", string search = "");
    Task<AddressLabelDto> SaveAddressLabelAsync(AddressLabelDto label);
    Task<bool> DeleteAddressLabelAsync(string address);
}

public class LabelRepository : ILabelRepository
{
    private readonly IDbConnectionFactory _dbFactory;

    public LabelRepository(IDbConnectionFactory dbFactory)
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

        var total = await connection.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM address_labels {where}", p);

        string sql = $@"
            SELECT
                address as Address,
                label as Label,
                category as Category,
                color as Color,
                notes as Notes,
                is_watched as IsWatched,
                updated_at as UpdatedAt
            FROM address_labels
            {where}
            ORDER BY is_watched DESC, updated_at DESC";

        var list = (await connection.QueryAsync<AddressLabelDto>(sql, p)).ToList();
        return (list, total);
    }

    public async Task<AddressLabelDto> SaveAddressLabelAsync(AddressLabelDto label)
    {
        using var connection = _dbFactory.CreateConnection();
        label.UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        const string sql = @"
            INSERT INTO address_labels (address, label, category, color, notes, is_watched, updated_at)
            VALUES (@Address, @Label, @Category, @Color, @Notes, @IsWatched, @UpdatedAt)
            ON CONFLICT(address) DO UPDATE SET
                label = excluded.label,
                category = excluded.category,
                color = excluded.color,
                notes = excluded.notes,
                is_watched = excluded.is_watched,
                updated_at = excluded.updated_at";

        await connection.ExecuteAsync(sql, label);
        return label;
    }

    public async Task<bool> DeleteAddressLabelAsync(string address)
    {
        using var connection = _dbFactory.CreateConnection();
        const string sql = "DELETE FROM address_labels WHERE LOWER(address) = LOWER(@address)";
        var affected = await connection.ExecuteAsync(sql, new { address });
        return affected > 0;
    }
}
