using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Payroll.api.Service;

namespace Payroll.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController(IEmployeeService _service, ILogger<EmployeesController> _logger) : ControllerBase
    {
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            if (page < 1)
                return BadRequest(new { message = "Page must be greater than 0." });

            if (pageSize < 1 || pageSize > 100)
                return BadRequest(new { message = "PageSize must be between 1 and 100." });

            var result = await _service.GetAllEmployeesAsync(page, pageSize);
            return Ok(result);
        }

    }
}
