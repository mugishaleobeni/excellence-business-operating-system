import React, { useState, useEffect } from 'react'
import exbosLogo from '../../../logo/exboslogo.png'
import { Sparkles, CheckCircle2 } from 'lucide-react'

export default function PreloaderScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  // Progress simulation ticker
  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setProgress(100)
      const t = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onComplete && onComplete(), 200)
      }, 300)
      return () => clearTimeout(t)
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Organic step increments
        const jump = Math.floor(Math.random() * 8) + 4
        return Math.min(100, prev + jump)
      })
    }, 45)

    return () => clearInterval(interval)
  }, [onComplete])

  // Handle completion and trigger smooth exit sequence
  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true)
        const unmountTimer = setTimeout(() => {
          if (onComplete) onComplete()
        }, 380)
        return () => clearTimeout(unmountTimer)
      }, 160)
      return () => clearTimeout(exitTimer)
    }
  }, [progress, isExiting, onComplete])

  // Keyboard shortcut: Press Escape to instantly dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isExiting) {
        setIsExiting(true)
        setTimeout(() => onComplete && onComplete(), 200)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExiting, onComplete])

  // Stage message indicator
  const stageMessage =
    progress < 30
      ? 'INITIALIZING SECURE LEDGERS'
      : progress < 70
      ? 'CALIBRATING BUSINESS ARCHITECTURES'
      : progress < 100
      ? 'SYNCING OPERATIONAL DATA'
      : 'EXBOS ENGINE READY'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[9999999] flex flex-col items-center justify-center p-4 sm:p-6 select-none transition-all duration-400 ease-out ${
        isExiting
          ? 'opacity-0 backdrop-blur-none pointer-events-none'
          : 'opacity-100 backdrop-blur-2xl'
      }`}
      style={{
        backgroundColor: '#03091F',
        backgroundImage: `
          radial-gradient(circle at 50% 35%, rgba(16, 69, 202, 0.28) 0%, transparent 60%),
          radial-gradient(circle at 80% 85%, rgba(33, 141, 255, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 20% 80%, rgba(10, 39, 134, 0.25) 0%, transparent 50%)
        `
      }}
    >
      <div
        className={`w-full max-w-md mx-auto flex flex-col items-center text-center transition-all duration-300 ease-out ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Animated Brand Logo in Sapphire Glass Squircle */}
        <div className="relative mb-6">
          {/* Subtle Ambient Breathing Aura */}
          <div
            className="absolute -inset-3 rounded-[32px] bg-gradient-to-r from-[#218DFF]/25 via-[#1045CA]/20 to-[#9EDCFF]/20 blur-xl animate-pulse pointer-events-none"
            style={{ animationDuration: '2.4s' }}
          />

          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-gradient-to-b from-white/10 via-[#071544]/80 to-[#03091F] border border-[#218DFF]/40 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(158,220,255,0.35)] flex items-center justify-center p-4 transition-transform duration-500 hover:scale-105">
            <img
              src={exbosLogo}
              alt="Excellence BOS Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(33,141,255,0.45)]"
            />
          </div>
        </div>

        {/* System Eyebrow Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-3.5 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-[#9EDCFF]" />
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.22em] uppercase font-bold text-[#9EDCFF]/90">
            EXCELLENCE BUSINESS OPERATING SYSTEM
          </span>
        </div>

        {/* Primary Strategic Tagline */}
        <h1 className="font-orbitron font-extrabold text-xl sm:text-2xl md:text-3xl text-white tracking-tight leading-snug max-w-sm sm:max-w-md mb-2">
          <span>Build a Business That Survives. </span>
          <span className="text-[#9EDCFF] bg-gradient-to-r from-[#9EDCFF] via-[#218DFF] to-white bg-clip-text text-transparent">
            And Grows.
          </span>
        </h1>

        <p className="text-xs text-slate-400 font-medium max-w-xs sm:max-w-sm mb-7">
          Precision operational intelligence for African trade enterprises.
        </p>

        {/* Precision Progress Rail Container */}
        <div className="w-full max-w-xs space-y-2">
          <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1045CA] via-[#218DFF] to-[#9EDCFF] transition-all duration-100 ease-out shadow-[0_0_12px_rgba(33,141,255,0.7)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
            <span className="flex items-center gap-1 text-[#9EDCFF] font-semibold tracking-wider truncate">
              {progress >= 100 && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
              <span>{stageMessage}</span>
            </span>
            <span className="tabular-nums font-bold text-white shrink-0 ml-2">
              {progress}%
            </span>
          </div>
        </div>

        {/* Optional Skip Hint */}
        <button
          type="button"
          onClick={() => {
            setIsExiting(true)
            setTimeout(() => onComplete && onComplete(), 200)
          }}
          className="mt-8 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer underline underline-offset-4 decoration-white/20"
        >
          Skip into workspace
        </button>
      </div>
    </div>
  )
}

