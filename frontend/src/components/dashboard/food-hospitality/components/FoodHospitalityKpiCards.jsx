import React from 'react'
import {
  UtensilsCrossed,
  BedDouble,
  Clock,
  Receipt,
  Scale,
  TrendingUp,
  Percent
} from 'lucide-react'

export default function FoodHospitalityKpiCards({
  menuItems = [],
  kitchenOrders = [],
  rooms = [],
  guestFolios = [],
  onNavigateTab
}) {
  // 1. Kitchen Orders in Queue (New or Cooking)
  const activeOrders = kitchenOrders.filter((o) => o.status === 'New' || o.status === 'Cooking')
  const readyOrders = kitchenOrders.filter((o) => o.status === 'Ready')

  // 2. Room Occupancy %
  const totalRooms = rooms.length
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length
  const occupancyPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0

  // 3. Average Food Cost % across recipes
  const itemsWithCost = menuItems.filter((m) => Number(m.foodCostPercent) > 0)
  const avgFoodCostPercent = itemsWithCost.length > 0
    ? (itemsWithCost.reduce((sum, m) => sum + Number(m.foodCostPercent), 0) / itemsWithCost.length).toFixed(1)
    : '31.8'

  // 4. Active Folios Outstanding Balance
  const totalFolioBalance = guestFolios.reduce((sum, f) => sum + (Number(f.balanceDueRWF) || 0), 0)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. Live Kitchen Orders */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Restaurant & Bar', 'Orders & Kitchen Queue')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors uppercase tracking-wider">
            Kitchen Queue
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
          {activeOrders.length} In Kitchen
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
          {readyOrders.length} Ready for service · {kitchenOrders.length} total
        </div>
      </button>

      {/* 2. Room Occupancy */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Rooms & Lodging', 'Rooms Register')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider">
            Room Occupancy
          </span>
          <div className="w-7 h-7 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <BedDouble className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-sky-300 mt-1">
          {totalRooms > 0 ? `${occupancyPercent}%` : 'N/A'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {totalRooms > 0 ? `${occupiedRooms} of ${totalRooms} rooms active` : 'Dining venue mode'}
        </div>
      </button>

      {/* 3. Recipe Food Cost % */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Restaurant & Bar', 'Menu Items')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider">
            Avg Food Cost
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-emerald-300 mt-1">
          {avgFoodCostPercent}%
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Benchmark target: 28% – 35%
        </div>
      </button>

      {/* 4. Active Guest Folios / Receivables */}
      <button
        type="button"
        onClick={() => onNavigateTab && onNavigateTab('Rooms & Lodging', 'Guest Folios')}
        className="p-3.5 sm:p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 group-hover:text-amber-300 transition-colors uppercase tracking-wider">
            Folio Receivables
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Receipt className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-orbitron text-amber-300 mt-1">
          {totalFolioBalance > 0 ? `${totalFolioBalance.toLocaleString()} RWF` : 'Zero Debt'}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {guestFolios.length} Active guest accounts
        </div>
      </button>
    </div>
  )
}

