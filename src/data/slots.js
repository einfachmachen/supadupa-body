// Mahlzeitenfenster eines Tages.
export const SLOTS = [
  { key: 'breakfast', label: 'Frühstück', emoji: '🥪' },
  { key: 'lunch', label: 'Mittag', emoji: '🥗' },
  { key: 'dinner', label: 'Abend', emoji: '🍽' },
  { key: 'snack', label: 'Snack', emoji: '🍎' },
]

export function slotLabel(key) {
  return SLOTS.find((s) => s.key === key)?.label || key
}
