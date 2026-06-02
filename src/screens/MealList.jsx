import { useApp } from '../store/AppContext.jsx'
import { nutritionForItems } from '../utils/nutrition.js'
import { slotLabel } from '../data/slots.js'
import { int } from '../utils/format.js'

// Screen 2 (Liste): gespeicherte Mahlzeiten-Vorlagen.
export default function MealList({ onEdit, onNew }) {
  const { meals, productMap } = useApp()
  const templates = meals.filter((m) => m.isTemplate)

  return (
    <>
      <div className="head">
        <div>
          <h2>Mahlzeiten</h2>
          <div className="sub">{templates.length} Vorlagen</div>
        </div>
      </div>

      <div className="body">
        {templates.length === 0 ? (
          <div className="empty">
            <div className="ic">🍽</div>
            <div className="t">Noch keine Mahlzeiten</div>
            <div className="d">Stelle aus deinem Vorrat eine Mahlzeit zusammen — die App rechnet die Nährwerte live mit.</div>
          </div>
        ) : (
          templates.map((m) => {
            const n = nutritionForItems(m.items, productMap)
            const names = m.items
              .map((it) => productMap.get(it.productId)?.name)
              .filter(Boolean)
              .join(' · ')
            return (
              <button key={m.id} className="mealcard" onClick={() => onEdit(m.id)}>
                <div className="em">{m.emoji || '🍽'}</div>
                <div className="mc">
                  <div className="t">{m.name} <span style={{ color: 'var(--txt2)', fontSize: 11 }}>· {slotLabel(m.slot)}</span></div>
                  <div className="d">{names || 'leer'}</div>
                </div>
                <div className="kc num">{int(n.kcal)}</div>
              </button>
            )
          })
        )}
      </div>

      <button className="fab" onClick={onNew} aria-label="Mahlzeit bauen">+</button>
    </>
  )
}
