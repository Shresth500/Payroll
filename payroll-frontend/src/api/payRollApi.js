const BASE = '/api'

export async function runPayroll(month, year) {
  const res = await fetch(`${BASE}/payroll/run`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ month, year }),
  })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

export async function fetchPayrollRun(month, year) {
  const res  = await fetch(`${BASE}/payroll/${month}/${year}`)
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

export async function fetchPayslip(runId, employeeId) {
  const res  = await fetch(`${BASE}/payroll/${runId}/slip/${employeeId}`)
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

// ── GET /api/employees ───────────────────────────────────────────────────────
// Appends pagination alongside optional Month/Year filter parameters
export async function fetchEmployees(page = 1, pageSize = 5, month = null, year = null) {
  let url = `${BASE}/employees?page=${page}&pageSize=${pageSize}`
  
  if (month) url += `&month=${month}`
  if (year) url += `&year=${year}`

  const res = await fetch(url)
  const body = await res.json().catch(() => ({ data: [], totalPages: 1, page: 1 }))
  return { status: res.status, body }
}