using System.Data;
using System.Data.SqlClient;

namespace Payroll.api.Service;

public class DbConnectionService
{
    private readonly string _connectionString;

    public DbConnectionService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("PayrollDb")
            ?? throw new InvalidOperationException("Connection string 'PayrollDb' not found.");
    }

    // Returns a new open connection each time it's called
    // Caller is responsible for disposing it (using var conn = ...)
    public IDbConnection CreateConnection() =>
        new SqlConnection(_connectionString);
}
