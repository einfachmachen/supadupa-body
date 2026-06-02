import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useBudget, useDayStats } from '../store/derived.js'
import NutriGrade from '../components/NutriGrade.jsx'
import Stepper from '../components/Stepper.jsx'
import Sheet from '../components/Sheet.jsx'
import { SLOTS } from '../data/slots.js'
import {
  defaultUnit, findUnit, kcalPerUnit, nutritionForItems,
} from '../utils/nutrition.js'
import { todayISO } from '../utils/id.js'
import { int, qty as fmtQty, unitLabel as unitPlural } from '../utils/format.js'

const EMOJIS = ['🥪', '🥗', '🍽', '🍎', '🥣', '🍳', '🥙', '🍲', '🥤']

// Screen 2 (Editor): Mahlzeit zusammenstellen — Mengen live gegen das Restbudget.
export default function MealEditor({ mealId, presetSlot, addToDate, onClose }) {
  const { meals, products, productMap, saveMeal, deleteMeal, addEntry } = useApp()
  const existing = meals.find((m) => m.id === mealId)
  const budget = useBudget()
  const today = useDayStats(todayISO())

  const [name, setName] = useState(existing?.name || '')
  const [slot, setSlot] = useState(existing?.slot || presetSlot || 'breakfast')
  const [emoji, setEmoji] = useState(existing?.emoji || SLOTS.find((s) => s.key === (presetSlot || 'breakfast'))?.emoji || '🍽')
  const [items, setItems] = useState(() => (existing?.items || []).map((it) => ({ ...it })))
  const [pickerOpen, setPickerOpen] = useState(false)

  const nutrition = useMemo(() => nutritionForItems(items, productMap), [items, productMap])

  // Restbudget heute (vor dieser Mahlzeit). Bei bereits eingeplanter Vorlage grobe Näherung.
  const remaining = budget.kcal - today.total.kcal
  const over = nutrition.kcal > remaining

  function addProduct(product) {
    const unit = defaultUnit(product)
    setItems((prev) => [...prev, { productId: product.id, qty: 1, unitLabel: unit.label }])
    setPickerOpen(false)
  }
  function setQty(i, q) {
    if (q <= 0) return setItems((prev) => prev.filter((_, idx) => idx !== i))
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, qty: q } : it)))
  }
  function setItemUnit(i, label) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, unitLabel: label } : it)))
  }
  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const valid = name.trim() && items.length > 0

  async function handleSave() {
    if (!valid) return
    const meal = await saveMeal({
      ...(existing || {}),
      name: name.trim(), slot, emoji, isTemplate: true,
      items: items.map((it) => ({ productId: it.productId, qty: it.qty, unitLabel: it.unitLabel })),
    })
    if (addToDate) await addEntry(addToDate, { mealId: meal.id, slot })
    onClose()
  }

  async function handleDelete() {
    if (existing && confirm(`„${existing.name}" wirklich löschen?`)) {
      await deleteMeal(existing.id)
      onClose()
    }
  }

  // Makro-Anteile fürs Track-Diagramm (Energie aus Eiweiß/KH/Fett).
  const kcalP = nutrition.proteinG * 4, kcalC = nutrition.carbG * 4, kcalF = nutrition.fatG * 9
  const kcalSum = kcalP + kcalC + kcalF || 1

  return (
    <div className="editor">
      <div className="head">
        <button className="iconbtn" onClick={onClose} aria-label="zurück">‹</button>
        <h2 style={{ fontSize: 18 }}>{existing ? 'Mahlzeit' : 'Neue Mahlzeit'}</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="body">
        <div className="row2">
          <div className="field" style={{ flex: 3 }}>
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Frühstücksbrot" autoFocus />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Symbol</label>
            <select value={emoji} onChange={(e) => setEmoji(e.target.value)}>
              {EMOJIS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Mahlzeitenfenster</label>
          <div className="seg">
            {SLOTS.map((s) => (
              <button key={s.key} className={slot === s.key ? 'on' : ''} onClick={() => setSlot(s.key)}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Live-Nährwerte */}
        <div className="livebar">
          <div className="top">
            <div className="kc num">{int(nutrition.kcal)} <small>kcal</small></div>
            <div className={`rem${over ? ' over' : ''}`}>
              <small>Rest heute</small>
              <span className="num">{int(remaining - nutrition.kcal)} kcal</span>
            </div>
          </div>
          <div className="track">
            <i style={{ width: `${(kcalP / kcalSum) * 100}%`, background: 'var(--lime)' }} />
            <i style={{ width: `${(kcalC / kcalSum) * 100}%`, background: 'var(--c)' }} />
            <i style={{ width: `${(kcalF / kcalSum) * 100}%`, background: 'var(--d)' }} />
          </div>
          <div className="legend">
            <span><i className="dot" style={{ background: 'var(--lime)' }} />Eiweiß {int(nutrition.proteinG)} g</span>
            <span><i className="dot" style={{ background: 'var(--c)' }} />KH {int(nutrition.carbG)} g</span>
            <span><i className="dot" style={{ background: 'var(--d)' }} />Fett {int(nutrition.fatG)} g</span>
          </div>
        </div>

        {/* Zutaten */}
        {items.map((it, i) => {
          const p = productMap.get(it.productId)
          if (!p) return null
          const unit = findUnit(p, it.unitLabel)
          const per = kcalPerUnit(p, unit)
          return (
            <div key={i} className="ing">
              <NutriGrade grade={p.grade} />
              <div className="n">
                <div className="t">
                  <b className="num">{fmtQty(it.qty)}</b> {unitPlural(unit.label, it.qty)} {p.name}
                </div>
                <div className="d num">
                  {int(per * it.qty)} kcal
                  {p.units.length > 1 && (
                    <select
                      value={it.unitLabel}
                      onChange={(e) => setItemUnit(i, e.target.value)}
                      style={{ marginLeft: 8, background: 'var(--surf2)', color: 'var(--txt2)', border: '1px solid var(--bd)', borderRadius: 6, fontSize: 11 }}
                    >
                      {p.units.map((u) => <option key={u.label} value={u.label}>in {u.label}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <Stepper value={it.qty} unitLabel={unitPlural(unit.label, it.qty)} onChange={(q) => setQty(i, q)} />
            </div>
          )
        })}

        <button className="addmeal" style={{ marginTop: 14, color: 'var(--lime)', borderColor: 'var(--bds)' }} onClick={() => setPickerOpen(true)}>
          ＋ Zutat aus dem Vorrat
        </button>

        {existing && (
          <button className="btn-ghost btn-danger" style={{ width: '100%', marginTop: 18 }} onClick={handleDelete}>
            Mahlzeit löschen
          </button>
        )}
      </div>

      <div className="footer">
        <button className="cta" disabled={!valid} onClick={handleSave}>
          {addToDate ? 'Speichern & einplanen' : 'Mahlzeit speichern'}
        </button>
      </div>

      {pickerOpen && (
        <ProductPicker products={products} onPick={addProduct} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  )
}

function ProductPicker({ products, onPick, onClose }) {
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const list = products
    .filter((p) => !needle || p.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name))

  return (
    <Sheet title="Zutat wählen" subtitle="aus deinem Vorrat" onClose={onClose}>
      <div className="search" style={{ marginTop: 0 }}>
        <span>⌕</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Produkt suchen…" autoFocus />
      </div>
      {list.length === 0 && <div className="note">Kein Produkt gefunden. Lege es zuerst im Vorrat an.</div>}
      {list.map((p) => {
        const unit = defaultUnit(p)
        return (
          <button key={p.id} className="prow" onClick={() => onPick(p)}>
            <NutriGrade grade={p.grade} />
            <div className="pname">
              <div className="t">{p.name}</div>
              <div className="m">{unit.label} ≈ {int(unit.grams)} {p.baseUnit}</div>
            </div>
            <div className="kcal num">{int(kcalPerUnit(p, unit))}<small>/ {unit.label}</small></div>
          </button>
        )
      })}
    </Sheet>
  )
}
