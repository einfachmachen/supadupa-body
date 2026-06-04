// Kuratierte, vollwertige Standard-Lebensmittel für mehr Abwechslung.
// Dienen als Einkaufstipps, wenn eine Gruppe im Vorrat dünn ist.
// `name` ist zugleich der Suchbegriff für Open Food Facts (Markt-Auswahl
// passiert dann beim Hinzufügen).
export const STAPLES = [
  // Gemüse
  { name: 'Brokkoli', category: 'veg', emoji: '🥦', why: 'sattmachend, kaum Kalorien' },
  { name: 'Tomaten', category: 'veg', emoji: '🍅', why: 'frische Basis für vieles' },
  { name: 'Paprika', category: 'veg', emoji: '🫑', why: 'viel Vitamin C, knackig' },
  { name: 'Karotten', category: 'veg', emoji: '🥕', why: 'lange haltbar, vielseitig' },
  { name: 'Zucchini', category: 'veg', emoji: '🥒', why: 'leicht, gut als Beilage' },
  { name: 'Babyspinat', category: 'veg', emoji: '🥬', why: 'schnell in Bowls & Salate' },
  { name: 'Champignons', category: 'veg', emoji: '🍄', why: 'herzhaft, eiweißreich für Gemüse' },

  // Obst
  { name: 'Apfel', category: 'fruit', emoji: '🍎', why: 'der einfache Snack' },
  { name: 'Banane', category: 'fruit', emoji: '🍌', why: 'Energie vor dem Sport' },
  { name: 'Orange', category: 'fruit', emoji: '🍊', why: 'Vitamin-C-Kick' },
  { name: 'Weintrauben', category: 'fruit', emoji: '🍇', why: 'süß ohne Schokolade' },

  // Mageres Eiweiß – bewusst breit gestreut
  { name: 'Hähnchenbrustfilet', category: 'meat', emoji: '🍗', why: 'mager & proteinreich' },
  { name: 'Putenbrust Aufschnitt', category: 'meat', emoji: '🦃', why: 'magerer Brotbelag' },
  { name: 'Thunfisch im eigenen Saft', category: 'fish', emoji: '🐟', why: 'eiweißstark, lange haltbar' },
  { name: 'Räucherlachs', category: 'fish', emoji: '🐟', why: 'Omega-3 fürs Brot' },
  { name: 'Eier', category: 'egg', emoji: '🥚', why: 'flexibel: gekocht, Rührei, Omelett' },
  { name: 'Skyr', category: 'dairy', emoji: '🥛', why: 'sehr viel Eiweiß, cremig' },
  { name: 'Körniger Frischkäse', category: 'dairy', emoji: '🧀', why: 'herzhaft & proteinreich' },
  { name: 'Linsen', category: 'veg', emoji: '🫘', why: 'pflanzliches Eiweiß + Ballaststoffe' },
  { name: 'Kichererbsen', category: 'veg', emoji: '🫘', why: 'sättigend für Bowls & Salate' },
  { name: 'Tofu natur', category: 'veg', emoji: '🧈', why: 'pflanzliche Eiweiß-Alternative' },

  // Vollkorn & Beilagen
  { name: 'Haferflocken', category: 'grain', emoji: '🥣', why: 'Porridge-Basis, langes Sattgefühl' },
  { name: 'Vollkornnudeln', category: 'grain', emoji: '🍝', why: 'mehr Ballaststoffe als hell' },
  { name: 'Naturreis', category: 'grain', emoji: '🍚', why: 'gute Beilage zum Vorkochen' },
  { name: 'Quinoa', category: 'grain', emoji: '🌾', why: 'Eiweiß + Beilage in einem' },
  { name: 'Vollkornbrot', category: 'bread', emoji: '🍞', why: 'kerniger als Toast' },

  // Gute Fette & Nüsse
  { name: 'Avocado', category: 'fat', emoji: '🥑', why: 'gute Fette, cremig aufs Brot' },
  { name: 'Walnüsse', category: 'fat', emoji: '🌰', why: 'Omega-3, knackiges Topping' },
  { name: 'Mandeln', category: 'fat', emoji: '🥜', why: 'Snack mit gutem Fett' },
  { name: 'Olivenöl', category: 'fat', emoji: '🫒', why: 'fürs Dressing & Anbraten' },
]
