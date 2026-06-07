// Toast notification bar
// Props:
//   toast  { msg: string, type: 'success' | 'error' | 'info' } | null
const STYLES = {
  success: { background: 'var(--accent-lt)', borderColor: 'var(--accent)',      color: 'var(--accent-dark)' },
  error:   { background: 'var(--red-lt)',    borderColor: 'var(--red)',          color: 'var(--red)'         },
  info:    { background: 'var(--amber-lt)',  borderColor: 'var(--amber)',        color: 'var(--amber)'       },
}

export default function Toast({ toast }) {
  if (!toast) return null

  return (
    <div
      style={{
        padding:      '10px 14px',
        borderRadius: 'var(--radius)',
        borderLeft:   '3px solid',
        fontSize:     13,
        marginBottom: 20,
        animation:    'fadeIn 0.2s ease',
        ...STYLES[toast.type],
      }}
    >
      {toast.msg}
    </div>
  )
}