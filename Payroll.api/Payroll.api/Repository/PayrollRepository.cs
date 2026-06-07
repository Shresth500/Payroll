using Dapper;
using Payroll.api.Models;
using Payroll.api.Repository;
using Payroll.api.Models;
using System.Data;
using System.Data.SqlClient;
using Payroll.api.Service;

namespace PayrollApi.Repositories;

public class PayrollRepository(DbConnectionService _db) : IPayrollRepository
{

    // --------------------------------------------------------
    // POST /api/payroll/run
    // Calls usp_RunPayroll stored procedure
    // --------------------------------------------------------
    public async Task<PayrollRun> RunPayrollAsync(int month, int year)
    {
        using var conn = _db.CreateConnection();

        // Execute the stored procedure and get back flat rows
        // (one row per employee in the run)
        var rows = await conn.QueryAsync<PayrollRunRow>(
            "dbo.usp_RunPayroll",
            new { Month = month, Year = year },
            commandType: CommandType.StoredProcedure
        );

        var rowList = rows.ToList();

        if (!rowList.Any())
            throw new InvalidOperationException("Payroll run returned no results.");

        // Map flat rows into the PayrollRun + Details structure
        return MapToPayrollRun(rowList);
    }

    // --------------------------------------------------------
    // GET /api/payroll/{month}/{year}
    // Calls usp_GetPayrollRun stored procedure
    // --------------------------------------------------------
    public async Task<PayrollRun?> GetPayrollRunAsync(int month, int year)
    {
        using var conn = _db.CreateConnection();

        var rows = await conn.QueryAsync<PayrollRunRow>(
            "dbo.usp_GetPayrollRun",
            new { Month = month, Year = year },
            commandType: CommandType.StoredProcedure
        );

        var rowList = rows.ToList();

        // No rows means no run exists for this month/year → 404
        if (!rowList.Any()) return null;

        return MapToPayrollRun(rowList);
    }

    // --------------------------------------------------------
    // GET /api/payroll/{runId}/slip/{employeeId}
    // Calls usp_GetPayslip stored procedure
    // --------------------------------------------------------
    public async Task<Payslip?> GetPayslipAsync(int runId, int employeeId)
    {
        using var conn = _db.CreateConnection();

        var result = await conn.QueryFirstOrDefaultAsync<Payslip>(
            "dbo.usp_GetPayslip",
            new { RunId = runId, EmployeeId = employeeId },
            commandType: CommandType.StoredProcedure
        );

        // null means no matching record → 404
        return result;
    }

    // --------------------------------------------------------
    // Private helper: maps flat stored procedure rows into the
    // nested PayrollRun → Details structure
    // --------------------------------------------------------
    private static PayrollRun MapToPayrollRun(List<PayrollRunRow> rows)
    {
        var first = rows.First();

        return new PayrollRun
        {
            RunId = first.RunId,
            Month = first.Month,
            Year = first.Year,
            Status = first.Status,
            RunDate = first.RunDate,
            Details = rows.Select(r => new PayrollDetail
            {
                DetailId = r.DetailId,
                RunId = r.RunId,
                EmployeeId = r.EmployeeId,
                EmployeeName = r.EmployeeName,
                BasicSalary = r.BasicSalary,
                TotalWorkingDays = r.TotalWorkingDays,
                DaysPresent = r.DaysPresent,
                GrossPay = r.GrossPay,
                PFDeduction = r.PFDeduction,
                ProfessionalTax = r.ProfessionalTax,
                NetPay = r.NetPay
            }).ToList()
        };
    }

    // --------------------------------------------------------
    // Private flat row class — matches the stored procedure
    // result set column-for-column. Dapper maps by column name.
    // --------------------------------------------------------
}