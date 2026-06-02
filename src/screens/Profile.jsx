import { useMemo, useRef, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { ACTIVITY_LEVELS, computeBudget } from '../utils/energy.js'
import { todayISO } from '../utils/id.js'
import { int, longDate } from '../utils/format.js'

// Profil & Einstellungen: Grundumsatz-Daten, Ziel(gewicht bis wann), Backup.
export default function Profile({ onClose }) {
  const { profile, latestWeight, saveProfile, addWeight, exportJSON, importJSON } = useApp()
  const fileRef = useRef(null)

  const [form, setForm] = useState(() => ({
    sex: profile?.sex || 'w',
    birthYear: profile?.birthYear || '',
    heightCm: profile?.heightCm || '',
    activityLevel: profile?.activityLevel || 1.375,
    kcalMode: profile?.kcalMode || 'auto',
    targetKcal: profile?.targetKcal || 2000,
    targetWeight: profile?.targetWeightKg || '',
    targetDate: profile?.targetDate || '',
  }))
  const [weight, setWeight] = useState(latestWeight || '')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')))

  // Live-Vorschau aus den aktuellen Eingaben.
  const preview = useMemo(() => computeBudget({
    sex: form.sex,
    birthYear: num(form.birthYear),
    heightCm: num(form.heightCm),
    activityLevel: Number(form.activityLevel),
    kcalMode: form.kcalMode,
    targetKcal: num(form.targetKcal),
    targetWeightKg: num(form.targetWeight),
    targetDate: form.targetDate || null,
  }, num(weight)), [form, weight])

  async function handleSave() {
    const w = num(weight)
    const tw = num(form.targetWeight)
    const goal = tw && w ? (tw < w ? 'lose' : tw > w ? 'gain' : 'hold') : (profile?.goal || 'hold')
    await saveProfile({
      sex: form.sex,
      birthYear: num(form.birthYear),
      heightCm: num(form.heightCm),
      activityLevel: Number(form.activityLevel),
      goal,
      kcalMode: form.kcalMode,
      targetKcal: num(form.targetKcal),
      targetWeightKg: tw,
      targetDate: form.targetDate || null,
      onboarded: true,
    })
    if (w && w !== latestWeight) await addWeight(w)
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

  const rate = preview.ratePerWeek ? preview.ratePerWeek.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0'

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

        <div className="section-title">Dein Ziel</div>
        <div className="row2">
          <div className="field">
            <label>Zielgewicht (kg)</label>
            <input type="number" inputMode="decimal" value={form.targetWeight} onChange={(e) => set({ targetWeight: e.target.value })}
              placeholder={weight ? String(weight) : '63'} />
          </div>
          <div className="field">
            <label>bis wann</label>
            <input type="date" value={form.targetDate || ''} min={todayISO()} onChange={(e) => set({ targetDate: e.target.value })} />
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
          <div className="livebar">
            <div className="top">
              <div className="kc num">{int(preview.kcal)} <small>kcal/Tag</small></div>
              {preview.direction && preview.direction !== 'hold' && (
                <div className="rem">
                  <small>{preview.direction === 'gain' ? 'Aufbauen' : 'Abnehmen'}</small>
                  <span className="num">~{rate} kg/Woche</span>
                </div>
              )}
            </div>
            <p className="note" style={{ textAlign: 'left', marginTop: 12, marginBottom: 0 }}>
              {preview.mode === 'fallback'
                ? 'Bitte Gewicht, Größe & Geburtsjahr ergänzen, dann rechnen wir dein Budget aus.'
                : <>Aus Grundumsatz ({int(preview.bmr)} kcal) × Aktivität − gesundem Defizit. Immer über deinem Grundumsatz — keine Sparflamme.</>}
            </p>
            {preview.capped && preview.realisticDate && preview.direction !== 'hold' && (
              <p className="note" style={{ textAlign: 'left', marginTop: 8, marginBottom: 0, color: 'var(--gold)' }}>
                Gesundes Tempo statt Crash: Ziel realistisch am <b>{longDate(preview.realisticDate)}</b>.
              </p>
            )}
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
