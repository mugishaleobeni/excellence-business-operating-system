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
import HospitalityStatusBanner from './banners/HospitalityStatusBanner'
import HybridStatusBanner from './banners/HybridStatusBanner'

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

  // 2. FOOD & HOSPITALITY ARCHITECTURE REAL-TIME STATUS
  if (activeArchId === 'food-and-hospitality') {
    return (
      <HospitalityStatusBanner
        handleModuleClick={handleModuleClick}
        setActivePage={setActivePage}
      />
    )
  }

  // 3. HYBRID ENTERPRISE ARCHITECTURE REAL-TIME STATUS
  if (activeArchId === 'hybrid') {
    return (
      <HybridStatusBanner
        handleModuleClick={handleModuleClick}
        setActivePage={setActivePage}
      />
    )
  }

  // 4. LIVESTOCK ARCHITECTURE REAL-TIME STATUS
  if (activeArchId !== 'agriculture') return null

  const workspace = demoWorkspaces?.['agriculture'] || {}
  const records = workspace.records || {}
  const animalsList = Array.isArray(records['Animals']) ? records['Animals'] : []
  const batchesList = Array.isArray(records['Batches']) ? records['Batches'] : []
  const feedsList = Array.isArray(records['Feeds']) ? records['Feeds'] : []
  const healthList = Array.isArray(records['HealthRecords']) ? records['HealthRecords'] : []

  // Active (unsold) breeding animals
  const activeAnimals = animalsList.filter((a) => !a.healthStatus?.toLowerCase().includes('sold'))
  const totalBreedingHeads = activeAnimals.length
  const totalBatchHeads = batchesList.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
  const totalHerdPopulation = totalBreedingHeads + totalBatchHeads

  // Species Aggregations - dynamically derived strictly from registered animals
  const speciesData = {}
  activeAnimals.forEach((a) => {
    const sp = a.type || 'Pigs'
    if (!speciesData[sp]) {
      speciesData[sp] = { individual: 0, batch: 0, males: 0, females: 0, young: 0, total: 0 }
    }
    speciesData[sp].individual += 1
    speciesData[sp].total += 1
    if (a.sex === 'Male') speciesData[sp].males += 1
    if (a.sex === 'Female') speciesData[sp].females += 1
    if ((Number(a.ageMonths) || 0) < 3) speciesData[sp].young += 1
  })

  batchesList.forEach((b) => {
    const sp = b.type || 'Pigs'
    const qty = Number(b.quantity) || 0
    if (!speciesData[sp]) {
      speciesData[sp] = { individual: 0, batch: 0, males: 0, females: 0, young: 0, total: 0 }
    }
    speciesData[sp].batch += qty
    speciesData[sp].total += qty
  })

  const speciesKeys = Object.keys(speciesData)

  // Dynamic feed duration
  const totalFeedKg = feedsList.reduce((sum, f) => sum + (Number(f.currentStockKg) || 0), 0)
  const dailyIntakeKg =
    activeAnimals.reduce(
      (sum, a) =>
        sum +
        (Number(a.dailyRationKg) ||
          (a.type === 'Pigs' ? 2.0 : a.type === 'Chickens' ? 0.125 : 8.0)),
      0
    ) +
    batchesList.reduce(
      (sum, b) =>
        sum +
        (Number(b.quantity) || 0) *
          (Number(b.dailyRationKg) ||
            (b.type === 'Pigs' ? 1.8 : b.type === 'Chickens' ? 0.125 : 8.0)),
      0
    )

  const feedDaysNum = dailyIntakeKg > 0 ? totalFeedKg / dailyIntakeKg : 0
  const feedDaysDisplay =
    dailyIntakeKg > 0
      ? `${feedDaysNum.toFixed(1)} Days`
      : totalFeedKg > 0
      ? 'Reserves Available'
      : '0 Days'
  const feedStockBadge =
    feedDaysNum > 14
      ? 'Optimal Stock'
      : feedDaysNum > 5
      ? 'Reorder Soon'
      : 'Low Stock'

  // Dynamic Upcoming Vet Dates
  const pendingVet = healthList
    .filter(
      (h) =>
        h.nextDate ||
        h.status === 'Scheduled' ||
        h.status === 'Pending' ||
        h.treatment
    )
    .slice(0, 3)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Animals by Type */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Livestock by Type</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
            {totalHerdPopulation} Total Heads
          </span>
        </div>

        <div className="space-y-1.5 text-xs min-h-[66px]">
          {speciesKeys.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">
              No livestock registered yet. Click below to add your first animal or batch.
            </p>
          ) : (
            speciesKeys.map((sp) => {
              const d = speciesData[sp]
              const details = []
              if (d.females > 0) details.push(`${d.females} Females`)
              if (d.males > 0) details.push(`${d.males} Males`)
              if (d.batch > 0) details.push(`${d.batch} in Batches`)

              return (
                <div key={sp} className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">{sp}:</span>
                  <span className="font-bold text-white font-mono">
                    {d.total} heads {details.length > 0 ? `(${details.join(', ')})` : ''}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold text-[11px]">
            {totalBreedingHeads} Breeders · {totalBatchHeads} Batched
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
            <span>Feed Reserves Remaining</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              feedDaysNum > 14
                ? 'bg-[#218DFF]/20 text-[#9EDCFF]'
                : feedDaysNum > 5
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {feedStockBadge}
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {feedDaysDisplay}
          </div>
          <p className="text-[11px] text-slate-300">
            {totalFeedKg.toLocaleString()} kg total feed in store ·{' '}
            {dailyIntakeKg > 0
              ? `${dailyIntakeKg.toFixed(1)} kg/day intake`
              : 'Record daily rations'}
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-300 text-[11px]">
            {feedsList.length} Feed formulations tracked
          </span>
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
            <span>Scheduled Vet Care</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
            {pendingVet.length > 0 ? `${pendingVet.length} Scheduled` : 'Up to Date'}
          </span>
        </div>
        <div className="space-y-1.5 text-xs min-h-[66px]">
          {pendingVet.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">
              All vaccinations &amp; health checks up to date. Zero urgent interventions pending.
            </p>
          ) : (
            pendingVet.map((vet, idx) => (
              <div key={vet.id || idx} className="flex items-center justify-between">
                <span className="text-slate-300 truncate max-w-[160px]">
                  {vet.diagnosis || vet.treatment || 'Routine Booster'}:
                </span>
                <span className="text-amber-300 font-bold font-mono">
                  {vet.nextDate || vet.date || 'Scheduled'}
                </span>
              </div>
            ))
          )}
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
