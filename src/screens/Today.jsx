import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useBudget, useDayStats, itemsForEntry } from '../store/derived.js'
import { nutritionForItems } from '../utils/nutrition.js'
import { suggestMeals } from '../utils/suggest.js'
import { GOALS } from '../utils/energy.js'
import { SLOTS } from '../data/slots.js'
import { todayISO } from '../utils/id.js'
import { int, prettyDate } from '../utils/format.js'
import Sheet from '../components/Sheet.jsx'

// Screen 3: Tagesbudget & geplante Mahlzeiten.
export default function Today({ onOpenProfile, onPlanNew, onPlanDraft }) {
  const { profile, meals, products, productMap, addEntry, updateEntry, removeEntry } = useApp()
  const date = todayISO()
  const budget = useBudget()
  const { day, total, bySlot, mealMap } = useDayStats(date)
  const [pickSlot, setPickSlot] = useState(null)

  const remaining = budget.kcal - total.kcal
  const over = remaining < 0
  const pct = Math.min(100, Math.max(0, (total.kcal / budget.kcal) * 100))
  const ringColor = over ? 'var(--neg)' : 'var(--lime)'
  const goalLabel = GOALS[profile?.goal]?.label

  const macroRows = [
    { key: 'proteinG', label: 'EIWEISS', color: 'var(--lime)', target: budget.macros.proteinG },
    { key: 'carbG', label: 'KOHLENHYDR.', color: 'var(--c)', target: budget.macros.carbG },
    { key: 'fatG', label: 'FETT', color: 'var(--d)', target: budget.macros.fatG },
  ]

  return (
    <>
      <div className="head">
        <div>
          <h2>Heute</h2>
          <div className="sub">{prettyDate(date)}{goalLabel ? ` · Ziel: ${goalLabel}` : ''}</div>
        </div>
        <button className="iconbtn" onClick={onOpenProfile} aria-label="Profil">☰</button>
      </div>

      <div className="body">
        <div className="ringwrap">
          <div className="ring" style={{ background: `conic-gradient(${ringColor} 0 ${pct}%, var(--surf3) ${pct}% 100%)` }}>
            <div className="inner">
              <div className="big num">{int(Math.abs(remaining))}<small> kcal</small></div>
              <div className={`lab${over ? ' over' : ''}`}>
                {over ? 'über ' : 'übrig von '}<b className="num">{int(budget.kcal)}</b>
              </div>
            </div>
          </div>
        </div>

        <div className="macros">
          {macroRows.map((m) => {
            const val = total[m.key]
            const w = Math.min(100, m.target ? (val / m.target) * 100 : 0)
            return (
              <div className="macro" key={m.key}>
                <div className="v num">{int(val)}<small>/{int(m.target)} g</small></div>
                <div className="k">{m.label}</div>
                <div className="bar"><i style={{ width: `${w}%`, background: m.color }} /></div>
              </div>
            )
          })}
        </div>

        {SLOTS.map((s) => {
          const entries = day.entries.filter((e) => e.slot === s.key)
          if (entries.length === 0 && s.key === 'snack') return null // Snack nur zeigen, wenn genutzt
          return (
            <div className="slot" key={s.key}>
              <div className="sh">
                <b>{s.label}</b>
                {entries.length > 0
                  ? <span className="num">{int(bySlot[s.key] || 0)} kcal</span>
                  : <span style={{ color: 'var(--lbl)' }}>offen</span>}
              </div>

              {entries.map((entry) => {
                const items = itemsForEntry(entry, mealMap)
                const meal = mealMap.get(entry.mealId)
                const n = nutritionForItems(items, productMap)
                const names = items.map((it) => productMap.get(it.productId)?.name).filter(Boolean).join(' · ')
                return (
                  <div key={entry.id} className={`mealcard${entry.done ? ' done' : ''}`}>
                    <button className="em" style={{ background: 'none', border: 'none' }}
                      onClick={() => updateEntry(date, entry.id, { done: !entry.done })} title="als gegessen markieren">
                      {entry.done ? '✓' : (meal?.emoji || '🍽')}
                    </button>
                    <div className="mc" onClick={() => updateEntry(date, entry.id, { done: !entry.done })}>
                      <div className="t">{meal?.name || 'Mahlzeit'}</div>
                      <div className="d">{names}</div>
                    </div>
                    <div className="kc num">{int(n.kcal)}</div>
                    <button className="iconbtn" style={{ width: 30, height: 30, fontSize: 15 }}
                      onClick={() => removeEntry(date, entry.id)} aria-label="entfernen">×</button>
                  </div>
                )
              })}

              <button className="addmeal" onClick={() => setPickSlot(s.key)}>
                ＋ Mahlzeit planen{entries.length === 0 ? ` — ca. ${int(Math.max(0, remaining))} kcal frei` : ''}
              </button>
            </div>
          )
        })}

        {!day.entries.some((e) => e.slot === 'snack') && (
          <div className="slot">
            <div className="sh"><b>Snack</b><span style={{ color: 'var(--lbl)' }}>offen</span></div>
            <button className="addmeal" onClick={() => setPickSlot('snack')}>＋ Snack planen</button>
          </div>
        )}
      </div>

      {pickSlot && (
        <MealPicker
          slot={pickSlot}
          meals={meals.filter((m) => m.isTemplate)}
          products={products}
          productMap={productMap}
          budgetKcal={budget.kcal}
          onPick={async (mealId) => { await addEntry(date, { mealId, slot: pickSlot }); setPickSlot(null) }}
          onSuggest={(draft) => { onPlanDraft(draft); setPickSlot(null) }}
          onNew={() => { onPlanNew(pickSlot); setPickSlot(null) }}
          onClose={() => setPickSlot(null)}
        />
      )}
    </>
  )
}

function MealPicker({ slot, meals, products, productMap, budgetKcal, onPick, onSuggest, onNew, onClose }) {
  const label = SLOTS.find((s) => s.key === slot)?.label || slot
  const [nonce, setNonce] = useState(0)
  const suggestions = suggestMeals(products, slot, budgetKcal, { count: 3, nonce })
  // passende Vorlagen zuerst
  const sorted = [...meals].sort((a, b) => (b.slot === slot) - (a.slot === slot) || a.name.localeCompare(b.name))

  return (
    <Sheet title={`${label} planen`} subtitle="Vorschlag wählen, Vorlage nehmen oder neu bauen" onClose={onClose}>
      {suggestions.length > 0 && (
        <>
          <div className="sh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12, color: 'var(--txt2)', margin: '2px 0 8px' }}>
            <span>✨ Vorschläge aus deinem Vorrat</span>
            <button className="linkbtn" onClick={() => setNonce((n) => n + 1)}>↻ neue</button>
          </div>
          {suggestions.map((sug, i) => {
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
          })}
        </>
      )}

      {sorted.length > 0 && (
        <>
          <div className="section-title">Meine Vorlagen</div>
          {sorted.map((m) => {
            const n = nutritionForItems(m.items, productMap)
            const names = m.items.map((it) => productMap.get(it.productId)?.name).filter(Boolean).join(' · ')
            return (
              <button key={m.id} className="mealcard" onClick={() => onPick(m.id)}>
                <div className="em">{m.emoji || '🍽'}</div>
                <div className="mc">
                  <div className="t">{m.name}</div>
                  <div className="d">{names}</div>
                </div>
                <div className="kc num">{int(n.kcal)}</div>
              </button>
            )
          })}
        </>
      )}

      <button className="cta" style={{ marginTop: 14 }} onClick={onNew}>＋ Selbst zusammenstellen</button>
    </Sheet>
  )
}
