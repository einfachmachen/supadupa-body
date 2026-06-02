import { useMemo } from 'react'
import { useApp } from './AppContext.jsx'
import { computeBudget, macroTargets } from '../utils/energy.js'
import { nutritionForItems, emptyNutrition } from '../utils/nutrition.js'

// Tagesbudget + Makro-Ziele aus dem Profil.
export function useBudget() {
  const { profile, latestWeight } = useApp()
  return useMemo(() => {
    const budget = computeBudget(profile, latestWeight)
    return { ...budget, macros: macroTargets(profile, budget.kcal) }
  }, [profile, latestWeight])
}

// Die Zutaten eines Log-Eintrags auflösen (Vorlage oder ad-hoc).
export function itemsForEntry(entry, mealMap) {
  if (entry.adHocItems?.length) return entry.adHocItems
  const meal = mealMap.get(entry.mealId)
  return meal?.items || []
}

// Summierte Nährwerte eines Tages + pro Slot.
export function useDayStats(date) {
  const { daylogs, meals, productMap } = useApp()
  const mealMap = useMemo(() => new Map(meals.map((m) => [m.id, m])), [meals])

  return useMemo(() => {
    const day = daylogs.find((d) => d.date === date) || { date, entries: [] }
    const total = emptyNutrition()
    const bySlot = {}
    for (const entry of day.entries) {
      const items = itemsForEntry(entry, mealMap)
      const n = nutritionForItems(items, productMap)
      for (const k of Object.keys(total)) total[k] += n[k]
      bySlot[entry.slot] = (bySlot[entry.slot] || 0) + n.kcal
    }
    return { day, total, bySlot, mealMap }
  }, [date, daylogs, productMap, mealMap])
}
