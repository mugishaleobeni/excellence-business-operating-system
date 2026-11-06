import React, { useState, useMemo } from 'react'
import {
  Plus,
  Egg,
  Milk,
  Sparkles,
  Calendar,
  AlertTriangle,
  Package,
  Trash2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Scale
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordProductionModal from '../modals/RecordProductionModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function FarmProductionWorkspace() {
  const { demoWorkspaces, addDemoRecord, deleteDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const productionList = archData.records?.Production || []
  const batchesList = archData.records?.Batches || []
  const animalsList = archData.records?.Animals || []
  const feedStockList = archData.records?.Feeds || []

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Overall KPI aggregates
  const totalCollectedUnits = useMemo(() => {
    return productionList.reduce((acc, p) => acc + (Number(p.collected) || Number(p.quantity) || 0), 0)
  }, [productionList])

  const totalBrokenUnits = useMemo(() => {
    return productionList.reduce((acc, p) => acc + (Number(p.broken) || 0), 0)
  }, [productionList])

  const totalSoldUnits = useMemo(() => {
    return productionList.reduce((acc, p) => acc + (Number(p.soldQuantity) || Number(p.sold) || 0), 0)
  }, [productionList])

  const totalRemainingInStorage = useMemo(() => {
    return productionList.reduce((acc, p) => acc + (Number(p.remainingInStorage) || Number(p.remaining) || 0), 0)
  }, [productionList])

  const totalSalesRevenueRWF = useMemo(() => {
    return productionList.reduce((acc, p) => acc + (Number(p.cashEarnedRWF) || 0), 0)
  }, [productionList])

  // Today's flock comparison (most recent record)
  const latestProduction = productionList[0] || {}
  const latestDailyFeedCost = latestProduction.dailyFeedCostRWF || 13500
  const latestDailyGrossValue = latestProduction.grossProductionValueRWF || 26400
  const latestDailyProfit = latestProduction.dailyNetProfitRWF !== undefined
    ? latestProduction.dailyNetProfitRWF
    : latestDailyGrossValue - latestDailyFeedCost
  const isLatestProfitable = latestDailyProfit >= 0

  const handleSaveProduction = (rec) => {
    addDemoRecord('agriculture', 'Production', rec)

    // If cash earned from sale today, add to cash transactions
    if (rec.cashEarnedRWF > 0) {
      addTransaction({
        architectureId: 'agriculture',
        title: `Harvest Sale: ${rec.soldQuantity} ${rec.unit} ${rec.item}`,
        type: 'in',
        category: 'Farm Production Sale',
        amountRWF: rec.cashEarnedRWF,
        account: 'Cash / Mobile Money',
        source: rec.buyerName || 'Farm Sales Desk'
      })
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('agriculture', 'Production', deleteTarget.id)
    setDeleteTarget(null)
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 07 · Daily Production &amp; Operational Margin
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Daily Harvest, Egg Sales &amp; Profit
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Log eggs, milk, honey: compare daily harvest sales vs today's flock feed cost to verify real daily profit
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Daily Harvest &amp; Sales</span>
        </button>
      </div>

      {/* Top Summary Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Total Collected
          </span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {totalCollectedUnits.toLocaleString()} units
          </div>
          <span className="text-[10px] text-emerald-300">Across recorded harvests</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Broken / Spoilage
          </span>
          <div className="text-xl font-bold font-mono text-rose-300 mt-1">
            {totalBrokenUnits.toLocaleString()} units
          </div>
          <span className="text-[10px] text-slate-400">
            {totalCollectedUnits > 0 ? `${((totalBrokenUnits / totalCollectedUnits) * 100).toFixed(1)}% breakage rate` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Sold &amp; Revenue
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatRWF(totalSalesRevenueRWF)}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {totalSoldUnits.toLocaleString()} units sold
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Remaining in Storage
          </span>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {totalRemainingInStorage.toLocaleString()} units
          </div>
          <span className="text-[10px] text-slate-400">Cold store ready for sale</span>
        </div>
      </div>

      {/* Daily Flock Performance Comparison Widget */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-[#072019] to-teal-950/80 border border-emerald-400/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Today's Flock Economic Comparison</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLatestProfitable
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {isLatestProfitable ? 'Profitable Today' : 'Operating at Loss'}
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Did today's egg yield cover what the flock consumed in feed?
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[11px] text-slate-400 uppercase block font-medium">
              Net Operating Margin Today
            </span>
            <span className={`text-xl font-bold font-mono ${
              isLatestProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {latestDailyProfit >= 0 ? `+${latestDailyProfit.toLocaleString()}` : latestDailyProfit.toLocaleString()} RWF
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Flock Feed Consumed Today</span>
            <span className="text-base font-bold font-mono text-rose-300 mt-1 block">
              -{formatRWF(latestDailyFeedCost)}
            </span>
            <span className="text-[10px] text-slate-400">Operating feeding cost</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Total Harvest Value Generated</span>
            <span className="text-base font-bold font-mono text-emerald-300 mt-1 block">
              +{formatRWF(latestDailyGrossValue)}
            </span>
            <span className="text-[10px] text-slate-400">Cash sales + stored inventory</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Laying Efficiency Benchmark</span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {latestProduction.layingRatePercent || 88.5}% Laying Rate
            </span>
            <span className="text-[10px] text-emerald-300">Target above 75% for optimal margin</span>
          </div>
        </div>
      </div>

      {/* Production Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Egg className="w-3.5 h-3.5" />
            <span>Recorded Yields, Sales &amp; Margins ({productionList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[860px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Yield Item &amp; Pen</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Harvest Tally</th>
                  <th className="py-3 px-3">Broken / Loss</th>
                  <th className="py-3 px-3">Net Good</th>
                  <th className="py-3 px-3">Sold &amp; Revenue</th>
                  <th className="py-3 px-3">Storage</th>
                  <th className="py-3 px-3">Daily Feed vs Net Profit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productionList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No farm production recorded yet. Click "Record Daily Harvest &amp; Sales" to start.
                    </td>
                  </tr>
                ) : (
                  productionList.map((prd) => {
                    const netProfit = prd.dailyNetProfitRWF !== undefined ? prd.dailyNetProfitRWF : null
                    const isProfit = netProfit === null || netProfit >= 0
                    return (
                      <tr key={prd.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{prd.item}</div>
                          <span className="text-[10px] text-emerald-300 font-mono">
                            {prd.sourceAnimal || 'Flock Shed'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">{prd.date}</td>
                        <td className="py-3 px-3 font-bold text-white">
                          {prd.collected !== undefined ? `${prd.collected} ${prd.unit}` : `${prd.quantity} ${prd.unit}`}
                        </td>
                        <td className="py-3 px-3 text-rose-300 font-mono">
                          {prd.broken !== undefined ? `${prd.broken} ${prd.unit}` : '0'}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-300">
                          {prd.quantity} {prd.unit}
                        </td>
                        <td className="py-3 px-3">
                          {prd.soldQuantity ? (
                            <div>
                              <div className="font-bold text-white font-mono">
                                {formatRWF(prd.cashEarnedRWF)}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {prd.soldQuantity} sold @ {prd.unitPriceRWF} RWF
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-amber-300 font-mono">
                          {prd.remainingInStorage !== undefined
                            ? `${prd.remainingInStorage} ${prd.unit}`
                            : `${prd.remaining || 0} ${prd.unit}`}
                        </td>
                        <td className="py-3 px-3">
                          {netProfit !== null ? (
                            <div>
                              <span className={`font-mono font-bold text-xs ${
                                isProfit ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {netProfit >= 0 ? `+${formatRWF(netProfit)}` : formatRWF(netProfit)}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                Feed: -{formatRWF(prd.dailyFeedCostRWF)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Stored</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setDeleteTarget(prd)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
                            title="Delete Record"
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
      <RecordProductionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        batchesList={batchesList}
        animalsList={animalsList}
        feedStockList={feedStockList}
        onSaveProduction={handleSaveProduction}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Production Record"
        message={`Are you sure you want to delete "${deleteTarget?.item}" (${deleteTarget?.date})?`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
