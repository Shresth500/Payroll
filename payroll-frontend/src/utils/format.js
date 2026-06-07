// ── Month names (1-indexed to match the API's month: int) ──────────────────
export const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ── Format a decimal as Indian Rupees ──────────────────────────────────────
// e.g. 27692.31 → "₹27,692.31"
export const inr = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })