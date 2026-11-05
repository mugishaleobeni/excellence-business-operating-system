import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, Percent, Plus, Trash2, Check, Sparkles, Coins } from 'lucide-react'

export default function NewServiceModal({
  isOpen,
  onClose,
  onSave,
  categories = [],
  availableConsumables = [],
  initialService = null
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [durationMins, setDurationMins] = useState(45)
  const [priceRWF, setPriceRWF] = useState('')
  const [commissionPct, setCommissionPct] = useState(25)
  const [linkedConsumables, setLinkedConsumables] = useState([])

  useEffect(() => {
    if (initialService) {
      setName(initialService.name || '')
      setCategory(initialService.category || (categories[0] || 'General Service'))
      setDurationMins(initialService.durationMins || 45)
      setPriceRWF(initialService.priceRWF ? String(initialService.priceRWF) : '')
      setCommissionPct(initialService.commissionPct ?? 25)
      setLinkedConsumables(initialService.linkedConsumables || [])
    } else {
      setName('')
      setCategory(categories[0] || 'General Service')
      setDurationMins(45)
      setPriceRWF('')
      setCommissionPct(25)
      setLinkedConsumables([])
    }
  }, [initialService, categories, isOpen])

  if (!isOpen) return null

  // Calculate supply cost and staff payout live
  const numericPrice = Number(priceRWF) || 0
  const totalSupplyCost = linkedConsumables.reduce(
    (sum, c) => sum + (Number(c.qty) || 0) * (Number(c.unitCostRWF) || 0),
    0
  )
  const staffCommissionRWF = Math.round((numericPrice * commissionPct) / 100)
  const netBusinessMarginRWF = numericPrice - totalSupplyCost - staffCommissionRWF
  const marginPct = numericPrice > 0 ? Math.round((netBusinessMarginRWF / numericPrice) * 100) : 0

  const handleAddConsumableRow = () => {
    if (availableConsumables.length === 0) return
    const first = availableConsumables[0]
    setLinkedConsumables([
      ...linkedConsumables,
      {
        name: first.name,
        qty: 1,
        unit: first.unit || 'pcs',
        unitCostRWF: first.unitCostRWF || 0
      }
    ])
  }

  const handleUpdateConsumable = (idx, field, val) => {
    const updated = [...linkedConsumables]
    if (field === 'name') {
      const found = availableConsumables.find((c) => c.name === val)
      updated[idx] = {
        ...updated[idx],
        name: val,
        unit: found?.unit || updated[idx].unit,
        unitCostRWF: found?.unitCostRWF || updated[idx].unitCostRWF
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: val }
    }
    setLinkedConsumables(updated)
  }

  const handleRemoveConsumable = (idx) => {
    setLinkedConsumables(linkedConsumables.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const servicePayload = {
      id: initialService?.id || `SRV-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      category: category.trim() || 'General Service',
      durationMins: Number(durationMins) || 30,
      priceRWF: numericPrice,
      commissionPct: Number(commissionPct) || 0,
      linkedConsumables: linkedConsumables.map((c) => ({
        ...c,
        qty: Number(c.qty) || 1,
        unitCostRWF: Number(c.unitCostRWF) || 0
      })),
      active: true
    }

    onSave(servicePayload)
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-sky-400/30 bg-[#071330]/98 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-sky-950/60 to-blue-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white">
                {initialService ? 'Edit Service' : 'Add New Service to Catalogue'}
              </h3>
              <p className="text-xs text-slate-300">
                Define pricing, duration, staff commission &amp; required supplies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Deluxe Gel Manicure, Front Brake Pad Replacement..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Service Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Hair Styling, Maintenance..."
                list="service-categories-list"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm"
              />
              <datalist id="service-categories-list">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Duration (mins) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Standard Duration (mins)</span>
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400 text-sm font-mono"
              />
            </div>

            {/* Price (RWF) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Client Selling Price (RWF) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="500"
                value={priceRWF}
                onChange={(e) => setPriceRWF(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm font-mono"
              />
            </div>

            {/* Staff Commission % */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Staff Commission Rate (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={commissionPct}
                onChange={(e) => setCommissionPct(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-sky-400 text-sm font-mono"
              />
            </div>
          </div>

          {/* Linked Consumable Supplies */}
          <div className="pt-3 border-t border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                  Required Consumables &amp; Supplies
                </span>
                <p className="text-[11px] text-slate-400">
                  Deducted automatically when this job is completed
                </p>
              </div>
              {availableConsumables.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddConsumableRow}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-400/30 text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Supply</span>
                </button>
              )}
            </div>

            {linkedConsumables.length === 0 ? (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-slate-400">
                No consumable materials linked to this service yet.
              </div>
            ) : (
              <div className="space-y-2">
                {linkedConsumables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs"
                  >
                    <select
                      value={item.name}
                      onChange={(e) => handleUpdateConsumable(idx, 'name', e.target.value)}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
                    >
                      {availableConsumables.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.unitCostRWF?.toLocaleString()} RWF/{c.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={item.qty}
                      onChange={(e) => handleUpdateConsumable(idx, 'qty', e.target.value)}
                      className="w-16 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs font-mono text-center"
                      title="Quantity used"
                    />
                    <span className="text-slate-400 text-xs w-10 shrink-0">{item.unit}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConsumable(idx)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profit & Margin Real-Time Calculator Preview */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-blue-950/30 to-slate-900/60 border border-sky-400/20 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] text-slate-400">Supplies Cost</div>
              <div className="font-mono text-xs font-semibold text-rose-300">
                {totalSupplyCost.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Staff Payout</div>
              <div className="font-mono text-xs font-semibold text-amber-300">
                {staffCommissionRWF.toLocaleString()} RWF
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">Net Business Margin</div>
              <div className="font-mono text-xs font-bold text-emerald-300">
                {netBusinessMarginRWF.toLocaleString()} RWF ({marginPct}%)
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialService ? 'Save Changes' : 'Create Service'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

