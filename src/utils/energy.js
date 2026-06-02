// Tagesbudget zentral berechnet (analog utils/saldo.js in SupaDupa Money).
// Grundumsatz: Mifflin-St Jeor → × PAL (Aktivität) − Ziel-Defizit.

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

// Liefert das Tagesbudget + Herleitung. weightKg = aktuellstes Gewicht.
export function computeBudget(profile, weightKg) {
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
  const delta = GOALS[profile.goal]?.deltaKcal ?? 0
  const tdee = bmr * pal
  return { kcal: Math.round(tdee + delta), mode: 'auto', bmr: Math.round(bmr), tdee: Math.round(tdee) }
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
