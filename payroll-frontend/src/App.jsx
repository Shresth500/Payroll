import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Toast from './components/Toast.jsx'
import Spinner from './components/Spinner.jsx'
import PayrollTable from './components/PayrollTable.jsx'
import EmployeeCards from './components/EmployeeCards.jsx'
import PayslipModal from './components/Payslipmodal.jsx'

import { fetchEmployees, fetchPayrollRun, runPayroll, fetchPayslip } from './api/payRollApi.js'
import { MONTHS } from './utils/format.js'

export default function App() {
  // ── Navigation & Global UI State ─────────────────────────────────────────
  const [currentTab, setCurrentTab] = useState('payroll') // 'payroll' | 'employees'
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  // ── Domain Data State ────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([])
  const [payrollRun, setPayrollRun] = useState(null)
  const [selectedSlip, setSelectedSlip] = useState(null)

  // ── Server-Side Pagination State ─────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(5) 

  // ── Form State for Running & Filtering Payroll ───────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── API Interaction: Fetch Paginated Employee Directory ──────────────────
  const loadEmployees = async (page, month, year) => {
    setLoading(true)
    const { status, body } = await fetchEmployees(page, pageSize, month, year)
    setLoading(false)

    if (status === 200) {
      setEmployees(body.data || [])
      setTotalPages(body.totalPages || 1)
    } else {
      showToast('Failed to fetch employee directory.', 'error')
    }
  }

  // ── API Interaction: Load Existing Payroll Run ───────────────────────────
  const loadCurrentPayroll = async (month, year) => {
    setLoading(true)
    const { status, body } = await fetchPayrollRun(month, year)
    setLoading(false)

    if (status === 200) {
      setPayrollRun(body)
    } else if (status === 404) {
      setPayrollRun(null)
    } else {
      showToast('Error loading payroll history.', 'error')
    }
  }

  // ── Sync View when Switch Tabs or changing Core Filters ──────────────────
  useEffect(() => {
    if (currentTab === 'employees') {
      setCurrentPage(1) 
      loadEmployees(1, selectedMonth, selectedYear)
    } else if (currentTab === 'payroll') {
      loadCurrentPayroll(selectedMonth, selectedYear)
    }
  }, [currentTab, selectedMonth, selectedYear])

  // ── Dedicated watcher for active page updates ────────────────────────────
  useEffect(() => {
    if (currentTab === 'employees') {
      loadEmployees(currentPage, selectedMonth, selectedYear)
    }
  }, [currentPage])

  // ── API Interaction: Trigger New Payroll Run ─────────────────────────────
  const handleRunPayroll = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { status, body } = await runPayroll(selectedMonth, selectedYear)
    setLoading(false)

    if (status === 201) {
      setPayrollRun(body)
      showToast(`Payroll generated successfully for ${MONTHS[selectedMonth]} ${selectedYear}!`)
    } else if (status === 409) {
      showToast(body.message || 'Payroll has already been processed for this month.', 'info')
    } else if (status === 400) {
      const errMsg = body.errors ? Object.values(body.errors).flat().join(', ') : (body.message || 'Validation failed.')
      showToast(errMsg, 'error')
    } else {
      showToast('An unexpected server error occurred.', 'error')
    }
  }

  // ── API Interaction: Fetch Specific Employee Slip ────────────────────────
  const handleOpenPayslip = async (runId, employeeId) => {
    setLoading(true)
    const { status, body } = await fetchPayslip(runId, employeeId)
    setLoading(false)

    if (status === 200) {
      setSelectedSlip(body)
    } else {
      showToast(body.message || 'Could not find or parse the requested payslip.', 'error')
    }
  }

  // ── Keyboard Modal Exit Handler ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedSlip(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pagBtnStyle = (disabled) => ({
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    background: disabled ? '#F5F3EE' : 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: disabled ? 'var(--text-muted)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.1s ease',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main style={{ flex: 1, width: '100%', maxWidth: 1024, margin: '0 auto', padding: '0 24px 48px' }}>
        <Toast toast={toast} />

        {/* Global Toolbar Filter Row (Always present or synced across states) */}
        <div style={{ 
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', 
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
          marginBottom: 24
        }}>
          <form onSubmit={handleRunPayroll} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13 }}
            >
              {MONTHS.map((m, idx) => idx > 0 && <option key={idx} value={idx}>{m}</option>)}
            </select>

            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13 }}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>

            {currentTab === 'payroll' && (
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: 'var(--accent)', color: '#fff', border: 'none', padding: '7px 16px', 
                  borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? <Spinner light size={12} /> : 'Process Payroll'}
              </button>
            )}
          </form>
          {loading && <Spinner size={18} />}
        </div>

        {/* ── TAB CONTENT: PAYROLL CALCULATOR MODULE ────────────────────── */}
        {currentTab === 'payroll' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.15s ease' }}>
            {payrollRun ? (
              <PayrollTable run={payrollRun} onSlip={handleOpenPayslip} />
            ) : (
              !loading && (
                <div style={{ 
                  textAlign: 'center', padding: '80px 20px', border: '1px dashed var(--border)', 
                  borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: 13 
                }}>
                  No active payroll run captured for {MONTHS[selectedMonth]} {selectedYear}. Click "Process Payroll" to initialize.
                </div>
              )
            )}
          </div>
        )}

        {/* ── TAB CONTENT: EMPLOYEES REGISTER DIRECTORY ───────────────── */}
        {currentTab === 'employees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                Active Registry ({MONTHS[selectedMonth]} {selectedYear})
              </h2>
            </div>

            <EmployeeCards employees={employees} />

            {/* Pagination Controls Footer section */}
            {employees && employees.length > 0 ? (
              <div style={{ 
                display: 'flex', 
                justify: 'space-between', 
                justifyContent: 'space-between',
                alignItems: 'center', 
                marginTop: 12,
                paddingTop: 16,
                borderTop: '1px solid var(--border)'
              }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Page <strong>{currentPage}</strong> of {totalPages} (Show {pageSize}/page)
                </span>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    disabled={currentPage === 1 || loading} 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    style={pagBtnStyle(currentPage === 1 || loading)}
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage === totalPages || loading} 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    style={pagBtnStyle(currentPage === totalPages || loading)}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              !loading && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 13 }}>
                  No historical employee records map to this period filter.
                </div>
              )
            )}
          </div>
        )}
      </main>

      <PayslipModal slip={selectedSlip} onClose={() => setSelectedSlip(null)} />
    </div>
  )
}