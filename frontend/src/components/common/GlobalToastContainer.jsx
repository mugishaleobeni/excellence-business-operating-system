import React from 'react'
import { useExbos } from '../../context/ExbosContext'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

export default function GlobalToastContainer() {
  const { toasts, removeToast } = useExbos()

  if (!toasts || toasts.length === 0) return null

  return (
    <div className="exbos-toast-container" aria-live="assertive">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success'
        const isInfo = t.type === 'info'
        return (
          <div key={t.id} className="exbos-toast" role="alert">
            <div
              className="exbos-toast-icon"
              style={{
                background: isSuccess
                  ? 'rgba(16, 185, 129, 0.2)'
                  : isInfo
                  ? 'rgba(33, 141, 255, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
                color: isSuccess ? '#34d399' : isInfo ? '#60a5fa' : '#f87171',
                borderColor: isSuccess
                  ? 'rgba(16, 185, 129, 0.35)'
                  : isInfo
                  ? 'rgba(33, 141, 255, 0.35)'
                  : 'rgba(239, 68, 68, 0.35)'
              }}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isInfo ? (
                <Info className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div className="exbos-toast-body">
              <div className="exbos-toast-title">{t.title}</div>
              <div className="exbos-toast-msg">{t.message}</div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="exbos-toast-close"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
