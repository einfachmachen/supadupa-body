import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as db from '../db/kvStore.js'
import { SEED } from '../data/seed.js'
import { uid, todayISO } from '../utils/id.js'

const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp muss innerhalb von <AppProvider> stehen')
  return ctx
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [stores, setStores] = useState([])
  const [meals, setMeals] = useState([])
  const [daylogs, setDaylogs] = useState([])
  const [weights, setWeights] = useState([])

  // --- Initiales Laden (+ Seed beim ersten Start) ---
  useEffect(() => {
    let alive = true
    ;(async () => {
      let [prof, prods, strs, mls, dls, wts] = await Promise.all([
        db.getProfile(),
        db.getAll('products'),
        db.getAll('stores'),
        db.getAll('meals'),
        db.getAll('daylogs'),
        db.getAll('weights'),
      ])

      if (prods.length === 0) {
        // Erstbefüllung des Vorrats (Demo). Profil/Gewicht kommen aus dem
        // Onboarding — daher hier bewusst NICHT vorbefüllt.
        await Promise.all([
          ...SEED.stores.map((s) => db.put('stores', s)),
          ...SEED.products.map((p) => db.put('products', p)),
          ...SEED.meals.map((m) => db.put('meals', m)),
          ...SEED.daylogs.map((d) => db.put('daylogs', d)),
        ])
        prods = SEED.products
        strs = SEED.stores
        mls = SEED.meals
        dls = SEED.daylogs
      }

      if (!alive) return
      setProfile(prof)
      setProducts(prods)
      setStores(strs)
      setMeals(mls)
      setDaylogs(dls)
      setWeights(wts)
      setReady(true)
    })()
    return () => { alive = false }
  }, [])

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])
  const storeMap = useMemo(() => new Map(stores.map((s) => [s.id, s])), [stores])

  // --- Produkte ---
  async function saveProduct(input) {
    const product = input.id
      ? input
      : { id: uid(), favorite: false, source: 'manual', createdAt: new Date().toISOString(), ...input }
    await db.put('products', product)
    setProducts((prev) => {
      const i = prev.findIndex((p) => p.id === product.id)
      if (i === -1) return [...prev, product]
      const next = [...prev]; next[i] = product; return next
    })
    return product
  }
  async function deleteProduct(id) {
    await db.del('products', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  // --- Märkte ---
  async function saveStore(input) {
    const store = input.id ? input : { id: uid(), ...input }
    await db.put('stores', store)
    setStores((prev) => {
      const i = prev.findIndex((s) => s.id === store.id)
      if (i === -1) return [...prev, store]
      const next = [...prev]; next[i] = store; return next
    })
    return store
  }

  // --- Mahlzeiten (Vorlagen) ---
  async function saveMeal(input) {
    const meal = input.id
      ? input
      : { id: uid(), isTemplate: true, createdAt: new Date().toISOString(), ...input }
    await db.put('meals', meal)
    setMeals((prev) => {
      const i = prev.findIndex((m) => m.id === meal.id)
      if (i === -1) return [...prev, meal]
      const next = [...prev]; next[i] = meal; return next
    })
    return meal
  }
  async function deleteMeal(id) {
    await db.del('meals', id)
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  // --- Profil ---
  async function saveProfile(input) {
    const next = { ...(profile || {}), ...input }
    await db.putProfile(next)
    setProfile(await db.getProfile())
  }

  // --- Gewicht ---
  async function addWeight(kg, date = todayISO(), note = null) {
    const entry = { id: uid(), date, kg: Number(kg), note }
    await db.put('weights', entry)
    setWeights((prev) => [...prev.filter((w) => w.date !== date), entry])
    return entry
  }
  const latestWeight = useMemo(() => {
    if (!weights.length) return null
    return [...weights].sort((a, b) => b.date.localeCompare(a.date))[0].kg
  }, [weights])

  // --- DayLog ---
  function dayLog(date) {
    return daylogs.find((d) => d.date === date) || { date, entries: [] }
  }
  async function persistDay(day) {
    await db.put('daylogs', day)
    setDaylogs((prev) => {
      const i = prev.findIndex((d) => d.date === day.date)
      if (i === -1) return [...prev, day]
      const next = [...prev]; next[i] = day; return next
    })
  }
  async function addEntry(date, { mealId = null, adHocItems = null, slot }) {
    const day = dayLog(date)
    const entry = { id: uid(), mealId, adHocItems, slot, done: false }
    await persistDay({ ...day, entries: [...day.entries, entry] })
    return entry
  }
  async function updateEntry(date, entryId, patch) {
    const day = dayLog(date)
    await persistDay({ ...day, entries: day.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e)) })
  }
  async function removeEntry(date, entryId) {
    const day = dayLog(date)
    await persistDay({ ...day, entries: day.entries.filter((e) => e.id !== entryId) })
  }

  // --- Backup ---
  async function exportJSON() {
    const dump = await db.exportAll()
    return JSON.stringify(dump, null, 2)
  }
  async function importJSON(text) {
    await db.importAll(JSON.parse(text))
    window.location.reload()
  }

  const value = {
    ready,
    profile, products, stores, meals, daylogs, weights,
    productMap, storeMap, latestWeight,
    saveProduct, deleteProduct,
    saveStore,
    saveMeal, deleteMeal,
    saveProfile,
    addWeight,
    dayLog, addEntry, updateEntry, removeEntry,
    exportJSON, importJSON,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
