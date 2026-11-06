import React, { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Egg, Milk, Sparkles, Scale, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'
import MoneyInput from '../../../common/MoneyInput'

export default function RecordProductionModal({
  isOpen,
  onClose,
  batchesList = [],
  animalsList = [],
  feedStockList = [],
  onSaveProduction
}) {
  const [sourceType, setSourceType] = useState('batch') // 'batch' | 'individual'
  const [selectedBatchId, setSelectedBatchId] = useState(() => batchesList[0]?.id || '')
  const [selectedAnimalId, setSelectedAnimalId] = useState(() => animalsList[0]?.id || '')
  const [itemType, setItemType] = useState('Fresh Table Eggs')
  const [unit, setUnit] = useState('eggs') // 'eggs' | 'trays' | 'liters'
  const [collected, setCollected] = useState('180')
  const [broken, setBroken] = useState('4')
  const [soldQuantity, setSoldQuantity] = useState('150')
  const [unitPriceRWF, setUnitPriceRWF] = useState('150')
  const [buyerName, setBuyerName] = useState('Walk-in Customers / Local Store')
  const [productionDate, setProductionDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  // Resolve source details
  const currentBatch = batchesList.find((b) => b.id === selectedBatchId) || batchesList[0] || {}
  const currentAnimal = animalsList.find((a) => a.id === selectedAnimalId) || animalsList[0] || {}

  const sourceName = sourceType === 'batch'
    ? (currentBatch.name || 'Flock Batch')
    : (currentAnimal.name || 'Individual Animal')

  const headCount = sourceType === 'batch'
    ? (Number(currentBatch.quantity) || 200)
    : 1

  // Math Calculations
  const totalCollectedNum = Math.max(0, parseInt(collected, 10) || 0)
  const brokenNum = Math.max(0, parseInt(broken, 10) || 0)
  const netAvailableNum = Math.max(0, totalCollectedNum - brokenNum)
  const soldNum = Math.min(netAvailableNum, Math.max(0, parseInt(soldQuantity, 10) || 0))
  const remainingInStorage = Math.max(0, netAvailableNum - soldNum)
  const priceNum = Math.max(0, Number(unitPriceRWF) || 0)

  // Financials
  const cashFromSalesRWF = soldNum * priceNum
  const storedValueRWF = remainingInStorage * priceNum
  const grossProductionValueRWF = cashFromSalesRWF + storedValueRWF

  // Daily Feed Cost for this flock / animal
  const dailyRationKg = sourceType === 'batch'
    ? (Number(currentBatch.dailyRationKg) || 0.125)
    : (Number(currentAnimal.dailyRationKg) || 2.0)

  const feedCostPerKg = feedStockList[0]?.costPerKgRWF || 540
  const dailyFeedIntakeKg = Math.round(headCount * dailyRationKg * 100) / 100
  const dailyFeedCostRWF = Math.round(dailyFeedIntakeKg * feedCostPerKg)

  // Net Operating Profit Today
  const dailyNetProfitRWF = grossProductionValueRWF - dailyFeedCostRWF
  const isProfitable = dailyNetProfitRWF >= 0

  // Laying efficiency % (for poultry)
  const layingRatePercent = headCount > 0
    ? ((totalCollectedNum / headCount) * 100).toFixed(1)
    : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveProduction) {
      onSaveProduction({
        id: `PRD-${Math.floor(100 + Math.random() * 900)}`,
        date: productionDate,
        item: itemType,
        sourceType,
        sourceId: sourceType === 'batch' ? selectedBatchId : selectedAnimalId,
        sourceAnimal: sourceName,
        headCount,
        unit,
        collected: totalCollectedNum,
        broken: brokenNum,
        quantity: netAvailableNum,
        soldQuantity: soldNum,
        remainingInStorage,
        unitPriceRWF: priceNum,
        cashEarnedRWF: cashFromSalesRWF,
        storedValueRWF,
        grossProductionValueRWF,
        dailyFeedCostRWF,
        dailyNetProfitRWF,
        isProfitable,
        layingRatePercent,
        buyerName: soldNum > 0 ? buyerName.trim() : '',
        status: remainingInStorage > 0 ? 'In Storage' : 'Fully Sold',
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Record Daily Harvest &amp; Sales</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 07 · Yield &amp; Profit
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Track eggs collected, broken &amp; sold, and compare against today's flock feed cost
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Source Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Source Flock / Pen *
              </label>
              {batchesList.length > 0 ? (
                <CustomSelect
                  value={selectedBatchId}
                  onChange={(val) => {
                    setSelectedBatchId(val)
                    const b = batchesList.find((item) => item.id === val)
                    if (b?.type === 'Cattle') {
                      setItemType('Fresh Raw Cow Milk')
                      setUnit('liters')
                      setUnitPriceRWF('450')
                      setCollected('50')
                      setBroken('0')
                      setSoldQuantity('40')
                    } else {
                      setItemType('Fresh Table Eggs')
                      setUnit('eggs')
                      setUnitPriceRWF('150')
                    }
                  }}
                  options={batchesList.map((b) => ({
                    value: b.id,
                    label: `${b.name} (${b.quantity} heads)`
                  }))}
                />
              ) : (
                <input
                  type="text"
                  value={sourceName}
                  disabled
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Yield Item *
              </label>
              <CustomSelect
                value={itemType}
                onChange={(val) => {
                  setItemType(val)
                  if (val === 'Fresh Table Eggs') setUnit('eggs')
                  else if (val === 'Fresh Raw Cow Milk') setUnit('liters')
                  else setUnit('kg')
                }}
                options={[
                  { value: 'Fresh Table Eggs', label: 'Fresh Table Eggs' },
                  { value: 'Fresh Raw Cow Milk', label: 'Fresh Raw Cow Milk' },
                  { value: 'Organic Honey', label: 'Organic Honey' },
                  { value: 'Organic Bio-Slurry', label: 'Organic Bio-Slurry' }
                ]}
              />
            </div>
          </div>

          {/* Collection & Spoilage breakdown */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
              1. Daily Harvest Breakdown
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Total Collected ({unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={collected}
                  onChange={(e) => setCollected(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono focus:border-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-rose-300 mb-1">
                  Broken / Spoiled ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={broken}
                  onChange={(e) => setBroken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-rose-500/30 text-rose-300 text-xs font-mono focus:border-rose-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-emerald-300 mb-1">
                  Net Good Available ({unit})
                </label>
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                  {netAvailableNum} {unit}
                </div>
              </div>
            </div>
          </div>

          {/* Sales & Storage Breakdown */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">
              2. Sales &amp; Storage Allocation
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Sold Today ({unit}) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={netAvailableNum}
                  required
                  value={soldQuantity}
                  onChange={(e) => setSoldQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white text-xs font-mono focus:border-sky-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Price per {unit === 'eggs' ? 'Egg' : unit} (RWF) *
                </label>
                <MoneyInput
                  value={unitPriceRWF}
                  onChange={setUnitPriceRWF}
                  placeholder="150"
                  currency="RWF"
                />
              </div>
              <div>
                <label className="block text-[11px] text-amber-300 mb-1">
                  Saved to Storage ({unit})
                </label>
                <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                  {remainingInStorage} {unit}
                </div>
              </div>
            </div>

            {soldNum > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Buyer / Channel
                  </label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Local Bakery, Supermarket"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Cash Earned Today
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-xs">
                    {cashFromSalesRWF.toLocaleString()} RWF
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Production Date</label>
              <CustomDateInput value={productionDate} onChange={setProductionDate} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Observation / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Good egg size, zero shell cracks"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* 3. The Smart Daily Comparison Widget (Feed Spent vs Production Value) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isProfitable
              ? 'bg-gradient-to-br from-emerald-950/70 to-black border-emerald-500/40 shadow-lg shadow-emerald-950/40'
              : 'bg-gradient-to-br from-rose-950/70 to-black border-rose-500/40 shadow-lg shadow-rose-950/40'
          }`}>
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Today's Flock Daily Operational Margin</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isProfitable
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {isProfitable ? 'Profitable Today' : 'Operating at Loss'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Daily Feed Spent:</span>
                <span className="font-mono text-rose-300 font-bold block mt-0.5">
                  -{dailyFeedCostRWF.toLocaleString()} RWF
                </span>
                <span className="text-[9px] text-slate-400">
                  ({dailyFeedIntakeKg} kg feed @ {feedCostPerKg} RWF)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Total Harvest Value:</span>
                <span className="font-mono text-emerald-300 font-bold block mt-0.5">
                  +{grossProductionValueRWF.toLocaleString()} RWF
                </span>
                <span className="text-[9px] text-slate-400">
                  ({soldNum} sold + {remainingInStorage} stored)
                </span>
              </div>
              <div className="border-l border-white/10 pl-2">
                <span className="text-[10px] text-slate-300 block font-semibold">Net Daily Profit:</span>
                <span className={`font-mono font-bold text-sm block mt-0.5 ${
                  isProfitable ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {dailyNetProfitRWF >= 0 ? `+${dailyNetProfitRWF.toLocaleString()}` : dailyNetProfitRWF.toLocaleString()} RWF
                </span>
                {itemType === 'Fresh Table Eggs' && (
                  <span className="text-[9px] text-emerald-300">
                    {layingRatePercent}% Laying Rate
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Record Harvest &amp; Sales</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}
