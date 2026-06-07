using Payroll.api.Models;

namespace Payroll.api.Service;

public interface IEmployeeService
{
    Task<IEnumerable<Employee>> GetAllEmployeesAsync();
}
