import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Package, Scale, DollarSign, Calendar, Truck } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'
import MoneyInput from '../../../common/MoneyInput'

export default function AddFeedStockModal({
  isOpen,
  onClose,
  onSaveFeedStock
}) {
  const [feedName, setFeedName] = useState('')
  const [brand, setBrand] = useState('Tunga Feed Ltd')
  const [packageUnit, setPackageUnit] = useState('bags50kg') // 'bags50kg' | 'kg'
  const [bagCount, setBagCount] = useState('10')
  const [bulkKg, setBulkKg] = useState('500')
  const [costPerBag, setCostPerBag] = useState('26000')
  const [costPerKg, setCostPerKg] = useState('520')
  const [reorderThresholdKg, setReorderThresholdKg] = useState('150')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [supplierName, setSupplierName] = useState('Kigali Feeds Depot')
  const [recordExpense, setRecordExpense] = useState(true)

  if (!isOpen) return null

  // Calculations
  const totalKg = packageUnit === 'bags50kg'
    ? Math.max(0, (parseInt(bagCount, 10) || 0) * 50)
    : Math.max(0, parseFloat(bulkKg) || 0)

  const effectiveCostPerKg = packageUnit === 'bags50kg'
    ? (Number(costPerBag) || 0) > 0 ? Math.round((Number(costPerBag) || 0) / 50) : 520
    : Number(costPerKg) || 520

  const totalPurchaseCost = packageUnit === 'bags50kg'
    ? (parseInt(bagCount, 10) || 0) * (Number(costPerBag) || 0)
    : totalKg * effectiveCostPerKg

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!feedName.trim()) return

    const newFeed = {
      id: `FED-${Math.floor(100 + Math.random() * 900)}`,
      name: feedName.trim(),
      brand: brand.trim() || 'Farm Milled',
      packageUnit: packageUnit === 'bags50kg' ? '50kg Bags' : 'Bulk kg',
      currentStockKg: totalKg,
      costPerKgRWF: effectiveCostPerKg,
      reorderLevelKg: Number(reorderThresholdKg) || 100,
      totalPurchaseCostRWF: totalPurchaseCost,
      supplier: supplierName.trim(),
      purchaseDate,
      recordExpense
    }

    if (onSaveFeedStock) {
      onSaveFeedStock(newFeed)
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70">
          <div>
            <h2 className="font-orbitron text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Record &amp; Receive Feed Stock</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 04 · Feed Store
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Add new feed inventory, bags received, cost per kg &amp; reorder threshold
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Feed Name / Formula *
            </label>
            <input
              type="text"
              required
              value={feedName}
              onChange={(e) => setFeedName(e.target.value)}
              placeholder="e.g. Tunga High-Protein Grower Pellets, Layers Mash 20%"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Brand / Miller
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Tunga Feed Ltd, Bakhresa"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supplier / Depot
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Local Agro-Dealer"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
              />
            </div>
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Packaging Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPackageUnit('bags50kg')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  packageUnit === 'bags50kg'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-md'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                Standard 50 kg Bags
              </button>
              <button
                type="button"
                onClick={() => setPackageUnit('kg')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  packageUnit === 'kg'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-md'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                Bulk Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Quantity & Unit Pricing */}
          <div className="grid grid-cols-2 gap-3">
            {packageUnit === 'bags50kg' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Number of Bags (50kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bagCount}
                    onChange={(e) => setBagCount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    = {totalKg} kg total feed
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Price per 50kg Bag (RWF) *
                  </label>
                  <MoneyInput
                    value={costPerBag}
                    onChange={setCostPerBag}
                    placeholder="26,000"
                    currency="RWF"
                  />
                  <span className="text-[10px] text-emerald-300 font-mono mt-1 block">
                    ≈ {effectiveCostPerKg} RWF / kg
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Total Kilograms (kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={bulkKg}
                    onChange={(e) => setBulkKg(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cost per kg (RWF) *
                  </label>
                  <MoneyInput
                    value={costPerKg}
                    onChange={setCostPerKg}
                    placeholder="520"
                    currency="RWF"
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reorder Alert Level (kg)
              </label>
              <input
                type="number"
                min="10"
                value={reorderThresholdKg}
                onChange={(e) => setReorderThresholdKg(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Purchase Date
              </label>
              <CustomDateInput
                value={purchaseDate}
                onChange={setPurchaseDate}
              />
            </div>
          </div>

          {/* Real-time Summary Card */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Feed Added to Inventory:</span>
              <span className="font-bold text-white font-mono">{totalKg} kg</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Calculated Unit Cost:</span>
              <span className="font-bold text-emerald-300 font-mono">{effectiveCostPerKg} RWF / kg</span>
            </div>
            <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1.5 text-sm">
              <span>Total Purchase Value:</span>
              <span className="text-emerald-400 font-mono">{totalPurchaseCost.toLocaleString()} RWF</span>
            </div>
          </div>

          {/* Auto expense checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={recordExpense}
              onChange={(e) => setRecordExpense(e.target.checked)}
              className="rounded border-white/20 text-emerald-500 focus:ring-0"
            />
            <span>Record this purchase as Farm Feed Expense in Cash Out transactions</span>
          </label>

          {/* Buttons */}
          <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
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
              <span>Save Feed Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}

