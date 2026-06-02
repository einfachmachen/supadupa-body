// Tagesbudget zentral berechnet (analog utils/saldo.js in SupaDupa Money).
// Grundumsatz: Mifflin-St Jeor → × PAL (Aktivität) − Defizit.
//
// Philosophie: kein Crash, kein Hungerstoffwechsel. Das Defizit ergibt sich
// aus Zielgewicht + Zeitraum, wird aber GEDECKELT (gesundes Tempo) und das
// Budget fällt NIE unter den Grundumsatz. „Weiter essen wie bisher — nur
// von Anfang an richtig dosiert."
import { todayISO } from './id.js'

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'sitzend' },
  { value: 1.375, label: 'leicht aktiv' },
  { value: 1.55, label: 'aktiv' },
  { value: 1.725, label: 'sehr aktiv' },
]

export const GOALS = {
  lose: { label: 'abnehmen', deltaKcal: -500 },
  hold: { label: 'halten', deltaKcal: 0 },
  gain: { label: 'aufbauen', deltaKcal: 300 },
}

// Energiegehalt von ~1 kg Körpergewicht (überwiegend Fett).
export const KCAL_PER_KG = 7000
// Schutz vor zu strikter Dosierung / Hungerstoffwechsel:
export const MAX_DAILY_DEFICIT = 500   // höchstens ~0,5 kg/Woche abnehmen
export const MAX_DAILY_SURPLUS = 350   // moderat aufbauen
export const SAFE_RATE_KG_WEEK = 0.5

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Grundumsatz (kcal/Tag). 'd' = Mittel aus m/w.
export function bmrMifflin({ sex, weightKg, heightCm, age }) {
  if (!weightKg || !heightCm || !age) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  if (sex === 'm') return base + 5
  if (sex === 'w') return base - 161
  return base - 78 // divers: Mittelwert (+5 / −161)
}

export function ageFrom(birthYear, now = new Date()) {
  if (!birthYear) return null
  return now.getFullYear() - birthYear
}

export function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + 'T00:00:00')
  const b = new Date(toISO + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}

export function addDaysISO(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + Math.ceil(days))
  return todayISO(d)
}

// Liefert das Tagesbudget + Herleitung. weightKg = aktuellstes Gewicht.
export function computeBudget(profile, weightKg, today = todayISO()) {
  if (!profile) return { kcal: 2000, mode: 'fallback' }

  if (profile.kcalMode === 'manual' && profile.targetKcal) {
    return { kcal: Math.round(profile.targetKcal), mode: 'manual' }
  }

  const bmr = bmrMifflin({
    sex: profile.sex,
    weightKg,
    heightCm: profile.heightCm,
    age: ageFrom(profile.birthYear),
  })

  if (!bmr) {
    // Nicht genug Daten → manueller Wert oder Standard.
    return { kcal: Math.round(profile.targetKcal || 2000), mode: profile.targetKcal ? 'manual' : 'fallback' }
  }

  const pal = profile.activityLevel || 1.375
  const tdee = bmr * pal

  // 1) Defizit/Überschuss bestimmen — bevorzugt aus Zielgewicht + Zeitraum.
  let dailyDelta = 0          // <0 = essen unter Bedarf (abnehmen), >0 = darüber
  let wish = null            // gewünschter Tageswert vor Deckelung
  let capped = false

  const hasTarget = profile.targetWeightKg && profile.targetDate && weightKg
  if (hasTarget) {
    const kgToLose = weightKg - profile.targetWeightKg // >0 = abnehmen
    const days = Math.max(1, daysBetween(today, profile.targetDate))
    wish = -(kgToLose * KCAL_PER_KG) / days // negativ beim Abnehmen
    if (kgToLose > 0) {
      dailyDelta = -clamp(-wish, 0, MAX_DAILY_DEFICIT)
      capped = -wish > MAX_DAILY_DEFICIT
    } else if (kgToLose < 0) {
      dailyDelta = clamp(wish, 0, MAX_DAILY_SURPLUS)
      capped = wish > MAX_DAILY_SURPLUS
    }
  } else {
    dailyDelta = GOALS[profile.goal]?.deltaKcal ?? 0
  }

  // 2) Budget bilden — niemals unter den Grundumsatz (kein Hungerstoffwechsel).
  let kcal = tdee + dailyDelta
  let belowBmr = false
  if (kcal < bmr) {
    kcal = bmr
    belowBmr = true
    capped = true
  }

  // 3) Tatsächliches Tempo & realistisches Zieldatum aus dem echten Defizit.
  const effectiveDelta = kcal - tdee // negativ beim Abnehmen
  const ratePerWeek = Math.abs(effectiveDelta) * 7 / KCAL_PER_KG
  const direction = dailyDelta < -1 ? 'lose' : dailyDelta > 1 ? 'gain' : 'hold'

  let realisticDate = profile.targetDate || null
  if (hasTarget && Math.abs(effectiveDelta) > 1) {
    const kgToLose = Math.abs(weightKg - profile.targetWeightKg)
    const daysNeeded = (kgToLose * KCAL_PER_KG) / Math.abs(effectiveDelta)
    realisticDate = addDaysISO(today, daysNeeded)
  }

  return {
    kcal: Math.round(kcal),
    mode: 'auto',
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    deltaKcal: Math.round(effectiveDelta),
    ratePerWeek,
    direction,
    capped,
    belowBmr,
    realisticDate,
  }
}

// Makro-Ziele: explizit gesetzt, sonst aus kcal abgeleitet
// (Eiweiß 25 %, KH 45 %, Fett 30 % → /4, /4, /9 kcal pro Gramm).
export function macroTargets(profile, kcal) {
  const m = profile?.macroTarget
  if (m && (m.proteinG || m.carbG || m.fatG)) return m
  return {
    proteinG: Math.round((kcal * 0.25) / 4),
    carbG: Math.round((kcal * 0.45) / 4),
    fatG: Math.round((kcal * 0.3) / 9),
  }
}
