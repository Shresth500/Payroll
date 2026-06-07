using Dapper;
using Payroll.api.Models;
using Payroll.api.Repository;
using Payroll.api.Models;
using System.Data;
using System.Data.SqlClient;

namespace PayrollApi.Repositories
{
    public class PayrollRepository : IPayrollRepository
    {
        private readonly string _connectionString;

        // Connection string is injected from appsettings.json — never hardcoded
        public PayrollRepository(IConfiguration configuration) => _connectionString = configuration.GetConnectionString("PayrollDb")
                ?? throw new InvalidOperationException("Connection string 'PayrollDb' not found.");

        // Creates a new open SQL connection each time
        // Dapper closes it automatically after each query
        private IDbConnection CreateConnection() =>
            new SqlConnection(_connectionString);

        // --------------------------------------------------------
        // GET /api/employees
        // --------------------------------------------------------
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

            using var conn = CreateConnection();
            return await conn.QueryAsync<Employee>(sql);
        }

        // --------------------------------------------------------
        // POST /api/payroll/run
        // Calls usp_RunPayroll stored procedure
        // --------------------------------------------------------
        public async Task<PayrollRun> RunPayrollAsync(int month, int year)
        {
            using var conn = CreateConnection();

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
            using var conn = CreateConnection();

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
            using var conn = CreateConnection();

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
        private class PayrollRunRow
        {
            public int RunId { get; set; }
            public int Month { get; set; }
            public int Year { get; set; }
            public string Status { get; set; } = string.Empty;
            public DateTime RunDate { get; set; }
            public int DetailId { get; set; }
            public int EmployeeId { get; set; }
            public string EmployeeName { get; set; } = string.Empty;
            public decimal BasicSalary { get; set; }
            public int TotalWorkingDays { get; set; }
            public int DaysPresent { get; set; }
            public decimal GrossPay { get; set; }
            public decimal PFDeduction { get; set; }
            public decimal ProfessionalTax { get; set; }
            public decimal NetPay { get; set; }
        }
    }
}