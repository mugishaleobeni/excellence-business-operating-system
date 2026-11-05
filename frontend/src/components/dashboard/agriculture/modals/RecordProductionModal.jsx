import React, { useState } from 'react'
import { X, Check, Egg, Milk, Sparkles, Scale } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RecordProductionModal({
  isOpen,
  onClose,
  onSaveProduction
}) {
  const [itemType, setItemType] = useState('Eggs')
  const [collected, setCollected] = useState('120')
  const [broken, setBroken] = useState('2')
  const [unit, setUnit] = useState('trays')
  const [productionDate, setProductionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [sourceAnimal, setSourceAnimal] = useState('Layers Flock Shed 1')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const collectedNum = Math.max(0, parseFloat(collected) || 0)
  const brokenNum = Math.max(0, parseFloat(broken) || 0)
  const availableNum = Math.max(0, collectedNum - brokenNum)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveProduction) {
      onSaveProduction({
        id: `PRD-${Math.floor(100 + Math.random() * 900)}`,
        date: productionDate,
        item: itemType,
        quantity: availableNum,
        collected: collectedNum,
        broken: brokenNum,
        unit,
        sourceAnimal: sourceAnimal.trim(),
        status: 'In Storage',
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
              <span>Record Daily Farm Production</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 07
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Eggs, milk, honey &amp; yields · collected, broken &amp; available for sale
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Production Item *</label>
              <CustomSelect
                value={itemType}
                onChange={(val) => {
                  setItemType(val)
                  if (val === 'Eggs') setUnit('trays')
                  else if (val === 'Fresh Milk') setUnit('liters')
                  else if (val === 'Honey') setUnit('jars (500g)')
                  else setUnit('kg')
                }}
                options={[
                  { value: 'Eggs', label: 'Eggs (Layers)' },
                  { value: 'Fresh Milk', label: 'Fresh Raw Milk (Dairy)' },
                  { value: 'Honey', label: 'Raw Pure Honey (Apiary)' },
                  { value: 'Fresh Fish', label: 'Fish Harvest (Ponds)' },
                  { value: 'Crop Harvest', label: 'Crop / Vegetable Yield' }
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. trays, liters, kg"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Total Collected *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={collected}
                onChange={(e) => setCollected(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-300 mb-1">Broken / Spoilage</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={broken}
                onChange={(e) => setBroken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-400/30 text-rose-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-emerald-300 mb-1">Net Available</label>
              <div className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 font-bold text-xs">
                {availableNum} {unit}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Source Animal / Pen</label>
              <input
                type="text"
                value={sourceAnimal}
                onChange={(e) => setSourceAnimal(e.target.value)}
                placeholder="e.g. Layers Flock Shed 1"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <CustomDateInput
                value={productionDate}
                onChange={setProductionDate}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes / Quality Grade</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Grade A Large eggs, high fat content milk"
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
              <span>Record Yield</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

