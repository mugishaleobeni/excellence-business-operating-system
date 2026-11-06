import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Plus, Trash2, Scale, Clock, DollarSign, AlertCircle, Percent } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import MoneyInput from '../../../common/MoneyInput'

const CATEGORIES = [
  { value: 'Main Dishes', label: 'Main Dishes' },
  { value: 'Starters', label: 'Starters' },
  { value: 'Quick Bites', label: 'Quick Bites' },
  { value: 'Beverages', label: 'Beverages & Bar' },
  { value: 'Desserts', label: 'Desserts & Sweets' },
  { value: 'Chef Specials', label: 'Chef Specials' }
]

const UNITS = [
  { value: 'piece', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'portion', label: 'Portion / Pinch' }
]

export default function AddMenuItemModal({
  isOpen,
  onClose,
  existingIngredients = [],
  onSaveMenuItem
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Main Dishes')
  const [sellingPriceRWF, setSellingPriceRWF] = useState('')
  const [preparationTimeMin, setPreparationTimeMin] = useState('20')
  const [notes, setNotes] = useState('')

  // Recipe Bill of Materials (BOM) ingredients
  const [ingredients, setIngredients] = useState([
    { name: '', quantity: '1', unit: 'piece', costRWF: '' }
  ])

  if (!isOpen) return null

  const handleAddIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { name: '', quantity: '1', unit: 'piece', costRWF: '' }
    ])
  }

  const handleRemoveIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleIngredientChange = (index, field, value) => {
    setIngredients((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Real-time recipe financials
  const sellingNum = Number(sellingPriceRWF) || 0
  const recipeCostNum = ingredients.reduce((sum, ing) => sum + (Number(ing.costRWF) || 0), 0)
  const portionProfitNum = Math.max(0, sellingNum - recipeCostNum)
  const foodCostPct = sellingNum > 0 ? ((recipeCostNum / sellingNum) * 100).toFixed(1) : 0
  const isHealthyMargin = Number(foodCostPct) <= 35.0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || sellingNum <= 0) return

    const cleanIngredients = ingredients
      .filter((ing) => ing.name?.trim())
      .map((ing) => ({
        name: ing.name.trim(),
        quantity: Number(ing.quantity) || 1,
        unit: ing.unit || 'piece',
        costRWF: Number(ing.costRWF) || 0
      }))

    if (onSaveMenuItem) {
      onSaveMenuItem({
        id: `MNU-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        category,
        sellingPriceRWF: sellingNum,
        recipeCostRWF: recipeCostNum,
        foodCostPercent: Number(foodCostPct),
        preparationTimeMin: Number(preparationTimeMin) || 15,
        ingredients: cleanIngredients,
        status: 'Available',
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-amber-400/30 bg-[#120e06]/95 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/70 via-[#221808]/80 to-yellow-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Create Menu Dish &amp; Recipe BOM</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Pillar 01
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Ingredient portion breakdown with automated Food Cost % calculation
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
          {/* Dish Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dish Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grilled Lake Kivu Tilapia"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-amber-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={CATEGORIES}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Menu Selling Price *</label>
              <MoneyInput
                value={sellingPriceRWF}
                onChange={setSellingPriceRWF}
                placeholder="e.g. 8,500 RWF"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Prep Time (Minutes)</label>
              <input
                type="number"
                min="1"
                value={preparationTimeMin}
                onChange={(e) => setPreparationTimeMin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Recipe Bill of Materials (BOM) */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  Recipe Ingredients (Bill of Materials)
                </span>
                <span className="text-[11px] text-slate-400">
                  Ingredients auto-deduct when this dish is ordered in kitchen
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-black/30 p-2 rounded-xl border border-white/5">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                      placeholder="Ingredient name (e.g. Tilapia)"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={ing.quantity}
                      onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <CustomSelect
                      value={ing.unit}
                      onChange={(val) => handleIngredientChange(idx, 'unit', val)}
                      options={UNITS}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={ing.costRWF}
                      onChange={(e) => handleIngredientChange(idx, 'costRWF', e.target.value)}
                      placeholder="Cost"
                      className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs outline-none text-right font-mono"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Margins Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-black/40 border border-amber-400/20 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Total Recipe Cost</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {recipeCostNum.toLocaleString()} RWF
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Food Cost %</span>
              <span className={`text-sm font-bold font-mono mt-0.5 block ${isHealthyMargin ? 'text-emerald-400' : 'text-amber-400'}`}>
                {foodCostPct}% {isHealthyMargin ? '(Healthy)' : '(Watch Margin)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Gross Profit / Dish</span>
              <span className="text-sm font-bold font-mono text-emerald-300 mt-0.5 block">
                +{portionProfitNum.toLocaleString()} RWF
              </span>
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
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save Menu Dish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

