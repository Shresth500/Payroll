namespace Payroll.api.Models;

public class PayrollDetail
{
    public int DetailId { get; set; }
    public int RunId { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public decimal BasicSalary { get; set; }
    public int TotalWorkingDays { get; set; }
    public int DaysPresent { get; set; }
    public decimal GrossPay { get; set; }
    public decimal PFDeduction { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal NetPay { get; set; }
}