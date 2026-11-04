import React, { useState } from 'react'
import { X, Scale, Calendar } from 'lucide-react'

export default function RecordWeightModal({
  isOpen,
  onClose,
  animal,
  onSave
}) {
  if (!isOpen || !animal) return null

  const [weightKg, setWeightKg] = useState(animal.weightKg ? String(animal.weightKg) : '')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10))
  const [weightNotes, setWeightNotes] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!weightKg) return
    onSave && onSave(animal.id, {
      weightKg: Number(weightKg),
      latestWeightDate: recordDate,
      weightHistory: [
        ...(animal.weightHistory || []),
        { date: recordDate, weightKg: Number(weightKg), notes: weightNotes }
      ]
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/85 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-[#071644] border-2 border-[#218DFF]/40 shadow-2xl text-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="font-orbitron text-base font-bold text-white">Record Weight</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
          Animal: <strong className="text-white">{animal.title || animal.animalId}</strong> ({animal.breed} {animal.animalType})
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
              New Weight (kg) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              autoFocus
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 78.5"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm font-bold text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
              Measurement Date
            </label>
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={weightNotes}
              onChange={(e) => setWeightNotes(e.target.value)}
              placeholder="e.g. Weigh-in before feed, good growth"
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sapphire-clean px-5 py-2 text-xs font-bold"
            >
              Save Weight
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

