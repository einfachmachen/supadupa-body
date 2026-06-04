// Lücken-Analyse: Welche Lebensmittelgruppen sind im Vorrat dünn?
// Daraus konkrete Einkaufstipps für mehr Abwechslung — damit sich die
// Ernährung nicht wie eine Diät anfühlt.
import { STAPLES } from '../data/staples.js'

// Zielgruppen für eine vollwertige, abwechslungsreiche Vorratskammer.
const GROUPS = [
  { key: 'veg', label: 'Gemüse', min: 3, cats: ['veg'] },
  { key: 'fruit', label: 'Obst', min: 2, cats: ['fruit'] },
  { key: 'protein', label: 'mageres Eiweiß', min: 3, cats: ['meat', 'fish', 'egg'] },
  { key: 'grain', label: 'Vollkorn & Beilagen', min: 2, cats: ['grain'] },
  { key: 'fat', label: 'gute Fette & Nüsse', min: 1, cats: ['fat'] },
]

// grober Abgleich: ist dieses Staple sinngemäß schon im Vorrat?
function alreadyHave(staple, products) {
  const token = staple.name.toLowerCase().split(' ')[0]
  return products.some((p) => p.name?.toLowerCase().includes(token))
}

// Liefert Einkaufstipps (gruppiert nach Lücke), max. `limit` Stück.
export function shoppingTips(products, { limit = 8 } = {}) {
  const countByCat = {}
  for (const p of products) countByCat[p.category] = (countByCat[p.category] || 0) + 1

  const tips = []
  for (const g of GROUPS) {
    const have = g.cats.reduce((s, c) => s + (countByCat[c] || 0), 0)
    const deficit = g.min - have
    if (deficit <= 0) continue

    const candidates = STAPLES
      .filter((s) => g.cats.includes(s.category) && !alreadyHave(s, products))
    // pro Gruppe so viele wie fehlen (mind. 1, höchstens 3)
    const take = Math.min(candidates.length, Math.max(1, Math.min(3, deficit)))
    for (let i = 0; i < take; i++) {
      tips.push({ ...candidates[i], group: g.label })
    }
  }

  return tips.slice(0, limit)
}
