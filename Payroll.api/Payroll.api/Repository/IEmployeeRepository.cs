using Payroll.api.Models;

namespace Payroll.api.Repository;

public interface IEmployeeRepository
{
    Task<PagedResult<Employee>> GetAllEmployeesAsync(int page, int pageSize);
}
