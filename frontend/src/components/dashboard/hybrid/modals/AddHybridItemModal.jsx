import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Scale, Package, Wrench, UtensilsCrossed, Layers, DollarSign } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import MoneyInput from '../../../common/MoneyInput'

const ACTIVITY_OPTIONS = [
  { value: 'retail', label: 'Physical Retail Product (Buy & Sell)' },
  { value: 'service', label: 'Technical Service / Labor (Service-Based)' },
  { value: 'food', label: 'Food, Snack or Beverage (Food & Hospitality)' },
  { value: 'production', label: 'Workshop / Assembly Output (Make & Sell)' }
]

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'job', label: 'Per Job / Session' },
  { value: 'hours', label: 'Hours (hrs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'boxes', label: 'Boxes / Packs' },
  { value: 'loaves', label: 'Loaves' },
  { value: 'cups', label: 'Cups' }
]

export default function AddHybridItemModal({
  isOpen,
  onClose,
  onSaveHybridItem
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('General')
  const [activity, setActivity] = useState('retail')
  const [trackStock, setTrackStock] = useState(true)
  const [currentStock, setCurrentStock] = useState('10')
  const [unit, setUnit] = useState('pcs')
  const [unitCostRWF, setUnitCostRWF] = useState('')
  const [sellingPriceRWF, setSellingPriceRWF] = useState('')
  const [reorderLevel, setReorderLevel] = useState('3')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  // If user switches to 'service', auto-toggle stock tracking to OFF
  const handleActivityChange = (act) => {
    setActivity(act)
    if (act === 'service') {
      setTrackStock(false)
      setUnit('job')
    } else {
      setTrackStock(true)
      setUnit(act === 'food' ? 'cups' : 'pcs')
    }
  }

  const sPrice = Number(sellingPriceRWF) || 0
  const uCost = Number(unitCostRWF) || 0
  const unitProfit = Math.max(0, sPrice - uCost)
  const marginPct = sPrice > 0 ? Math.round((unitProfit / sPrice) * 100) : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || sPrice <= 0) return

    if (onSaveHybridItem) {
      onSaveHybridItem({
        id: `HYB-${Math.floor(100 + Math.random() * 900)}`,
        title: title.trim(),
        category: category.trim() || 'General',
        activity,
        trackStock,
        unit: trackStock ? unit : 'service',
        currentStock: trackStock ? (Number(currentStock) || 0) : 'Unlimited',
        unitCostRWF: uCost,
        sellingPriceRWF: sPrice,
        reorderLevel: trackStock ? (Number(reorderLevel) || 2) : 0,
        status: trackStock ? 'Physical Good' : 'Service Labor',
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-cyan-400/30 bg-[#06121a]/95 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-cyan-950/70 via-[#0a2030]/80 to-blue-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Add Catalog Item &amp; Stock Switch</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Pillar 02
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Configure selective inventory tracking: ON for physical goods, OFF for services
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item Title / Service Name *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Samsung Screen or Expert Repair Labor"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Business Activity *</label>
              <CustomSelect
                value={activity}
                onChange={handleActivityChange}
                options={ACTIVITY_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category / Tag</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Phone Parts, Repairs, Bakery"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Selective Stock Switch Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  Selective Stock Tracking Switch
                </span>
                <span className="text-[11px] text-slate-400">
                  {trackStock
                    ? 'Tracking physical warehouse inventory countdowns'
                    : 'Stock tracking disabled (Pure service, labor, or digital billable)'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTrackStock(!trackStock)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  trackStock
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-white/10 text-slate-300 border-white/20'
                }`}
              >
                {trackStock ? 'Stock: ON' : 'Stock: OFF'}
              </button>
            </div>

            {trackStock ? (
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Stock Unit</label>
                  <CustomSelect value={unit} onChange={setUnit} options={UNIT_OPTIONS} />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Reorder Alert</label>
                  <input
                    type="number"
                    min="1"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-cyan-200/90 italic bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-400/20">
                Zero stock constraints: Cashiers can sell and bill this item indefinitely without false "out of stock" inventory barriers.
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Selling Price (RWF) *</label>
              <MoneyInput
                value={sellingPriceRWF}
                onChange={setSellingPriceRWF}
                placeholder="Selling price"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost Basis (RWF)</label>
              <MoneyInput
                value={unitCostRWF}
                onChange={setUnitCostRWF}
                placeholder="Purchase cost or parts cost"
              />
            </div>
          </div>

          {/* Expected Margin Ribbon */}
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-400/20 flex items-center justify-between text-xs">
            <span className="text-slate-300">Expected Unit Profit:</span>
            <span className="font-orbitron font-extrabold text-sm text-cyan-300">
              +{unitProfit.toLocaleString()} RWF ({marginPct}% margin)
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save Hybrid Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

