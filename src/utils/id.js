// Kurze, kollisionsarme IDs — kein externes Paket nötig.
export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

// ISO-Datum (YYYY-MM-DD) in lokaler Zeitzone — Schlüssel für DayLog.
export function todayISO(d = new Date()) {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}
