using Payroll.api.Models;
using Payroll.api.Repository;

namespace Payroll.api.Service;

public class EmployeeService(IEmployeeRepository _employeeRepository) : IEmployeeService
{
    public async Task<IEnumerable<Employee>> GetAllEmployeesAsync() => await _employeeRepository.GetAllEmployeesAsync();
}
