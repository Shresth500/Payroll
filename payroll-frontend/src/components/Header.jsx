// Top navigation header
// Props matched with App.jsx
export default function Header({ currentTab, setCurrentTab }) {
  const navBtn = (tab, label) => (
    <button
      onClick={() => setCurrentTab(tab)}
      style={{
        background:    currentTab === tab ? '#2E2E2A' : 'none',
        border:        'none',
        color:         currentTab === tab ? '#FAFAF7' : 'rgba(250,250,247,0.5)',
        padding:       '6px 14px',
        borderRadius:  6,
        fontSize:      13,
        fontWeight:    500,
        cursor:        'pointer',
        transition:    'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <header
      style={{
        background:     'var(--header-bg)',
        color:          '#FAFAF7',
        padding:        '0 48px',
        height:         56,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        position:       'sticky',
        top:            0,
        zIndex:         100,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Payroll Module
        </span>
        <span
          style={{
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background:    'var(--accent)',
            color:         '#fff',
            padding:       '3px 8px',
            borderRadius:  20,
          }}
        >
          HR Internal
        </span>
      </div>

      {/* Nav tabs */}
      <nav style={{ display: 'flex', gap: 4 }}>
        {navBtn('payroll',   'Payroll Run')}
        {navBtn('employees', 'Employees')}
      </nav>
    </header>
  )
}