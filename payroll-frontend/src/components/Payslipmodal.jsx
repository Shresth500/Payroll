import { MONTHS, inr } from '../utils/format.js'

// Payslip modal — shown when HR clicks "Payslip" on a table row
// Props:
//   slip    — Payslip model {
//               runId, month, year, status, runDate,
//               employeeId, employeeName, email, departmentName,
//               basicSalary, totalWorkingDays, daysPresent,
//               grossPay, pfDeduction, professionalTax, netPay
//             }
//   onClose — () => void

// Individual slip row inside the modal
function SlipRow({ label, value, type = 'normal' }) {
  const isNet = type === 'net'
  const isDed = type === 'ded'

  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        isNet ? '14px 24px' : '10px 24px',
        borderBottom:   isNet ? 'none' : '1px solid var(--border-lt)',
        background:     isNet ? 'var(--accent-lt)' : 'transparent',
        borderTop:      isNet ? '1px solid #C8E6C9' : 'none',
      }}
    >
      <span
        style={{
          fontSize:   isNet ? 14 : 13,
          fontWeight: isNet ? 700 : 400,
          color:      isNet ? 'var(--accent-dark)' : 'var(--text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize:   isNet ? 15 : 12,
          fontWeight: isNet ? 700 : 400,
          color:      isNet ? 'var(--accent-dark)' : isDed ? 'var(--red)' : 'var(--text)',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export default function PayslipModal({ slip, onClose }) {
  if (!slip) return null

  // Close on overlay click
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Close on Escape key is handled in App.jsx via useEffect

  return (
    <div
      onClick={handleOverlay}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.4)',
        zIndex:         500,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background:   'var(--surface)',
          border:       '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          width:        400,
          maxWidth:     '94vw',
          boxShadow:    'var(--shadow-lg)',
          overflow:     'hidden',
          animation:    'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'var(--header-bg)',
            color:      '#FAFAF7',
            padding:    '20px 24px',
            position:   'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position:   'absolute',
              top:        14,
              right:      16,
              background: 'none',
              border:     'none',
              color:      'rgba(250,250,247,0.5)',
              fontSize:   16,
              cursor:     'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>
            {slip.employeeName}
          </div>
          <div style={{ fontSize: 11, opacity: 0.55, letterSpacing: '0.06em' }}>
            {MONTHS[slip.month]} {slip.year} · {slip.departmentName}
          </div>
        </div>

        {/* Slip rows — every field from the Payslip model */}
        <SlipRow label="Basic Salary"                value={inr(slip.basicSalary)}                />
        <SlipRow label="Total Working Days"           value={slip.totalWorkingDays}                />
        <SlipRow label="Days Present"                 value={slip.daysPresent}                     />
        <SlipRow label="Gross Pay"                    value={inr(slip.grossPay)}                   />
        <SlipRow label="PF Deduction (12% of Basic)" value={`− ${inr(slip.pfDeduction)}`}    type="ded" />
        <SlipRow label="Professional Tax (flat)"      value={`− ${inr(slip.professionalTax)}`} type="ded" />
        <SlipRow label="Net Pay"                      value={inr(slip.netPay)}               type="net" />
      </div>
    </div>
  )
}