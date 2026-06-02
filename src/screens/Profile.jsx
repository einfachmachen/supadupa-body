import { useRef, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { useBudget } from '../store/derived.js'
import { ACTIVITY_LEVELS, GOALS } from '../utils/energy.js'
import { int } from '../utils/format.js'

// Profil & Einstellungen: Tagesbudget, Ziel, Gewicht, Backup.
export default function Profile({ onClose }) {
  const { profile, latestWeight, saveProfile, addWeight, exportJSON, importJSON } = useApp()
  const budget = useBudget()
  const fileRef = useRef(null)

  const [form, setForm] = useState(() => ({
    sex: profile?.sex || 'w',
    birthYear: profile?.birthYear || '',
    heightCm: profile?.heightCm || '',
    activityLevel: profile?.activityLevel || 1.375,
    goal: profile?.goal || 'lose',
    kcalMode: profile?.kcalMode || 'auto',
    targetKcal: profile?.targetKcal || budget.kcal,
  }))
  const [weight, setWeight] = useState(latestWeight || '')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')))

  async function handleSave() {
    await saveProfile({
      sex: form.sex,
      birthYear: num(form.birthYear),
      heightCm: num(form.heightCm),
      activityLevel: Number(form.activityLevel),
      goal: form.goal,
      kcalMode: form.kcalMode,
      targetKcal: num(form.targetKcal),
    })
    if (weight && Number(weight) !== latestWeight) await addWeight(weight)
    onClose()
  }

  async function handleExport() {
    const json = await exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `supadupa-body-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (confirm('Import ersetzt alle aktuellen Daten. Fortfahren?')) {
      await importJSON(await file.text())
    }
  }

  return (
    <div className="editor">
      <div className="head">
        <button className="iconbtn" onClick={onClose} aria-label="zurück">‹</button>
        <h2 style={{ fontSize: 18 }}>Profil</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="body">
        <div className="field">
          <label>Geschlecht (für Grundumsatz)</label>
          <div className="seg">
            {[['w', 'weiblich'], ['m', 'männlich'], ['d', 'divers']].map(([v, l]) => (
              <button key={v} className={form.sex === v ? 'on' : ''} onClick={() => set({ sex: v })}>{l}</button>
            ))}
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <label>Geburtsjahr</label>
            <input type="number" inputMode="numeric" value={form.birthYear} onChange={(e) => set({ birthYear: e.target.value })} placeholder="1990" />
          </div>
          <div className="field">
            <label>Größe (cm)</label>
            <input type="number" inputMode="numeric" value={form.heightCm} onChange={(e) => set({ heightCm: e.target.value })} placeholder="172" />
          </div>
        </div>

        <div className="field">
          <label>Aktuelles Gewicht (kg)</label>
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" />
        </div>

        <div className="field">
          <label>Aktivität</label>
          <select value={form.activityLevel} onChange={(e) => set({ activityLevel: e.target.value })}>
            {ACTIVITY_LEVELS.map((a) => <option key={a.value} value={a.value}>{a.label} (×{a.value})</option>)}
          </select>
        </div>

        <div className="field">
          <label>Ziel</label>
          <div className="seg">
            {Object.entries(GOALS).map(([key, g]) => (
              <button key={key} className={form.goal === key ? 'on' : ''} onClick={() => set({ goal: key })}>{g.label}</button>
            ))}
          </div>
        </div>

        <div className="section-title">Tagesbudget</div>
        <div className="field">
          <div className="seg">
            <button className={form.kcalMode === 'auto' ? 'on' : ''} onClick={() => set({ kcalMode: 'auto' })}>automatisch</button>
            <button className={form.kcalMode === 'manual' ? 'on' : ''} onClick={() => set({ kcalMode: 'manual' })}>fest</button>
          </div>
        </div>
        {form.kcalMode === 'manual' ? (
          <div className="field">
            <label>kcal pro Tag</label>
            <input type="number" inputMode="numeric" value={form.targetKcal} onChange={(e) => set({ targetKcal: e.target.value })} />
          </div>
        ) : (
          <div className="note" style={{ textAlign: 'left' }}>
            Berechnet aus Grundumsatz (Mifflin-St Jeor) × Aktivität − Ziel-Defizit.
            {' '}Aktuell: <b className="num" style={{ color: 'var(--lime)' }}>{int(budget.kcal)} kcal</b>
            {budget.mode === 'fallback' && ' — bitte Gewicht, Größe & Geburtsjahr ergänzen.'}
          </div>
        )}

        <div className="section-title">Daten</div>
        <div className="btnrow">
          <button className="btn-ghost" onClick={handleExport}>Export (JSON)</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
        </div>
        <div className="note">Local-first: alle Daten bleiben auf diesem Gerät. Export für Backup & Gerätewechsel.</div>
      </div>

      <div className="footer">
        <button className="cta" onClick={handleSave}>Speichern</button>
      </div>
    </div>
  )
}
