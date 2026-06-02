import { useState, lazy, Suspense } from 'react'
import { useApp } from './store/AppContext.jsx'
import { todayISO } from './utils/id.js'
import TabBar from './components/TabBar.jsx'
import Pantry from './screens/Pantry.jsx'
import ProductForm from './screens/ProductForm.jsx'
import ProductSearch from './screens/ProductSearch.jsx'
import MealList from './screens/MealList.jsx'
import MealEditor from './screens/MealEditor.jsx'
import Today from './screens/Today.jsx'
import Better from './screens/Better.jsx'
import Profile from './screens/Profile.jsx'
import Onboarding from './screens/Onboarding.jsx'

// ZXing nur bei Bedarf nachladen.
const Scanner = lazy(() => import('./screens/Scanner.jsx'))

export default function App() {
  const { ready, profile } = useApp()
  const [tab, setTab] = useState('today')
  const [editor, setEditor] = useState(null) // {kind, ...}

  if (!ready) {
    return (
      <div className="app">
        <div className="empty" style={{ margin: 'auto' }}>
          <div className="ic">◍</div>
          <div className="t">SupaDupa <b style={{ color: 'var(--lime)' }}>Body</b></div>
        </div>
      </div>
    )
  }

  // Erst-Abfrage, bis Grundumsatz & Ziel erfasst sind.
  if (!profile?.onboarded) {
    return <div className="app"><Onboarding /></div>
  }

  if (editor) {
    const close = () => setEditor(null)
    return (
      <div className="app">
        {editor.kind === 'addProduct' && (
          <ProductSearch
            onClose={close}
            onScan={() => setEditor({ kind: 'scan' })}
            onManual={() => setEditor({ kind: 'product' })}
            onPick={(draft) => setEditor({ kind: 'product', draft })}
          />
        )}
        {editor.kind === 'scan' && (
          <Suspense fallback={<div className="empty" style={{ margin: 'auto' }}><div className="ic">📷</div><div className="t">Kamera startet…</div></div>}>
            <Scanner
              onClose={close}
              onManual={() => setEditor({ kind: 'product' })}
              onPick={(draft) => setEditor({ kind: 'product', draft })}
            />
          </Suspense>
        )}
        {editor.kind === 'product' && <ProductForm productId={editor.id} draft={editor.draft} onClose={close} />}
        {editor.kind === 'meal' && (
          <MealEditor
            mealId={editor.id}
            presetSlot={editor.presetSlot}
            addToDate={editor.addToDate}
            draftMeal={editor.draftMeal}
            onClose={close}
          />
        )}
        {editor.kind === 'profile' && <Profile onClose={close} />}
      </div>
    )
  }

  return (
    <div className="app">
      {tab === 'pantry' && (
        <Pantry
          onEdit={(id) => setEditor({ kind: 'product', id })}
          onNew={() => setEditor({ kind: 'addProduct' })}
        />
      )}
      {tab === 'build' && (
        <MealList
          onEdit={(id) => setEditor({ kind: 'meal', id })}
          onNew={() => setEditor({ kind: 'meal' })}
          onSuggest={(draft) => setEditor({ kind: 'meal', draftMeal: draft })}
        />
      )}
      {tab === 'today' && (
        <Today
          onOpenProfile={() => setEditor({ kind: 'profile' })}
          onPlanNew={(slot) => setEditor({ kind: 'meal', presetSlot: slot, addToDate: todayISO() })}
          onPlanDraft={(draft) => setEditor({ kind: 'meal', draftMeal: draft, addToDate: todayISO() })}
        />
      )}
      {tab === 'better' && <Better />}

      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
