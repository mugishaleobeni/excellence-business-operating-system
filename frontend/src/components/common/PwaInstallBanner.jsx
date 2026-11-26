import React, { useState, useEffect } from 'react'
import { Download, WifiOff, X, Smartphone } from 'lucide-react'

export default function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('exbos_pwa_banner_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )
  const [offlineBannerCollapsed, setOfflineBannerCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem('exbos_offline_banner_collapsed') === '1'
    } catch {
      return false
    }
  })

  const collapseOfflineBanner = () => {
    setOfflineBannerCollapsed(true)
    try {
      sessionStorage.setItem('exbos_offline_banner_collapsed', '1')
    } catch {}
  }

  const expandOfflineBanner = () => {
    setOfflineBannerCollapsed(false)
    try {
      sessionStorage.removeItem('exbos_offline_banner_collapsed')
    } catch {}
  }

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const handleInstalled = () => {
      setDeferredPrompt(null)
    }
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice.catch(() => null)
    if (choice?.outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('exbos_pwa_banner_dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {isOffline && (
        offlineBannerCollapsed ? (
          <button
            type="button"
            onClick={expandOfflineBanner}
            title="Offline Mode — Tap for details"
            aria-label="Offline Mode indicator"
            className="fixed bottom-20 lg:bottom-4 left-4 z-[99990] w-10 h-10 rounded-full bg-[#071544]/95 hover:bg-[#0A2786] text-amber-400 border border-amber-400/60 shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all"
          >
            <WifiOff className="w-4 h-4 shrink-0" />
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5 animate-pulse" />
          </button>
        ) : (
          <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 sm:right-auto z-[99990] flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-500/95 text-slate-950 text-xs font-extrabold shadow-2xl border border-amber-300 max-w-md">
            <div className="flex items-center gap-2 min-w-0">
              <WifiOff className="w-4 h-4 shrink-0" />
              <span className="leading-snug">
                Offline Mode — Changes are saved locally and sync automatically when reconnected.
              </span>
            </div>
            <button
              type="button"
              onClick={collapseOfflineBanner}
              aria-label="Minimize offline banner"
              title="Minimize to floating offline icon"
              className="p-1 rounded-lg text-slate-900/80 hover:text-slate-950 hover:bg-black/10 cursor-pointer shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      )}

      {deferredPrompt && !dismissed && (
        <div className="fixed bottom-4 right-4 z-[99990] max-w-xs rounded-2xl bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] border border-[#9EDCFF]/45 p-3.5 text-white shadow-[0_18px_45px_rgba(0,0,0,0.65)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-[#9EDCFF]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-orbitron text-xs font-extrabold text-white">Install ExBOS App</div>
            <div className="text-[10px] text-slate-200 leading-tight mt-0.5">
              Faster launch &amp; offline support on mobile &amp; desktop.
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  )
}

