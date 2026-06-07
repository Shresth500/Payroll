namespace Payroll.api.Models;

public class PayrollRunRow
{
    public int RunId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RunDate { get; set; }
    public int DetailId { get; set; }
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