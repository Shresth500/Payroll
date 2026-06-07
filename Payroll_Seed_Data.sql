USE PayrollDB;
GO

-- ============================================================
-- Departments
-- ============================================================
INSERT INTO dbo.Departments (DepartmentName) VALUES
    ('Engineering'),
    ('Human Resources');
GO

-- ============================================================
-- Employees  (5 employees across 2 departments)
-- ============================================================
INSERT INTO dbo.Employees (DepartmentId, FullName, Email, BasicSalary) VALUES
    -- Engineering (DepartmentId = 1)
    (1, 'Ravi Sharma',    'ravi.sharma@company.com',    30000.00),
    (1, 'Priya Nair',     'priya.nair@company.com',     42000.00),
    (1, 'Arjun Mehta',    'arjun.mehta@company.com',    55000.00),

    -- Human Resources (DepartmentId = 2)
    (2, 'Deepa Krishnan', 'deepa.krishnan@company.com', 35000.00),
    (2, 'Suresh Patel',   'suresh.patel@company.com',   28000.00);
GO

INSERT INTO dbo.AttendanceRecords (EmployeeId, Month, Year, TotalWorkingDays, DaysPresent) VALUES
    (1, 6, 2026, 26, 24),
    (2, 6, 2026, 26, 26),
    (3, 6, 2026, 26, 13),
    (4, 6, 2026, 26, 25),
    (5, 6, 2026, 26, 0);
GO

PRINT 'Seed data inserted successfully.';
GO

SELECT
    e.EmployeeId,
    e.FullName,
    d.DepartmentName,
    e.BasicSalary,
    a.TotalWorkingDays,
    a.DaysPresent,

    ROUND((e.BasicSalary / a.TotalWorkingDays) * a.DaysPresent, 2)    AS ExpectedGrossPay,
    ROUND(e.BasicSalary * 0.12, 2)                                     AS ExpectedPF,
    200.00                                                             AS ExpectedPT,
    ROUND(
        GREATEST(
            (e.BasicSalary / a.TotalWorkingDays) * a.DaysPresent
            - (e.BasicSalary * 0.12)
            - 200,
            0
        ), 2)                                                          AS ExpectedNetPay
FROM dbo.Employees        e
JOIN dbo.Departments       d ON d.DepartmentId   = e.DepartmentId
JOIN dbo.AttendanceRecords a ON a.EmployeeId      = e.EmployeeId
                             AND a.Month = 6 AND a.Year = 2026
ORDER BY e.EmployeeId;
GO