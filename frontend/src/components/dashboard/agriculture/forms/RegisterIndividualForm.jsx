import React, { useState } from 'react'
import { Check } from 'lucide-react'
import { ANIMAL_TYPES_DATA } from '../data/animalBreedsData'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function RegisterIndividualForm({ defaultType = 'Pigs', onSave, onCancel }) {
  const [indivType, setIndivType] = useState(defaultType)
  const [indivId, setIndivId] = useState('')
  const [indivName, setIndivName] = useState('')
  const [indivBreed, setIndivBreed] = useState('')
  const [indivCustomBreed, setIndivCustomBreed] = useState('')
  const [indivSex, setIndivSex] = useState('Female')
  const [indivAge, setIndivAge] = useState('')
  const [indivWeight, setIndivWeight] = useState('')
  const [indivPrice, setIndivPrice] = useState('')
  const [indivLocation, setIndivLocation] = useState('Breeding Pen 1')
  const [indivCustomLocation, setIndivCustomLocation] = useState('')
  const [indivHealth, setIndivHealth] = useState('Healthy')
  const [indivDate, setIndivDate] = useState(() => new Date().toISOString().split('T')[0])

  const availableBreeds = ANIMAL_TYPES_DATA[indivType]?.breeds || []

  const animalTypeOptions = Object.keys(ANIMAL_TYPES_DATA).map((t) => ({
    value: t,
    label: t
  }))

  const breedOptions = [
    ...availableBreeds.map((b) => ({ value: b, label: b })),
    { value: 'Other', label: 'Other / Custom Breed' }
  ]

  const sexOptions = [
    { value: 'Female', label: 'Female (Sow / Cow / Doe / Ewe)' },
    { value: 'Male', label: 'Male (Boar / Bull / Buck / Ram)' }
  ]

  const healthOptions = [
    { value: 'Healthy', label: 'Healthy' },
    { value: 'Healthy · Gestating', label: 'Healthy · Gestating' },
    { value: 'Healthy · Lactating', label: 'Healthy · Lactating' },
    { value: 'Under Vet Treatment', label: 'Under Vet Treatment' },
    { value: 'Quarantine', label: 'Quarantine' }
  ]

  const locationOptions = [
    { value: 'Breeding Pen 1', label: 'Breeding Pen 1' },
    { value: 'Breeding Pen 2', label: 'Breeding Pen 2' },
    { value: 'Farrowing / Maternity Pen', label: 'Farrowing / Maternity Pen' },
    { value: 'Grower / Fattening Barn A', label: 'Grower / Fattening Barn A' },
    { value: 'Boar / Stud Stall A', label: 'Boar / Stud Stall A' },
    { value: 'Quarantine / Hospital Pen', label: 'Quarantine / Hospital Pen' },
    { value: 'Free-Range Pasture / Paddock', label: 'Free-Range Pasture / Paddock' },
    { value: 'Other', label: 'Other / Custom Location...' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalBreed = indivBreed === 'Other' ? indivCustomBreed.trim() || 'Custom Breed' : indivBreed || 'Standard'
    const finalLocation = indivLocation === 'Other' ? indivCustomLocation.trim() || 'Main Farm Pen' : indivLocation
    const finalId = indivId.trim() || `${indivType.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
    const finalName = indivName.trim() || finalId
    const weightNum = Number(indivWeight) || 0
    const priceNum = Number(indivPrice) || 0

    onSave({
      id: finalId,
      name: finalName,
      type: indivType,
      breed: finalBreed,
      sex: indivSex,
      ageMonths: Number(indivAge) || 1,
      startingWeightKg: weightNum,
      currentWeightKg: weightNum,
      purchasePriceRWF: priceNum,
      totalRaisedCostRWF: priceNum,
      acquiredDate: indivDate,
      location: finalLocation,
      healthStatus: indivHealth,
      activities: [
        {
          date: indivDate,
          type: 'Registration',
          text: `Animal registered · Starting weight ${weightNum > 0 ? `${weightNum} kg` : 'Recorded'}`
        }
      ]
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Animal Type & Breed with signature CustomSelect */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Animal Type *</label>
          <CustomSelect
            value={indivType}
            onChange={(val) => {
              setIndivType(val)
              setIndivBreed('')
            }}
            options={animalTypeOptions}
            placeholder="Select animal type..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Breed</label>
          <CustomSelect
            value={indivBreed}
            onChange={setIndivBreed}
            options={breedOptions}
            placeholder="-- Select Breed --"
          />
        </div>
      </div>

      {indivBreed === 'Other' && (
        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">Custom Breed Name *</label>
          <input
            type="text"
            required
            value={indivCustomBreed}
            onChange={(e) => setIndivCustomBreed(e.target.value)}
            placeholder="e.g. Duroc Cross or Sahiwal"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/40 text-white text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Identifier / Number (Optional)</label>
          <input
            type="text"
            value={indivId}
            onChange={(e) => setIndivId(e.target.value)}
            placeholder="e.g. 1, PIG-001 (auto-generates if blank)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Friendly Name (Optional)</label>
          <input
            type="text"
            value={indivName}
            onChange={(e) => setIndivName(e.target.value)}
            placeholder="e.g. Big Mama, Daisy"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Sex, Age, Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Sex *</label>
          <CustomSelect
            value={indivSex}
            onChange={setIndivSex}
            options={sexOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Age (Months)</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={indivAge}
            onChange={(e) => setIndivAge(e.target.value)}
            placeholder="e.g. 5"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Starting Weight (kg) *</label>
          <input
            type="number"
            min="0"
            step="0.5"
            required
            value={indivWeight}
            onChange={(e) => setIndivWeight(e.target.value)}
            placeholder="e.g. 60"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Purchase Price & Pen Location ("Where") */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Price (RWF)</label>
          <input
            type="number"
            min="0"
            value={indivPrice}
            onChange={(e) => setIndivPrice(e.target.value)}
            placeholder="e.g. 250000 (0 if farm born)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Housing / Pen Location (Where)</label>
          <CustomSelect
            value={indivLocation}
            onChange={setIndivLocation}
            options={locationOptions}
            placeholder="Select housing / pen..."
          />
        </div>
      </div>

      {indivLocation === 'Other' && (
        <div>
          <label className="block text-xs font-medium text-emerald-300 mb-1">Custom Location / Pen Name *</label>
          <input
            type="text"
            required
            value={indivCustomLocation}
            onChange={(e) => setIndivCustomLocation(e.target.value)}
            placeholder="e.g. Pasture Enclosure Sector 3"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-500/40 text-white text-xs focus:outline-none"
          />
        </div>
      )}

      {/* Health Condition & Signature CustomDateInput */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Health Condition</label>
          <CustomSelect
            value={indivHealth}
            onChange={setIndivHealth}
            options={healthOptions}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Date Acquired / Born</label>
          <CustomDateInput
            value={indivDate}
            onChange={setIndivDate}
            placeholder="Select acquisition date..."
          />
        </div>
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
          <span>Register Animal</span>
        </button>
      </div>
    </form>
  )
}
