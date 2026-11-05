import React from 'react'
import {
  Activity,
  Wheat,
  HeartPulse,
  ArrowUpRight
} from 'lucide-react'

export default function IndustryStatusBanner({
  activeArchId = 'buy-and-sell',
  handleModuleClick = () => {},
  setActivePage = () => {}
}) {
  if (activeArchId !== 'agriculture') return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Animals by Type */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Animals by Type</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
            63 Herd Total
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">🐷 Pigs (Swine):</span>
            <span className="font-bold text-white font-mono">
              57 (12 Gilts, 8 Sows, 3 Boars, 34 Piglets)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">🐔 Poultry:</span>
            <span className="font-bold text-white font-mono">
              750 (450 Layers, 300 Broilers)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">🐄 Dairy Cattle:</span>
            <span className="font-bold text-white font-mono">6 (4 Cows, 2 Calves)</span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold text-[11px]">
            Breeding Ready: 100%
          </span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Livestock')
              setActivePage('Animal Register')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Animal Register</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Feed Days Left */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
            <Wheat className="w-4 h-4 text-[#218DFF]" />
            <span>Feed Days Left</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF]">
            Optimal Stock
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            18.5 Days
          </div>
          <p className="text-[11px] text-slate-300">
            520 kg Tunga Feed &amp; Premix in store · 28 kg/day herd intake
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-300 text-[11px]">Run-out forecast: Nov 20</span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Livestock')
              setActivePage('Feed Management')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Log Feeding</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Vet Dates Due */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <HeartPulse className="w-4 h-4 text-amber-400" />
            <span>Vet Dates Due</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
            3 Upcoming
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Piglet Iron Injection:</span>
            <span className="text-amber-300 font-bold font-mono">Due in 2 days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Breeder Sow Deworming:</span>
            <span className="text-amber-300 font-bold font-mono">Due in 5 days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Erysipelas Booster:</span>
            <span className="text-slate-400 font-mono">Due in 12 days</span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Biosecurity Level: High</span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Livestock')
              setActivePage('Health & Vet Care')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Vet Care</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

