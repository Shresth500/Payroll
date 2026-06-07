import { inr }    from '../utils/format.js'
import AttBar      from './AttBar.jsx'

// Renders the payroll results table
// Props:
//   run     — PayrollRun { runId, details: PayrollDetail[] }
//   onSlip  — (runId, employeeId) => void  — triggered by Payslip button
//
// PayrollDetail fields used:
//   detailId, employeeId, employeeName, basicSalary,
//   totalWorkingDays, daysPresent,
//   grossPay, pfDeduction, professionalTax, netPay
const TH = ({ children, right }) => (
  <th
    style={{
      padding:       '9px 14px',
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      color:         'var(--text-muted)',
      textAlign:     right ? 'right' : 'left',
      background:    '#F5F3EE',
      whiteSpace:    'nowrap',
      borderBottom:  '1px solid var(--border)',
    }}
  >
    {children}
  </th>
)

export default function PayrollTable({ run, onSlip }) {
  const details = run.details || []

  return (
    <div
      style={{
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow:     'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <TH>#</TH>
            <TH>Employee</TH>
            <TH right>Basic Salary</TH>
            <TH>Attendance</TH>
            <TH right>Gross Pay</TH>
            <TH right>PF (12%)</TH>
            <TH right>Prof. Tax</TH>
            <TH right>Net Pay</TH>
            <TH></TH>
          </tr>
        </thead>
        <tbody>
          {details.map((d, i) => {
            const isZero = d.netPay === 0
            const rowBg  = i % 2 === 0 ? '#fff' : '#FAFAF7'

            return (
              <tr
                key={d.detailId}
                style={{ background: rowBg, transition: 'background 0.1s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F3EE')}
                onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
              >
                {/* Row number */}
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)', fontSize: 11, borderBottom: '1px solid var(--border-lt)' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>

                {/* Employee name */}
                <td style={{ padding: '11px 14px', fontWeight: 600, borderBottom: '1px solid var(--border-lt)' }}>
                  {d.employeeName}
                </td>

                {/* Basic salary */}
                <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, borderBottom: '1px solid var(--border-lt)' }}>
                  {inr(d.basicSalary)}
                </td>

                {/* Attendance bar — uses daysPresent + totalWorkingDays */}
                <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-lt)' }}>
                  <AttBar present={d.daysPresent} total={d.totalWorkingDays} />
                </td>

                {/* Gross pay */}
                <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, borderBottom: '1px solid var(--border-lt)' }}>
                  {inr(d.grossPay)}
                </td>

                {/* PF deduction — shown as negative, red */}
                <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', borderBottom: '1px solid var(--border-lt)' }}>
                  −{inr(d.pfDeduction)}
                </td>

                {/* Professional tax — flat ₹200, shown red */}
                <td style={{ padding: '11px 14px', textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--red)', borderBottom: '1px solid var(--border-lt)' }}>
                  −{inr(d.professionalTax)}
                </td>

                {/* Net pay — green if positive, muted if zero (edge case) */}
                <td
                  style={{
                    padding:       '11px 14px',
                    textAlign:     'right',
                    fontFamily:    'var(--mono)',
                    fontSize:      12,
                    fontWeight:    700,
                    color:         isZero ? 'var(--text-muted)' : 'var(--accent)',
                    borderBottom:  '1px solid var(--border-lt)',
                  }}
                >
                  {inr(d.netPay)}
                </td>

                {/* Payslip button — passes runId + employeeId to parent */}
                <td style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-lt)' }}>
                  <button
                    onClick={() => onSlip(run.runId, d.employeeId)}
                    style={{
                      background:    'none',
                      border:        '1px solid var(--border)',
                      borderRadius:  5,
                      padding:       '4px 11px',
                      fontSize:      11,
                      fontWeight:    600,
                      color:         'var(--text-muted)',
                      cursor:        'pointer',
                      letterSpacing: '0.04em',
                      transition:    'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.color = 'var(--accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.color = 'var(--text-muted)'
                    }}
                  >
                    Payslip
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}