import { useEffect, useRef, useState } from 'react'
import { searchProducts } from '../api/openfoodfacts.js'
import { category } from '../data/categories.js'
import NutriGrade from '../components/NutriGrade.jsx'
import { int } from '../utils/format.js'

// Produkt per Open-Food-Facts-Suche finden und in den Vorrat übernehmen.
export default function ProductSearch({ onPick, onManual, onClose }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const abortRef = useRef(null)

  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) { setResults([]); setStatus('idle'); return }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac
      setStatus('loading')
      try {
        const r = await searchProducts(q, { signal: ac.signal })
        setResults(r)
        setStatus('done')
      } catch (e) {
        if (e.name !== 'AbortError') setStatus('error')
      }
    }, 400) // entprellt
    return () => clearTimeout(t)
  }, [term])

  return (
    <div className="editor">
      <div className="head">
        <button className="iconbtn" onClick={onClose} aria-label="zurück">‹</button>
        <h2 style={{ fontSize: 18 }}>Produkt suchen</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="body">
        <div className="search">
          <span>⌕</span>
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="z. B. Vollkorntoast, Magerquark…" autoFocus />
        </div>

        {status === 'loading' && <div className="note">Suche in Open Food Facts…</div>}
        {status === 'error' && (
          <div className="empty">
            <div className="ic">📡</div>
            <div className="t">Keine Verbindung</div>
            <div className="d">Suche gerade nicht erreichbar. Du kannst das Produkt auch manuell anlegen.</div>
          </div>
        )}
        {status === 'done' && results.length === 0 && (
          <div className="empty">
            <div className="ic">🔍</div>
            <div className="t">Nichts gefunden</div>
            <div className="d">Anderen Begriff probieren oder manuell anlegen.</div>
          </div>
        )}

        {results.map((d, i) => (
          <button key={(d.barcode || '') + i} className="prow" onClick={() => onPick(d)}>
            <NutriGrade grade={d.grade} />
            <div className="pname">
              <div className="t">{d.name}</div>
              <div className="m">
                {d.brand ? d.brand + ' · ' : ''}{category(d.category).label}
                {d._meta?.quantity ? ` · ${d._meta.quantity}` : ''}
              </div>
            </div>
            <div className="kcal num">{int(d.nutriments.kcal)}<small>/ 100 {d.baseUnit}</small></div>
          </button>
        ))}

        {status === 'idle' && term.trim().length < 2 && (
          <div className="note" style={{ marginTop: 24 }}>
            Tippe einen Produktnamen — die Nährwerte & der Nutri-Score kommen
            automatisch aus der freien Datenbank Open Food Facts.<br />
            Nur dein Suchbegriff wird gesendet.
          </div>
        )}

        <button className="addmeal" style={{ marginTop: 16 }} onClick={onManual}>
          ✎ Stattdessen manuell anlegen
        </button>
      </div>
    </div>
  )
}
