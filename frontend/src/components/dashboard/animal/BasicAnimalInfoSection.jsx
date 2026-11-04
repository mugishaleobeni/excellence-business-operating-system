import React from 'react'
import { ArrowRight } from 'lucide-react'
import { PURPOSE_OPTIONS, STATUS_OPTIONS } from './animalConstants'

export default function BasicAnimalInfoSection({
  registrationMode,
  animalId,
  setAnimalId,
  nameOrTag,
  setNameOrTag,
  sex,
  setSex,
  age,
  setAge,
  weightKg,
  setWeightKg,
  color,
  setColor,
  groupQuantity,
  setGroupQuantity,
  maleCount,
  setMaleCount,
  femaleCount,
  setFemaleCount,
  unknownCount,
  setUnknownCount,
  ageGroup,
  setAgeGroup,
  housing,
  setHousing,
  registrationDate,
  setRegistrationDate,
  purpose,
  setPurpose,
  setIncludeBreeding,
  status,
  setStatus,
  notes,
  setNotes,
  onBack,
  onContinue
}) {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Animal ID */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Animal ID / Code *
          </label>
          <input
            type="text"
            required
            value={animalId}
            onChange={(e) => setAnimalId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono font-bold text-[#9EDCFF] focus:outline-none"
          />
        </div>

        {/* Animal Name / Ear Tag / Group Name */}
        <div className="space-y-1 sm:col-span-2">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            {registrationMode === 'group'
              ? 'Group / Batch Name *'
              : 'Animal Tag / Name (Optional)'}
          </label>
          <input
            type="text"
            value={nameOrTag}
            onChange={(e) => setNameOrTag(e.target.value)}
            placeholder={
              registrationMode === 'group'
                ? 'e.g. Sasso Broiler Batch #10, Tilapia Pond 1'
                : 'e.g. Ear Tag #LR-24, Queen, Boss'
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
          />
        </div>
      </div>

      {/* Individual vs Group Specific Fields */}
      {registrationMode === 'individual' ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Sex */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
              Sex
            </label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
              Age / DOB
            </label>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 8 months, 1.5 yrs"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Weight (kg) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 65"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
            />
          </div>

          {/* Color / Markings */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
              Color / Markings
            </label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. White, Black spots"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
            />
          </div>
        </div>
      ) : (
        /* GROUP REGISTRATION MODE FIELDS */
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <span className="text-[11px] font-bold uppercase text-[#9EDCFF] block">
            Group Quantity &amp; Housing Breakdown
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Total Quantity *
              </label>
              <input
                type="number"
                required
                value={groupQuantity}
                onChange={(e) => setGroupQuantity(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Male Count
              </label>
              <input
                type="number"
                value={maleCount}
                onChange={(e) => setMaleCount(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Female Count
              </label>
              <input
                type="number"
                value={femaleCount}
                onChange={(e) => setFemaleCount(e.target.value)}
                placeholder="e.g. 90"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Unknown Sex Count
              </label>
              <input
                type="number"
                value={unknownCount}
                onChange={(e) => setUnknownCount(e.target.value)}
                placeholder="e.g. 0"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Age Group / Stage
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
              >
                <option value="Day-Old Chicks / Hatchlings">Day-Old Chicks / Hatchlings</option>
                <option value="Brooding (1-4 weeks)">Brooding (1-4 weeks)</option>
                <option value="Growers (4-8 weeks)">Growers (4-8 weeks)</option>
                <option value="Point of Lay (16-20 weeks)">Point of Lay (16-20 weeks)</option>
                <option value="Adult Layers / Finishers">Adult Layers / Finishers</option>
                <option value="Fingerlings / Juveniles (Fish)">Fingerlings / Juveniles (Fish)</option>
                <option value="Other Stage">Other Stage</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase text-slate-300">
                Housing / Pen / Pond
              </label>
              <input
                type="text"
                value={housing}
                onChange={(e) => setHousing(e.target.value)}
                placeholder="e.g. Poultry Shed A, Pond #2, Barn 3"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Registration Date */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Registration Date
          </label>
          <input
            type="date"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
          />
        </div>

        {/* Purpose */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Primary Purpose
          </label>
          <select
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value)
              if (e.target.value === 'Breeding' && setIncludeBreeding) setIncludeBreeding(true)
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
          >
            {PURPOSE_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
          General Notes / Characteristics (Optional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Healthy, vaccinated on arrival, good appetite, gentle temperament..."
          className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none resize-none"
        />
      </div>

      {/* Navigation hints */}
      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <span>Continue to Purchase &amp; Origin</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

