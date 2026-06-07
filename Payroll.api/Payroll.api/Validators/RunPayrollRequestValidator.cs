// FILE: Validators/RunPayrollRequestValidator.cs
using FluentValidation;
using Payroll.api.Models;

namespace Payroll.api.Validators;

public class RunPayrollRequestValidator : AbstractValidator<RunPayrollRequest>
{
    public RunPayrollRequestValidator()
    {
        RuleFor(x => x.Month)
            .NotEmpty()
                .WithMessage("Month is required.")
            .InclusiveBetween(1, 12)
                .WithMessage("Month must be between 1 and 12.");

        RuleFor(x => x.Year)
            .NotEmpty()
                .WithMessage("Year is required.")
            .InclusiveBetween(2000, 2100)
                .WithMessage("Year must be between 2000 and 2100.")
            .LessThanOrEqualTo(DateTime.UtcNow.Year)
                .WithMessage("Cannot run payroll for a future year.");
    }
}