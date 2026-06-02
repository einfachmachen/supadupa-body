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

// "2. Juni 2026" — für Zieldatum
export function longDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// Gewicht: "68 kg" / "67,5 kg"
export function kg(n) {
  if (n == null || n === '') return '–'
  return `${Number(n).toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg`
}

// Einheiten-Plural für die Zutatenliste: "2 Scheiben", "½ Scheibe", "1 TL"
const PLURALS = {
  Scheibe: 'Scheiben',
  Portion: 'Portionen',
  Glas: 'Gläser',
  Becher: 'Becher',
  Stück: 'Stück',
  Stueck: 'Stück',
  TL: 'TL',
  EL: 'EL',
  g: 'g',
  ml: 'ml',
}
export function unitLabel(label, amount) {
  if (amount > 1 && PLURALS[label]) return PLURALS[label]
  return label
}
