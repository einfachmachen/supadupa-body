const TABS = [
  { key: 'pantry', label: 'Vorrat', ic: '▦' },
  { key: 'build', label: 'Bauen', ic: '🍽' },
  { key: 'today', label: 'Heute', ic: '◍' },
  { key: 'better', label: 'Bessere', ic: '↻' },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <button key={t.key} className={`tab${active === t.key ? ' on' : ''}`} onClick={() => onChange(t.key)}>
          <span className="ic">{t.ic}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}
