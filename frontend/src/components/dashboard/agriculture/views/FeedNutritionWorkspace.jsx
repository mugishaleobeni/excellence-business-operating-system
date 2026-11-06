import React, { useState, useMemo } from 'react'
import {
  Plus,
  Scale,
  Calendar,
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import LogFeedingModal from '../modals/LogFeedingModal'
import AddFeedStockModal from '../modals/AddFeedStockModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function FeedNutritionWorkspace() {
  const { demoWorkspaces, updateDemoRecord, addDemoRecord, deleteDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const feedList = archData.records?.Feeds || []
  const animalsList = archData.records?.Animals || []
  const batchesList = archData.records?.Batches || []
  const feedingLogs = archData.records?.FeedingLogs || []

  const [logModalOpen, setLogModalOpen] = useState(false)
  const [addFeedModalOpen, setAddFeedModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [activeHeads, setActiveHeads] = useState(() => {
    const totalAnimals = animalsList.length
    const totalBatchHeads = batchesList.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0)
    return totalAnimals + totalBatchHeads || 14
  })
  const [dailyRationKg, setDailyRationKg] = useState('2.0')

  const totalStockKg = useMemo(() => {
    return feedList.reduce((sum, f) => sum + (Number(f.currentStockKg) || 0), 0)
  }, [feedList])

  const totalValueRWF = useMemo(() => {
    return feedList.reduce((sum, f) => sum + (Number(f.currentStockKg) || 0) * (Number(f.costPerKgRWF) || 0), 0)
  }, [feedList])

  const headsNum = Math.max(1, parseInt(activeHeads, 10) || 1)
  const rationNum = Math.max(0.01, parseFloat(dailyRationKg) || 0.1)
  const dailyTotalKg = Math.round(headsNum * rationNum * 10) / 10
  const weeklyTotalKg = Math.round(dailyTotalKg * 7)
  const monthlyTotalKg = Math.round(dailyTotalKg * 30)

  // Run-Out Date Calculation
  const daysRemaining = dailyTotalKg > 0 ? Math.floor(totalStockKg / dailyTotalKg) : 0
  const runOutDateStr = useMemo(() => {
    if (daysRemaining <= 0) return 'Immediate Depletion'
    const d = new Date()
    d.setDate(d.getDate() + daysRemaining)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [daysRemaining])

  const handleSaveFeedStock = (newFeed) => {
    addDemoRecord('agriculture', 'Feeds', newFeed)

    if (newFeed.recordExpense && newFeed.totalPurchaseCostRWF > 0) {
      addTransaction({
        architectureId: 'agriculture',
        title: `Feed Purchase: ${newFeed.name} (${newFeed.currentStockKg} kg)`,
        type: 'out',
        category: 'Feed & Nutrition',
        amountRWF: newFeed.totalPurchaseCostRWF,
        account: 'Cash / Mobile Money',
        source: newFeed.supplier || 'Feed Dealer'
      })
    }
  }

  const handleSaveFeeding = (feedingLog) => {
    // 1. Deduct from feed stock
    const targetFeed = feedList.find((f) => f.id === feedingLog.feedId)
    if (targetFeed) {
      const newStock = Math.max(0, (targetFeed.currentStockKg || 0) - feedingLog.totalKgUsed)
      updateDemoRecord('agriculture', 'Feeds', targetFeed.id, {
        currentStockKg: newStock
      })
    }

    // 2. Record Feeding Log
    addDemoRecord('agriculture', 'FeedingLogs', feedingLog)

    // 3. Update Animal or Batch active daily ration
    if (feedingLog.consumerMode === 'individual' && feedingLog.targetId) {
      updateDemoRecord('agriculture', 'Animals', feedingLog.targetId, {
        assignedFeedName: feedingLog.feedName,
        dailyRationKg: feedingLog.rationPerHeadKg,
        dailyFeedCostRWF: feedingLog.costPerKgRWF * feedingLog.rationPerHeadKg
      })
    } else if (feedingLog.consumerMode === 'batch' && feedingLog.targetId) {
      updateDemoRecord('agriculture', 'Batches', feedingLog.targetId, {
        assignedFeedName: feedingLog.feedName,
        dailyRationKg: feedingLog.rationPerHeadKg,
        dailyFeedCostRWF: feedingLog.totalCostRWF
      })
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('agriculture', 'Feeds', deleteTarget.id)
    setDeleteTarget(null)
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 04 · Feeding &amp; Nutrition Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Feed Management &amp; Stock Depletion
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Add feed inventory, record daily intake per pig/pen/flock, and predict exact stockout dates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setAddFeedModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Package className="w-4 h-4 text-emerald-400" />
            <span>+ Add Feed Stock</span>
          </button>
          <button
            onClick={() => setLogModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Daily Feeding</span>
          </button>
        </div>
      </div>

      {/* Real-time Depletion Predictor Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-[#08201a] to-teal-950/80 border border-emerald-400/40 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 pr-4">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Run-Out Date Forecast
            </span>
            <div className="text-xl font-bold text-white mt-1">
              {runOutDateStr}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{daysRemaining} Days of Feeding Remaining</span>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Daily Need</span>
              <span className="text-base font-bold text-white mt-0.5 block">{dailyTotalKg} kg</span>
              <span className="text-[10px] text-slate-400">({headsNum} heads × {rationNum} kg)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Weekly Need (7d)</span>
              <span className="text-base font-bold text-emerald-300 mt-0.5 block">{weeklyTotalKg} kg</span>
              <span className="text-[10px] text-slate-400">Total ration: 1 week</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">Monthly Need (30d)</span>
              <span className="text-base font-bold text-sky-300 mt-0.5 block">{monthlyTotalKg} kg</span>
              <span className="text-[10px] text-slate-400">30-day forecast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Herd Configuration Sliders / Inputs */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">Adjust Simulation Parameters:</span> change active heads or daily ration to recalculate run-out date.
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Active Heads:</span>
            <input
              type="number"
              min="1"
              value={activeHeads}
              onChange={(e) => setActiveHeads(e.target.value)}
              className="w-16 px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-white font-mono text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ration (kg/head):</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={dailyRationKg}
              onChange={(e) => setDailyRationKg(e.target.value)}
              className="w-16 px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-white font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* Feed Stock Inventory Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            <span>Feed Stock in Store ({feedList.length} Formulas · {totalStockKg} kg on Hand)</span>
          </h3>
          <span className="text-xs font-mono text-slate-300">
            Total Inventory Value: {formatRWF(totalValueRWF)}
          </span>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Feed Formula / Name</th>
                  <th className="py-3 px-3">Brand / Supplier</th>
                  <th className="py-3 px-3">Stock in Store</th>
                  <th className="py-3 px-3">Cost per kg</th>
                  <th className="py-3 px-3">Reorder Alert</th>
                  <th className="py-3 px-3">Stock Status</th>
                  <th className="py-3 px-3">Inventory Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {feedList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No feed inventory found. Click "+ Add Feed Stock" to record your feed purchases.
                    </td>
                  </tr>
                ) : (
                  feedList.map((feed) => {
                    const isLow = (feed.currentStockKg || 0) <= (feed.reorderLevelKg || 100)
                    const bags50kg = Math.floor((feed.currentStockKg || 0) / 50)
                    return (
                      <tr key={feed.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{feed.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{feed.id}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{feed.brand || 'Local Milling'}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-emerald-300 text-sm">
                            {feed.currentStockKg || 0} kg
                          </div>
                          {bags50kg > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ≈ {bags50kg} bags (50kg)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono">{formatRWF(feed.costPerKgRWF)}</td>
                        <td className="py-3 px-3 text-slate-400">{feed.reorderLevelKg || 100} kg</td>
                        <td className="py-3 px-3">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Reorder Needed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Adequate Stock</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-white">
                          {formatRWF((feed.currentStockKg || 0) * (feed.costPerKgRWF || 0))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeleteTarget(feed)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Remove Feed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Modals */}
      <AddFeedStockModal
        isOpen={addFeedModalOpen}
        onClose={() => setAddFeedModalOpen(false)}
        onSaveFeedStock={handleSaveFeedStock}
      />

      <LogFeedingModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        feedStockList={feedList}
        animalsList={animalsList}
        batchesList={batchesList}
        onSaveFeeding={handleSaveFeeding}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Feed Stock"
        message={`Are you sure you want to remove "${deleteTarget?.name}" from feed inventory?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
