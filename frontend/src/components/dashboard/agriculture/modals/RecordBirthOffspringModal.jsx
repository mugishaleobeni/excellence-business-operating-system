import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, HeartPulse, Scale, Layers } from 'lucide-react'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RecordBirthOffspringModal({
  isOpen,
  onClose,
  gestationRecord,
  onSaveBirth
}) {
  const [birthDate, setBirthDate] = useState(() => new Date().toISOString().split('T')[0])
  const [totalBorn, setTotalBorn] = useState('10')
  const [survivedCount, setSurvivedCount] = useState('9')
  const [avgBirthWeightKg, setAvgBirthWeightKg] = useState('1.3')
  const [autoRegisterBatch, setAutoRegisterBatch] = useState(true)
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const total = parseInt(totalBorn, 10) || 0
  const survived = parseInt(survivedCount, 10) || 0
  const stillborn = Math.max(0, total - survived)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveBirth) {
      onSaveBirth({
        gestationId: gestationRecord?.id,
        damId: gestationRecord?.damId || 'DAM',
        damName: gestationRecord?.damName || 'Mother Sow/Cow',
        birthDate,
        totalBorn: total,
        survivedCount: survived,
        stillbornCount: stillborn,
        avgBirthWeightKg: parseFloat(avgBirthWeightKg) || 1.2,
        autoRegisterBatch,
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Record Birth &amp; Litter</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 05
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Log farrowing/calving outcomes &amp; auto-register surviving offspring
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
            <span className="text-slate-400 block">Mother Dam:</span>
            <span className="font-bold text-white text-sm">
              {gestationRecord?.damName || 'Selected Breeder'}
            </span>
            {gestationRecord?.sireName && (
              <span className="text-slate-400 block text-[11px] mt-0.5">
                Mated with: {gestationRecord.sireName} · Expected: {gestationRecord.expectedDate}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Actual Birth Date *
              </label>
              <CustomDateInput
                value={birthDate}
                onChange={setBirthDate}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Avg Birth Weight (kg)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={avgBirthWeightKg}
                onChange={(e) => setAvgBirthWeightKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Total Born *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalBorn}
                onChange={(e) => setTotalBorn(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-300 mb-1">
                Survived Healthy *
              </label>
              <input
                type="number"
                min="0"
                required
                value={survivedCount}
                onChange={(e) => setSurvivedCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-300 mb-1">
                Stillborn / Lost
              </label>
              <div className="w-full px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 font-mono text-xs">
                {stillborn}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRegisterBatch}
                onChange={(e) => setAutoRegisterBatch(e.target.checked)}
                className="mt-0.5 rounded text-emerald-500 focus:ring-0"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Auto-register {survived} surviving offspring as a new farm batch
                </span>
                <span className="text-slate-300 text-[11px]">
                  Automatically creates a new grower batch linked to this dam with birth history preserved.
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Birth Notes / Observations
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vigorous piglets, colostrum nursed successfully"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Record Birth Outcome</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}

