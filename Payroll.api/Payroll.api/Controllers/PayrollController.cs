using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Payroll.api.Models;
using Payroll.api.Service;

namespace Payroll.api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PayrollController(IPayrollService _service, ILogger<PayrollController> _logger) : ControllerBase
{

        // --------------------------------------------------------
        // POST /api/payroll/run
        // Body: { "month": 6, "year": 2026 }
        // Triggers the payroll calculation for that month/year.
        // Returns 201 Created with the full run summary.
        // Returns 409 Conflict if a run already exists.
        // --------------------------------------------------------
        [HttpPost("run")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> RunPayroll([FromBody] RunPayrollRequest request)
        {
            try
            {
                var result = await _service.RunPayrollAsync(request.Month, request.Year);

                // 201 Created with a Location header pointing to the new resource
                return CreatedAtAction(
                    nameof(GetPayrollRun),
                    new { month = request.Month, year = request.Year },
                    result
                );
            }
            catch (PayrollAlreadyExistsException ex)
            {
                // Bonus requirement: HTTP 409 Conflict
                _logger.LogWarning(ex.Message);
                return Conflict(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // --------------------------------------------------------
        // GET /api/payroll/{month}/{year}
        // Returns the saved payroll run for a given month and year.
        // Returns 404 if no run exists for that period.
        // --------------------------------------------------------
        [HttpGet("{month:int}/{year:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetPayrollRun(int month, int year)
        {
            var result = await _service.GetPayrollRunAsync(month, year);

            if (result is null)
                return NotFound(new { message = $"No payroll run found for {month}/{year}." });

            return Ok(result);
        }

        // --------------------------------------------------------
        // GET /api/payroll/{runId}/slip/{employeeId}
        // Returns individual payslip for one employee in a run.
        // Returns 404 if the run or employee doesn't exist.
        // --------------------------------------------------------
        [HttpGet("{runId:int}/slip/{employeeId:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetPayslip(int runId, int employeeId)
        {
            var result = await _service.GetPayslipAsync(runId, employeeId);

            if (result is null)
                return NotFound(new { message = $"No payslip found for employee {employeeId} in run {runId}." });

            return Ok(result);
        }
    }

