import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, HeartPulse, AlertTriangle, Calendar, DollarSign } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RecordVetHealthModal({
  isOpen,
  onClose,
  animalsList = [],
  batchesList = [],
  onSaveHealthRecord
}) {
  const [targetType, setTargetType] = useState('individual') // 'individual' | 'batch'
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [treatmentType, setTreatmentType] = useState('Vaccination')
  const [diagnosis, setDiagnosis] = useState('')
  const [medication, setMedication] = useState('')
  const [costRWF, setCostRWF] = useState('')
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0])
  const [nextDate, setNextDate] = useState('')
  const [isMortality, setIsMortality] = useState(false)
  const [mortalityCause, setMortalityCause] = useState('')
  const [mortalityCount, setMortalityCount] = useState('1')

  if (!isOpen) return null

  const targetAnimal = animalsList.find((a) => a.id === selectedAnimalId) || animalsList[0] || {}
  const targetBatch = batchesList.find((b) => b.id === selectedBatchId) || batchesList[0] || {}

  const handleSubmit = (e) => {
    e.preventDefault()
    const targetRef = targetType === 'individual' ? targetAnimal.id : targetBatch.id
    const targetName = targetType === 'individual' ? targetAnimal.name : targetBatch.name
    const cost = Number(costRWF) || 0

    if (onSaveHealthRecord) {
      onSaveHealthRecord({
        id: `HLT-${Math.floor(100 + Math.random() * 900)}`,
        targetType,
        targetRef,
        targetName,
        treatmentType: isMortality ? 'Mortality' : treatmentType,
        diagnosis: isMortality ? `Mortality: ${mortalityCause}` : diagnosis.trim() || treatmentType,
        treatment: isMortality ? 'Carcass disposal / Autopsy' : medication.trim(),
        costRWF: cost,
        date: eventDate,
        nextDate: isMortality ? null : nextDate || null,
        isMortality,
        mortalityCount: isMortality ? Math.max(1, parseInt(mortalityCount, 10) || 1) : 0,
        mortalityCause: isMortality ? mortalityCause.trim() : null
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
              <span>Record Veterinary Event / Care</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 06
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Vaccinations, antibiotic treatments, booster schedules &amp; mortality audit
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
          {/* Target Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target</label>
              <CustomSelect
                value={targetType}
                onChange={setTargetType}
                options={[
                  { value: 'individual', label: 'Individual Animal' },
                  { value: 'batch', label: 'Flock / Batch Group' }
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Animal/Batch *</label>
              {targetType === 'individual' ? (
                <CustomSelect
                  value={selectedAnimalId || targetAnimal.id}
                  onChange={setSelectedAnimalId}
                  options={animalsList.map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.id})`
                  }))}
                />
              ) : (
                <CustomSelect
                  value={selectedBatchId || targetBatch.id}
                  onChange={setSelectedBatchId}
                  options={batchesList.map((b) => ({
                    value: b.id,
                    label: `${b.name} (${b.quantity} heads)`
                  }))}
                />
              )}
            </div>
          </div>

          {/* Mortality Toggle */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isMortality}
                onChange={(e) => setIsMortality(e.target.checked)}
                className="rounded text-rose-500 focus:ring-0"
              />
              <span className="text-xs font-bold text-white">
                Log Animal Mortality / Loss (Preserves complete historical record)
              </span>
            </label>
          </div>

          {isMortality ? (
            <div className="space-y-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-rose-300 mb-1">Cause of Death *</label>
                  <input
                    type="text"
                    required
                    value={mortalityCause}
                    onChange={(e) => setMortalityCause(e.target.value)}
                    placeholder="e.g. Pneumonia, Bloat, Heat Stress"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-rose-300 mb-1">Number Lost *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={mortalityCount}
                    onChange={(e) => setMortalityCount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Event Type</label>
                  <CustomSelect
                    value={treatmentType}
                    onChange={setTreatmentType}
                    options={[
                      { value: 'Vaccination', label: 'Vaccination / Preventive' },
                      { value: 'Deworming', label: 'Deworming' },
                      { value: 'Antibiotic', label: 'Antibiotic Treatment' },
                      { value: 'Vitamin Booster', label: 'Vitamin / Mineral Booster' },
                      { value: 'Wound Care', label: 'Wound Care / Surgery' },
                      { value: 'Other', label: 'General Checkup' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Diagnosis / Reason *</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Routine Swine Erysipelas"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Medication / Dose Given</label>
                <input
                  type="text"
                  value={medication}
                  onChange={(e) => setMedication(e.target.value)}
                  placeholder="e.g. Penicillin 10ml, Oxytetracycline"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Treatment Cost (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={costRWF}
                    onChange={(e) => setCostRWF(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Next Booster / Review Date</label>
                  <CustomDateInput
                    value={nextDate}
                    onChange={setNextDate}
                    placeholder="Optional booster..."
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Date of Event</label>
            <CustomDateInput
              value={eventDate}
              onChange={setEventDate}
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
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg ${
                isMortality
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{isMortality ? 'Log Mortality' : 'Record Vet Care'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}

