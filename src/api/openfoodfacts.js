// Anbindung an Open Food Facts (freie, offene Lebensmittel-Datenbank).
// Nur die Suchanfrage verlässt das Gerät — keine Konto-/Trackingdaten.
// Doku: https://world.openfoodfacts.org/data
import { CATEGORIES, category } from '../data/categories.js'

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'
const FIELDS = [
  'code', 'product_name', 'product_name_de', 'generic_name', 'brands',
  'nutriscore_grade', 'nutriments', 'serving_size', 'categories_tags', 'quantity',
].join(',')

// Freitextsuche → Liste von Produkt-Entwürfen (Product-Form-Vorbefüllung).
export async function searchProducts(term, { signal, pageSize = 20 } = {}) {
  const q = term.trim()
  if (!q) return []
  const url = `${SEARCH_URL}?search_terms=${encodeURIComponent(q)}` +
    `&search_simple=1&action=process&json=1&page_size=${pageSize}&fields=${FIELDS}&lc=de`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Open Food Facts: HTTP ${res.status}`)
  const data = await res.json()
  return (data.products || []).map(toDraft).filter(Boolean)
}

const numberFrom = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function kcalFrom(n = {}) {
  if (n['energy-kcal_100g'] != null) return numberFrom(n['energy-kcal_100g'])
  if (n['energy-kcal'] != null) return numberFrom(n['energy-kcal'])
  if (n['energy_100g'] != null) return Math.round(numberFrom(n['energy_100g']) / 4.184) // kJ → kcal
  return 0
}

// "30 g", "1 portion (45 g)", "250ml" → Gramm/ml als Zahl
function parseServingGrams(serving) {
  if (!serving) return null
  const m = String(serving).match(/([\d.,]+)\s*(g|ml)/i)
  if (!m) return null
  const g = numberFrom(m[1])
  return g > 0 ? g : null
}

// OFF-Kategorien grob auf unsere Kategorien abbilden.
function guessCategory(tags = []) {
  const hay = tags.join(' ')
  const rules = [
    ['drink', /beverage|drink|getr|juice|soda|water|wasser|saft/],
    ['dairy', /dairy|milk|milch|cheese|käse|kase|yogurt|joghurt|quark|cream|sahne|butter-milk/],
    ['spread', /spread|aufstrich|butter|margarine|jam|konfit|honey|honig|nut-butter/],
    ['bread', /bread|brot|toast|bakery|backwaren|roll|brötchen|brotchen/],
    ['grain', /pasta|nudel|rice|reis|cereal|getreide|flake|müsli|muesli|oat|hafer|couscous|quinoa/],
    ['meat', /meat|fleisch|sausage|wurst|salami|ham|schinken|poultry|chicken|hähnchen|hahnchen|beef|pork/],
    ['fish', /fish|fisch|seafood|salmon|lachs|tuna|thunfisch/],
    ['fruit', /fruit|obst|berry|beere|apple|apfel|banana|banane/],
    ['veg', /vegetable|gemüse|gemuse|salad|salat|legume|tomato|tomate|cucumber|gurke/],
    ['snack', /snack|chocolate|schokolade|sweet|süß|sus|candy|chips|cookie|keks|cake|kuchen/],
  ]
  for (const [key, re] of rules) if (re.test(hay)) return key
  return 'other'
}

function toDraft(off) {
  const name = (off.product_name_de || off.product_name || off.generic_name || '').trim()
  const kcal = kcalFrom(off.nutriments)
  if (!name || kcal <= 0) return null // ohne Name/Energie unbrauchbar

  const catKey = guessCategory(off.categories_tags)
  const cat = category(catKey)
  const baseUnit = catKey === 'drink' ? 'ml' : 'g'

  const servingG = parseServingGrams(off.serving_size)
  const unit = servingG
    ? { label: cat.unit.label, grams: servingG, isDefault: true }
    : { ...cat.unit, isDefault: true }

  const n = off.nutriments || {}
  const grade = /^[a-e]$/i.test(off.nutriscore_grade || '') ? off.nutriscore_grade.toUpperCase() : null

  return {
    name,
    brand: (off.brands || '').split(',')[0]?.trim() || null,
    barcode: off.code || null,
    category: catKey,
    baseUnit,
    grade,
    source: 'off',
    nutriments: {
      kcal: Math.round(kcal),
      proteinG: numberFrom(n['proteins_100g']),
      carbG: numberFrom(n['carbohydrates_100g']),
      sugarG: numberFrom(n['sugars_100g']),
      fatG: numberFrom(n['fat_100g']),
      satFatG: numberFrom(n['saturated-fat_100g']),
      fiberG: numberFrom(n['fiber_100g']),
      saltG: numberFrom(n['salt_100g']),
    },
    units: [unit],
    _meta: { quantity: off.quantity || null }, // nur zur Anzeige in der Trefferliste
  }
}

export { CATEGORIES }
