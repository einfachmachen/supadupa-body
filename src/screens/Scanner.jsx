import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import { getProductByBarcode } from '../api/openfoodfacts.js'

// Barcode (EAN) per Kamera scannen → Produkt aus Open Food Facts laden.
// Wird via React.lazy nachgeladen, damit ZXing das Startbundle nicht aufbläht.

// Auf gängige Lebensmittel-Barcodes eingrenzen + gründlicher suchen.
const HINTS = new Map()
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
])
HINTS.set(DecodeHintType.TRY_HARDER, true)

export default function Scanner({ onPick, onManual, onClose }) {
  const videoRef = useRef(null)
  const controlsRef = useRef(null)
  const trackRef = useRef(null)
  const doneRef = useRef(false)
  const [phase, setPhase] = useState('scanning') // scanning | looking | error
  const [msg, setMsg] = useState('')
  const [zoom, setZoom] = useState(null) // { min, max, step, value } | null

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(HINTS, { delayBetweenScanAttempts: 100 })
    let cancelled = false
    ;(async () => {
      try {
        controlsRef.current = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoRef.current,
          (result) => { if (result) handleCode(result.getText()) },
        )
        if (!cancelled) setupTrack()
      } catch (e) {
        if (!cancelled) { setPhase('error'); setMsg(cameraMessage(e)) }
      }
    })()
    return () => { cancelled = true; controlsRef.current?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Zoom & Dauer-Autofokus aktivieren, sobald der Kamera-Track läuft.
  function setupTrack() {
    const track = videoRef.current?.srcObject?.getVideoTracks?.()[0]
    if (!track?.getCapabilities) return
    trackRef.current = track
    const caps = track.getCapabilities()

    // Kontinuierlicher Autofokus hilft bei kleinen Codes.
    if (caps.focusMode?.includes?.('continuous')) {
      track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
    }

    // Automatisch ~2× heranzoomen, wenn das Gerät Zoom kann.
    if (caps.zoom && typeof caps.zoom.max === 'number') {
      const min = caps.zoom.min ?? 1
      const max = caps.zoom.max
      const step = caps.zoom.step || 0.1
      const value = Math.min(2, max)
      setZoom({ min, max, step, value })
      track.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {})
    }
  }

  function changeZoom(value) {
    const track = trackRef.current
    if (!track) return
    track.applyConstraints({ advanced: [{ zoom: value }] }).catch(() => {})
    setZoom((z) => (z ? { ...z, value } : z))
  }

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
          <>
            <div className="scanwrap">
              <video ref={videoRef} className="scanvideo" muted playsInline />
              <div className="scanframe" />
              <div className="scanhint">
                {phase === 'looking' ? 'Produkt wird geladen…' : 'Barcode quer in den Rahmen halten'}
              </div>
            </div>

            {zoom && (
              <div className="zoomrow">
                <span>Zoom</span>
                <input
                  type="range"
                  min={zoom.min}
                  max={zoom.max}
                  step={zoom.step}
                  value={zoom.value}
                  onChange={(e) => changeZoom(Number(e.target.value))}
                />
                <b className="num">{zoom.value.toFixed(1)}×</b>
              </div>
            )}
          </>
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
