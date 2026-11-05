import React, { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingUp,
  Scale,
  Users,
  Activity,
  Plus,
  AlertCircle,
  CheckCircle2,
  Percent
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import SellAnimalModal from '../modals/SellAnimalModal'

export default function TrueProfitWorkspace() {
  const { demoWorkspaces, addDemoRecord, updateDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const animalsList = archData.records?.Animals || []
  const batchesList = archData.records?.Batches || []
  const productionList = archData.records?.Production || []
  const salesList = archData.records?.Sales || []
  const healthList = archData.records?.HealthRecords || []
  const customersList = archData.records?.Customers || []

  const [sellModalOpen, setSellModalOpen] = useState(false)

  // Simulation Calculator State
  const [calcAnimalPrice, setCalcAnimalPrice] = useState('250000')
  const [calcFeedSpent, setCalcFeedSpent] = useState('90000')
  const [calcVetSpent, setCalcVetSpent] = useState('15000')
  const [calcLaborOverhead, setCalcLaborOverhead] = useState('20000')
  const [calcSellingPrice, setCalcSellingPrice] = useState('420000')

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  // Total Population
  const totalBreedingHeads = animalsList.length
  const totalBatchHeads = batchesList.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)
  const totalHerdPopulation = totalBreedingHeads + totalBatchHeads

  // Mortality Rate
  const totalMortalities = healthList.filter((h) => h.isMortality).reduce((s, h) => s + (h.mortalityCount || 1), 0)
  const mortalityRatePercent = totalHerdPopulation > 0 ? ((totalMortalities / (totalHerdPopulation + totalMortalities)) * 100).toFixed(1) : 0

  // True Cost Simulation
  const pPrice = Number(calcAnimalPrice) || 0
  const fSpent = Number(calcFeedSpent) || 0
  const vSpent = Number(calcVetSpent) || 0
  const lSpent = Number(calcLaborOverhead) || 0
  const sPrice = Number(calcSellingPrice) || 0

  const trueCostOfRaising = pPrice + fSpent + vSpent + lSpent
  const naiveProfit = sPrice - pPrice
  const realNetProfit = sPrice - trueCostOfRaising
  const netMarginPercent = sPrice > 0 ? ((realNetProfit / sPrice) * 100).toFixed(1) : 0

  const handleSaveSale = (saleData) => {
    addDemoRecord('agriculture', 'Sales', saleData)

    // Add cash in transaction
    if (saleData.amountPaidRWF > 0) {
      addTransaction({
        architectureId: 'agriculture',
        title: `Sale: ${saleData.title}`,
        type: 'in',
        category: 'Livestock / Produce Sale',
        amountRWF: saleData.amountPaidRWF,
        account: 'Cash / Mobile Money',
        source: 'Farm Sales Desk'
      })
    }

    // If customer debt, add customer or update balance
    if (saleData.debtRemainingRWF > 0) {
      addDemoRecord('agriculture', 'Customers', {
        id: `CUS-${Math.floor(100 + Math.random() * 900)}`,
        name: saleData.buyerName,
        phone: saleData.buyerPhone || '—',
        unpaidBalanceRWF: saleData.debtRemainingRWF,
        lastSaleDate: saleData.date,
        status: 'Unpaid Balance'
      })
    }

    // Deduct inventory
    if (saleData.saleCategory === 'animal') {
      const animal = animalsList.find((a) => a.id === saleData.sourceId)
      if (animal) {
        updateDemoRecord('agriculture', 'Animals', animal.id, {
          healthStatus: 'Sold · Archived'
        })
      }
    } else if (saleData.saleCategory === 'batch') {
      const batch = batchesList.find((b) => b.id === saleData.sourceId)
      if (batch) {
        const remaining = Math.max(0, (batch.quantity || 0) - saleData.unitsSold)
        updateDemoRecord('agriculture', 'Batches', batch.id, {
          quantity: remaining
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillars 10 &amp; 11 · True Cost of Raising &amp; Performance Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Real Business Profit &amp; Farm KPIs
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            True Cost = Purchase + Feed + Vet + Labor vs Selling Price: Eliminate deceptive paper profits
          </p>
        </div>

        <button
          onClick={() => setSellModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Live Animal / Produce Sale</span>
        </button>
      </div>

      {/* KPI Performance Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Herd Population
          </span>
          <div className="text-xl font-bold text-white mt-1">{totalHerdPopulation} Heads</div>
          <span className="text-[10px] text-emerald-300 block mt-0.5">
            {totalBreedingHeads} breeders · {totalBatchHeads} growers
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Mortality Rate
          </span>
          <div className="text-xl font-bold text-emerald-300 mt-1">{mortalityRatePercent}%</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {totalMortalities} losses recorded
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Estimated FCR
          </span>
          <div className="text-xl font-bold text-sky-300 mt-1">2.8 : 1</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Feed conversion benchmark</span>
        </div>

        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Sales Recorded
          </span>
          <div className="text-xl font-bold text-teal-300 mt-1">{salesList.length} Orders</div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Live &amp; produce sales</span>
        </div>
      </div>

      {/* Interactive True Cost of Raising Calculator Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#061814] via-[#09221b] to-[#04110d] border border-emerald-400/40 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>True Cost of Raising vs Paper Profit Calculator</span>
            </h2>
            <p className="text-xs text-slate-300">
              Compare naive profit (Sale – Purchase) vs real profit (Sale – Purchase – Feed – Vet – Labor)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Purchase / Weaner (RWF)</label>
            <input
              type="number"
              value={calcAnimalPrice}
              onChange={(e) => setCalcAnimalPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Feed Consumed (RWF)</label>
            <input
              type="number"
              value={calcFeedSpent}
              onChange={(e) => setCalcFeedSpent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Vet &amp; Vaccines (RWF)</label>
            <input
              type="number"
              value={calcVetSpent}
              onChange={(e) => setCalcVetSpent(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Labor &amp; Pen (RWF)</label>
            <input
              type="number"
              value={calcLaborOverhead}
              onChange={(e) => setCalcLaborOverhead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-emerald-300 font-semibold mb-1">Market Sale Price (RWF)</label>
            <input
              type="number"
              value={calcSellingPrice}
              onChange={(e) => setCalcSellingPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 font-bold font-mono"
            />
          </div>
        </div>

        {/* Results Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
              True Raising Cost
            </span>
            <div className="text-lg font-bold text-white mt-1">
              {formatRWF(trueCostOfRaising)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Cumulative inputs to market weight
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[11px] text-rose-300 uppercase tracking-wider block">
              Naive Deceptive Margin
            </span>
            <div className="text-lg font-bold text-rose-200 mt-1">
              {formatRWF(naiveProfit)}
            </div>
            <span className="text-[10px] text-rose-300/80 block mt-0.5">
              Ignores feed, health &amp; labor costs
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40">
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider block font-semibold">
              Real Net Business Profit
            </span>
            <div className="text-xl font-bold text-emerald-300 mt-1">
              {formatRWF(realNetProfit)} ({netMarginPercent}%)
            </div>
            <span className="text-[10px] text-emerald-200 block mt-0.5">
              Accurate cash you can spend safely
            </span>
          </div>
        </div>
      </div>

      {/* Farm Sales Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Farm Sales Ledger &amp; Customer Debt ({salesList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Sold Item / Description</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Buyer Name</th>
                  <th className="py-3 px-3">Total Sale</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Unpaid Debt</th>
                  <th className="py-3 px-4 text-right">Real Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {salesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No farm sales recorded yet. Click "Record Live Animal / Produce Sale" to log one.
                    </td>
                  </tr>
                ) : (
                  salesList.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{sale.title}</div>
                        <span className="text-[10px] font-mono text-slate-400">{sale.id}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{sale.date}</td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{sale.buyerName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {formatRWF(sale.totalPriceRWF)}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-300">
                        {formatRWF(sale.amountPaidRWF)}
                      </td>
                      <td className="py-3 px-3">
                        {sale.debtRemainingRWF > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {formatRWF(sale.debtRemainingRWF)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium text-[11px]">Paid in Full</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-300">
                        {formatRWF(sale.realProfitRWF || sale.totalPriceRWF)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SellAnimalModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        animalsList={animalsList}
        batchesList={batchesList}
        productionList={productionList}
        customersList={customersList}
        onSaveSale={handleSaveSale}
      />
    </div>
  )
}
