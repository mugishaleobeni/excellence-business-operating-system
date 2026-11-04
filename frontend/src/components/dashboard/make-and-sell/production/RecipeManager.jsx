import React, { useState } from 'react'
import {
  ScrollText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Info
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'

export default function RecipeManager({
  recipes = [],
  rawMaterials = [],
  products = [],
  onSaveRecipe = null,
  onDeleteRecipe = null,
  hideFinancials = false,
  addToast = null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)

  // Form State
  const [name, setName] = useState('')
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [yieldQty, setYieldQty] = useState(100)
  const [unit, setUnit] = useState('pcs')
  const [wastePct, setWastePct] = useState(2)
  const [laborCost, setLaborCost] = useState(15000)
  const [overheadCost, setOverheadCost] = useState(10000)
  const [ingredients, setIngredients] = useState([
    {
      materialId: rawMaterials[0]?.id || 'MAT-FLOUR',
      name: rawMaterials[0]?.name || 'Wheat Flour',
      quantity: 20,
      unit: 'kg',
      unitPriceRWF: 880
    }
  ])

  const openNewRecipeModal = () => {
    setEditingRecipe(null)
    setName('')
    setProductId(products[0]?.id || '')
    setYieldQty(100)
    setUnit('pcs')
    setWastePct(2)
    setLaborCost(15000)
    setOverheadCost(10000)
    setIngredients([
      {
        materialId: rawMaterials[0]?.id || 'MAT-FLOUR',
        name: rawMaterials[0]?.name || 'Wheat Flour',
        quantity: 20,
        unit: 'kg',
        unitPriceRWF: Number(rawMaterials[0]?.purchasePriceRWF || 880)
      }
    ])
    setModalOpen(true)
  }

  const openEditRecipeModal = (rec) => {
    setEditingRecipe(rec)
    setName(rec.name || '')
    setProductId(rec.productId || '')
    setYieldQty(rec.yield || 100)
    setUnit(rec.unit || 'pcs')
    setWastePct(rec.expectedWastePct || 2)
    setLaborCost(rec.laborCostRWF || 15000)
    setOverheadCost(rec.overheadCostRWF || 10000)
    setIngredients(rec.ingredients ? [...rec.ingredients] : [])
    setModalOpen(true)
  }

  const handleAddIngredient = () => {
    const defaultMat = rawMaterials[0] || { id: 'MAT-NEW', name: 'Raw Material', unit: 'kg', purchasePriceRWF: 1000 }
    setIngredients((prev) => [
      ...prev,
      {
        materialId: defaultMat.id,
        name: defaultMat.name,
        quantity: 1,
        unit: defaultMat.unit || 'kg',
        unitPriceRWF: Number(defaultMat.purchasePriceRWF || 1000)
      }
    ])
  }

  const handleRemoveIngredient = (idx) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleIngredientChange = (idx, field, value) => {
    setIngredients((prev) =>
      prev.map((ing, i) => {
        if (i !== idx) return ing
        if (field === 'materialId') {
          const mat = rawMaterials.find((m) => m.id === value)
          return {
            ...ing,
            materialId: value,
            name: mat ? (mat.name || mat.title) : ing.name,
            unit: mat ? mat.unit : ing.unit,
            unitPriceRWF: mat ? Number(mat.purchasePriceRWF || mat.unitCostRWF || 0) : ing.unitPriceRWF
          }
        }
        return { ...ing, [field]: value }
      })
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const product = products.find((p) => p.id === productId)
    const newRecipe = {
      id: editingRecipe?.id || `REC-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      productId,
      productName: product ? (product.name || product.title) : 'Finished Product',
      yield: Math.max(1, Number(yieldQty) || 1),
      unit,
      expectedWastePct: Math.max(0, Number(wastePct) || 0),
      laborCostRWF: Number(laborCost) || 0,
      overheadCostRWF: Number(overheadCost) || 0,
      ingredients: ingredients.map((ing) => ({
        ...ing,
        quantity: Number(ing.quantity) || 0,
        unitPriceRWF: Number(ing.unitPriceRWF) || 0
      }))
    }

    if (onSaveRecipe) {
      onSaveRecipe(newRecipe)
    }

    setModalOpen(false)
    if (addToast) {
      addToast({
        type: 'success',
        title: editingRecipe ? 'Recipe Updated' : 'Recipe Created',
        message: `Saved "${newRecipe.name}" with ${newRecipe.ingredients.length} raw materials.`
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recipes &amp; Bill of Materials (BOM)
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Standard formulas defining the raw material quantities and labor needed to manufacture your finished goods.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewRecipeModal}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Recipe</span>
        </button>
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {recipes.map((recipe) => {
          const materialCost = (recipe.ingredients || []).reduce(
            (sum, ing) => sum + Math.round((Number(ing.quantity) || 0) * (Number(ing.unitPriceRWF) || 0)),
            0
          )
          const totalBatchCost = materialCost + (recipe.laborCostRWF || 0) + (recipe.overheadCostRWF || 0)
          const unitCost = Math.round(totalBatchCost / Math.max(1, recipe.yield || 1))

          return (
            <div
              key={recipe.id}
              className="exbos-glass-card p-5 space-y-4 relative overflow-hidden group border border-white/10 hover:border-[#218DFF]/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-orbitron font-bold text-[#9EDCFF]">
                      {recipe.id}
                    </span>
                    <span className="text-xs text-slate-300">Yield: {recipe.yield} {recipe.unit}</span>
                  </div>
                  <h4 className="font-orbitron text-base font-bold text-white">
                    {recipe.name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    Product: <strong className="text-white">{recipe.productName}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditRecipeModal(recipe)}
                    className="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white cursor-pointer transition-all"
                    title="Edit Recipe"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#218DFF]" />
                  </button>
                  {onDeleteRecipe && (
                    <button
                      type="button"
                      onClick={() => onDeleteRecipe(recipe.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 cursor-pointer transition-all"
                      title="Delete Recipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <span className="text-[10px] font-orbitron font-bold uppercase text-slate-400 block tracking-wider">
                  Bill of Materials (Inputs per Batch)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(recipe.ingredients || []).map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-white">{ing.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-300">
                          {ing.quantity} {ing.unit}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          @{formatRWF(ing.unitPriceRWF, hideFinancials)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Summary Footer */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] uppercase text-slate-400 block">Materials</span>
                  <strong className="font-orbitron text-xs text-white">
                    {formatRWF(materialCost, hideFinancials)}
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] uppercase text-slate-400 block">Labor &amp; Energy</span>
                  <strong className="font-orbitron text-xs text-slate-300">
                    {formatRWF((recipe.laborCostRWF || 0) + (recipe.overheadCostRWF || 0), hideFinancials)}
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/30">
                  <span className="text-[10px] uppercase text-[#9EDCFF] block font-bold">Unit Cost</span>
                  <strong className="font-orbitron text-xs text-[#9EDCFF]">
                    {formatRWF(unitCost, hideFinancials)}
                  </strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* CREATE / EDIT RECIPE MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl p-6 sm:p-7 space-y-5 my-8"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1045CA]/40 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
                  <ScrollText className="w-5 h-5 text-[#218DFF]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-lg font-extrabold text-white">
                    {editingRecipe ? 'Edit Recipe / Formula' : 'Register New Recipe'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Define ingredients, batch output yield, and expected production costs.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Recipe Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard Brioche Loaf Formula (100 Loaves)"
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Target Finished Product *</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title} ({p.unit || 'pcs'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Expected Yield *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Yield Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, loaves"
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Labor Cost (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Energy / Overhead</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Ingredients Form Section */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-[#9EDCFF]">
                    Raw Material Ingredients
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer border border-white/20"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>Add Material</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5">
                        <select
                          value={ing.materialId}
                          onChange={(e) => handleIngredientChange(idx, 'materialId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                        >
                          {rawMaterials.map((mat) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name || mat.title} ({mat.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={ing.quantity}
                          onChange={(e) => handleIngredientChange(idx, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className="w-full px-2 py-1.5 rounded-lg bg-[#071644] border border-white/20 text-xs font-mono text-white text-right focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3">
                        <span className="text-xs font-mono text-slate-300">
                          {ing.unit} (@{formatRWF(ing.unitPriceRWF)})
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white cursor-pointer shadow-md transition-all"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

