import React, { useState } from 'react'
import { X, Check, Calendar, Activity, Clock } from 'lucide-react'
import { GESTATION_PERIODS } from '../data/animalBreedsData'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RecordBreedingModal({
  isOpen,
  onClose,
  animalsList = [],
  onSaveBreeding
}) {
  const [damId, setDamId] = useState('')
  const [sireId, setSireId] = useState('')
  const [animalType, setAnimalType] = useState('Pigs')
  const [matingDate, setMatingDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const females = animalsList.filter((a) => a.sex === 'Female' || !a.sex)
  const males = animalsList.filter((a) => a.sex === 'Male')

  const selectedDam = animalsList.find((a) => a.id === damId) || females[0] || {}
  const selectedSire = animalsList.find((a) => a.id === sireId) || males[0] || {}

  // Calculate expected date
  const gestationDays = GESTATION_PERIODS[animalType] || 114
  const expectedDateStr = (() => {
    try {
      const d = new Date(matingDate)
      d.setDate(d.getDate() + gestationDays)
      return d.toISOString().split('T')[0]
    } catch {
      return ''
    }
  })()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveBreeding) {
      onSaveBreeding({
        id: `GES-${Math.floor(10 + Math.random() * 90)}`,
        animalType,
        damId: selectedDam.id || 'DAM-UNKNOWN',
        damName: selectedDam.name || 'Dam Female',
        sireId: selectedSire.id || 'SIRE-UNKNOWN',
        sireName: selectedSire.name || 'Sire Male',
        matingDate,
        gestationDays,
        expectedDate: expectedDateStr,
        status: 'Active Gestation',
        notes: notes.trim()
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Record Breeding &amp; Mating</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 05
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Auto-calculate gestation cycle &amp; expected delivery date
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
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Animal Specie / Gestation Type *
            </label>
            <CustomSelect
              value={animalType}
              onChange={setAnimalType}
              options={[
                { value: 'Pigs', label: 'Pigs / Swine (114 days · 3mo 3wk 3d)' },
                { value: 'Cattle', label: 'Cattle / Dairy Cows (283 days)' },
                { value: 'Goats', label: 'Goats / Does (150 days)' },
                { value: 'Sheep', label: 'Sheep / Ewes (150 days)' },
                { value: 'Rabbits', label: 'Rabbits / Does (31 days)' },
                { value: 'Chickens', label: 'Poultry Incubation (21 days)' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Breeding Female (Dam) *
              </label>
              <CustomSelect
                value={damId || selectedDam.id}
                onChange={setDamId}
                options={
                  females.length > 0
                    ? females.map((f) => ({ value: f.id, label: `${f.name} (${f.id})` }))
                    : [{ value: 'DAM-01', label: 'Female Breeder 01' }]
                }
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Breeding Male (Sire) *
              </label>
              <CustomSelect
                value={sireId || selectedSire.id}
                onChange={setSireId}
                options={
                  males.length > 0
                    ? males.map((m) => ({ value: m.id, label: `${m.name} (${m.id})` }))
                    : [{ value: 'SIRE-01', label: 'Stud Male Sire 01' }]
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mating / Insemination Date *
              </label>
              <CustomDateInput
                value={matingDate}
                onChange={setMatingDate}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Expected Delivery Date
              </label>
              <CustomDateInput
                value={expectedDateStr}
                onChange={() => {}}
                readOnly
                placeholder="Calculated date..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Breeding Notes / Observations
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Natural service or artificial insemination batch"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
            />
          </div>

          <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Expected gestation length: <strong className="text-white">{gestationDays} days</strong>. System will highlight status when due within 14 days.
            </span>
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
              <span>Record Breeding Cycle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

