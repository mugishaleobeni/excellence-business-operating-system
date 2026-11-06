import React from 'react'
import {
  Activity,
  Layers,
  Clock,
  Egg,
  Milk,
  HeartPulse,
  TrendingUp,
  Scale
} from 'lucide-react'

export default function AgricultureKpiCards({
  animals = [],
  batches = [],
  feeds = [],
  gestations = [],
  production = [],
  onNavigateTab
}) {
  const totalBreedingHeads = animals.filter((a) => !a.healthStatus?.toLowerCase().includes('sold')).length
  const totalBatchHeads = batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
  const totalPopulation = totalBreedingHeads + totalBatchHeads

  const totalFeedKg = feeds.reduce((sum, f) => sum + (Number(f.currentStockKg) || 0), 0)
  const activeGestations = gestations.filter((g) => !g.status?.includes('Completed')).length
  const totalStoredYields = production.reduce(
    (sum, p) => sum + (Number(p.remainingInStorage) || Number(p.quantity) || 0),
    0
  )

  const hasPoultry =
    animals.some((a) => /chicken|poultry|layer|broiler|hen/i.test(a.type || a.breed)) ||
    batches.some((b) => /chicken|poultry|layer|broiler|hen/i.test(b.type || b.breed))
  const hasDairy =
    animals.some((a) => /cow|cattle|dairy|bovine/i.test(a.type || a.breed)) ||
    batches.some((b) => /cow|cattle|dairy|bovine/i.test(b.type || b.breed))
  const hasPigs =
    animals.some((a) => /pig|swine/i.test(a.type || a.breed)) ||
    batches.some((b) => /pig|swine/i.test(b.type || b.breed))

  const yieldLabel = hasPoultry
    ? 'Egg Yields'
    : hasDairy
    ? 'Milk Yields'
    : hasPigs
    ? 'Farm Output'
    : 'Yields in Store'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Herd Population */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Livestock', 'Animal Register')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            Herd Population
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
          {totalPopulation} Heads
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
          {totalBreedingHeads} breeders · {totalBatchHeads} in batches
        </div>
      </button>

      {/* 2. Feed Stock Remaining */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Livestock', 'Feed Management')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            Feed Reserves
          </span>
          <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-sky-300 mt-1">
          {totalFeedKg.toLocaleString()} kg
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {feeds.length} Feed rations configured
        </div>
      </button>

      {/* 3. Gestating Dams */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Livestock', 'Breeding & Births')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            Breeding Cycles
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-emerald-300 mt-1">
          {activeGestations} Active
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Gestation &amp; farrowing timeline
        </div>
      </button>

      {/* 4. Production Storage */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Livestock', 'Daily Production')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            {yieldLabel}
          </span>
          <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            {hasPoultry ? (
              <Egg className="w-3.5 h-3.5" />
            ) : hasDairy ? (
              <Milk className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-teal-300 mt-1">
          {totalStoredYields} Units
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {production.length} Daily production logs
        </div>
      </button>
    </div>
  )
}

