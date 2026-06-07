// Lightweight CSS-only spinner — no dependencies
// Props:
//   light  (bool) — white spinner, for use on dark/green backgrounds
//   size   (number) — diameter in px, default 14
export default function Spinner({ light = false, size = 14 }) {
  return (
    <span
      style={{
        display:       'inline-block',
        width:         size,
        height:        size,
        border:        `2px solid ${light ? 'rgba(255,255,255,0.25)' : 'var(--border)'}`,
        borderTopColor: light ? '#fff' : 'var(--accent)',
        borderRadius:  '50%',
        animation:     'spin 0.65s linear infinite',
        flexShrink:    0,
        verticalAlign: 'middle',
      }}
    />
  )
}