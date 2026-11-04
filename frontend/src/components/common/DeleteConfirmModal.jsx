import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, AlertTriangle, X } from 'lucide-react'

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  itemName = '',
  description = 'Are you sure you want to permanently delete this record? This action cannot be undone.',
  confirmText = 'Delete Record',
  cancelText = 'Cancel'
}) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/98 p-6 shadow-2xl text-slate-100 animate-scaleUp overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(225, 29, 72, 0.25)'
        }}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Icon */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 text-slate-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0 shadow-sm">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0 pr-6">
            <h3 className="font-orbitron text-lg font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Permanently remove this item
            </p>
          </div>
        </div>

        {/* Item Highlight Box */}
        {itemName && (
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 mb-4">
            <div className="text-[11px] font-semibold text-rose-300 uppercase tracking-wider mb-1">
              Target Record:
            </div>
            <div className="text-sm font-bold text-white font-mono break-words">
              {itemName}
            </div>
          </div>
        )}

        {/* Description Warning */}
        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-white/15 transition-all"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm()
              if (onClose) onClose()
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30 transition-all focus:ring-2 focus:ring-rose-400"
          >
            <Trash2 className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  return modalContent
}
