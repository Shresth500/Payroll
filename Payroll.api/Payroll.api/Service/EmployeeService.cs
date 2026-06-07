using Payroll.api.Models;
using Payroll.api.Repository;

namespace Payroll.api.Service;

public class EmployeeService(IEmployeeRepository _employeeRepository) : IEmployeeService
{
    public async Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize)
    {
        // Clamp values — never trust raw input
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 10); // max 10 per page

        return await _employeeRepository.GetAllEmployeesAsync(page, pageSize);
    }
}
