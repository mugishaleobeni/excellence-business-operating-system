import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Tag, Layers } from 'lucide-react'
import RegisterIndividualForm from '../forms/RegisterIndividualForm'
import RegisterBatchForm from '../forms/RegisterBatchForm'

export default function RegisterAnimalModal({
  isOpen,
  onClose,
  onSaveIndividual,
  onSaveBatch,
  defaultType = 'Pigs'
}) {
  const [activeTab, setActiveTab] = useState('individual')

  if (!isOpen) return null

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Register Farm Animals</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 02
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Zero tag barriers: register individual animals or entire flock/herd batches
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/20 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'individual'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Method A: Individual Animal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'batch'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Method B: Group / Batch (e.g. 100 birds)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'individual' ? (
            <RegisterIndividualForm
              defaultType={defaultType}
              onSave={(rec) => {
                if (onSaveIndividual) onSaveIndividual(rec)
                onClose()
              }}
              onCancel={onClose}
            />
          ) : (
            <RegisterBatchForm
              defaultType={defaultType}
              onSave={(rec) => {
                if (onSaveBatch) onSaveBatch(rec)
                onClose()
              }}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}
