// Rezept-Vorschläge aus dem eigenen Vorrat — fertig dosiert aufs Tagesbudget.
// Heuristik: Produkte nach Rolle einteilen, zu typischen Mahlzeiten-Archetypen
// kombinieren und die Hauptzutat so skalieren, dass die Slot-kcal passen.
import { defaultUnit, kcalPerUnit, nutritionForItems } from './nutrition.js'

const GRADE_SCORE = { A: 1, B: 0.8, C: 0.6, D: 0.4, E: 0.2 }

// unsere Kategorien → Rolle in einer Mahlzeit
const ROLE = {
  bread: 'base', grain: 'base',
  dairy: 'protein', meat: 'protein', fish: 'protein',
  spread: 'spread', veg: 'veg', fruit: 'fruit', drink: 'drink', snack: 'snack', other: 'other',
}

// Anteil des Tagesbudgets je Mahlzeitenfenster
const SLOT_SHARE = { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.12 }

// Vernünftige Obergrenzen je Rolle (in Alltagseinheiten)
const MAX_QTY = { base: 4, protein: 3, spread: 3, veg: 2, fruit: 2, snack: 2, drink: 2, other: 2 }

// Mahlzeiten-Baupläne. scalable = Zutat, über die wir die kcal justieren.
const ARCHETYPES = [
  { key: 'brotzeit', emoji: '🥪', slots: ['breakfast', 'dinner'],
    parts: [{ role: 'base', qty: 2, scalable: true }, { role: 'spread', qty: 2 }, { role: 'protein', qty: 1, optional: true }, { role: 'veg', qty: 0.5, optional: true }] },
  { key: 'bowl', emoji: '🥣', slots: ['breakfast', 'snack'],
    parts: [{ role: 'protein', qty: 1, scalable: true, prefer: 'dairy' }, { role: 'fruit', qty: 1 }] },
  { key: 'teller', emoji: '🍽', slots: ['lunch', 'dinner'],
    parts: [{ role: 'protein', qty: 1, scalable: true }, { role: 'veg', qty: 1 }, { role: 'base', qty: 1, optional: true }] },
  { key: 'salat', emoji: '🥗', slots: ['lunch', 'dinner'],
    parts: [{ role: 'veg', qty: 2 }, { role: 'protein', qty: 1, scalable: true }] },
  { key: 'snackfruit', emoji: '🍎', slots: ['snack'],
    parts: [{ role: 'fruit', qty: 1, scalable: true }] },
  { key: 'snackdairy', emoji: '🥛', slots: ['snack'],
    parts: [{ role: 'protein', qty: 1, scalable: true, prefer: 'dairy' }] },
]

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

// Kandidaten einer Rolle, nach Eignung sortiert (Nutri-Score, Eiweißdichte, Favorit).
function candidates(products, role, prefer) {
  return products
    .filter((p) => ROLE[p.category] === role)
    .map((p) => {
      let s = (GRADE_SCORE[p.grade] ?? 0.5)
      if (role === 'protein') s += Math.min(0.5, (p.nutriments?.proteinG || 0) / 40)
      if (prefer && p.category === prefer) s += 0.3
      if (p.favorite) s += 0.15
      return { p, s }
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p)
}

// kcal über die skalierbare Zutat ans Ziel annähern (halbe Einheiten).
function scaleToTarget(items, productMap, scalableIdx, target) {
  if (scalableIdx < 0) return
  const it = items[scalableIdx]
  const p = productMap.get(it.productId)
  const per = kcalPerUnit(p, defaultUnit(p))
  if (per <= 0) return
  let rest = 0
  items.forEach((other, i) => {
    if (i === scalableIdx) return
    const op = productMap.get(other.productId)
    rest += kcalPerUnit(op, defaultUnit(op)) * other.qty
  })
  const role = ROLE[p.category]
  const qty = clamp(Math.round(((target - rest) / per) * 2) / 2, 0.5, MAX_QTY[role] || 3)
  it.qty = qty
}

function nameFor(items, productMap) {
  const names = items.map((it) => productMap.get(it.productId)?.name).filter(Boolean)
  if (names.length === 0) return 'Vorschlag'
  if (names.length === 1) return names[0]
  return `${names[0]} mit ${names[1]}`
}

// Liefert bis zu `count` Vorschläge für einen Slot.
// nonce verschiebt die Produktauswahl → „neue Vorschläge".
export function suggestMeals(products, slot, budgetKcal, { count = 4, nonce = 0 } = {}) {
  const productMap = new Map(products.map((p) => [p.id, p]))
  const target = Math.round((SLOT_SHARE[slot] ?? 0.25) * (budgetKcal || 2000))
  const out = []
  const seen = new Set()

  const archetypes = ARCHETYPES.filter((a) => a.slots.includes(slot))
  // mehrere Durchläufe mit Versatz → Abwechslung
  for (let pass = 0; pass < 3 && out.length < count * 2; pass++) {
    for (const arch of archetypes) {
      const items = []
      let scalableIdx = -1
      let ok = true

      for (const part of arch.parts) {
        const cands = candidates(products, part.role, part.prefer)
        if (cands.length === 0) {
          if (part.optional) continue
          ok = false
          break
        }
        const pick = cands[(pass + nonce) % cands.length]
        if (part.scalable) scalableIdx = items.length
        items.push({ productId: pick.id, qty: part.qty, unitLabel: defaultUnit(pick).label })
      }
      if (!ok || items.length === 0) continue

      scaleToTarget(items, productMap, scalableIdx, target)

      const key = items.map((i) => i.productId).sort().join('|')
      if (seen.has(key)) continue
      seen.add(key)

      const nutrition = nutritionForItems(items, productMap)
      const closeness = 1 - clamp(Math.abs(nutrition.kcal - target) / target, 0, 1)
      const gradeAvg = items.reduce((s, i) => s + (GRADE_SCORE[productMap.get(i.productId)?.grade] ?? 0.5), 0) / items.length
      const proteinScore = clamp(nutrition.proteinG / (target * 0.3 / 4), 0, 1)
      const score = closeness * 0.5 + gradeAvg * 0.3 + proteinScore * 0.2

      out.push({
        name: nameFor(items, productMap),
        slot, emoji: arch.emoji, items, nutrition, score, target,
      })
    }
  }

  return out.sort((a, b) => b.score - a.score).slice(0, count)
}
