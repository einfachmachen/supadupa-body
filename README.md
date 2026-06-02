# SupaDupa Body

Kalorienbewusst essen über den **umgedrehten Ansatz**: erst den persönlichen
Warenkorb (Stammprodukte) einmalig erfassen, dann daraus Mahlzeiten
zusammenstellen — die App schlägt **Mengen** (Scheiben, TL, Stück) fürs
Tagesbudget vor, statt jede Mahlzeit nachträglich zu protokollieren.

Schwester-App zu **SupaDupa Money**: gleiche Grundprinzipien (Local-first PWA,
React + Vite, IndexedDB, kein Backend/Tracking, mobile-first, Dark-Look mit
Lime-Akzent).

## Stand

Lauffähiges MVP (Vite + React, IndexedDB, kein Backend). Die drei Kern-Screens
funktionieren mit echten Daten; beim ersten Start wird ein Demo-Warenkorb
(aus dem Mockup) angelegt.

- **Vorratskammer** — Produkte per **Open-Food-Facts-Suche** übernehmen
  (Nährwerte & Nutri-Score automatisch) oder manuell anlegen/bearbeiten,
  Alltagseinheiten (Scheibe/TL/Stück), kcal je Einheit.
- **Mahlzeit bauen** — **Rezept-Vorschläge aus dem eigenen Vorrat**, fertig
  aufs Slot-Budget dosiert; antippen → im Builder feinjustieren (Mengen-Stepper,
  Live-Nährwerte) und als Vorlage speichern oder einplanen.
- **Heute** — Tagesbudget-Ring (Mifflin-St Jeor × Aktivität − Defizit),
  Makro-Ampel, Mahlzeiten je Fenster ein-/ausplanen, „gegessen" markieren.
- **Bessere Wahl** — heuristische Alternativ-Vorschläge je Kategorie/Nutri-Score.
- **Onboarding** — kurze Erst-Abfrage für den Grundumsatz und das **Ziel
  (Gewicht bis wann)**.
- **Profil** — Grundumsatz-Daten, Zielgewicht & -datum, Gewicht,
  manuelles/automatisches Budget, JSON-Export/-Import (Backup).

**Gesundes Tempo statt Diät:** Das Defizit wird aus Zielgewicht + Zeitraum
abgeleitet, aber gedeckelt (max. ~0,5 kg/Woche) und das Budget fällt nie unter
den Grundumsatz — kein Crash, kein Hungerstoffwechsel. Zu strikte Wunschtermine
rechnet die App auf ein realistisches Datum um (`utils/energy.js`).

Doku: `DATENMODELL.md` (Entitäten/Felder), `mockup.html` (ursprünglicher
Klick-Dummy, Look-Referenz).

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server (Vite)
npm run build    # Produktionsbuild nach dist/
npm run preview  # Build lokal ansehen
```

Local-first: alle Daten liegen in IndexedDB im Browser. Zum Zurücksetzen die
Site-Daten löschen — oder über Profil → Import ein Backup einspielen.

### Struktur

```
src/
  api/openfoodfacts.js OFF-Suche → Produkt-Entwurf (Mapping/Kategorien)
  db/kvStore.js        IndexedDB-Wrapper + Export/Import
  store/               App-State (Context) + abgeleitete Werte
  utils/               energy.js (Budget), nutrition.js (Nährwerte),
                       suggest.js (Rezept-Vorschläge), format.js
  data/                Kategorien, Slots, Seed-Daten
  components/          TabBar, NutriGrade, Stepper, Sheet
  screens/             Pantry, ProductForm, ProductSearch, MealList, MealEditor,
                       Today, Better, Profile, Onboarding
  styles/              theme.css (Tokens), app.css
```

## Nächste Schritte (Vorschlag)

1. **Barcode-Scan** (Kamera → EAN → OFF-Produkt direkt übernehmen).
2. **Gewichtskurve** aus den `WeightEntry`-Daten (Verlaufschart).
3. **PWA** vervollständigen (Service-Worker / Offline-Cache, Install-Prompt).
4. Vorschlags-Engine verfeinern (Vorlieben/Abneigungen, mehr Archetypen,
   gespeicherte Lieblingskombis bevorzugen).
5. Alternativen-Engine ausbauen (Akzeptanz speichern, in Vorschläge einfließen).
