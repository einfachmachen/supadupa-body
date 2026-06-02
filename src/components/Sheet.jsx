import { useEffect } from 'react'

// Bottom-Sheet-Modal. Schließt per Backdrop oder Escape.
export default function Sheet({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        {title && <h3>{title}</h3>}
        {subtitle && <div className="sub">{subtitle}</div>}
        {children}
      </div>
    </div>
  )
}
