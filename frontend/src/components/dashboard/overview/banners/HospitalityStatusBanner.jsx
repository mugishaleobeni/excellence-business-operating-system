import React from 'react'
import {
  UtensilsCrossed,
  Bed,
  AlertTriangle,
  ArrowUpRight,
  Flame,
  CheckCircle2
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import { FOOD_HOSPITALITY_PRESETS } from '../../food-hospitality/data/foodHospitalityPresets'

export default function HospitalityStatusBanner({
  handleModuleClick = () => {},
  setActivePage = () => {}
}) {
  const { demoWorkspaces, foodTrade = 'combined' } = useExbos()
  const currentPreset = FOOD_HOSPITALITY_PRESETS[foodTrade] || FOOD_HOSPITALITY_PRESETS.combined
  const workspace = demoWorkspaces?.['food-and-hospitality'] || {}
  const records = workspace.records || {}

  const kitchenOrders = Array.isArray(records['KitchenOrders']) && records['KitchenOrders'].length > 0
    ? records['KitchenOrders']
    : currentPreset.kitchenOrders || []

  const rooms = Array.isArray(records['Rooms']) && records['Rooms'].length > 0
    ? records['Rooms']
    : currentPreset.rooms || []

  const ingredients = Array.isArray(records['Ingredients']) && records['Ingredients'].length > 0
    ? records['Ingredients']
    : currentPreset.ingredients || []

  const activeOrders = kitchenOrders.filter(
    (o) => o.status === 'Pending' || o.status === 'Cooking'
  )

  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied')
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0

  const lowStockIngredients = ingredients.filter(
    (ing) => Number(ing.currentStock || 0) <= Number(ing.minStockLevel || 5)
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Live Kitchen Order Queue */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Kitchen Queue</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
            {activeOrders.length} In Prep
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {activeOrders.length} Active KOT
          </div>
          <p className="text-[11px] text-slate-300">
            {kitchenOrders.length} total orders logged today · Dining &amp; Room service
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-amber-300 font-semibold text-[11px]">
            {currentPreset.name}
          </span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Restaurant & Bar')
              setActivePage('Orders & Kitchen Queue')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Kitchen Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Room Occupancy & Lodging */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-sky-400" />
            <span>Room Occupancy</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-300">
            {occupancyRate}% Occupied
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {occupiedRooms.length} / {rooms.length} Rooms
          </div>
          <p className="text-[11px] text-slate-300">
            {rooms.length - occupiedRooms.length} rooms ready for check-in
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Consolidated Folio Billing</span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Rooms & Lodging')
              setActivePage('Rooms Register')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Rooms Register</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Ingredient Stock & Reorder Alerts */}
      <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <span>Kitchen Pantry Stock</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              lowStockIngredients.length > 0
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {lowStockIngredients.length > 0
              ? `${lowStockIngredients.length} Low Stock`
              : 'Optimal Stock'}
          </span>
        </div>
        <div className="space-y-1">
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
            {ingredients.length} Ingredients
          </div>
          <p className="text-[11px] text-slate-300">
            Auto-deductions active on completed kitchen dishes
          </p>
        </div>
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            {lowStockIngredients.length > 0
              ? `${lowStockIngredients[0].name} reorder needed`
              : 'Zero stock bottlenecks'}
          </span>
          <button
            type="button"
            onClick={() => {
              handleModuleClick('Ingredients & Stock')
              setActivePage('Kitchen Ingredients')
            }}
            className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <span>Pantry Stock</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

