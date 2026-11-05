import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { ANIMAL_TYPES_DATA } from '../data/animalBreedsData'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RegisterBatchForm({ defaultType = 'Pigs', onSave, onCancel }) {
  const [batchType, setBatchType] = useState(defaultType)
  const [batchName, setBatchName] = useState('')
  const [batchBreed, setBatchBreed] = useState('')
  const [batchCustomBreed, setBatchCustomBreed] = useState('')
  const [batchQuantity, setBatchQuantity] = useState('')
  const [batchAge, setBatchAge] = useState('')
  const [batchAvgWeight, setBatchAvgWeight] = useState('')
  const [batchUnitPrice, setBatchUnitPrice] = useState('')
  const [batchLocation, setBatchLocation] = useState('Flock House / Shed 1')
  const [batchCustomLocation, setBatchCustomLocation] = useState('')
  const [batchDate, setBatchDate] = useState(() => new Date().toISOString().split('T')[0])
  const [batchNotes, setBatchNotes] = useState('')

  const availableBreeds = ANIMAL_TYPES_DATA[batchType]?.breeds || []

  const animalTypeOptions = Object.keys(ANIMAL_TYPES_DATA).map((t) => ({
    value: t,
    label: t
  }))

  const batchBreedOptions = [
    ...availableBreeds.map((b) => ({ value: b, label: b })),
    { value: 'Other', label: 'Other / Custom Breed' }
  ]

  const batchLocationOptions = [
    { value: 'Flock House / Shed 1', label: 'Flock House / Shed 1' },
    { value: 'Flock House / Shed 2', label: 'Flock House / Shed 2' },
    { value: 'Grower Pen Group B', label: 'Grower Pen Group B' },
    { value: 'Brooding Station A', label: 'Brooding Station A' },
    { value: 'Earth Pond 1 (Aquaculture)', label: 'Earth Pond 1 (Aquaculture)' },
    { value: 'Fenced Grazing Paddock', label: 'Fenced Grazing Paddock' },
    { value: 'Other', label: 'Other / Custom Enclosure...' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalBreed = batchBreed === 'Other' ? batchCustomBreed.trim() || 'Custom Breed' : batchBreed || 'Standard'
    const finalLocation = batchLocation === 'Other' ? batchCustomLocation.trim() || 'Flock House' : batchLocation
    const qty = Math.max(1, parseInt(batchQuantity, 10) || 1)
    const unitPrice = Number(batchUnitPrice) || 0
    const finalBatchName = batchName.trim() || `${batchType} Batch ${Math.floor(100 + Math.random() * 900)}`

    onSave({
      id: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: finalBatchName,
      type: batchType,
      breed: finalBreed,
      quantity: qty,
      initialQuantity: qty,
      avgWeightKg: Number(batchAvgWeight) || 0,
      unitCostRWF: unitPrice,
      totalCostRWF: qty * unitPrice,
      acquisitionDate: batchDate,
      location: finalLocation,
      notes: batchNotes.trim() || 'Active rearing batch',
      age: batchAge.trim() || '1 day'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Animal Type & Batch Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Animal Type *</label>
          <CustomSelect
            value={batchType}
            onChange={(val) => {
              setBatchType(val)
              setBatchBreed('')
            }}
            options={animalTypeOptions}
            placeholder="Select animal type..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Group / Batch Name *</label>
          <input
            type="text"
            required
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. Broilers Batch 001, Piglets Pen C"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Breed & Quantity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Breed</label>
          <CustomSelect
            value={batchBreed}
            onChange={setBatchBreed}
            options={batchBreedOptions}
            placeholder="-- Select Breed --"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Quantity (Heads / Birds) *</label>
          <input
            type="number"
            min="1"
            required
            value={batchQuantity}
            onChange={(e) => setBatchQuantity(e.target.value)}
            placeholder="e.g. 100"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {batchBreed === 'Other' && (
        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">Custom Breed Name *</label>
          <input
            type="text"
            required
            value={batchCustomBreed}
            onChange={(e) => setBatchCustomBreed(e.target.value)}
            placeholder="e.g. Kuroiler or Sasso"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/40 text-white text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Age, Avg Weight, Price per Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Age at Acquisition</label>
          <input
            type="text"
            value={batchAge}
            onChange={(e) => setBatchAge(e.target.value)}
            placeholder="e.g. 1 day, 2 weeks"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Avg Weight (kg/head)</label>
          <input
            type="number"
            min="0"
            step="0.05"
            value={batchAvgWeight}
            onChange={(e) => setBatchAvgWeight(e.target.value)}
            placeholder="e.g. 0.05 or 15"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Price per Unit (RWF)</label>
          <input
            type="number"
            min="0"
            value={batchUnitPrice}
            onChange={(e) => setBatchUnitPrice(e.target.value)}
            placeholder="e.g. 1200"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Housing Location (Where) & Signature CustomDateInput */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Housing / Enclosure (Where)</label>
          <CustomSelect
            value={batchLocation}
            onChange={setBatchLocation}
            options={batchLocationOptions}
            placeholder="Select enclosure / pen..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Acquisition Date</label>
          <CustomDateInput
            value={batchDate}
            onChange={setBatchDate}
            placeholder="Select acquisition date..."
          />
        </div>
      </div>

      {batchLocation === 'Other' && (
        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">Custom Enclosure Name *</label>
          <input
            type="text"
            required
            value={batchCustomLocation}
            onChange={(e) => setBatchCustomLocation(e.target.value)}
            placeholder="e.g. Broiler Barn Section 4"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/40 text-white text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Target & Notes */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Target / Notes</label>
        <textarea
          rows={2}
          value={batchNotes}
          onChange={(e) => setBatchNotes(e.target.value)}
          placeholder="e.g. Broiler cycle targeting 1.8kg liveweight in 6 weeks."
          className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Form Bottom Actions */}
      <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>Register Batch</span>
        </button>
      </div>
    </form>
  )
}
