using Payroll.api.Models;

namespace Payroll.api.Repository;

public interface IEmployeeRepository
{
    Task<IEnumerable<Employee>> GetAllEmployeesAsync();
}
