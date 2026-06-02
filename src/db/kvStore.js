// Schlanker IndexedDB-Wrapper. Eine DB, mehrere Object-Stores.
// Kein Backend, kein Tracking — alle Daten bleiben auf dem Gerät.

const DB_NAME = 'supadupa-body'
const DB_VERSION = 1

// Object-Stores (vgl. DATENMODELL.md → "Persistenz").
export const STORES = ['profile', 'products', 'stores', 'meals', 'daylogs', 'weights', 'alternatives']

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          // 'profile' ist ein Singleton-KV-Store, der Rest nutzt 'id' bzw. 'date'.
          const keyPath = name === 'daylogs' ? 'date' : 'id'
          db.createObjectStore(name, { keyPath })
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(store, mode) {
  return openDB().then((db) => db.transaction(store, mode).objectStore(store))
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAll(store) {
  return wrap((await tx(store, 'readonly')).getAll())
}

export async function get(store, key) {
  return wrap((await tx(store, 'readonly')).get(key))
}

export async function put(store, value) {
  await wrap((await tx(store, 'readwrite')).put(value))
  return value
}

export async function del(store, key) {
  return wrap((await tx(store, 'readwrite')).delete(key))
}

export async function clear(store) {
  return wrap((await tx(store, 'readwrite')).clear())
}

// --- Singleton-Profil (fester Schlüssel) ---
const PROFILE_KEY = 'me'

export async function getProfile() {
  const p = await get('profile', PROFILE_KEY)
  return p || null
}

export async function putProfile(profile) {
  return put('profile', { ...profile, id: PROFILE_KEY })
}

// --- Backup / Restore (JSON, wie SupaDupa Money) ---
export async function exportAll() {
  const dump = {}
  for (const name of STORES) dump[name] = await getAll(name)
  return { app: 'supadupa-body', version: DB_VERSION, exportedAt: new Date().toISOString(), data: dump }
}

export async function importAll(dump) {
  const data = dump?.data ?? dump
  for (const name of STORES) {
    if (!data[name]) continue
    await clear(name)
    for (const row of data[name]) await put(name, row)
  }
}
