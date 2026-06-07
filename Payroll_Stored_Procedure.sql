USE PayrollDB;
GO

CREATE OR ALTER PROCEDURE dbo.usp_RunPayroll
    @Month  TINYINT,
    @Year   SMALLINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;  -- auto-rollback on any error

    -- --------------------------------------------------------
    -- 1. Input validation
    -- --------------------------------------------------------
    IF @Month NOT BETWEEN 1 AND 12
    BEGIN
        RAISERROR('Invalid month. Must be between 1 and 12.', 16, 1);
        RETURN;
    END;

    IF @Year NOT BETWEEN 2000 AND 2100
    BEGIN
        RAISERROR('Invalid year. Must be between 2000 and 2100.', 16, 1);
        RETURN;
    END;

    -- --------------------------------------------------------
    -- 2. Duplicate check — one run per month/year
    --    Returns error code 50409 so the C# caller can map it
    --    to HTTP 409 Conflict.
    -- --------------------------------------------------------
    IF EXISTS (
        SELECT 1
        FROM   dbo.PayrollRuns
        WHERE  Month = @Month AND Year = @Year
    )
    BEGIN
        RAISERROR('A payroll run already exists for the specified month and year.', 16, 1, 50409);
        RETURN;
    END;

    -- --------------------------------------------------------
    -- 3. Collect active employees with their attendance for
    --    this period. Employees with no attendance record are
    --    included with DaysPresent = 0 (assumption noted in README).
    -- --------------------------------------------------------
    DECLARE @Employees TABLE
    (
        EmployeeId       INT            NOT NULL,
        FullName         NVARCHAR(150)  NOT NULL,
        BasicSalary      DECIMAL(12, 2) NOT NULL,
        TotalWorkingDays TINYINT        NOT NULL,
        DaysPresent      TINYINT        NOT NULL,
        GrossPay         DECIMAL(12, 2) NOT NULL,
        PFDeduction      DECIMAL(12, 2) NOT NULL,
        ProfessionalTax  DECIMAL(12, 2) NOT NULL,
        NetPay           DECIMAL(12, 2) NOT NULL
    );

    INSERT INTO @Employees
    (
        EmployeeId, FullName, BasicSalary,
        TotalWorkingDays, DaysPresent,
        GrossPay, PFDeduction, ProfessionalTax, NetPay
    )
    SELECT
        e.EmployeeId,
        e.FullName,
        e.BasicSalary,

        -- Default to 26 working days if no attendance record exists
        ISNULL(a.TotalWorkingDays, 26)  AS TotalWorkingDays,
        ISNULL(a.DaysPresent,       0)  AS DaysPresent,

        -- GrossPay = (BasicSalary / TotalWorkingDays) * DaysPresent
        -- ROUND to 2 decimal places (half-up)
        ROUND(
            (e.BasicSalary / CAST(ISNULL(a.TotalWorkingDays, 26) AS DECIMAL(12,4)))
            * ISNULL(a.DaysPresent, 0),
            2
        )                               AS GrossPay,

        -- PF = 12% of Basic Salary (NOT gross pay)
        ROUND(e.BasicSalary * 0.12, 2) AS PFDeduction,

        -- Professional Tax: flat ₹200 per month
        200.00                          AS ProfessionalTax,

        -- NetPay = GrossPay - PF - PT, floored at 0
        -- (edge case: absent all month → GrossPay = 0, deductions > 0)
        GREATEST(
            ROUND(
                (e.BasicSalary / CAST(ISNULL(a.TotalWorkingDays, 26) AS DECIMAL(12,4)))
                * ISNULL(a.DaysPresent, 0),
                2
            )
            - ROUND(e.BasicSalary * 0.12, 2)
            - 200.00,
            0.00
        )                               AS NetPay

    FROM       dbo.Employees        e
    LEFT JOIN  dbo.AttendanceRecords a
               ON  a.EmployeeId = e.EmployeeId
               AND a.Month      = @Month
               AND a.Year       = @Year
    WHERE e.IsActive = 1;

    -- --------------------------------------------------------
    -- 4. Guard: nothing to process
    -- --------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM @Employees)
    BEGIN
        RAISERROR('No active employees found. Payroll run aborted.', 16, 1);
        RETURN;
    END;

    DECLARE @NewRunId INT;

    BEGIN TRANSACTION;

        -- Insert the payroll run header
        INSERT INTO dbo.PayrollRuns (Month, Year, Status)
        VALUES (@Month, @Year, 'Finalised');

        SET @NewRunId = SCOPE_IDENTITY();

        -- Insert one detail row per employee
        INSERT INTO dbo.PayrollRunDetails
        (
            RunId, EmployeeId, EmployeeName,
            BasicSalary, TotalWorkingDays, DaysPresent,
            GrossPay, PFDeduction, ProfessionalTax, NetPay
        )
        SELECT
            @NewRunId,
            EmployeeId,
            FullName,
            BasicSalary,
            TotalWorkingDays,
            DaysPresent,
            GrossPay,
            PFDeduction,
            ProfessionalTax,
            NetPay
        FROM @Employees;

    COMMIT TRANSACTION;

    -- --------------------------------------------------------
    -- 6. Return the run summary to the caller
    --    The C# service maps this result set to the API response.
    -- --------------------------------------------------------
    SELECT
        r.RunId,
        r.Month,
        r.Year,
        r.Status,
        r.RunDate,
        d.DetailId,
        d.EmployeeId,
        d.EmployeeName,
        d.BasicSalary,
        d.TotalWorkingDays,
        d.DaysPresent,
        d.GrossPay,
        d.PFDeduction,
        d.ProfessionalTax,
        d.NetPay
    FROM       dbo.PayrollRuns        r
    JOIN       dbo.PayrollRunDetails   d ON d.RunId = r.RunId
    WHERE      r.RunId = @NewRunId
    ORDER BY   d.EmployeeId;

