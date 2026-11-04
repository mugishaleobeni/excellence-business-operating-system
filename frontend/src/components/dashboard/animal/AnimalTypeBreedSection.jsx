import React from 'react'
import { Search, ArrowRight, Layers } from 'lucide-react'

export default function AnimalTypeBreedSection({
  typeSearch,
  setTypeSearch,
  filteredCategories = [],
  activeCategoryInfo = {},
  selectedCategory,
  setSelectedCategory,
  animalType,
  setAnimalType,
  customAnimalType,
  setCustomAnimalType,
  availableBreeds = [],
  breed,
  setBreed,
  customBreed,
  setCustomBreed,
  onContinue
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white font-orbitron">
            Select Animal Species
          </h4>
          <p className="text-xs text-slate-400">
            Choose category or search. The registration interface adapts dynamically to the chosen species.
          </p>
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            placeholder="Search (e.g. Pig, Cow, Hen, Tilapia)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
          />
        </div>
      </div>

      {/* Grid of Species */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 max-h-56 overflow-y-auto pr-1">
        {filteredCategories.map((cat) => {
          const isSelected = activeCategoryInfo.category === cat.category
          return (
            <button
              key={cat.category}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.category)
                setAnimalType(cat.types[0])
              }}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#218DFF]/25 border-[#218DFF] text-white shadow-[0_0_15px_rgba(33,141,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold leading-tight">{cat.category}</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                {cat.types.slice(0, 2).join(', ')}
              </span>
            </button>
          )
        })}
      </div>

      {/* If selected category has multiple sub-types (e.g. Cow, Bull, Calf) */}
      {activeCategoryInfo.types && activeCategoryInfo.types.length > 1 && (
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Specific Animal Type in {activeCategoryInfo.category}</span>
            </label>
            <span className="text-[10px] text-slate-400">
              Selected: <strong>{animalType}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {activeCategoryInfo.types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAnimalType(t)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  animalType === t
                    ? 'bg-[#218DFF] text-white shadow-md'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Animal Type input if Other Animals selected */}
      {animalType === 'Custom Animal Type' && (
        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Enter Custom Animal Type *
          </label>
          <input
            type="text"
            required
            value={customAnimalType}
            onChange={(e) => setCustomAnimalType(e.target.value)}
            placeholder="e.g. Ostrich, Alpaca, Silkworm, Snail"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF]"
          />
        </div>
      )}

      {/* Dynamic Breed Selection */}
      <div className="p-4 rounded-2xl bg-[#03091F]/70 border border-[#218DFF]/30 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
            Breed for {animalType}
          </label>
          <span className="text-[10px] text-slate-400 italic">
            Species-specific breed catalog
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableBreeds.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBreed(b)}
              className={`px-3 py-2 rounded-xl text-xs font-medium text-left truncate transition-all cursor-pointer ${
                breed === b
                  ? 'bg-[#218DFF] text-white font-bold border border-white/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {breed === 'Other' && (
          <div className="space-y-1 pt-2">
            <label className="block text-[10px] font-bold uppercase text-slate-300">
              Specify Breed Name *
            </label>
            <input
              type="text"
              required
              value={customBreed}
              onChange={(e) => setCustomBreed(e.target.value)}
              placeholder="e.g. Pietrain × Landrace F1 Cross, Local Mixed"
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
            />
          </div>
        )}
      </div>

      {/* Next Step hint */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5"
        >
          <span>Continue to Basic Information</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

