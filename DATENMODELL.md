# SupaDupa Body — Datenmodell (Entwurf v0.1)

> Schwester-App zu **SupaDupa Money**. Gleiche Grundprinzipien: Local-first PWA
> (React + Vite), Daten in IndexedDB, kein Backend, kein Tracking, UI-Sprache
> Deutsch / Code englisch. Mobile-first im selben Look (Dark „Dove Sport",
> Lime-Akzent `#AACC00`).

## Leitgedanke (der „umgedrehte" Ansatz)

Klassische Apps zwingen zum **nachträglichen Protokollieren** jeder Mahlzeit →
Frust. SupaDupa Body dreht das um:

1. **Einmal** den persönlichen Warenkorb erfassen (Stammprodukte, ~50–150 Stück).
2. **Danach** nur noch **vorwärts planen**: Mahlzeiten aus dem Vorrat
   zusammenstellen, App schlägt **Mengen** (Scheiben, TL, Stück) fürs Tagesbudget vor.
3. **Verbessern statt verzichten**: schlechte Nährwerte werden durch gezielte
   **Alternativ-Empfehlungen** nach und nach ersetzt.

Der Aufwand ist damit **einmalig & gestaltend** statt **dauerhaft & kontrollierend**.

---

## Übersicht der Entitäten

```
UserProfile ── targetKcal/macros ──┐
                                   │
Store 1───* Product *──* Alternative (Product↔Product, "besser als")
              │  ▲
              │  └─ NutritionFacts (pro 100 g) + ServingUnit[] (Alltagsmengen)
              │
              *─ MealItem *─1 Meal (Vorlage oder konkret)
                              │
                              *─ LogEntry 1─* DayLog ─1 Datum
                                                  └─ WeightEntry (Verlauf)
```

---

## 1. `UserProfile`

Eine einzige Instanz (Singleton im kvStore).

| Feld | Typ | Bedeutung |
|---|---|---|
| `sex` | `"m" \| "w" \| "d"` | für Grundumsatz |
| `birthYear` | number | Alter → Grundumsatz |
| `heightCm` | number | Körpergröße |
| `activityLevel` | `1.2 \| 1.375 \| 1.55 \| 1.725` | PAL-Faktor (sitzend … sehr aktiv) |
| `goal` | `"lose" \| "hold" \| "gain"` | Ziel |
| `targetKcal` | number | Tagesbudget (berechnet od. manuell) |
| `macroTarget` | `{ proteinG, carbG, fatG }` | optionale Makro-Ziele |
| `kcalMode` | `"auto" \| "manual"` | Budget aus Profil oder fest |

> Tagesbudget: Mifflin-St Jeor (Grundumsatz) × PAL − Defizit (z. B. −500 kcal bei
> `lose`). In `utils/energy.js` zentralisiert (analog `utils/saldo.js` in Money).

## 2. `WeightEntry`

| Feld | Typ |
|---|---|
| `id` | string |
| `date` | ISO `YYYY-MM-DD` |
| `kg` | number |
| `note` | string? |

Reiner Verlauf für die Gewichtskurve — keine Pflicht, motiviert aber.

## 3. `Store`

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | |
| `name` | string | „Aldi", „Lidl", „Edeka" … |
| `color` | string? | optionaler Akzent (analog Bank-Logos in Money) |

## 4. `Product` — Herzstück (der Warenkorb)

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | |
| `name` | string | „Vollkorntoast" |
| `brand` | string? | „Goldähren" |
| `storeId` | string? | wo üblicherweise gekauft |
| `barcode` | string? | EAN — Schlüssel zu Open Food Facts |
| `category` | enum | `bread \| dairy \| meat \| veg \| fruit \| drink \| snack \| spread \| …` |
| `nutriments` | `NutritionFacts` | **pro 100 g / 100 ml** |
| `units` | `ServingUnit[]` | Alltagsmengen (Scheibe, TL, Stück …) |
| `baseUnit` | `"g" \| "ml"` | Bezugsgröße der Nährwerte |
| `grade` | `"A".."E"` | Nutri-Score (aus OFF od. selbst berechnet) |
| `favorite` | boolean | Standard-Zutaten schneller finden |
| `source` | `"off" \| "manual"` | Datenherkunft |
| `createdAt` | ISO | |

### 4a. `NutritionFacts` (eingebettet, pro 100 g/ml)

| Feld | Typ | Pflicht |
|---|---|---|
| `kcal` | number | ✔ |
| `proteinG` | number | ✔ |
| `carbG` | number | ✔ |
| `sugarG` | number | – |
| `fatG` | number | ✔ |
| `satFatG` | number | – |
| `fiberG` | number | – |
| `saltG` | number | – |

