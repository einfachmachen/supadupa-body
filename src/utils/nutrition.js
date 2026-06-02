// Nährwerte werden NIE gespeichert, sondern immer aus
// (MealItem.qty × ServingUnit.grams / 100) × Product.nutriments berechnet.
// Eine einzige Quelle der Wahrheit (vgl. DATENMODELL.md → "Abgeleitete Werte").

const NUTRIENT_KEYS = ['kcal', 'proteinG', 'carbG', 'sugarG', 'fatG', 'satFatG', 'fiberG', 'saltG']

export function emptyNutrition() {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0]))
}

// Bevorzugte Anzeigeeinheit eines Produkts.
export function defaultUnit(product) {
  if (!product?.units?.length) {
    return { label: product?.baseUnit === 'ml' ? 'ml' : 'g', grams: 1, isDefault: true }
  }
  return product.units.find((u) => u.isDefault) || product.units[0]
}

export function findUnit(product, label) {
  if (!product?.units?.length) return defaultUnit(product)
  return product.units.find((u) => u.label === label) || defaultUnit(product)
}

// Gramm-/ml-Menge eines MealItems.
export function gramsForItem(product, item) {
  const unit = findUnit(product, item.unitLabel)
  return (item.qty || 0) * (unit.grams || 0)
}

// Nährwerte eines einzelnen MealItems.
export function nutritionForItem(product, item) {
  const out = emptyNutrition()
  if (!product?.nutriments) return out
  const factor = gramsForItem(product, item) / 100
  for (const k of NUTRIENT_KEYS) out[k] = (product.nutriments[k] || 0) * factor
  return out
}

// Summe über mehrere Items (productMap: id → Product).
export function nutritionForItems(items = [], productMap) {
  const total = emptyNutrition()
  for (const item of items) {
    const product = productMap.get ? productMap.get(item.productId) : productMap[item.productId]
    if (!product) continue
    const n = nutritionForItem(product, item)
    for (const k of NUTRIENT_KEYS) total[k] += n[k]
  }
  return total
}

// kcal pro einer Einheit (z. B. „pro Scheibe").
export function kcalPerUnit(product, unit = defaultUnit(product)) {
  if (!product?.nutriments) return 0
  return (product.nutriments.kcal || 0) * (unit.grams || 0) / 100
}

// Mengen-Vorschlag: „Wie viele Scheiben passen noch ins Restbudget?"
// Auf halbe Alltagseinheiten gerundet, mindestens 0.
export function suggestQty(product, unit, remainingKcal) {
  const per = kcalPerUnit(product, unit)
  if (per <= 0) return 0
  const raw = remainingKcal / per
  return Math.max(0, Math.round(raw * 2) / 2)
}
