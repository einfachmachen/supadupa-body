import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useBudget } from '../store/derived.js'
import { suggestMeals } from '../utils/suggest.js'
import { nutritionForItems } from '../utils/nutrition.js'
import { SLOTS, slotLabel } from '../data/slots.js'
import { int } from '../utils/format.js'

// Screen 2 (Liste): Rezept-Vorschläge aus dem Vorrat + gespeicherte Vorlagen.
export default function MealList({ onEdit, onNew, onSuggest }) {
  const { meals, products, productMap } = useApp()
  const budget = useBudget()
  const templates = meals.filter((m) => m.isTemplate)

  const [slot, setSlot] = useState('breakfast')
  const [nonce, setNonce] = useState(0)
  const suggestions = useMemo(
    () => suggestMeals(products, slot, budget.kcal, { nonce }),
    [products, slot, budget.kcal, nonce],
  )

  return (
    <>
      <div className="head">
        <div>
          <h2>Mahlzeiten</h2>
          <div className="sub">Vorschläge aus deinem Vorrat</div>
        </div>
      </div>

      <div className="body">
        {/* ---- Vorschläge ---- */}
        <div className="seg" style={{ marginBottom: 12 }}>
          {SLOTS.map((s) => (
            <button key={s.key} className={slot === s.key ? 'on' : ''} onClick={() => setSlot(s.key)}>{s.label}</button>
          ))}
        </div>

        <div className="sh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, color: 'var(--txt2)', marginBottom: 8 }}>
          <span>✨ Vorschläge für {slotLabel(slot)}</span>
          <button className="linkbtn" onClick={() => setNonce((n) => n + 1)}>↻ neue</button>
        </div>

        {suggestions.length === 0 ? (
          <div className="empty" style={{ padding: '28px 24px' }}>
            <div className="ic">🧺</div>
            <div className="t">Noch zu wenig im Vorrat</div>
            <div className="d">Füll deine Vorratskammer (z. B. per Suche) — dann stellt die App dir hier Mahlzeiten zusammen.</div>
          </div>
        ) : (
          suggestions.map((sug, i) => {
            const names = sug.items.map((it) => productMap.get(it.productId)?.name).filter(Boolean).join(' · ')
            return (
              <button key={i} className="mealcard" onClick={() => onSuggest(sug)}>
                <div className="em">{sug.emoji}</div>
                <div className="mc">
                  <div className="t">{sug.name}</div>
                  <div className="d">{names}</div>
                </div>
                <div className="kc num">{int(sug.nutrition.kcal)}</div>
              </button>
            )
          })
        )}

        {/* ---- gespeicherte Vorlagen ---- */}
        {templates.length > 0 && (
          <>
            <div className="section-title">Meine Vorlagen</div>
            {templates.map((m) => {
              const n = nutritionForItems(m.items, productMap)
              const names = m.items.map((it) => productMap.get(it.productId)?.name).filter(Boolean).join(' · ')
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
            })}
          </>
        )}
      </div>

      <button className="fab" onClick={onNew} aria-label="Mahlzeit selbst bauen">+</button>
    </>
  )
}
