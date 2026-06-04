// Produkt-Kategorien + sinnvolle Default-Alltagseinheit je Kategorie.
// Beim Anlegen wird die passende Einheit vorgeschlagen (vgl. DATENMODELL.md 4b).

export const CATEGORIES = [
  { key: 'bread', label: 'Brot & Backwaren', emoji: '🍞', unit: { label: 'Scheibe', grams: 45 }, base: 'g' },
  { key: 'dairy', label: 'Milchprodukte', emoji: '🧀', unit: { label: 'Portion', grams: 125 }, base: 'g' },
  { key: 'spread', label: 'Aufstrich', emoji: '🧈', unit: { label: 'TL', grams: 15 }, base: 'g' },
  { key: 'meat', label: 'Fleisch & Wurst', emoji: '🥓', unit: { label: 'Scheibe', grams: 25 }, base: 'g' },
  { key: 'fish', label: 'Fisch', emoji: '🐟', unit: { label: 'Portion', grams: 120 }, base: 'g' },
  { key: 'egg', label: 'Eier', emoji: '🥚', unit: { label: 'Stück', grams: 60 }, base: 'g' },
  { key: 'veg', label: 'Gemüse', emoji: '🥦', unit: { label: 'Portion', grams: 100 }, base: 'g' },
  { key: 'fruit', label: 'Obst', emoji: '🍎', unit: { label: 'Stück', grams: 120 }, base: 'g' },
  { key: 'grain', label: 'Getreide & Beilagen', emoji: '🍚', unit: { label: 'Portion', grams: 60 }, base: 'g' },
  { key: 'fat', label: 'Fette & Nüsse', emoji: '🥑', unit: { label: 'Portion', grams: 30 }, base: 'g' },
  { key: 'snack', label: 'Snacks & Süßes', emoji: '🍫', unit: { label: 'Stück', grams: 25 }, base: 'g' },
  { key: 'drink', label: 'Getränke', emoji: '🥤', unit: { label: 'Glas', grams: 200 }, base: 'ml' },
  { key: 'other', label: 'Sonstiges', emoji: '🍽', unit: { label: 'Portion', grams: 100 }, base: 'g' },
]

const BY_KEY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

export function category(key) {
  return BY_KEY[key] || BY_KEY.other
}
