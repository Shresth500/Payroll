using Payroll.api.Models;
using Payroll.api.Repository;
using System.Data.SqlClient;

namespace Payroll.api.Service;

public class PayrollService(IPayrollRepository _repository, ILogger<PayrollService> _logger) : IPayrollService
{

    public async Task<PayrollRun> RunPayrollAsync(int month, int year)
    {

        try
        {
            _logger.LogInformation("Starting payroll run for {Month}/{Year}", month, year);
            var result = await _repository.RunPayrollAsync(month, year);
            _logger.LogInformation("Payroll run completed. RunId: {RunId}", result.RunId);
            return result;
        }
        catch (SqlException ex) when (ex.Message.Contains("already exists"))
        {
            _logger.LogWarning("Duplicate payroll run attempted for {Month}/{Year}", month, year);
            throw new PayrollAlreadyExistsException(month, year);
        }
    }

    // --------------------------------------------------------
    // GET payroll run by month/year
    // --------------------------------------------------------
    public async Task<PayrollRun?> GetPayrollRunAsync(int month, int year)
    {
        if (month < 1 || month > 12)
            throw new ArgumentException("Month must be between 1 and 12.", nameof(month));

        if (year < 2000 || year > 2100)
            throw new ArgumentException("Year must be between 2000 and 2100.", nameof(year));
        return await _repository.GetPayrollRunAsync(month, year);
    }

    // --------------------------------------------------------
    // GET individual payslip
    // --------------------------------------------------------
    public async Task<Payslip?> GetPayslipAsync(int runId, int employeeId)
    {
        if (runId <= 0)
            throw new ArgumentException("RunId must be greater than 0.", nameof(runId));

        if (employeeId <= 0)
            throw new ArgumentException("EmployeeId must be greater than 0.", nameof(employeeId));

        return await _repository.GetPayslipAsync(runId, employeeId);
    }
}

// --------------------------------------------------------
// Custom exception — thrown when a duplicate run is attempted.
// Controller catches this and returns 409 Conflict.
// --------------------------------------------------------
public class PayrollAlreadyExistsException : Exception
{
    public int Month { get; }
    public int Year { get; }

    public PayrollAlreadyExistsException(int month, int year)
        : base($"A payroll run already exists for {month}/{year}.")
    {
        Month = month;
        Year = year;
    }
}