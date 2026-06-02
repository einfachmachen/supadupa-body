import { qty as fmtQty } from '../utils/format.js'

// Mengen-Stepper in Alltagseinheiten. Schrittweite ½ unter 3, sonst 1.
export default function Stepper({ value, unitLabel, onChange, min = 0 }) {
  const step = value < 3 ? 0.5 : 1
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)))
  const inc = () => onChange(+(value + step).toFixed(2))
  return (
    <div className="stepper">
      <button type="button" onClick={dec} aria-label="weniger">−</button>
      <div className="q">
        <b className="num">{fmtQty(value)}</b>
        <small>{unitLabel}</small>
      </div>
      <button type="button" onClick={inc} aria-label="mehr">+</button>
    </div>
  )
}
