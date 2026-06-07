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
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetAllEmployees(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? month = null,
            [FromQuery] int? year = null)
        {
            // Existing validation
            if (page < 1)
                return BadRequest(new { message = "Page must be greater than 0." });

            if (pageSize < 1 || pageSize > 100)
                return BadRequest(new { message = "PageSize must be between 1 and 100." });

            // New validation for Month and Year
            if (month.HasValue && (month < 1 || month > 12))
                return BadRequest(new { message = "Month must be between 1 and 12." });

            if (year.HasValue && (year < 1900 || year > 2100)) // Adjust years as needed
                return BadRequest(new { message = "Please provide a valid year." });

            var result = await _service.GetAllEmployeesAsync(page, pageSize, month, year);
            return Ok(result);
        }

    }
}
