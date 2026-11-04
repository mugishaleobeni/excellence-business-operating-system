import React, { useState } from 'react'
import { X, Heart, Sparkles, Calendar } from 'lucide-react'
import { getCategoryByAnimalType, calculateExpectedBirthDate } from './animalConstants'

export default function RecordBreedingModal({
  isOpen,
  onClose,
  animal,
  onSave
}) {
  if (!isOpen || !animal) return null

  const categoryInfo = getCategoryByAnimalType(animal.animalType)
  const [breedingStatus, setBreedingStatus] = useState(animal.breedingStatus || 'In Pig (Pregnant / Gestating)')
  const [matingDate, setMatingDate] = useState(animal.lastMatingDate || new Date().toISOString().slice(0, 10))
  const [matingPartner, setMatingPartner] = useState(animal.matingPartner || '')
  const [expectedDate, setExpectedDate] = useState(
    animal.expectedBirthDate ||
    calculateExpectedBirthDate(matingDate, categoryInfo.gestationDays)
  )
  const [bornAlive, setBornAlive] = useState(animal.bornAlive ? String(animal.bornAlive) : '')
  const [stillborn, setStillborn] = useState(animal.stillborn ? String(animal.stillborn) : '')
  const [notes, setNotes] = useState('')

  const handleMatingDateChange = (newDate) => {
    setMatingDate(newDate)
    if (categoryInfo.gestationDays > 0) {
      setExpectedDate(calculateExpectedBirthDate(newDate, categoryInfo.gestationDays))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave && onSave(animal.id, {
      breedingStatus,
      lastMatingDate: matingDate,
      matingPartner,
      expectedBirthDate: expectedDate,
      bornAlive: bornAlive ? Number(bornAlive) : animal.bornAlive,
      stillborn: stillborn ? Number(stillborn) : animal.stillborn,
      breedingNotes: notes || animal.breedingNotes
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/85 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-[#071644] border-2 border-[#218DFF]/40 shadow-2xl text-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#9EDCFF]" />
            <h3 className="font-orbitron text-base font-bold text-white">Record Breeding Event</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
          Animal: <strong className="text-white">{animal.title || animal.animalId}</strong> ({animal.breed} {animal.animalType}) · Gestation: ~{categoryInfo.gestationDays} days
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
              Breeding / Pregnancy Status *
            </label>
            <select
              value={breedingStatus}
              onChange={(e) => setBreedingStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F] border border-white/20 text-xs text-white"
            >
              <option value="Ready for Breeding">Ready for Breeding (Open / Heat Detected)</option>
              <option value="In Pig (Pregnant / Gestating)">Pregnant / Gestating (Confirmed Service)</option>
              <option value="Lactating (Nursing / Has Given Birth)">Lactating / Nursing (Given Birth)</option>
              <option value="Dry / Resting">Dry / Resting Period</option>
              <option value="Not Breeding">Not Breeding / Retired</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
                Mating / Service Date
              </label>
              <input
                type="date"
                value={matingDate}
                onChange={(e) => handleMatingDateChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
                Sire / Mating Partner ID
              </label>
              <input
                type="text"
                value={matingPartner}
                onChange={(e) => setMatingPartner(e.target.value)}
                placeholder="e.g. Boar #01, Bull Tag #B-12"
                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
              />
            </div>
          </div>

          {categoryInfo.gestationDays > 0 && (
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-emerald-400">
                Expected {categoryInfo.gestationTerm} Date (~{categoryInfo.gestationDays} days)
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-bold text-emerald-300"
              />
            </div>
          )}

          {breedingStatus.includes('Given Birth') || breedingStatus.includes('Lactating') ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-emerald-300">
                  Offspring Born Alive
                </label>
                <input
                  type="number"
                  value={bornAlive}
                  onChange={(e) => setBornAlive(e.target.value)}
                  placeholder="e.g. 11"
                  className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-emerald-300"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-rose-300">
                  Stillborn / Lost
                </label>
                <input
                  type="number"
                  value={stillborn}
                  onChange={(e) => setStillborn(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-rose-300"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase text-[#9EDCFF]">
              Notes / Observation
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Insemination completed smoothly, healthy condition"
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
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
              Save Breeding Event
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

