using Payroll.api.Models;
namespace Payroll.api.Service;

public interface IPayrollService
{
    Task<PayrollRun> RunPayrollAsync(int month, int year);
    Task<PayrollRun?> GetPayrollRunAsync(int month, int year);
    Task<Payslip?> GetPayslipAsync(int runId, int employeeId);
}