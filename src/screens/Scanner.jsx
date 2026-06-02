import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { getProductByBarcode } from '../api/openfoodfacts.js'

// Barcode (EAN) per Kamera scannen → Produkt aus Open Food Facts laden.
// Wird via React.lazy nachgeladen, damit ZXing das Startbundle nicht aufbläht.
export default function Scanner({ onPick, onManual, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const doneRef = useRef(false)
  const [phase, setPhase] = useState('scanning') // scanning | looking | error
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let cancelled = false
    ;(async () => {
      try {
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: 'environment' } } },
          videoRef.current,
          (result) => { if (result) handleCode(result.getText()) },
        )
      } catch (e) {
        if (!cancelled) { setPhase('error'); setMsg(cameraMessage(e)) }
      }
    })()
    return () => { cancelled = true; controlsRef.current?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCode(code) {
    if (doneRef.current) return
    doneRef.current = true
    controlsRef.current?.stop()
    setPhase('looking')
    try {
      const draft = await getProductByBarcode(code)
      onPick(draft || { barcode: code }, !draft)
    } catch {
      onPick({ barcode: code }, true)
    }
  }

  return (
    <div className="editor">
      <div className="head">
        <button className="iconbtn" onClick={onClose} aria-label="zurück">‹</button>
        <h2 style={{ fontSize: 18 }}>Barcode scannen</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="body" style={{ display: 'flex', flexDirection: 'column' }}>
        {phase === 'error' ? (
          <div className="empty">
            <div className="ic">📷</div>
            <div className="t">Kamera nicht verfügbar</div>
            <div className="d">{msg}</div>
          </div>
        ) : (
          <div className="scanwrap">
            <video ref={videoRef} className="scanvideo" muted playsInline />
            <div className="scanframe" />
            <div className="scanhint">
              {phase === 'looking' ? 'Produkt wird geladen…' : 'Barcode in den Rahmen halten'}
            </div>
          </div>
        )}

        <button className="addmeal" style={{ marginTop: 16 }} onClick={onManual}>
          ✎ Stattdessen manuell anlegen
        </button>
      </div>
    </div>
  )
}

function cameraMessage(e) {
  if (e?.name === 'NotAllowedError') return 'Kamerazugriff wurde abgelehnt. Erlaube ihn in den Browser-Einstellungen.'
  if (e?.name === 'NotFoundError') return 'Es wurde keine Kamera gefunden.'
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return 'Kamera braucht HTTPS — öffne die App über die https-Adresse.'
  return 'Kamera konnte nicht gestartet werden.'
}
