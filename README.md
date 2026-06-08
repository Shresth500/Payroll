# Payroll Run Module

A full-stack payroll processing module that replaces an Excel-based HR payroll workflow.
Built with ASP.NET Core Web API, Dapper, SQL Server, and React App.

---

## App Design


### Database Design

![SQL Database Design](images/er-design.png)

---

### API Documentation

![Swagger API Documentation](images/api-docs.png)

#### Employee Api


![Employee API Request](images/employee-api-request.png)

![Employee API Response](images/employee-api-response.png)

#### Payroll run api
![Payroll Run API Request](images/payroll-run-api-request.png)

![Payroll Run API](images/payroll-run-api-response.png)

#### Payroll Details Api - GET

![Payroll Details API](images/payroll-details-api-request.png)

![Payroll Details API](images/payroll-details-api-response.png)

#### Payroll Slip Api

![Payroll Slip API ](images/payslip-api-request.png)
![Payroll Slip API ](images/payslip-api-response.png)

---

### User Interface

#### Payroll UI
![Payroll UI](images/payroll-ui.png)

#### Employee UI
![Employee UI](images/employee-ui.png)


## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | ASP.NET Core 10 Web API (C#)            |
| DB Access  | Dapper + ADO.NET (no ORM)               |
| Database   | SQL Server (Developer / Express edition)|
| Validation | FluentValidation                        |
| Frontend   |React Js         |
| API Docs   | Swagger UI                              |

---

## Project Structure

```
Payroll.api/
├── Controllers/
│   ├── EmployeesController.cs        GET /api/employees
│   └── PayrollController.cs          POST /api/payroll/run
│                                     GET  /api/payroll/{month}/{year}
│                                     GET  /api/payroll/{runId}/slip/{employeeId}
├── Models/
│   ├── Employee.cs
│   ├── PayrollRun.cs                 also contains PayrollDetail
│   ├── Payslip.cs
│   ├── RunPayrollRequest.cs          POST body model
│   └── PagedResult.cs                generic pagination wrapper
├── Repository/
│   ├── IPayrollRepository.cs
│   └── PayrollRepository.cs          all Dapper calls to stored procedures
├── Services/
│   ├── DbConnectionService.cs        singleton — holds connection string
│   ├── IPayrollService.cs
│   └── PayrollService.cs             business logic + exception handling
├── Validators/
│   └── RunPayrollRequestValidator.cs FluentValidation rules
├── SQL/
│   ├── 01_Schema.sql                 creates PayrollDB + all tables
│   ├── 02_SeedData.sql               5 employees, 2 departments, attendance
│   └── 03_StoredProcedures.sql       usp_RunPayroll, usp_GetPayrollRun,
│                                     usp_GetPayslip
├── wwwroot/
│   └── index.html                    frontend (served as static file)
├── appsettings.json                  connection string lives here
└── Program.cs                        DI registration + middleware
```

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- SQL Server Developer or Express edition running locally
- SQL Server Management Studio (SSMS) — to run the SQL scripts

---

## 1. Database Setup

### Step 1 — Open SSMS and connect

Common server names to try:
```
localhost
.\SQLEXPRESS
.\MSSQLSERVER
```
Use **Windows Authentication**.

### Step 2 — Run the SQL scripts in order

Open each file in SSMS (**File → Open → File**) and press **F5**:

```
SQL/01_Schema.sql           Creates PayrollDB and all 5 tables
SQL/02_SeedData.sql         Inserts 5 employees across 2 departments
                            with attendance records for June 2026
SQL/03_StoredProcedures.sql Creates usp_RunPayroll, usp_GetPayrollRun,
                            usp_GetPayslip
```

### Step 3 — Verify

Run this in SSMS with `PayrollDB` selected:

```sql
SELECT * FROM dbo.Employees;
SELECT name FROM sys.procedures;
```

Expected: 5 employees, 3 stored procedures.

---

## 2. Backend Setup

### Step 1 — Update the connection string

Open `appsettings.json` and set the correct server name:

