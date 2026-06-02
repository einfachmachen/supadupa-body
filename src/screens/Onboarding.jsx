import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { ACTIVITY_LEVELS, computeBudget } from '../utils/energy.js'
import { todayISO } from '../utils/id.js'
import { int, longDate } from '../utils/format.js'

// Einfache Erst-Abfrage: Grundumsatz + Ziel(gewicht bis wann).
// Leitidee: weiter essen wie bisher, nur richtig dosiert — keine Diät,
// kein Hungerstoffwechsel.
export default function Onboarding() {
  const { saveProfile, addWeight, latestWeight } = useApp()
  const [step, setStep] = useState(0)
  const [f, setF] = useState(() => ({
    sex: 'w',
    birthYear: '',
    heightCm: '',
    weight: latestWeight || '',
    activityLevel: 1.375,
    targetWeight: '',
    targetDate: defaultTargetDate(),
  }))
  const set = (patch) => setF((s) => ({ ...s, ...patch }))
  const num = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')))

  // Live-Vorschau des Budgets aus den bisherigen Eingaben.
  const preview = useMemo(() => {
    const profile = {
      sex: f.sex,
      birthYear: num(f.birthYear),
      heightCm: num(f.heightCm),
      activityLevel: Number(f.activityLevel),
      kcalMode: 'auto',
      targetWeightKg: num(f.targetWeight),
      targetDate: f.targetDate,
    }
    return computeBudget(profile, num(f.weight))
  }, [f])

  const step1ok = f.sex && num(f.birthYear) && num(f.heightCm) && num(f.weight)
  const step3ok = num(f.targetWeight) && f.targetDate

  async function finish() {
    const w = num(f.weight)
    const tw = num(f.targetWeight)
    const goal = tw < w ? 'lose' : tw > w ? 'gain' : 'hold'
    await saveProfile({
      sex: f.sex,
      birthYear: num(f.birthYear),
      heightCm: num(f.heightCm),
      activityLevel: Number(f.activityLevel),
      goal,
      kcalMode: 'auto',
      targetWeightKg: tw,
      targetDate: f.targetDate,
      startWeightKg: w,
      onboarded: true,
    })
    await addWeight(w)
  }

  return (
    <div className="editor">
      <div className="head">
        {step > 0
          ? <button className="iconbtn" onClick={() => setStep(step - 1)} aria-label="zurück">‹</button>
          : <div style={{ width: 36 }} />}
        <div className="dots">
          {[0, 1, 2, 3].map((i) => <span key={i} className={`dot-step${i === step ? ' on' : ''}`} />)}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="body">
        {step === 0 && (
          <div style={{ paddingTop: 18 }}>
            <h2 style={{ fontSize: 26 }}>Hallo! 👋</h2>
            <p style={{ color: 'var(--txt2)', fontSize: 15, lineHeight: 1.6, marginTop: 14 }}>
              SupaDupa <b style={{ color: 'var(--lime)' }}>Body</b> ist <b>keine Diät</b>.
              Du isst weiter wie bisher — nur von Anfang an <b>richtig dosiert</b>.
            </p>
            <p style={{ color: 'var(--txt2)', fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
              Kein „Friss die Hälfte", kein Hungern. Wir wählen ein <b>gesundes Tempo</b>,
              damit dein Körper nicht auf Sparflamme schaltet und alles einlagert.
            </p>
            <p style={{ color: 'var(--txt2)', fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
              Drei kurze Fragen, dann kennt die App dein persönliches Tagesbudget.
            </p>
          </div>
        )}

        {step === 1 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Über dich</div>
            <p className="note" style={{ textAlign: 'left', marginTop: 0, marginBottom: 14 }}>
              Für deinen Grundumsatz — die Energie, die dein Körper in Ruhe braucht.
            </p>
            <div className="field">
              <label>Geschlecht</label>
              <div className="seg">
                {[['w', 'weiblich'], ['m', 'männlich'], ['d', 'divers']].map(([v, l]) => (
                  <button key={v} className={f.sex === v ? 'on' : ''} onClick={() => set({ sex: v })}>{l}</button>
                ))}
              </div>
            </div>
            <div className="row2">
              <div className="field">
                <label>Geburtsjahr</label>
                <input type="number" inputMode="numeric" value={f.birthYear} onChange={(e) => set({ birthYear: e.target.value })} placeholder="1990" />
              </div>
              <div className="field">
                <label>Größe (cm)</label>
                <input type="number" inputMode="numeric" value={f.heightCm} onChange={(e) => set({ heightCm: e.target.value })} placeholder="172" />
              </div>
            </div>
            <div className="field">
              <label>Aktuelles Gewicht (kg)</label>
              <input type="number" inputMode="decimal" value={f.weight} onChange={(e) => set({ weight: e.target.value })} placeholder="68" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Dein Alltag</div>
            <p className="note" style={{ textAlign: 'left', marginTop: 0, marginBottom: 14 }}>
              Wie viel bewegst du dich an einem normalen Tag?
            </p>
            <div className="field">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.value}
                  className="seg-row"
                  data-on={Number(f.activityLevel) === a.value}
                  onClick={() => set({ activityLevel: a.value })}
                >
                  <span style={{ textTransform: 'capitalize' }}>{a.label}</span>
                  <small>{ACTIVITY_HINT[a.value]}</small>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="section-title" style={{ marginTop: 8 }}>Dein Ziel</div>
            <p className="note" style={{ textAlign: 'left', marginTop: 0, marginBottom: 14 }}>
              Wohin möchtest du — und bis wann? Kein Stress: zu strikte Tempos
              bremsen wir automatisch auf ein gesundes Maß.
            </p>
            <div className="row2">
              <div className="field">
                <label>Zielgewicht (kg)</label>
                <input type="number" inputMode="decimal" value={f.targetWeight} onChange={(e) => set({ targetWeight: e.target.value })}
                  placeholder={f.weight ? String(f.weight) : '63'} />
              </div>
              <div className="field">
                <label>bis wann</label>
                <input type="date" value={f.targetDate} min={todayISO()} onChange={(e) => set({ targetDate: e.target.value })} />
              </div>
            </div>

            {step3ok && <BudgetPreview preview={preview} f={f} num={num} />}
          </>
        )}
      </div>

      <div className="footer">
        {step < 3 ? (
          <button className="cta" disabled={step === 1 && !step1ok} onClick={() => setStep(step + 1)}>
            {step === 0 ? "Los geht's" : 'Weiter'}
          </button>
        ) : (
          <button className="cta" disabled={!step3ok} onClick={finish}>Passt — App starten</button>
        )}
      </div>
    </div>
  )
}

function BudgetPreview({ preview, f, num }) {
  const w = num(f.weight)
  const tw = num(f.targetWeight)
  const rate = preview.ratePerWeek ? preview.ratePerWeek.toLocaleString('de-DE', { maximumFractionDigits: 1 }) : '0'
  const dir = preview.direction

  return (
    <div className="livebar" style={{ marginTop: 6 }}>
      <div className="top">
        <div className="kc num">{int(preview.kcal)} <small>kcal/Tag</small></div>
        <div className="rem">
          <small>{dir === 'gain' ? 'Aufbauen' : dir === 'lose' ? 'Abnehmen' : 'Halten'}</small>
          <span className="num">~{rate} kg/Woche</span>
        </div>
      </div>

      <p className="note" style={{ textAlign: 'left', marginTop: 12, marginBottom: 0 }}>
        {dir === 'hold'
          ? 'Du hältst dein Gewicht.'
          : `So isst du täglich rund ${int(preview.kcal)} kcal — ${dir === 'lose' ? 'leicht unter' : 'leicht über'} deinem Bedarf von ${int(preview.tdee)} kcal.`}
        {' '}Immer über deinem Grundumsatz ({int(preview.bmr)} kcal) — also keine Sparflamme.
      </p>

      {preview.capped && tw < w && (
        <p className="note" style={{ textAlign: 'left', marginTop: 8, marginBottom: 0, color: 'var(--gold)' }}>
          Dein Wunschtermin wäre ziemlich sportlich. Im gesunden Tempo erreichst du
          dein Ziel realistisch am <b>{longDate(preview.realisticDate)}</b>.
        </p>
      )}
    </div>
  )
}

const ACTIVITY_HINT = {
  1.2: 'überwiegend sitzend, wenig Bewegung',
  1.375: 'Bürojob + ab und zu Sport',
  1.55: 'viel auf den Beinen / 3–5× Sport',
  1.725: 'körperlich aktiver Job / täglich Sport',
}

function defaultTargetDate() {
  const d = new Date()
  d.setDate(d.getDate() + 84) // 12 Wochen
  return todayISO(d)
}
