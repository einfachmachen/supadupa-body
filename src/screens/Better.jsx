import { useMemo, useState } from 'react'
import { useApp } from '../store/AppContext.jsx'
import NutriGrade from '../components/NutriGrade.jsx'
import { category } from '../data/categories.js'
import { shoppingTips } from '../utils/shopping.js'
import { int } from '../utils/format.js'

const RANK = { A: 1, B: 2, C: 3, D: 4, E: 5 }

// Vergleicht Produkte gleicher Kategorie und schlägt die bessere Variante vor.
function buildSuggestions(products) {
  const byCat = {}
  for (const p of products) {
    if (!p.grade) continue
    ;(byCat[p.category] ||= []).push(p)
  }
  const out = []
  for (const p of products) {
    if (!p.grade || RANK[p.grade] <= 2) continue // A/B sind schon gut
    const cands = (byCat[p.category] || []).filter((c) => c.id !== p.id && RANK[c.grade] < RANK[p.grade])
    if (!cands.length) continue
    cands.sort((a, b) => RANK[a.grade] - RANK[b.grade] || a.nutriments.kcal - b.nutriments.kcal)
    const better = cands[0]
    const deltas = {
      fatG: p.nutriments.fatG - better.nutriments.fatG,
      sugarG: p.nutriments.sugarG - better.nutriments.sugarG,
      saltG: p.nutriments.saltG - better.nutriments.saltG,
    }
    const reasonKey = Object.entries(deltas).sort((a, b) => b[1] - a[1])[0]
    const reasonText = { fatG: 'weniger Fett', sugarG: 'weniger Zucker', saltG: 'weniger Salz' }[reasonKey[0]]
    out.push({
      id: p.id, worse: p, better,
      reason: `${reasonText} & besserer Nutri-Score`,
      dKcal: better.nutriments.kcal - p.nutriments.kcal,
      dFat: better.nutriments.fatG - p.nutriments.fatG,
    })
  }
  return out
}

export default function Better({ onShop }) {
  const { products, storeMap } = useApp()
  const [dismissed, setDismissed] = useState([])

  const tips = useMemo(() => shoppingTips(products), [products])
  const swaps = useMemo(() => buildSuggestions(products), [products])
  const list = swaps.filter((s) => !dismissed.includes(s.id))

  return (
    <>
      <div className="head">
        <div>
          <h2>Bessere Wahl</h2>
          <div className="sub">{tips.length} Einkaufstipps · {list.length} Alternativen</div>
        </div>
      </div>

      <div className="body">
        {/* ---- Einkaufstipps für mehr Abwechslung ---- */}
        {tips.length > 0 && (
          <>
            <div className="section-title">Mehr Vielfalt für deinen Einkauf</div>
            <p className="note" style={{ textAlign: 'left', marginTop: 0, marginBottom: 10 }}>
              Das rundet deine Mahlzeiten ab und bringt Abwechslung rein. Tipp antippen →
              das Produkt deines Markts auswählen und in den Vorrat legen.
            </p>
            {tips.map((t, i) => (
              <div key={i} className="mealcard">
                <div className="em">{t.emoji}</div>
                <div className="mc">
                  <div className="t">{t.name} <span style={{ color: 'var(--lbl)', fontSize: 11 }}>· {t.group}</span></div>
                  <div className="d">{t.why}</div>
                </div>
                <button className="pill-add" onClick={() => onShop(t.name)}>＋ Suchen</button>
              </div>
            ))}
          </>
        )}

        {/* ---- Bessere Alternativen zu vorhandenen Produkten ---- */}
        {list.length > 0 && (
          <>
            <div className="section-title">Bessere Alternativen</div>
            {list.map((s) => {
              const store = storeMap.get(s.worse.storeId)
              return (
                <div className="altcard" key={s.id}>
                  <div className="why">▼ {s.reason}</div>
                  <div className="swap">
                    <div className="p old">
                      <div className="t">{s.worse.name}</div>
                      <div className="m"><NutriGrade grade={s.worse.grade} sm /> {category(s.worse.category).label}{store ? ` · ${store.name}` : ''}</div>
                    </div>
                    <div className="arrow">→</div>
                    <div className="p">
                      <div className="t">{s.better.name}</div>
                      <div className="m"><NutriGrade grade={s.better.grade} sm /> {int(s.better.nutriments.kcal)} kcal/100</div>
                    </div>
                  </div>
                  <div className="delta">
                    <div className="d"><div className="v num">{s.dFat <= 0 ? '' : '+'}{int(s.dFat)} g</div><div className="k">Fett /100 g</div></div>
                    <div className="d"><div className="v num">{s.dKcal <= 0 ? '' : '+'}{int(s.dKcal)}</div><div className="k">kcal /100 g</div></div>
                    <div className="d"><div className="v num">{s.worse.grade} → {s.better.grade}</div><div className="k">Nutri-Score</div></div>
                  </div>
                  <div className="btnrow" style={{ marginTop: 12 }}>
                    <button className="btn-ghost" style={{ background: 'var(--lime)', color: 'var(--on)', border: 'none' }} onClick={() => setDismissed((d) => [...d, s.id])}>Merken</button>
                    <button className="btn-ghost" onClick={() => setDismissed((d) => [...d, s.id])}>Behalten</button>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tips.length === 0 && list.length === 0 && (
          <div className="empty">
            <div className="ic">↻</div>
            <div className="t">Alles im grünen Bereich</div>
            <div className="d">Dein Vorrat ist abwechslungsreich und gut bewertet. Weiter so!</div>
          </div>
        )}
      </div>
    </>
  )
}
