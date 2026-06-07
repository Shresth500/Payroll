using Dapper;
using Payroll.api.Models;
using Payroll.api.Service;

namespace Payroll.api.Repository;

public class EmployeeRepository(DbConnectionService _db) : IEmployeeRepository
{
    public async Task<IEnumerable<Employee>> GetAllEmployeesAsync()
    {
        const string sql = @"
                SELECT
                    e.EmployeeId,
                    e.DepartmentId,
                    d.DepartmentName,
                    e.FullName,
                    e.Email,
                    e.BasicSalary,
                    e.IsActive
                FROM       dbo.Employees   e
                JOIN       dbo.Departments d ON d.DepartmentId = e.DepartmentId
                WHERE      e.IsActive = 1
                ORDER BY   e.FullName;";

        using var conn = _db.CreateConnection();
        return await conn.QueryAsync<Employee>(sql);
    }
}
