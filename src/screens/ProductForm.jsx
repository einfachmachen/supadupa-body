import { useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import { CATEGORIES, category } from '../data/categories.js'

const GRADES = ['A', 'B', 'C', 'D', 'E']

// Vollbild-Editor: Produkt anlegen / bearbeiten. `draft` befüllt ein neues
// Produkt vor (z. B. aus der Open-Food-Facts-Suche).
export default function ProductForm({ productId, draft, onClose }) {
  const { products, stores, saveProduct, deleteProduct } = useApp()
  const existing = products.find((p) => p.id === productId)
  const base = existing || draft || {}

  const initCat = base.category || 'bread'
  const [form, setForm] = useState(() => ({
    name: base.name || '',
    brand: base.brand || '',
    storeId: existing?.storeId || '',
    category: initCat,
    baseUnit: base.baseUnit || category(initCat).base,
    grade: base.grade || '',
    favorite: existing?.favorite || false,
    nutriments: {
      kcal: '', proteinG: '', carbG: '', sugarG: '', fatG: '', satFatG: '', fiberG: '', saltG: '',
      ...(base.nutriments || {}),
    },
    units: base.units?.length
      ? base.units.map((u) => ({ ...u }))
      : [{ ...category(initCat).unit, isDefault: true }],
  }))

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setN = (key, val) => setForm((f) => ({ ...f, nutriments: { ...f.nutriments, [key]: val } }))

  function onCategory(key) {
    const c = category(key)
    setForm((f) => ({
      ...f,
      category: key,
      baseUnit: c.base,
      // war noch die Default-Einheit unverändert? → mit Kategorie-Vorschlag ersetzen
      units: f.units.length === 1 && f.units[0].isDefault
        ? [{ ...c.unit, isDefault: true }]
        : f.units,
    }))
  }

  function setUnit(i, patch) {
    setForm((f) => ({ ...f, units: f.units.map((u, idx) => (idx === i ? { ...u, ...patch } : u)) }))
  }
  function setDefaultUnit(i) {
    setForm((f) => ({ ...f, units: f.units.map((u, idx) => ({ ...u, isDefault: idx === i })) }))
  }
  function addUnit() {
    setForm((f) => ({ ...f, units: [...f.units, { label: '', grams: 0, isDefault: f.units.length === 0 }] }))
  }
  function removeUnit(i) {
    setForm((f) => {
      const units = f.units.filter((_, idx) => idx !== i)
      if (units.length && !units.some((u) => u.isDefault)) units[0].isDefault = true
      return { ...f, units }
    })
  }

  const num = (v) => (v === '' || v == null ? 0 : Number(String(v).replace(',', '.')))
  const valid = form.name.trim() && num(form.nutriments.kcal) >= 0 && form.nutriments.kcal !== '' &&
    form.units.length && form.units.every((u) => u.label.trim() && num(u.grams) > 0)

  async function handleSave() {
    if (!valid) return
    const nutriments = {}
    for (const k of Object.keys(form.nutriments)) nutriments[k] = num(form.nutriments[k])
    await saveProduct({
      ...(existing || {}),
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      storeId: form.storeId || null,
      category: form.category,
      baseUnit: form.baseUnit,
      grade: form.grade || null,
      favorite: form.favorite,
      barcode: existing?.barcode ?? draft?.barcode ?? null,
      source: existing?.source || draft?.source || 'manual',
      nutriments,
      units: form.units.map((u) => ({ label: u.label.trim(), grams: num(u.grams), isDefault: !!u.isDefault })),
    })
    onClose()
  }

  async function handleDelete() {
    if (existing && confirm(`„${existing.name}" wirklich löschen?`)) {
      await deleteProduct(existing.id)
      onClose()
    }
  }

  return (
    <div className="editor">
      <div className="head">
        <button className="iconbtn" onClick={onClose} aria-label="zurück">‹</button>
        <h2 style={{ fontSize: 18 }}>{existing ? 'Produkt bearbeiten' : 'Neues Produkt'}</h2>
        <button className="iconbtn" onClick={() => set({ favorite: !form.favorite })} aria-label="Favorit">
          {form.favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="body">
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Vollkorntoast" autoFocus />
        </div>

        <div className="row2">
          <div className="field">
            <label>Marke</label>
            <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="optional" />
          </div>
          <div className="field">
            <label>Markt</label>
            <select value={form.storeId} onChange={(e) => set({ storeId: e.target.value })}>
              <option value="">—</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <label>Kategorie</label>
            <select value={form.category} onChange={(e) => onCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Nutri-Score</label>
            <select value={form.grade} onChange={(e) => set({ grade: e.target.value })}>
              <option value="">unbekannt</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="section-title">Nährwerte pro 100 {form.baseUnit}</div>
        <div className="row2">
          <NutrField label="kcal *" value={form.nutriments.kcal} onChange={(v) => setN('kcal', v)} />
          <NutrField label="Eiweiß (g) *" value={form.nutriments.proteinG} onChange={(v) => setN('proteinG', v)} />
        </div>
        <div className="row2">
          <NutrField label="Kohlenhydr. (g) *" value={form.nutriments.carbG} onChange={(v) => setN('carbG', v)} />
          <NutrField label="davon Zucker (g)" value={form.nutriments.sugarG} onChange={(v) => setN('sugarG', v)} />
        </div>
        <div className="row2">
          <NutrField label="Fett (g) *" value={form.nutriments.fatG} onChange={(v) => setN('fatG', v)} />
          <NutrField label="ges. Fettsäuren (g)" value={form.nutriments.satFatG} onChange={(v) => setN('satFatG', v)} />
        </div>
        <div className="row2">
          <NutrField label="Ballaststoffe (g)" value={form.nutriments.fiberG} onChange={(v) => setN('fiberG', v)} />
          <NutrField label="Salz (g)" value={form.nutriments.saltG} onChange={(v) => setN('saltG', v)} />
        </div>

        <div className="section-title">Alltagsmengen</div>
        {form.units.map((u, i) => (
          <div key={i} className="row2" style={{ alignItems: 'flex-end', marginBottom: 10 }}>
            <div className="field" style={{ flex: 1.4, marginBottom: 0 }}>
              <label>Bezeichnung</label>
              <input value={u.label} onChange={(e) => setUnit(i, { label: e.target.value })} placeholder="Scheibe, TL, Stück…" />
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 0 }}>
              <label>≈ {form.baseUnit}</label>
              <input type="number" inputMode="decimal" value={u.grams || ''} onChange={(e) => setUnit(i, { grams: e.target.value })} />
            </div>
            <button type="button" className="iconbtn" onClick={() => setDefaultUnit(i)}
              title="Standardanzeige" style={{ marginBottom: 0, color: u.isDefault ? 'var(--lime)' : 'var(--lbl)' }}>
              {u.isDefault ? '●' : '○'}
            </button>
            {form.units.length > 1 && (
              <button type="button" className="iconbtn" onClick={() => removeUnit(i)} aria-label="Einheit entfernen">×</button>
            )}
          </div>
        ))}
        <button type="button" className="addmeal" onClick={addUnit}>＋ weitere Einheit</button>

        {existing && (
          <button type="button" className="btn-ghost btn-danger" style={{ width: '100%', marginTop: 18 }} onClick={handleDelete}>
            Produkt löschen
          </button>
        )}
      </div>

      <div className="footer">
        <button className="cta" disabled={!valid} onClick={handleSave}>Speichern</button>
      </div>
    </div>
  )
}

function NutrField({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" />
    </div>
  )
}
