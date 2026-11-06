import React, { useState } from 'react'
import {
  Scale,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import LogKitchenWasteModal from '../modals/LogKitchenWasteModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function IngredientsStockWorkspace() {
  const { demoWorkspaces, addDemoRecord, deleteDemoRecord } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const ingredientsList = archData.records?.Ingredients || []
  const wasteList = archData.records?.WasteLogs || []

  const [wasteModalOpen, setWasteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const totalStockValue = ingredientsList.reduce(
    (sum, ing) => sum + (Number(ing.currentStock) || 0) * (Number(ing.unitCostRWF) || 0),
    0
  )
  const totalWasteValue = wasteList.reduce((sum, w) => sum + (Number(w.estimatedCostRWF) || 0), 0)
  const lowStockCount = ingredientsList.filter(
    (ing) => (Number(ing.currentStock) || 0) <= (Number(ing.reorderLevel) || 5)
  ).length

  const handleSaveWaste = (wasteData) => {
    addDemoRecord('food-and-hospitality', 'WasteLogs', wasteData)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('food-and-hospitality', 'Ingredients', deleteTarget.id)
    setDeleteTarget(null)
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 03 &amp; 04 · Kitchen Inventory &amp; Waste
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Kitchen Ingredients &amp; Spoilage Ledger
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Auto-deducted ingredient stock paired with a zero-tolerance kitchen waste tracking ledger
          </p>
        </div>

        <button
          onClick={() => setWasteModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
          <span>Log Kitchen Waste</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Ingredient Store Value
          </span>
          <div className="text-2xl font-bold font-orbitron text-white mt-1">
            {formatRWF(totalStockValue)}
          </div>
          <span className="text-[10px] text-emerald-400">{ingredientsList.length} Items stocked</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <div className={`text-2xl font-bold font-orbitron mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockCount} Items
          </div>
          <span className="text-[10px] text-slate-400">Below kitchen reorder threshold</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Recorded Waste &amp; Spoilage
          </span>
          <div className="text-2xl font-bold font-orbitron text-rose-400 mt-1">
            {formatRWF(totalWasteValue)}
          </div>
          <span className="text-[10px] text-slate-400">{wasteList.length} Waste logs recorded</span>
        </div>
      </div>

      {/* Ingredients Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            <span>Kitchen Ingredients Stock ({ingredientsList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[700px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Ingredient Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-right">Cost / Unit</th>
                  <th className="py-3 px-4 text-right">Total Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ingredientsList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No ingredients tracked yet. Create menu dishes to register recipe ingredients.
                    </td>
                  </tr>
                ) : (
                  ingredientsList.map((ing) => {
                    const isLow = (Number(ing.currentStock) || 0) <= (Number(ing.reorderLevel) || 5)
                    const val = (Number(ing.currentStock) || 0) * (Number(ing.unitCostRWF) || 0)
                    return (
                      <tr key={ing.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-white">{ing.name}</td>
                        <td className="py-3 px-4 text-slate-400">{ing.category || 'Kitchen Goods'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-white">
                          {ing.currentStock} {ing.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {formatRWF(ing.unitCostRWF)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-300">
                          {formatRWF(val)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isLow
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                            }`}
                          >
                            {isLow ? 'Low Stock' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Waste Logs Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Recorded Kitchen Waste Logs ({wasteList.length})</span>
        </h3>

        <div className="rounded-3xl border border-white/10 bg-[#140808]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[700px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Item Wasted</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4">Reason Code</th>
                  <th className="py-3 px-4 text-right">Cost Loss</th>
                  <th className="py-3 px-4">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {wasteList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      Zero kitchen waste logged. Excellent kitchen portion control!
                    </td>
                  </tr>
                ) : (
                  wasteList.map((w) => (
                    <tr key={w.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-slate-400">{w.date}</td>
                      <td className="py-3 px-4 font-bold text-white">{w.item}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {w.quantity} {w.unit}
                      </td>
                      <td className="py-3 px-4 text-amber-300">{w.reason}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                        -{formatRWF(w.estimatedCostRWF)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{w.loggedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LogKitchenWasteModal
        isOpen={wasteModalOpen}
        onClose={() => setWasteModalOpen(false)}
        ingredients={ingredientsList}
        onSaveWaste={handleSaveWaste}
      />
    </div>
  )
}

