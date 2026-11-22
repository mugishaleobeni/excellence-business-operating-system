import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X, Barcode, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react'

/**
 * Camera Barcode & QR Code Scanner Modal
 * - Uses native Chrome/Android BarcodeDetector API for instant 60fps scanning
 *   (EAN-13, EAN-8, Code-128, Code-39, UPC-A, QR Code).
 * - Automatically falls back to USB scanner / manual code entry on unsupported browsers.
 */
export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Product Barcode / QR'
}) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const [status, setStatus] = useState('starting') // starting | scanning | fallback | error
  const [errorMsg, setErrorMsg] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [lastScanned, setLastScanned] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined
    let cancelled = false

    const stopCamera = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    async function startScanner() {
      setStatus('starting')
      setErrorMsg('')
      setLastScanned('')

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStatus('fallback')
        setErrorMsg('Camera access is not available on this device. Use a USB scanner or type the code below.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }

        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          setStatus('scanning')
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          })

          const tick = async () => {
            if (cancelled) return
            try {
              if (videoRef.current && videoRef.current.readyState >= 2) {
                const barcodes = await detector.detect(videoRef.current)
                if (barcodes && barcodes.length > 0) {
                  const raw = String(barcodes[0].rawValue || '').trim()
                  if (raw) {
                    setLastScanned(raw)
                    stopCamera()
                    onDetected?.(raw)
                    onClose?.()
                    return
                  }
                }
              }
            } catch {
              /* ignore single frame errors */
            }
            rafRef.current = requestAnimationFrame(tick)
          }
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setStatus('fallback')
          setErrorMsg(
            'Live auto-detection requires Chrome/Edge. Point camera to read or type/USB-scan the barcode below.'
          )
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setErrorMsg(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Allow camera access or enter the barcode manually below.'
              : 'Could not open camera. Use a USB barcode scanner or type the code below.'
          )
        }
      }
    }

    startScanner()
    return () => {
      cancelled = true
      stopCamera()
    }
  }, [isOpen, onDetected, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleManualSubmit = (e) => {
    e.preventDefault()
    const clean = manualCode.trim()
    if (!clean) return
    onDetected?.(clean)
    setManualCode('')
    onClose?.()
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#071544] border border-[#9EDCFF]/35 p-5 text-white shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#218DFF]" />
            <h3 className="font-orbitron font-bold text-sm">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Camera Viewfinder */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#03091F] border border-[#218DFF]/40 flex items-center justify-center">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {status === 'scanning' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-3/4 h-24 rounded-xl border-2 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.45)] relative">
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400 animate-pulse" />
              </div>
            </div>
          )}
          {lastScanned && (
            <div className="absolute bottom-3 inset-x-3 p-2 rounded-xl bg-emerald-500/90 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Scanned: {lastScanned}</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/35 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* USB Hardware Scanner / Manual Entry */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="text-[11px] font-bold uppercase text-[#9EDCFF] flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>USB Scanner / Manual Barcode Entry</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Scan with USB reader or type SKU / barcode..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#03091F] border border-white/20 text-xs text-white outline-none focus:border-[#218DFF]"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Use Code</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

