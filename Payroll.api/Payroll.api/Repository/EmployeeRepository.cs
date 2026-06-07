using Dapper;
using Payroll.api.Models;
using Payroll.api.Service;

namespace Payroll.api.Repository;

public class EmployeeRepository(DbConnectionService _db) : IEmployeeRepository
{
    public async Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize)
    {
        // Two queries in one round trip:
        // First  → total count (for pagination metadata)
        // Second → the actual page of data using OFFSET/FETCH
        const string sql = @"
        SELECT COUNT(*) 
        FROM dbo.Employees 
        WHERE IsActive = 1;

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
        ORDER BY   e.FullName
        OFFSET     @Offset ROWS           -- skip rows before this page
        FETCH NEXT @PageSize ROWS ONLY;   -- take only this page's rows";

        using var conn = _db.CreateConnection();

        // QueryMultiple handles two result sets in one call
        using var multi = await conn.QueryMultipleAsync(sql, new
        {
            Offset = (page - 1) * pageSize,
            PageSize = pageSize
        });

        var totalCount = await multi.ReadFirstAsync<int>();
        var data = await multi.ReadAsync<Employee>();

        return new PagedResult<Employee>
        {
            Data = data,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}