```json
{
  "ConnectionStrings": {
    "PayrollDB": "Server=localhost;Database=PayrollDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

If `localhost` does not connect, try `.\SQLEXPRESS` or `.\MSSQLSERVER`.

### Step 2 — Run

```bash
dotnet restore
dotnet run
```

Or press **F5** in Visual Studio.

### Step 3 — Check Swagger

Once running, the console shows the port. Navigate to:

```
https://localhost:{port}/swagger
```

All 4 endpoints are listed there and can be tested directly.

---

## 3. Frontend Setup

The frontend is a single HTML file served by ASP.NET Core's static file middleware.

### Step 1 — Confirm static files are enabled

`Program.cs` must have this line before `app.MapControllers()`:

```csharp
app.UseStaticFiles();
```

### Step 2 — Update the API port

Open `wwwroot/index.html` and find:

```javascript
const API = 'https://localhost:7255/api';
```

Change `7255` to the port shown in the console when the API starts.

### Step 3 — Open

```
https://localhost:{port}/index.html
```

---

## 4. API Endpoints

### GET `/api/employees`

Returns all active employees.

**Response 200:**
```json
[
  {
    "employeeId": 1,
    "departmentId": 1,
    "departmentName": "Engineering",
    "fullName": "Ravi Sharma",
    "email": "ravi.sharma@company.com",
    "basicSalary": 30000.00,
    "isActive": true
  }
]
```

---

### POST `/api/payroll/run`

Triggers the payroll calculation for a given month and year.

**Request body:**
```json
{ "month": 6, "year": 2026 }
```

**Response 201 — PayrollRun:**
```json
{
  "runId": 1,
  "month": 6,
  "year": 2026,
  "status": "Finalised",
  "runDate": "2026-06-07T10:00:00Z",
  "details": [
    {
      "detailId": 1,
      "runId": 1,
      "employeeId": 1,
      "employeeName": "Ravi Sharma",
      "basicSalary": 30000.00,
      "totalWorkingDays": 26,
      "daysPresent": 24,
      "grossPay": 27692.31,
      "pfDeduction": 3600.00,
      "professionalTax": 200.00,
      "netPay": 23892.31
    }
  ]
}
```

**Response 409** — run already exists for that month/year:
```json
{ "message": "A payroll run already exists for 6/2026." }
```

**Response 400** — validation error:
```json
{
  "errors": {
    "Month": ["Month must be between 1 and 12."]
  }
}
```

---

### GET `/api/payroll/{month}/{year}`

Returns the saved payroll run for a given period.

**Response 200** — same shape as the POST response above.

**Response 404:**
```json
{ "message": "No payroll run found for 6/2026." }
```

---

### GET `/api/payroll/{runId}/slip/{employeeId}`

Returns an individual payslip. Includes department name and email
(richer than the payroll run detail row).

**Response 200 — Payslip:**
```json
{
  "runId": 1,
  "month": 6,
  "year": 2026,
  "status": "Finalised",
  "runDate": "2026-06-07T10:00:00Z",
  "employeeId": 1,
  "employeeName": "Ravi Sharma",
  "email": "ravi.sharma@company.com",
  "departmentName": "Engineering",
  "basicSalary": 30000.00,
  "totalWorkingDays": 26,
  "daysPresent": 24,
  "grossPay": 27692.31,
  "pfDeduction": 3600.00,
  "professionalTax": 200.00,
  "netPay": 23892.31
}
```

**Response 404:**
```json
{ "message": "No payslip found for employee 1 in run 1." }
```

---

## 5. Payroll Calculation Rules

| Component        | Formula                                                  |
|------------------|----------------------------------------------------------|
| Gross Pay        | `(BasicSalary ÷ TotalWorkingDays) × DaysPresent`         |
| PF Deduction     | `12% of BasicSalary` — not gross pay                     |
| Professional Tax | Flat ₹200 per month                                      |
| Net Pay          | `GrossPay − PFDeduction − ProfessionalTax` (min ₹0)     |

**Example (from spec):**

| Employee    | Basic   | Days | Present | Gross      | PF       | PT    | Net        |
|-------------|---------|------|---------|------------|----------|-------|------------|
| Ravi Sharma | ₹30,000 | 26   | 24      | ₹27,692.31 | ₹3,600   | ₹200  | ₹23,892.31 |

---

## 6. Assumptions

Decisions made where the brief did not specify exact behaviour:

**1. PF on zero-attendance employees**
PF is deducted from BasicSalary regardless of attendance. PF is a statutory deduction on salary, not on earnings. An employee on unpaid leave still has PF calculated on their basic.

**2. Net Pay floored at zero**
For an employee with 0 days present: GrossPay = ₹0, but PF + PT > ₹0. Rather than returning a negative net pay, it is clamped to ₹0. This is handled in the stored procedure using `GREATEST(calculated, 0)`.

**3. Missing attendance records**
If no attendance record exists for an employee in the selected month, they are included with `DaysPresent = 0` and `TotalWorkingDays = 26` (default). They are not silently excluded from the run.

**4. Professional Tax not prorated**
PT is a flat ₹200 regardless of how many days the employee worked that month.

**5. TotalWorkingDays stored per attendance record**
The system does not auto-calculate working days from a calendar. HR enters the figure when recording attendance. This allows flexibility for months with public holidays.

**6. Immutability enforced at two levels**
- Application level: `POST /api/payroll/run` returns 409 if a run already exists.
- Database level: `AFTER UPDATE, DELETE` triggers on `PayrollRuns` and `PayrollRunDetails` raise an error and rollback, so no direct SQL can corrupt a run either.

**7. Only active employees included**
Employees with `IsActive = false` are excluded from payroll runs.

**8. No Draft state**
Runs are marked `Finalised` immediately on creation. The brief did not specify a Draft → Finalise workflow, so it was kept simple.

---

## 7. Bonus Features Implemented

| Feature | Where |
|---------|-------|
| HTTP 409 Conflict on duplicate run | `PayrollService` catches the SP error and throws `PayrollAlreadyExistsException`; controller returns `Conflict()` |
| Payslip view per employee | `GET /api/payroll/{runId}/slip/{employeeId}` + modal in frontend |
| FluentValidation | `Validators/RunPayrollRequestValidator.cs` validates month range and year range before the request reaches the service |
| Singleton DB connection service | `DbConnectionService` registered as `AddSingleton` — holds only the connection string, not a connection |
| Pagination on employees | `GET /api/employees?page=1&pageSize=10` returns `PagedResult<Employee>` with `totalCount`, `totalPages`, `hasNext`, `hasPrev` |

---

## 8. What I Would Add With More Time

- **Unit tests** — xUnit tests for the net pay calculation. The formula is a pure function and trivial to test in isolation. Would also test the 409 path and the zero-attendance edge case.
- **Print-friendly payslip** — a print button on the payslip modal with a CSS `@media print` stylesheet.
- **Authentication** — the API has no auth. In production this would use JWT bearer tokens or Windows Authentication.
- **Audit log** — a table recording who triggered each payroll run, from which IP, and when.
- **Department filter on payroll results** — allow HR to view the run filtered by department.
- **Attenddance** - The Employee could login and mark his attendance and Manager could approve it and then Hr is the one to make the payslip. Employee can only submit the timesheet, but Employee cannot generate Payslip, it will be accessible only to Hr.
- **Structured logging** — currently logs to console only. In production, would add a sink like Seq or Application Insights.
- **Environment-specific connection strings** — move the connection string to `appsettings.Development.json` and use environment variables or Azure Key Vault for production.

---

## 9. Running the Smoke Test

To verify the stored procedure directly in SSMS before running the API:

```sql
USE PayrollDB;
EXEC dbo.usp_RunPayroll @Month = 6, @Year = 2026;
```

Expected: 5 rows returned, Ravi Sharma showing NetPay = ₹23,892.31.
Suresh Patel (0 days present) should show NetPay = ₹0.00.