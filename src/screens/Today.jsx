import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useBudget, useDayStats, itemsForEntry } from '../store/derived.js'
import { nutritionForItems } from '../utils/nutrition.js'
import { GOALS } from '../utils/energy.js'
import { SLOTS } from '../data/slots.js'
import { todayISO } from '../utils/id.js'
import { int, prettyDate } from '../utils/format.js'
import Sheet from '../components/Sheet.jsx'

// Screen 3: Tagesbudget & geplante Mahlzeiten.
export default function Today({ onOpenProfile, onPlanNew }) {
  const { profile, meals, productMap, addEntry, updateEntry, removeEntry } = useApp()
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
          productMap={productMap}
          onPick={async (mealId) => { await addEntry(date, { mealId, slot: pickSlot }); setPickSlot(null) }}
          onNew={() => { onPlanNew(pickSlot); setPickSlot(null) }}
          onClose={() => setPickSlot(null)}
        />
      )}
    </>
  )
}

function MealPicker({ slot, meals, productMap, onPick, onNew, onClose }) {
  const label = SLOTS.find((s) => s.key === slot)?.label || slot
  // passende Vorlagen zuerst
  const sorted = [...meals].sort((a, b) => (b.slot === slot) - (a.slot === slot) || a.name.localeCompare(b.name))

  return (
    <Sheet title={`${label} planen`} subtitle="Vorlage wählen oder neu bauen" onClose={onClose}>
      <button className="cta" style={{ marginBottom: 14 }} onClick={onNew}>＋ Neue Mahlzeit bauen</button>

      {sorted.length === 0 ? (
        <div className="note">Noch keine Vorlagen — bau dir oben deine erste Mahlzeit.</div>
      ) : (
        sorted.map((m) => {
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
        })
      )}
    </Sheet>
  )
}
