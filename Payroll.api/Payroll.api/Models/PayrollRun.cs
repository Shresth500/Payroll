namespace Payroll.api.Models;

public class PayrollRun
{
    public int RunId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime RunDate { get; set; }

    public List<PayrollDetail> Details { get; set; } = new();
}

