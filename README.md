# SupaDupa Body

Kalorienbewusst essen über den **umgedrehten Ansatz**: erst den persönlichen
Warenkorb (Stammprodukte) einmalig erfassen, dann daraus Mahlzeiten
zusammenstellen — die App schlägt **Mengen** (Scheiben, TL, Stück) fürs
Tagesbudget vor, statt jede Mahlzeit nachträglich zu protokollieren.

Schwester-App zu **SupaDupa Money**: gleiche Grundprinzipien (Local-first PWA,
React + Vite, IndexedDB, kein Backend/Tracking, mobile-first, Dark-Look mit
Lime-Akzent).

## Stand

Konzeptphase. Bisher:

- `DATENMODELL.md` — Entitäten, Felder, abgeleitete Werte, MVP-Schnitt.
- `mockup.html` — statischer Klick-Dummy der vier Kern-Screens
  (Vorratskammer · Mahlzeit bauen · Heute · Bessere Wahl).
  Einfach im Browser öffnen (Desktop oder Handy).

## Nächste Schritte (Vorschlag)

1. Vite-/React-Gerüst analog `../new` aufsetzen (Theme-Tokens wiederverwenden).
2. `kvStore` + Stores anlegen, Produkt-CRUD.
3. Open-Food-Facts-Barcode-Import.
4. Mahlzeiten-Builder mit Live-Nährwerten (`utils/nutrition.js`).
