// Nutri-Score-Pille A–E (oder „—" wenn unbekannt).
export default function NutriGrade({ grade, sm = false }) {
  const g = grade && 'ABCDE'.includes(grade) ? grade : null
  const cls = g ? `g${g}` : 'gNA'
  return <span className={`grade ${cls}${sm ? ' sm' : ''}`}>{g || '—'}</span>
}
