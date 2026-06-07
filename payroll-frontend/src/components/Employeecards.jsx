import { inr } from '../utils/format.js'

// Grid of employee cards
// Props:
//   employees — Employee[] {
//     employeeId, departmentId, departmentName,
//     fullName, email, basicSalary, isActive
//   }
export default function EmployeeCards({ employees }) {
  if (employees.length === 0) {
    return (
      <div
        style={{
          textAlign:    'center',
          padding:      '60px 20px',
          border:       '1px dashed var(--border)',
          borderRadius: 'var(--radius)',
          background:   'var(--surface)',
          color:        'var(--text-muted)',
          fontSize:     13,
        }}
      >
        No employees found.
      </div>
    )
  }

  return (
    <div
      style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap:                 12,
      }}
    >
      {employees.map((e) => (
        <div
          key={e.employeeId}
          style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding:      '16px 18px',
            boxShadow:    'var(--shadow)',
            transition:   'box-shadow 0.15s',
          }}
          onMouseEnter={(el) => (el.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
          onMouseLeave={(el) => (el.currentTarget.style.boxShadow = 'var(--shadow)')}
        >
          {/* fullName */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            {e.fullName}
          </div>

          {/* departmentName */}
          <div
            style={{
              fontSize:      11,
              fontWeight:    600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color:         'var(--text-muted)',
              marginBottom:  10,
            }}
          >
            {e.departmentName}
          </div>

          {/* basicSalary */}
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            {inr(e.basicSalary)} / mo
          </div>
        </div>
      ))}
    </div>
  )
}