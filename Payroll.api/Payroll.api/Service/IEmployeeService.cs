using Payroll.api.Models;

namespace Payroll.api.Service;

public interface IEmployeeService
{
    Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize, int? month, int? year);
}