END;
GO

CREATE OR ALTER PROCEDURE dbo.usp_GetPayrollRun
    @Month TINYINT,
    @Year  SMALLINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1 FROM dbo.PayrollRuns
        WHERE Month = @Month AND Year = @Year
    )
    BEGIN
        SELECT
            CAST(NULL AS INT)           AS RunId,
            CAST(NULL AS TINYINT)       AS Month,
            CAST(NULL AS SMALLINT)      AS Year,
            CAST(NULL AS NVARCHAR(20))  AS Status,
            CAST(NULL AS DATETIME2)     AS RunDate,
            CAST(NULL AS INT)           AS DetailId,
            CAST(NULL AS INT)           AS EmployeeId,
            CAST(NULL AS NVARCHAR(150)) AS EmployeeName,
            CAST(NULL AS DECIMAL(12,2)) AS BasicSalary,
            CAST(NULL AS TINYINT)       AS TotalWorkingDays,
            CAST(NULL AS TINYINT)       AS DaysPresent,
            CAST(NULL AS DECIMAL(12,2)) AS GrossPay,
            CAST(NULL AS DECIMAL(12,2)) AS PFDeduction,
            CAST(NULL AS DECIMAL(12,2)) AS ProfessionalTax,
            CAST(NULL AS DECIMAL(12,2)) AS NetPay
        WHERE 1 = 0;   -- empty, typed result set
        RETURN;
    END;

    SELECT
        r.RunId,
        r.Month,
        r.Year,
        r.Status,
        r.RunDate,
        d.DetailId,
        d.EmployeeId,
        d.EmployeeName,
        d.BasicSalary,
        d.TotalWorkingDays,
        d.DaysPresent,
        d.GrossPay,
        d.PFDeduction,
        d.ProfessionalTax,
        d.NetPay
    FROM       dbo.PayrollRuns        r
    JOIN       dbo.PayrollRunDetails   d ON d.RunId = r.RunId
    WHERE      r.Month = @Month AND r.Year = @Year
    ORDER BY   d.EmployeeId;
END;
GO

-- ============================================================
-- Helper: GET individual payslip
-- Used by GET /api/payroll/{runId}/slip/{employeeId}
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.usp_GetPayslip
    @RunId      INT,
    @EmployeeId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.RunId,
        r.Month,
        r.Year,
        r.Status,
        r.RunDate,
        d.DetailId,
        d.EmployeeId,
        d.EmployeeName,
        d.BasicSalary,
        d.TotalWorkingDays,
        d.DaysPresent,
        d.GrossPay,
        d.PFDeduction,
        d.ProfessionalTax,
        d.NetPay,
        e.Email,
        dep.DepartmentName
    FROM       dbo.PayrollRunDetails d
    JOIN       dbo.PayrollRuns       r   ON  r.RunId      = d.RunId
    JOIN       dbo.Employees         e   ON  e.EmployeeId = d.EmployeeId
    JOIN       dbo.Departments       dep ON  dep.DepartmentId = e.DepartmentId
    WHERE      d.RunId      = @RunId
      AND      d.EmployeeId = @EmployeeId;
END;
GO

PRINT 'Stored procedures created successfully.';
GO
