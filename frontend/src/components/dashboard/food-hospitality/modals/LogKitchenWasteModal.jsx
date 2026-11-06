import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Trash2, AlertTriangle, Scale, DollarSign } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'
import MoneyInput from '../../../common/MoneyInput'

const WASTE_REASONS = [
  { value: 'Expired / Spoiled in Cold Storage', label: 'Expired / Spoiled in Cold Storage' },
  { value: 'Burnt / Kitchen Preparation Error', label: 'Burnt / Kitchen Preparation Error' },
  { value: 'Spilled / Dropped on Floor', label: 'Spilled / Dropped on Floor' },
  { value: 'Customer Return / Over-Cooked', label: 'Customer Return / Over-Cooked' },
  { value: 'Trimming / Excess Prep Waste', label: 'Trimming / Excess Prep Waste' }
]

const UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'pieces', label: 'Pieces (pcs)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'portions', label: 'Portions' }
]

export default function LogKitchenWasteModal({
  isOpen,
  onClose,
  ingredients = [],
  onSaveWaste
}) {
  const [itemName, setItemName] = useState(ingredients[0]?.name || '')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('kg')
  const [estimatedCostRWF, setEstimatedCostRWF] = useState('')
  const [reason, setReason] = useState('Expired / Spoiled in Cold Storage')
  const [loggedBy, setLoggedBy] = useState('Head Chef')
  const [wasteDate, setWasteDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const costNum = Number(estimatedCostRWF) || 0
  const qtyNum = Number(quantity) || 1

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!itemName.trim() || costNum <= 0) return

    if (onSaveWaste) {
      onSaveWaste({
        id: `WST-${Math.floor(100 + Math.random() * 900)}`,
        date: wasteDate,
        item: itemName.trim(),
        quantity: qtyNum,
        unit,
        estimatedCostRWF: costNum,
        reason,
        loggedBy: loggedBy.trim() || 'Kitchen Staff',
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-[#160a0a]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-rose-950/70 via-[#260e0e]/80 to-red-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Log Kitchen Spoilage &amp; Waste</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Pillar 04
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Track kitchen waste to enforce the &lt; 2.0% food waste target
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item / Ingredient Wasted *</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Fresh Tilapia or Peeled Potatoes"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-rose-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity *</label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit *</label>
              <CustomSelect value={unit} onChange={setUnit} options={UNITS} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Estimated Waste Cost (RWF) *</label>
            <MoneyInput
              value={estimatedCostRWF}
              onChange={setEstimatedCostRWF}
              placeholder="e.g. 5,500 RWF"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Waste Reason Code *</label>
            <CustomSelect value={reason} onChange={setReason} options={WASTE_REASONS} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Logged By</label>
              <input
                type="text"
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
              <CustomDateInput value={wasteDate} onChange={setWasteDate} />
            </div>
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
              className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Record Waste Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

