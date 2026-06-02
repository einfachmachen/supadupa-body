// Erst-Befüllung beim allerersten Start (Demo-Warenkorb aus dem Mockup),
// damit die App nicht leer wirkt. Alles editier-/löschbar.
import { todayISO } from '../utils/id.js'

const now = new Date().toISOString()

// feste IDs, damit Mahlzeiten/Logs sauber referenzieren können
const P = {
  toast: 'seed-toast',
  fkVoll: 'seed-fk-voll',
  quark: 'seed-quark',
  gouda: 'seed-gouda',
  gurke: 'seed-gurke',
  salami: 'seed-salami',
  fkLeicht: 'seed-fk-leicht',
  fruchtjo: 'seed-fruchtjo',
  naturjo: 'seed-naturjo',
  beeren: 'seed-beeren',
}

const S = { aldi: 'seed-aldi', lidl: 'seed-lidl', edeka: 'seed-edeka' }

function product(id, name, brand, storeId, category, grade, nutriments, units, baseUnit = 'g') {
  return { id, name, brand, storeId, category, grade, nutriments, units, baseUnit, favorite: false, source: 'manual', createdAt: now }
}
const u = (label, gramsVal, isDefault = false) => ({ label, grams: gramsVal, isDefault })

export const SEED = {
  stores: [
    { id: S.aldi, name: 'Aldi', color: '#00a0e2' },
    { id: S.lidl, name: 'Lidl', color: '#0050aa' },
    { id: S.edeka, name: 'Edeka', color: '#ffd400' },
  ],

  products: [
    product(P.toast, 'Vollkorntoast', 'Goldähren', S.aldi, 'bread', 'B',
      { kcal: 227, proteinG: 9, carbG: 41, sugarG: 3, fatG: 3.5, satFatG: 0.7, fiberG: 6, saltG: 1.0 },
      [u('Scheibe', 45, true)]),
    product(P.fkVoll, 'Frischkäse Doppelrahm', null, S.lidl, 'spread', 'D',
      { kcal: 347, proteinG: 6, carbG: 3.5, sugarG: 3.5, fatG: 31, satFatG: 20, fiberG: 0, saltG: 0.8 },
      [u('TL', 15, true), u('EL', 30)]),
    product(P.quark, 'Magerquark', null, S.aldi, 'dairy', 'A',
      { kcal: 66, proteinG: 12, carbG: 4, sugarG: 4, fatG: 0.3, satFatG: 0.2, fiberG: 0, saltG: 0.1 },
      [u('Portion', 125, true), u('EL', 30)]),
    product(P.gouda, 'Gouda jung 48 %', null, S.edeka, 'dairy', 'C',
      { kcal: 363, proteinG: 25, carbG: 0, sugarG: 0, fatG: 29, satFatG: 19, fiberG: 0, saltG: 1.8 },
      [u('Scheibe', 30, true)]),
    product(P.gurke, 'Gurke', null, S.aldi, 'veg', 'A',
      { kcal: 12, proteinG: 0.6, carbG: 1.8, sugarG: 1.5, fatG: 0.2, satFatG: 0, fiberG: 0.5, saltG: 0 },
      [u('Stück', 400, true), u('Scheibe', 8)]),
    product(P.salami, 'Salami-Sticks', null, S.lidl, 'meat', 'E',
      { kcal: 504, proteinG: 21, carbG: 1, sugarG: 1, fatG: 46, satFatG: 18, fiberG: 0, saltG: 4.5 },
      [u('Stück', 25, true)]),
    product(P.fkLeicht, 'Frischkäse leicht', null, S.lidl, 'spread', 'B',
      { kcal: 153, proteinG: 11, carbG: 4, sugarG: 4, fatG: 11, satFatG: 7, fiberG: 0, saltG: 0.8 },
      [u('TL', 15, true), u('EL', 30)]),
    product(P.fruchtjo, 'Frucht-Joghurt Erdbeer', null, S.aldi, 'dairy', 'C',
      { kcal: 95, proteinG: 3, carbG: 14, sugarG: 13, fatG: 2.8, satFatG: 1.8, fiberG: 0, saltG: 0.1 },
      [u('Becher', 150, true)]),
    product(P.naturjo, 'Naturjoghurt 1,5 %', null, S.aldi, 'dairy', 'A',
      { kcal: 49, proteinG: 4.8, carbG: 4.7, sugarG: 4.7, fatG: 1.5, satFatG: 1.0, fiberG: 0, saltG: 0.1 },
      [u('Becher', 150, true)]),
    product(P.beeren, 'Heidelbeeren', null, S.aldi, 'fruit', 'A',
      { kcal: 42, proteinG: 0.7, carbG: 7, sugarG: 7, fatG: 0.3, satFatG: 0, fiberG: 3.4, saltG: 0 },
      [u('Portion', 80, true)]),
  ],

  meals: [
    {
      id: 'seed-meal-fruehstuecksbrot',
      name: 'Frühstücksbrot', slot: 'breakfast', emoji: '🥪', isTemplate: true, createdAt: now,
      items: [
        { productId: P.toast, qty: 2, unitLabel: 'Scheibe' },
        { productId: P.fkVoll, qty: 2, unitLabel: 'TL' },
        { productId: P.gurke, qty: 0.25, unitLabel: 'Stück' },
        { productId: P.quark, qty: 0.5, unitLabel: 'Portion' },
      ],
    },
    {
      id: 'seed-meal-quarkbowl',
      name: 'Quark-Bowl', slot: 'lunch', emoji: '🥗', isTemplate: true, createdAt: now,
      items: [
        { productId: P.quark, qty: 2, unitLabel: 'Portion' },
        { productId: P.beeren, qty: 1, unitLabel: 'Portion' },
        { productId: P.naturjo, qty: 1, unitLabel: 'Becher' },
      ],
    },
  ],

  profile: {
    sex: 'w', birthYear: 1990, heightCm: 172, activityLevel: 1.375,
    goal: 'lose', kcalMode: 'manual', targetKcal: 2100, macroTarget: null,
  },

  weights: [{ id: 'seed-w1', date: todayISO(), kg: 68, note: null }],

  // gleich einen Tag vorplanen (Frühstück eingetragen)
  daylogs: [
    {
      date: todayISO(),
      entries: [
        { id: 'seed-log-1', mealId: 'seed-meal-fruehstuecksbrot', slot: 'breakfast', done: false },
      ],
    },
  ],
}
