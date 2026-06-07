using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Payroll.api.Service;

namespace Payroll.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController(IPayrollService _service, ILogger<EmployeesController> _logger) : ControllerBase
    {
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees() => Ok(await _service.GetAllEmployeesAsync());

    }
}
