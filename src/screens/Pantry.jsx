import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import NutriGrade from '../components/NutriGrade.jsx'
import { defaultUnit, kcalPerUnit } from '../utils/nutrition.js'
import { int } from '../utils/format.js'

// Screen 1: der Warenkorb (Stammprodukte). Suchen, anlegen, bearbeiten.
export default function Pantry({ onEdit, onNew }) {
  const { products, stores, storeMap } = useApp()
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return products
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || (p.brand || '').toLowerCase().includes(needle))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))
  }, [products, q])

  return (
    <>
      <div className="head">
        <div>
          <h2>Vorratskammer</h2>
          <div className="sub">{products.length} Produkte · {stores.length} Märkte</div>
        </div>
      </div>

      <div className="body">
        <div className="search">
          <span>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Produkt suchen…" />
        </div>

        {list.length === 0 ? (
          <div className="empty">
            <div className="ic">🛒</div>
            <div className="t">{q ? 'Nichts gefunden' : 'Noch keine Produkte'}</div>
            <div className="d">{q ? 'Andere Suche probieren.' : 'Tippe auf +, um dein erstes Stammprodukt anzulegen.'}</div>
          </div>
        ) : (
          list.map((p) => {
            const unit = defaultUnit(p)
            const store = storeMap.get(p.storeId)
            return (
              <button key={p.id} className="prow" onClick={() => onEdit(p.id)}>
                <NutriGrade grade={p.grade} />
                <div className="pname">
                  <div className="t">{p.favorite ? '★ ' : ''}{p.name}</div>
                  <div className="m">
                    {store && <span className="chip">{store.name}</span>}
                    {p.brand ? p.brand + ' · ' : ''}{unit.label} ≈ {int(unit.grams)} {p.baseUnit}
                  </div>
                </div>
                <div className="kcal num">
                  {int(kcalPerUnit(p, unit))}
                  <small>/ {unit.label}</small>
                </div>
              </button>
            )
          })
        )}
      </div>

      <button className="fab" onClick={onNew} aria-label="Produkt anlegen">+</button>
    </>
  )
}
