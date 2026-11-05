import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Package, Check, AlertTriangle } from 'lucide-react'

export default function NewConsumableModal({
  isOpen,
  onClose,
  onSave,
  initialConsumable = null
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [unit, setUnit] = useState('pcs')
  const [unitCostRWF, setUnitCostRWF] = useState('')
  const [reorderLevel, setReorderLevel] = useState(5)

  useEffect(() => {
    if (initialConsumable) {
      setName(initialConsumable.name || '')
      setCategory(initialConsumable.category || 'Supplies')
      setCurrentStock(String(initialConsumable.currentStock ?? ''))
      setUnit(initialConsumable.unit || 'pcs')
      setUnitCostRWF(String(initialConsumable.unitCostRWF ?? ''))
      setReorderLevel(initialConsumable.reorderLevel ?? 5)
    } else {
      setName('')
      setCategory('Supplies')
      setCurrentStock('')
      setUnit('pcs')
      setUnitCostRWF('')
      setReorderLevel(5)
    }
  }, [initialConsumable, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      id: initialConsumable?.id || `CON-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      category: category.trim() || 'Supplies',
      currentStock: Number(currentStock) || 0,
      unit: unit.trim() || 'pcs',
      unitCostRWF: Number(unitCostRWF) || 0,
      reorderLevel: Number(reorderLevel) || 5
    }

    onSave(payload)
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-sky-400/30 bg-[#071330]/98 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-sky-950/60 to-blue-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white">
                {initialConsumable ? 'Edit Consumable Supply' : 'Add Consumable Supply'}
              </h3>
              <p className="text-xs text-slate-300">
                Track usage, replenishment costs &amp; stock alerts
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Supply Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Keratin Conditioning Mask, 10W-40 Synthetic Oil..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Lotions, Parts, Fluids..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="bottles">Bottles</option>
                <option value="cans">Cans</option>
                <option value="rolls">Rolls</option>
                <option value="pairs">Pairs</option>
                <option value="tubes">Tubes</option>
                <option value="L">Liters (L)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Unit Purchase Cost (RWF) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                value={unitCostRWF}
                onChange={(e) => setUnitCostRWF(e.target.value)}
                placeholder="e.g. 3500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Low Stock Reorder Alert Level</span>
            </label>
            <input
              type="number"
              min="1"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-sky-400"
            />
          </div>

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
              <span>{initialConsumable ? 'Save Supply' : 'Add to Stock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

