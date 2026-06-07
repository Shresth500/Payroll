using Payroll.api.Models;
using Payroll.api.Repository;

namespace Payroll.api.Service;

public class EmployeeService(IEmployeeRepository _employeeRepository) : IEmployeeService
{
    public async Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize, int? month, int? year)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 10); // Note: your controller allows 100, but this clamps it to 10. Keep it consistent if needed!

        return await _employeeRepository.GetAllEmployeesAsync(page, pageSize, month, year);
    }
}
