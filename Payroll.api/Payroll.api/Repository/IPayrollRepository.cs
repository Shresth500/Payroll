using Payroll.api.Models;

namespace Payroll.api.Repository;

public interface IPayrollRepository
{
    Task<IEnumerable<Employee>> GetAllEmployeesAsync();
    Task<PayrollRun> RunPayrollAsync(int month, int year);
    Task<PayrollRun?> GetPayrollRunAsync(int month, int year);
    Task<Payslip?> GetPayslipAsync(int runId, int employeeId);
}
