import React from 'react'
import {
  Activity,
  Wheat,
  HeartPulse,
  ArrowUpRight,
  CalendarCheck,
  Coins,
  Package,
  AlertTriangle,
  Sparkles
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { SERVICE_PRESETS } from '../services/data/servicePresets'

export default function IndustryStatusBanner({
  activeArchId = 'buy-and-sell',
  handleModuleClick = () => {},
  setActivePage = () => {}
}) {
  const { demoWorkspaces, serviceTrade = 'salon' } = useExbos()

  // 1. SERVICES ARCHITECTURE REAL-TIME STATUS
  if (activeArchId === 'services') {
    const currentPreset = SERVICE_PRESETS[serviceTrade] || SERVICE_PRESETS.salon
    const workspace = demoWorkspaces?.['services'] || {}
    const records = workspace.records || {}

    const jobs = Array.isArray(records['Jobs']) && records['Jobs'].length > 0
      ? records['Jobs']
      : currentPreset.jobs || []

    const staff = Array.isArray(records['Staff']) && records['Staff'].length > 0
      ? records['Staff']
      : currentPreset.staff || []

    const consumables = Array.isArray(records['Consumables']) && records['Consumables'].length > 0
      ? records['Consumables']
      : currentPreset.consumables || []

    const activeJobs = jobs.filter((j) => j.status === 'Booked' || j.status === 'In Progress')
    const completedJobs = jobs.filter((j) => j.status === 'Completed')

    const totalRevenueRWF = jobs.reduce(
      (sum, j) => sum + (Number(j.depositPaidRWF) || 0) + (j.status === 'Completed' ? (Number(j.balanceDueRWF) || 0) : 0),
      0
    )

    const totalCommissionsRWF = completedJobs.reduce((sum, j) => {
      const s = staff.find((m) => m.id === j.staffId || m.name === j.staffName)
      const commPct = s?.commissionPct || 25
      return sum + Math.round(((Number(j.priceRWF) || 0) * commPct) / 100)
    }, 0)

    const lowConsumables = consumables.filter(
      (c) => Number(c.currentStock || 0) <= Number(c.reorderLevel || 5)
    )

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Active Bookings & Stations */}
        <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-sky-400" />
              <span>Active Work Orders</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
              {activeJobs.length} In Pipeline
            </span>
          </div>
          <div className="space-y-1">
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
              {jobs.length} Bookings
            </div>
            <p className="text-[11px] text-slate-300">
              {activeJobs.length} active on floor · {completedJobs.length} completed &amp; invoiced
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-sky-300 font-semibold text-[11px]">
              {currentPreset.name}
            </span>
            <button
              type="button"
              onClick={() => {
                handleModuleClick('Jobs & Bookings')
                setActivePage('All Jobs')
              }}
              className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
            >
              <span>Job Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Staff & Commissions */}
        <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Staff Commissions Accrued</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
              {staff.length} Active Staff
            </span>
          </div>
          <div className="space-y-1">
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
              {totalCommissionsRWF.toLocaleString()} RWF
            </div>
            <p className="text-[11px] text-slate-300">
              Revenue delivered: {totalRevenueRWF.toLocaleString()} RWF
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-300 text-[11px]">Daily Payout Engine</span>
            <button
              type="button"
              onClick={() => {
                handleModuleClick('Settings')
                setActivePage('Staff & Commissions')
              }}
              className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
            >
              <span>Staff Roster</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Consumable Supplies Status */}
        <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Consumables &amp; Supplies</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              lowConsumables.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {lowConsumables.length > 0 ? `${lowConsumables.length} Low Stock` : 'Supplies Full'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
              {consumables.length} Tracked Supplies
            </div>
            <p className="text-[11px] text-slate-300">
              {lowConsumables.length > 0
                ? `${lowConsumables.map((c) => c.name).slice(0, 2).join(', ')} low`
                : 'All critical supplies above reorder threshold'}
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Usage Auto-Deducted</span>
            <button
              type="button"
              onClick={() => {
                handleModuleClick('Services')
                setActivePage('Consumables & Supplies')
              }}
              className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
            >
              <span>Restock Supplies</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. AGRICULTURE ARCHITECTURE
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
            <span className="text-slate-300 font-medium">Pigs (Swine):</span>
            <span className="font-bold text-white font-mono">
              57 (12 Gilts, 8 Sows, 3 Boars, 34 Piglets)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Poultry:</span>
            <span className="font-bold text-white font-mono">
              750 (450 Layers, 300 Broilers)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Dairy Cattle:</span>
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
