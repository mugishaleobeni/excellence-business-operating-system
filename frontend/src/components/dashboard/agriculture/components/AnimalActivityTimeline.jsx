import React, { useState } from 'react'
import {
  X,
  Plus,
  Scale,
  Calendar,
  HeartPulse,
  Activity,
  Check,
  Tag
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

  const activities = animal.activities || []

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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {animal.id}
              </span>
              <h2 className="font-orbitron text-base font-bold text-white">
                {animal.name}
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {animal.breed} · {animal.sex} · Location: {animal.location || 'Pen'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Growth Stats Ribbon */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-black/20 border-b border-white/10 text-center">
          <div className="p-2 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 block uppercase">Starting Weight</span>
            <span className="text-sm font-bold text-white">{animal.startingWeightKg || 0} kg</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
            <span className="text-[10px] text-emerald-300 block uppercase font-medium">Current Weight</span>
            <span className="text-sm font-bold text-emerald-300">{animal.currentWeightKg || 0} kg</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5">
            <span className="text-[10px] text-slate-400 block uppercase">Weight Gained</span>
            <span className="text-sm font-bold text-sky-300">
              +{Math.max(0, (animal.currentWeightKg || 0) - (animal.startingWeightKg || 0))} kg
            </span>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Recorded Lifecycle Activities ({activities.length})
            </h3>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Event / Weight</span>
              </button>
            )}
          </div>

          {showAddForm && (
            <form onSubmit={handleSaveActivity} className="p-4 rounded-2xl bg-white/5 border border-emerald-400/30 space-y-3">
              <div className="text-xs font-bold text-white">Log Animal Change / Treatment</div>
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white text-xs"
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
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
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Activity</span>
                </button>
              </div>
            </form>
          )}

          {/* Activities List */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No activities recorded yet.</p>
            ) : (
              activities.map((act, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-emerald-400/40 flex items-center justify-center">
                    {getTypeIcon(act.type)}
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-emerald-300">{act.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                    </div>
                    <p className="text-xs text-slate-200">{act.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

