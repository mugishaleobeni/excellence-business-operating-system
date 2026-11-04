import React from "react";
import { Sparkles } from "lucide-react";

export default function BreedingDetailsSection({
  includeBreeding,
  setIncludeBreeding,
  animalType,
  sex,
  isPig,
  isFemale,
  isMale,
  isChicken,
  isCattle,
  isGoatOrSheep,
  isRuminant,
  isMammal,
  activeCategoryInfo = {},
  breedingPurpose,
  setBreedingPurpose,
  breedingStatus,
  setBreedingStatus,
  lastMatingDate,
  setLastMatingDate,
  matingPartner,
  setMatingPartner,
  matingMethod,
  setMatingMethod,
  expectedBirthDate,
  setExpectedBirthDate,
  previousLitters,
  setPreviousLitters,
  totalOffspring,
  setTotalOffspring,
  bornAlive,
  setBornAlive,
  stillborn,
  setStillborn,
  weaned,
  setWeaned,
  availableForBreeding,
  setAvailableForBreeding,
  successfulMatings,
  setSuccessfulMatings,
  matingHistory,
  setMatingHistory,
  layingStatus,
  setLayingStatus,
  dailyEggs,
  setDailyEggs,
  roosterAssociation,
  setRoosterAssociation,
  incubationDate,
  setIncubationDate,
  chicksHatched,
  setChicksHatched,
  gestationDays,
  breedingNotes,
  setBreedingNotes,
  onBack
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Skip toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div>
                    <strong className="text-xs font-bold text-white block">
                      Include Reproductive &amp; Breeding Details?
                    </strong>
                    <p className="text-[11px] text-slate-400">
                      Tailored to {animalType} ({sex}). Skip if animal is strictly for meat or not currently used for breeding.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBreeding}
                      onChange={(e) => setIncludeBreeding(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#218DFF]"></div>
                  </label>
                </div>

                {includeBreeding && (
                  <div className="space-y-4">
                    {/* FEMALE PIG (SOW / GILT) SPECIALIZED BREEDING */}
                    {isPig && isFemale && (
                      <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-orbitron font-bold text-[#9EDCFF] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Female Pig Reproduction · Gestation ~114 Days</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            3 Months · 3 Weeks · 3 Days
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Breeding Purpose
                            </label>
                            <input
                              type="text"
                              value={breedingPurpose}
                              onChange={(e) => setBreedingPurpose(e.target.value)}
                              placeholder="e.g. Commercial Piglets, Gilt Multiplier"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Reproductive Status
                            </label>
                            <select
                              value={breedingStatus}
                              onChange={(e) => setBreedingStatus(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                            >
                              <option value="Ready for Breeding">Ready for Breeding (Open / Cycling)</option>
                              <option value="In Pig (Pregnant / Gestating)">In Pig (Pregnant / Gestating)</option>
                              <option value="Lactating (Nursing Piglets)">Lactating (Nursing Piglets)</option>
                              <option value="Dry / Resting">Dry / Resting</option>
                              <option value="Retired">Retired / Culled</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Mating Method
                            </label>
                            <select
                              value={matingMethod}
                              onChange={(e) => setMatingMethod(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                            >
                              <option value="Natural Service">Natural Service (Boar)</option>
                              <option value="Artificial Insemination (AI)">Artificial Insemination (AI)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-[#9EDCFF]">
                              Last Mating Date
                            </label>
                            <input
                              type="date"
                              value={lastMatingDate}
                              onChange={(e) => setLastMatingDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-[#9EDCFF]">
                              Mating Partner / Boar ID
                            </label>
                            <input
                              type="text"
                              value={matingPartner}
                              onChange={(e) => setMatingPartner(e.target.value)}
                              placeholder="e.g. Boar #01 or Tag #LR-BOAR"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-emerald-400">
                              Expected Farrowing Date (~114 days)
                            </label>
                            <input
                              type="date"
                              value={expectedBirthDate}
                              onChange={(e) => setExpectedBirthDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-bold text-emerald-300 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Litter history */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/10">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-slate-300">
                              Prev Litters
                            </label>
                            <input
                              type="number"
                              value={previousLitters}
                              onChange={(e) => setPreviousLitters(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-slate-300">
                              Total Born
                            </label>
                            <input
                              type="number"
                              value={totalOffspring}
                              onChange={(e) => setTotalOffspring(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-emerald-300">
                              Born Alive
                            </label>
                            <input
                              type="number"
                              value={bornAlive}
                              onChange={(e) => setBornAlive(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-emerald-300 font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-rose-300">
                              Stillborn
                            </label>
                            <input
                              type="number"
                              value={stillborn}
                              onChange={(e) => setStillborn(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-rose-300"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold uppercase text-[#9EDCFF]">
                              Weaned
                            </label>
                            <input
                              type="number"
                              value={weaned}
                              onChange={(e) => setWeaned(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs text-[#9EDCFF] font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MALE PIG (BOAR) SPECIALIZED BREEDING */}
                    {isPig && isMale && (
                      <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/40 space-y-3">
                        <span className="text-xs font-orbitron font-bold text-[#9EDCFF] block">
                          Boar Breeding &amp; Stud Details
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Stud Status
                            </label>
                            <select
                              value={breedingStatus}
                              onChange={(e) => setBreedingStatus(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
                            >
                              <option value="Active Stud Boar">Active Stud Boar</option>
                              <option value="In Training / Young Boar">In Training / Young Boar</option>
                              <option value="Resting">Resting</option>
                              <option value="Retired">Retired / Culled</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Available for Service?
                            </label>
                            <select
                              value={availableForBreeding ? 'Yes' : 'No'}
                              onChange={(e) => setAvailableForBreeding(e.target.value === 'Yes')}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
                            >
                              <option value="Yes">Yes · Ready for Service</option>
                              <option value="No">No · Resting / Inactive</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Successful Matings
                            </label>
                            <input
                              type="number"
                              value={successfulMatings}
                              onChange={(e) => setSuccessfulMatings(e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CHICKENS / POULTRY SPECIALIZED BREEDING */}
                    {isChicken && (
                      <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/40 space-y-3">
                        <span className="text-xs font-orbitron font-bold text-[#9EDCFF] block">
                          Poultry Production &amp; Hatching Details
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Production Purpose
                            </label>
                            <select
                              value={breedingPurpose}
                              onChange={(e) => setBreedingPurpose(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
                            >
                              <option value="Eggs (Layers)">Eggs (Layers)</option>
                              <option value="Meat (Broilers)">Meat (Broilers)</option>
                              <option value="Breeding & Hatching">Breeding &amp; Hatching</option>
                              <option value="Dual Purpose">Dual Purpose</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Laying Status
                            </label>
                            <select
                              value={layingStatus}
                              onChange={(e) => setLayingStatus(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
                            >
                              <option value="Point of Lay (16-20 wks)">Point of Lay (16-20 wks)</option>
                              <option value="Active Layer (Peak)">Active Layer (Peak)</option>
                              <option value="Broody">Broody (Sitting)</option>
                              <option value="Moulting">Moulting (Resting)</option>
                              <option value="Spent Layer">Spent Layer</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Daily Average Eggs
                            </label>
                            <input
                              type="number"
                              value={dailyEggs}
                              onChange={(e) => setDailyEggs(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-[#9EDCFF]">
                              Incubation Start Date
                            </label>
                            <input
                              type="date"
                              value={incubationDate}
                              onChange={(e) => setIncubationDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-emerald-400">
                              Expected Hatch Date (~21 days)
                            </label>
                            <input
                              type="date"
                              value={expectedBirthDate}
                              onChange={(e) => setExpectedBirthDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Chicks Hatched (Output)
                            </label>
                            <input
                              type="number"
                              value={chicksHatched}
                              onChange={(e) => setChicksHatched(e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CATTLE, GOATS, SHEEP, MAMMALS */}
                    {(isCattle || isGoatOrSheep || (isMammal && !isPig)) && (
                      <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-xs font-orbitron font-bold text-[#9EDCFF]">
                            {animalType} Breeding &amp; Pregnancy Tracker
                          </span>
                          <span className="text-[10px] text-emerald-400">
                            Gestation: ~{activeCategoryInfo.gestationDays} Days ({activeCategoryInfo.gestationTerm})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Breeding Status
                            </label>
                            <select
                              value={breedingStatus}
                              onChange={(e) => setBreedingStatus(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
                            >
                              <option value="Ready for Service">Ready for Service (Open)</option>
                              <option value="Pregnant (Confirmed)">Pregnant / In Calf / In Kid</option>
                              <option value="Lactating">Lactating / Nursing</option>
                              <option value="Dry">Dry Period</option>
                              <option value="Retired">Retired</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Last Service / Mating Date
                            </label>
                            <input
                              type="date"
                              value={lastMatingDate}
                              onChange={(e) => setLastMatingDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-emerald-400">
                              Expected {activeCategoryInfo.gestationTerm} Date
                            </label>
                            <input
                              type="date"
                              value={expectedBirthDate}
                              onChange={(e) => setExpectedBirthDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Sire / Bull / Buck ID
                            </label>
                            <input
                              type="text"
                              value={matingPartner}
                              onChange={(e) => setMatingPartner(e.target.value)}
                              placeholder="e.g. Bull #03 or AI Straw Code"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Previous Calvings / Births
                            </label>
                            <input
                              type="number"
                              value={previousLitters}
                              onChange={(e) => setPreviousLitters(e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase text-slate-300">
                              Total Offspring Born
                            </label>
                            <input
                              type="number"
                              value={totalOffspring}
                              onChange={(e) => setTotalOffspring(e.target.value)}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Breeding Notes */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                    Breeding Observations / Vet Notes
                  </label>
                  <textarea
                    rows={2}
                    value={breedingNotes}
                    onChange={(e) => setBreedingNotes(e.target.value)}
                    placeholder="e.g. Heat detected naturally, serviced in morning, healthy recovery..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white resize-none focus:outline-none"
                  />
                </div>

      <div className="flex justify-start pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-300"
        >
          Back
        </button>
      </div>
    </div>
  );
}
