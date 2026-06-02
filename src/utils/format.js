// Anzeige-Helfer. UI-Sprache Deutsch.

// Ganze Zahl mit schmalem Tausender-Leerzeichen: 1 312
export function int(n) {
  return Math.round(n || 0).toLocaleString('de-DE').replace(/\./g, ' ')
}

// Mengen schön als Brüche zeigen: 0.5 → ½, 0.25 → ¼, 1.5 → 1½
const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
export function qty(n) {
  if (n == null) return ''
  const whole = Math.floor(n)
  const frac = +(n - whole).toFixed(2)
  const fracStr = FRACTIONS[frac]
  if (fracStr) return whole > 0 ? `${whole}${fracStr}` : fracStr
  if (Number.isInteger(n)) return String(n)
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

// Gramm/ml mit Einheit.
export function grams(n, base = 'g') {
  return `${int(n)} ${base}`
}

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTHS = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.']

// "Di · 2. Juni"
export function prettyDate(iso) {
  const d = new Date(iso + 'T00:00:00')
  return `${DAYS[d.getDay()]} · ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}
