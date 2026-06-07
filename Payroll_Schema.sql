USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PayrollDB')
BEGIN
    CREATE DATABASE PayrollDB;
END
GO

USE PayrollDB;
GO

-- ============================================================
-- 1. Departments
-- ============================================================
IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL
    DROP TABLE dbo.Departments;
GO

CREATE TABLE dbo.Departments
(
    DepartmentId   INT           NOT NULL IDENTITY(1,1),
    DepartmentName NVARCHAR(100) NOT NULL,
    CreatedAt      DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Departments PRIMARY KEY (DepartmentId),
    CONSTRAINT UQ_Departments_Name UNIQUE (DepartmentName)
);
GO

-- ============================================================
-- 2. Employees
-- ============================================================
IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL
    DROP TABLE dbo.Employees;
GO

CREATE TABLE dbo.Employees
(
    EmployeeId     INT             NOT NULL IDENTITY(1,1),
    DepartmentId   INT             NOT NULL,
    FullName       NVARCHAR(150)   NOT NULL,
    Email          NVARCHAR(200)   NOT NULL,
    BasicSalary    DECIMAL(12, 2)  NOT NULL,
    IsActive       BIT             NOT NULL DEFAULT 1,
    CreatedAt      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_Employees           PRIMARY KEY (EmployeeId),
    CONSTRAINT UQ_Employees_Email     UNIQUE (Email),
    CONSTRAINT FK_Employees_Dept      FOREIGN KEY (DepartmentId)
                                      REFERENCES dbo.Departments (DepartmentId),
    CONSTRAINT CK_Employees_Salary    CHECK (BasicSalary > 0)
);
GO

CREATE INDEX IX_Employees_DepartmentId ON dbo.Employees (DepartmentId);
GO

-- ============================================================
-- 3. AttendanceRecords
--    One row per employee per month captures:
--      - TotalWorkingDays  (calendar working days for that month)
--      - DaysPresent       (actual days the employee was present)
-- ============================================================
IF OBJECT_ID('dbo.AttendanceRecords', 'U') IS NOT NULL
    DROP TABLE dbo.AttendanceRecords;
GO

CREATE TABLE dbo.AttendanceRecords
(
    AttendanceId     INT  NOT NULL IDENTITY(1,1),
    EmployeeId       INT  NOT NULL,
    Month            TINYINT NOT NULL,   -- 1–12
    Year             SMALLINT NOT NULL,  -- e.g. 2026
    TotalWorkingDays TINYINT NOT NULL,   -- e.g. 26
    DaysPresent      TINYINT NOT NULL,   -- e.g. 24  (0 = absent all month)
    CreatedAt        DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_AttendanceRecords    PRIMARY KEY (AttendanceId),
    CONSTRAINT UQ_Attendance_EmpMonth  UNIQUE (EmployeeId, Month, Year),  -- one record per employee per month
    CONSTRAINT FK_Attendance_Employee  FOREIGN KEY (EmployeeId)
                                       REFERENCES dbo.Employees (EmployeeId),
    CONSTRAINT CK_Attendance_Month     CHECK (Month BETWEEN 1 AND 12),
    CONSTRAINT CK_Attendance_Year      CHECK (Year  BETWEEN 2000 AND 2100),
    CONSTRAINT CK_Attendance_Days      CHECK (DaysPresent <= TotalWorkingDays),
    CONSTRAINT CK_Attendance_WorkDays  CHECK (TotalWorkingDays > 0)
);
GO

CREATE INDEX IX_Attendance_EmpMonth ON dbo.AttendanceRecords (EmployeeId, Month, Year);
GO

-- ============================================================
-- 4. PayrollRuns
--    One header row per month/year combination.
--    Status: 'Draft' → 'Finalised'
--    Once Finalised the trigger (below) prevents updates/deletes.
-- ============================================================
IF OBJECT_ID('dbo.PayrollRuns', 'U') IS NOT NULL
    DROP TABLE dbo.PayrollRuns;
GO

CREATE TABLE dbo.PayrollRuns
(
    RunId       INT          NOT NULL IDENTITY(1,1),
    Month       TINYINT      NOT NULL,
    Year        SMALLINT     NOT NULL,
    Status      NVARCHAR(20) NOT NULL DEFAULT 'Finalised', -- always finalised on insert
    RunDate     DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedAt   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT PK_PayrollRuns          PRIMARY KEY (RunId),
    CONSTRAINT UQ_PayrollRuns_Month    UNIQUE (Month, Year),             -- one run per month (enables 409 Conflict check)
    CONSTRAINT CK_PayrollRuns_Month    CHECK (Month BETWEEN 1 AND 12),
    CONSTRAINT CK_PayrollRuns_Year     CHECK (Year  BETWEEN 2000 AND 2100),
    CONSTRAINT CK_PayrollRuns_Status   CHECK (Status IN ('Draft', 'Finalised'))
);
GO

-- ============================================================
-- 5. PayrollRunDetails
--    One row per employee per payroll run.
--    All monetary values are stored so the record is self-contained
--    and does not change even if the employee's salary changes later.
-- ============================================================
IF OBJECT_ID('dbo.PayrollRunDetails', 'U') IS NOT NULL
    DROP TABLE dbo.PayrollRunDetails;
GO

CREATE TABLE dbo.PayrollRunDetails
(
    DetailId         INT            NOT NULL IDENTITY(1,1),
    RunId            INT            NOT NULL,
    EmployeeId       INT            NOT NULL,

    -- Snapshot values at time of run (immutable record)
    EmployeeName     NVARCHAR(150)  NOT NULL,
    BasicSalary      DECIMAL(12, 2) NOT NULL,
    TotalWorkingDays TINYINT        NOT NULL,
    DaysPresent      TINYINT        NOT NULL,

    -- Calculated components
    GrossPay         DECIMAL(12, 2) NOT NULL,  -- (BasicSalary / TotalWorkingDays) * DaysPresent
    PFDeduction      DECIMAL(12, 2) NOT NULL,  -- 12% of BasicSalary
    ProfessionalTax  DECIMAL(12, 2) NOT NULL,  -- Flat 200
    NetPay           DECIMAL(12, 2) NOT NULL,  -- GrossPay - PFDeduction - ProfessionalTax

    CONSTRAINT PK_PayrollRunDetails    PRIMARY KEY (DetailId),
    CONSTRAINT UQ_Details_RunEmployee  UNIQUE (RunId, EmployeeId),       -- one detail per employee per run
    CONSTRAINT FK_Details_Run          FOREIGN KEY (RunId)
                                       REFERENCES dbo.PayrollRuns (RunId),
    CONSTRAINT FK_Details_Employee     FOREIGN KEY (EmployeeId)
                                       REFERENCES dbo.Employees (EmployeeId),
    CONSTRAINT CK_Details_DaysPresent  CHECK (DaysPresent <= TotalWorkingDays),
    CONSTRAINT CK_Details_GrossPay    CHECK (GrossPay >= 0),
    CONSTRAINT CK_Details_NetPay      CHECK (NetPay >= 0)
);
GO

CREATE INDEX IX_Details_RunId     ON dbo.PayrollRunDetails (RunId);
CREATE INDEX IX_Details_EmployeeId ON dbo.PayrollRunDetails (EmployeeId);
GO

-- ============================================================
-- 6. Immutability Trigger
--    Prevents UPDATE or DELETE on PayrollRunDetails and
--    PayrollRuns once a run exists (all runs are Finalised).
--    Covers the requirement: "Once finalised it cannot be
--    edited or deleted."
-- ============================================================

-- Prevent edits/deletes on PayrollRuns
CREATE OR ALTER TRIGGER trg_PayrollRuns_Immutable
ON dbo.PayrollRuns
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Payroll runs are immutable and cannot be updated or deleted once created.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- Prevent edits/deletes on PayrollRunDetails
CREATE OR ALTER TRIGGER trg_PayrollRunDetails_Immutable
ON dbo.PayrollRunDetails
AFTER UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Payroll run details are immutable and cannot be updated or deleted once created.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

PRINT 'Schema created successfully.';
GO