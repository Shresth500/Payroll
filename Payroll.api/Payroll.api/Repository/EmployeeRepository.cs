using Dapper;
using Payroll.api.Models;
using Payroll.api.Service;

namespace Payroll.api.Repository;

public class EmployeeRepository(DbConnectionService _db) : IEmployeeRepository
{
    public async Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize, int? month, int? year)
    {
        // Using LEFT JOINs on Attendance or Payroll details depending on what your business logic expects.
        // Here, we look at AttendanceRecords to see if they have data for that month/year, 
        // fallback to checking if month/year parameters are NULL (return all active employees).
        const string sql = @"
        SELECT COUNT(DISTINCT e.EmployeeId) 
        FROM dbo.Employees e
        LEFT JOIN dbo.AttendanceRecords att ON att.EmployeeId = e.EmployeeId
        WHERE e.IsActive = 1
          AND (@Month IS NULL OR att.Month = @Month)
          AND (@Year IS NULL OR att.Year = @Year);

        SELECT
            e.EmployeeId,
            e.DepartmentId,
            d.DepartmentName,
            e.FullName,
            e.Email,
            e.BasicSalary,
            e.IsActive
        FROM       dbo.Employees   e
        JOIN       dbo.Departments d   ON d.DepartmentId = e.DepartmentId
        LEFT JOIN  dbo.AttendanceRecords att ON att.EmployeeId = e.EmployeeId
        WHERE      e.IsActive = 1
          AND      (@Month IS NULL OR att.Month = @Month)
          AND      (@Year IS NULL OR att.Year = @Year)
        GROUP BY   e.EmployeeId, e.DepartmentId, d.DepartmentName, e.FullName, e.Email, e.BasicSalary, e.IsActive
        ORDER BY   e.FullName
        OFFSET     @Offset ROWS           
        FETCH NEXT @PageSize ROWS ONLY;";

        using var conn = _db.CreateConnection();

        using var multi = await conn.QueryMultipleAsync(sql, new
        {
            Offset = (page - 1) * pageSize,
            PageSize = pageSize,
            Month = month,
            Year = year
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