### 4b. `ServingUnit` (eingebettet) — löst „Teelöffel statt Gramm"

| Feld | Typ | Beispiel |
|---|---|---|
| `label` | string | „Scheibe", „TL", „Stück", „Portion" |
| `grams` | number | 45, 15, 120 |
| `isDefault` | boolean | bevorzugte Anzeigeeinheit |

> So denkt der Nutzer in **Scheiben/TL/Stück**, gerechnet wird intern in Gramm.
> Beim Barcode-Import setzt die App sinnvolle Voreinstellungen je `category`
> (z. B. Brot → „Scheibe ≈ 45 g"), korrigierbar.

## 5. `Alternative` — die Verbesserungs-Empfehlung

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | |
| `productId` | string | das „schlechtere" Stammprodukt |
| `betterProductId` | string | empfohlene Alternative |
| `reason` | enum | `lessSugar \| lessFat \| lessSalt \| moreProtein \| moreFiber \| betterGrade` |
| `deltaKcalPer100` | number | Ersparnis zur Einordnung |
| `accepted` | boolean | Nutzer hat ersetzt → fließt in Vorschläge ein |

> Engine-Idee: vergleicht Produkte gleicher `category` und stuft nach `grade` +
> Schlüssel-Nährwert. „Dein Frischkäse (D) → Variante (B), −19 g Fett/100 g."

## 6. `Meal` — zusammengestellte Mahlzeit (Vorlage **oder** konkret)

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | string | |
| `name` | string | „Frühstücksbrot" |
| `slot` | `"breakfast"\|"lunch"\|"dinner"\|"snack"` | Mahlzeitenfenster |
| `items` | `MealItem[]` | die Zutaten |
| `isTemplate` | boolean | wiederverwendbare Vorlage vs. Tageseintrag |
| `createdAt` | ISO | |

### 6a. `MealItem` (eingebettet)

| Feld | Typ | Bedeutung |
|---|---|---|
| `productId` | string | Zutat |
| `qty` | number | Menge in der gewählten Einheit |
| `unitLabel` | string | welche `ServingUnit` (z. B. „Scheibe") |

> Nährwerte einer Mahlzeit werden **nicht gespeichert**, sondern aus
> `items × Produkt-Nährwerten` berechnet (eine Quelle der Wahrheit, analog zur
> Saldo-Logik in Money). Helfer: `utils/nutrition.js`.

## 7. `DayLog` & `LogEntry` — der geplante/gegessene Tag

| `DayLog` | Typ |
|---|---|
| `date` | ISO `YYYY-MM-DD` (Schlüssel) |
| `entries` | `LogEntry[]` |

| `LogEntry` | Typ | Bedeutung |
|---|---|---|
| `id` | string | |
| `mealId` | string? | Verweis auf konkrete Mahlzeit … |
| `adHocItems` | `MealItem[]?` | … oder spontane Einzelzutaten |
| `slot` | slot | Fenster |
| `done` | boolean | geplant ↔ gegessen |

---

## Abgeleitete Werte (berechnet, nie doppelt gespeichert)

- **Mahlzeit-Nährwerte** = Σ `item.qty × unit.grams/100 × product.nutriments`.
- **Tagesbilanz** = Σ aller `DayLog.entries` vs. `targetKcal` + Makro-Ampel.
- **Mengen-Vorschlag** („wie viele Scheiben passen noch?") =
  Restbudget ÷ kcal-pro-Einheit, gerundet auf ganze/halbe Alltagseinheiten.
- **Nutri-Ampel** je Produkt/Mahlzeit (A–E), analog zur 6-stufigen Budget-Ampel
  in Money.

## Persistenz

- `kvStore` (IndexedDB), Stores: `profile`, `products`, `stores`, `meals`,
  `daylogs`, `weights`, `alternatives`.
- **Import/Export JSON** (wie Money) für Backup & Gerätewechsel.
- **Barcode-Import**: Kamera → EAN → Open Food Facts API → `Product` vorbefüllen
  (Name, Marke, Nährwerte, Nutri-Score). Manuell als Fallback.

## MVP-Schnitt (erste lauffähige Version)

1. **Vorratskammer**: Produkte anlegen (Scan/manuell) + Alltagseinheit.
2. **Mahlzeit bauen**: Zutaten wählen → Live-Nährwerte → Mengenvorschlag.
3. **Tagesbudget**: eine kcal-Zahl aus dem Profil.
4. *(Ausbau)* **Alternativen** & **Gewichtskurve**.
