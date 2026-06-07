// Attendance mini progress bar
// Props:
//   present  (int) — daysPresent from PayrollDetail
//   total    (int) — totalWorkingDays from PayrollDetail
export default function AttBar({ present, total }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Track */}
      <div
        style={{
          width:        42,
          height:       3,
          background:   'var(--border)',
          borderRadius: 2,
          overflow:     'hidden',
          flexShrink:   0,
        }}
      >
        {/* Fill */}
        <div
          style={{
            width:        `${pct}%`,
            height:       '100%',
            background:   pct === 0 ? 'var(--border)' : 'var(--accent)',
            borderRadius: 2,
            transition:   'width 0.5s ease',
          }}
        />
      </div>
      {/* Label */}
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {present}/{total}
      </span>
    </div>
  )
}