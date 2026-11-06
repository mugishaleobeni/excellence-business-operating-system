import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Plus,
  Scale,
  Calendar,
  HeartPulse,
  Activity,
  Check,
  Tag,
  MapPin,
  TrendingUp
} from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function AnimalActivityTimeline({
  animal,
  onClose,
  onAddActivity,
  onUpdateWeight
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [actType, setActType] = useState('Weight Check')
  const [actText, setActText] = useState('')
  const [actDate, setActDate] = useState(() => new Date().toISOString().split('T')[0])
  const [newWeight, setNewWeight] = useState(animal?.currentWeightKg || '')

  const eventTypeOptions = [
    { value: 'Weight Check', label: 'Weight Check / Update' },
    { value: 'Health', label: 'Veterinary Treatment' },
    { value: 'Feeding', label: 'Feed Ration Change' },
    { value: 'Mating', label: 'Breeding / Insemination' },
    { value: 'Transfer', label: 'Pen / Location Change' }
  ]

  if (!animal) return null

  const activities = Array.isArray(animal.activities) ? animal.activities : []
  const startWeight = Number(animal.startingWeightKg) || 0
  const currentWeight = Number(animal.currentWeightKg) || startWeight
  const weightGained = Math.max(0, currentWeight - startWeight)

  const handleSaveActivity = (e) => {
    e.preventDefault()
    let details = actText.trim()
    if (actType === 'Weight Check') {
      const w = Number(newWeight) || 0
      details = `Weight updated: ${w} kg (Previous: ${animal.currentWeightKg || 0} kg)`
      if (onUpdateWeight) onUpdateWeight(animal.id, w)
    }

    if (onAddActivity) {
      onAddActivity(animal.id, {
        date: actDate,
        type: actType,
        text: details || `Recorded ${actType}`
      })
    }

    setShowAddForm(false)
    setActText('')
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Weight Check':
        return <Scale className="w-3.5 h-3.5 text-sky-400" />
      case 'Health':
        return <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
      case 'Mating':
      case 'Birth':
        return <Activity className="w-3.5 h-3.5 text-emerald-400" />
      default:
        return <Tag className="w-3.5 h-3.5 text-amber-400" />
    }
  }

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-emerald-400/40 bg-[#061814] text-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#072019] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {animal.id}
              </span>
              <h2 className="font-orbitron text-base sm:text-lg font-bold text-white">
                {animal.name}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{animal.breed || animal.type}</span>
              <span className="text-white/30">·</span>
              <span>{animal.sex || 'Unknown'}</span>
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <MapPin className="w-3 h-3" />
                <span>{animal.location || 'Breeding Pen'}</span>
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Growth Stats Ribbon */}
        <div className="grid grid-cols-3 gap-2.5 p-4 bg-black/40 border-b border-white/10 text-center shrink-0">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 uppercase font-medium truncate">Starting Weight</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">{startWeight} kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 flex flex-col justify-center">
            <span className="text-[10px] text-emerald-300 uppercase font-medium truncate">Current Weight</span>
            <span className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-0.5">{currentWeight} kg</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 uppercase font-medium truncate">Weight Gained</span>
            <span className="text-sm sm:text-base font-bold font-mono text-sky-300 mt-0.5">+{weightGained} kg</span>
          </div>
        </div>

        {/* Timeline Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Recorded Lifecycle Activities ({activities.length})</span>
            </h3>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Log Event / Weight</span>
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleSaveActivity} className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-400/30 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Log Animal Change / Treatment</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Event Type</label>
                  <CustomSelect
                    value={actType}
                    onChange={setActType}
                    options={eventTypeOptions}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Date</label>
                  <CustomDateInput
                    value={actDate}
                    onChange={setActDate}
                  />
                </div>
              </div>

              {actType === 'Weight Check' ? (
                <div>
                  <label className="block text-[11px] text-emerald-300 mb-1">
                    New Measured Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="e.g. 95"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-emerald-500/40 text-white text-xs font-mono focus:border-emerald-400 outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Activity Notes / Details *</label>
                  <input
                    type="text"
                    required
                    value={actText}
                    onChange={(e) => setActText(e.target.value)}
                    placeholder="e.g. Deworming dose given, or moved to fattening pen"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          )}

          {/* Activities Timeline List */}
          <div className="space-y-3 pt-1">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                No lifecycle activities recorded yet. Click "Log Event / Weight" to add an entry.
              </div>
            ) : (
              activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs text-emerald-300 truncate">
                        {act.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {act.date}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed break-words">
                      {act.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}
