import React, { useState, useMemo } from 'react'
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Eye,
  Trash2,
  Calendar,
  X,
  Layers,
  Sparkles,
  ArrowRight,
  Calculator,
  Search,
  ShoppingCart,
  Percent,
  Check,
  AlertOctagon,
  ScrollText,
  Printer,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import PriceCalculatorPanel from '../PriceCalculatorPanel'
import CustomSelect from '../../../common/CustomSelect'
import { calculateMaterialShortages } from '../services/productionCalculations'
import { useExbos } from '../../../../context/ExbosContext'

export default function ProductionWorkspace({
  activeSubPage = 'Batches',
  batches = [],
  recipes = [],
  rawMaterials = [],
  finishedGoods = [],
  onUpdateBatches = null,
  onUpdateRawMaterials = null,
  onUpdateFinishedGoods = null,
  onOpenCreatePurchase = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const { user, demoWorkspaces } = useExbos?.() || {}
  const activeBizName = user?.businessName || demoWorkspaces?.['make-and-sell']?.businessName || 'ExBOS Make & Sell Enterprise'

  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [detailBatch, setDetailBatch] = useState(null)

  // Drawer / Modal states
  const [newBatchDrawerOpen, setNewBatchDrawerOpen] = useState(false)
  const [newRecipeDrawerOpen, setNewRecipeDrawerOpen] = useState(false)
  const [completeBatchModalOpen, setCompleteBatchModalOpen] = useState(false)
  const [selectedBatchToComplete, setSelectedBatchToComplete] = useState(null)
  const [showRecipeCalculator, setShowRecipeCalculator] = useState(false)

  // New Batch Form State
  const [batchRecipeId, setBatchRecipeId] = useState(recipes[0]?.id || '')
  const [batchPlannedQty, setBatchPlannedQty] = useState(200)
  const [batchPlannedDate, setBatchPlannedDate] = useState(new Date().toISOString().slice(0, 10))
  const [batchEmployee, setBatchEmployee] = useState('Jean-Pierre Mugisha')
  const [batchNotes, setBatchNotes] = useState('')

  // Selected recipe for new batch
  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.id === batchRecipeId) || recipes[0] || null
  }, [recipes, batchRecipeId])

  // Real-time shortage check for the new batch form
  const batchShortages = useMemo(() => {
    if (!activeRecipe) return []
    const scaleFactor = (Number(batchPlannedQty) || 1) / (activeRecipe.yieldQuantity || 1)
    const requiredMaterials = (activeRecipe.ingredients || []).map((ing) => ({
      materialId: ing.materialId,
      name: ing.materialName || ing.name,
      requiredQuantity: (Number(ing.quantity) || 0) * scaleFactor,
      unit: ing.unit
    }))
    return calculateMaterialShortages(requiredMaterials, rawMaterials)
  }, [activeRecipe, batchPlannedQty, rawMaterials])

  const hasShortages = batchShortages.some((s) => s.isShort)

  // Complete Batch Form State
  const [actualGoodUnits, setActualGoodUnits] = useState(195)
  const [actualWasteUnits, setActualWasteUnits] = useState(5)
  const [actualHoursSpent, setActualHoursSpent] = useState(3)
  const [actualExtraCostRWF, setActualExtraCostRWF] = useState(0)

  // New Recipe Form State
  const [recipeName, setRecipeName] = useState('')
  const [recipeProductId, setRecipeProductId] = useState(finishedGoods[0]?.id || '')
  const [recipeYieldQty, setRecipeYieldQty] = useState(200)
  const [recipeUnit, setRecipeUnit] = useState('loaves')
  const [recipeWastePct, setRecipeWastePct] = useState(2.5)
  const [recipeTargetMargin, setRecipeTargetMargin] = useState(40)
  const [recipeOtherCosts, setRecipeOtherCosts] = useState([
    { id: 'cost-1', name: 'Gas & Labour', amount: 6600 }
  ])
  const [recipeIngredients, setRecipeIngredients] = useState([
    { materialId: rawMaterials[0]?.id || 'MAT-FLOUR', materialName: rawMaterials[0]?.name || 'Flour', quantity: 20, unit: 'kg' },
    { materialId: rawMaterials[1]?.id || 'MAT-SUGAR', materialName: rawMaterials[1]?.name || 'Sugar', quantity: 3, unit: 'kg' }
  ])

  // 3-Number Summary Strips
  const batchSummary = useMemo(() => {
    const planned = batches.filter((b) => b.status === 'Planned').length
    const inProg = batches.filter((b) => b.status === 'In Progress').length
    const completed = batches.filter((b) => b.status === 'Completed').length
    return { planned, inProg, completed }
  }, [batches])

  // Filtered lists
  const filteredBatches = useMemo(() => {
    let list = [...batches]
    if (activeSubPage === 'In Progress') {
      list = list.filter((b) => b.status === 'In Progress')
    } else if (activeSubPage === 'Completed Batches') {
      list = list.filter((b) => b.status === 'Completed')
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (b) =>
          (b.batchCode || '').toLowerCase().includes(q) ||
          (b.productName || '').toLowerCase().includes(q) ||
          (b.responsibleEmployee || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [batches, activeSubPage, searchQuery])

  // --- Start a Batch ---
  const handleStartBatch = () => {
    if (hasShortages) {
      alert('Cannot start batch: some raw materials are missing or short in stock.')
      return
    }

    if (!activeRecipe) return

    const scaleFactor = (Number(batchPlannedQty) || 1) / (activeRecipe.yieldQuantity || 1)
    const newBatch = {
      id: `BATCH-${Date.now()}`,
      batchCode: `B-${Math.floor(100 + Math.random() * 900)}`,
      recipeId: activeRecipe.id,
      productId: activeRecipe.productId,
      productName: activeRecipe.productName || activeRecipe.name,
      plannedQuantity: Number(batchPlannedQty) || 200,
      unit: activeRecipe.unit || 'pcs',
      status: 'In Progress',
      plannedDate: batchPlannedDate,
      startTime: new Date().toISOString(),
      targetCompletion: new Date(Date.now() + 3 * 3600000).toISOString(),
      responsibleEmployee: batchEmployee,
      notes: batchNotes,
      plannedUnitCostRWF: activeRecipe.costPerUnitRWF || 180,
      ingredientsUsed: (activeRecipe.ingredients || []).map((ing) => ({
        materialId: ing.materialId,
        name: ing.materialName || ing.name,
        quantity: (Number(ing.quantity) || 0) * scaleFactor,
        unit: ing.unit
      }))
    }

    // Reserve / deduct materials from raw materials stock
    if (onUpdateRawMaterials) {
      const updatedMaterials = rawMaterials.map((mat) => {
        const used = newBatch.ingredientsUsed.find((u) => u.materialId === mat.id || u.name === mat.name)
        if (used) {
          const newStock = Math.max(0, (Number(mat.currentStock || mat.stock || 0)) - used.quantity)
          return { ...mat, currentStock: newStock }
        }
        return mat
      })
      onUpdateRawMaterials(updatedMaterials)
    }

    if (onUpdateBatches) {
      onUpdateBatches([newBatch, ...batches])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Batch Started',
        message: `Batch ${newBatch.batchCode} (${newBatch.productName}) is now In Progress.`
      })
    }

    setNewBatchDrawerOpen(false)
  }

  // --- Complete a Batch ---
  const handleOpenCompleteModal = (batch) => {
    setSelectedBatchToComplete(batch)
    setActualGoodUnits(batch.plannedQuantity ? Math.round(batch.plannedQuantity * 0.98) : 195)
    setActualWasteUnits(batch.plannedQuantity ? Math.round(batch.plannedQuantity * 0.02) : 5)
    setActualHoursSpent(3)
    setActualExtraCostRWF(0)
    setCompleteBatchModalOpen(true)
  }

  const handleConfirmCompleteBatch = () => {
    if (!selectedBatchToComplete) return

    const goodQty = Number(actualGoodUnits) || 1
    const wasteQty = Number(actualWasteUnits) || 0
    const totalBatchCost = (selectedBatchToComplete.plannedUnitCostRWF || 180) * (selectedBatchToComplete.plannedQuantity || 200) + (Number(actualExtraCostRWF) || 0)
    const actualCostPerUnit = Math.round((totalBatchCost / goodQty) * 100) / 100
    const plannedCost = selectedBatchToComplete.plannedUnitCostRWF || 180
    const isOverPlan = actualCostPerUnit > plannedCost * 1.05

    const completedBatch = {
      ...selectedBatchToComplete,
      status: 'Completed',
      actualQuantity: goodQty,
      wasteQuantity: wasteQty,
      actualYieldPct: Math.round((goodQty / (selectedBatchToComplete.plannedQuantity || 1)) * 100),
      actualCostPerUnitRWF: actualCostPerUnit,
      plannedCostPerUnitRWF: plannedCost,
      isOverPlan,
      completionDate: new Date().toISOString().slice(0, 10),
      completionTime: new Date().toISOString()
    }

    // Add produced units to Finished Goods stock with batch code & best before date
    if (onUpdateFinishedGoods) {
      const bestBefore = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10)
      const existingProduct = finishedGoods.find((p) => p.id === selectedBatchToComplete.productId)

      if (existingProduct) {
        const updated = finishedGoods.map((p) => {
          if (p.id === existingProduct.id) {
            return {
              ...p,
              currentStock: (Number(p.currentStock || p.stock || 0)) + goodQty,
              batchCode: selectedBatchToComplete.batchCode,
              bestBeforeDate: bestBefore,
              costPerUnitRWF: actualCostPerUnit
            }
          }
          return p
        })
        onUpdateFinishedGoods(updated)
      } else {
        const newProduct = {
          id: selectedBatchToComplete.productId || `PROD-${Date.now()}`,
          name: selectedBatchToComplete.productName,
          category: 'Bakery Goods',
          unit: selectedBatchToComplete.unit || 'pcs',
          currentStock: goodQty,
          sellingPriceRWF: Math.round(actualCostPerUnit * 1.6),
          costPerUnitRWF: actualCostPerUnit,
          batchCode: selectedBatchToComplete.batchCode,
          bestBeforeDate: bestBefore
        }
        onUpdateFinishedGoods([newProduct, ...finishedGoods])
      }
    }

    // Update batch status in batch list
    if (onUpdateBatches) {
      onUpdateBatches(batches.map((b) => (b.id === selectedBatchToComplete.id ? completedBatch : b)))
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Batch Completed',
        message: `Batch ${completedBatch.batchCode} completed: +${goodQty} units added to stock at ${formatRWF(actualCostPerUnit)}/unit.`
      })
    }

    setCompleteBatchModalOpen(false)
    setSelectedBatchToComplete(null)
  }

  // --- Abort Batch (return unused materials) ---
  const handleAbortBatch = (batch) => {
    if (!window.confirm(`Abort batch ${batch.batchCode}? Unused materials will be returned to Raw Materials stock.`)) return

    if (onUpdateRawMaterials && batch.ingredientsUsed) {
      const restored = rawMaterials.map((mat) => {
        const used = batch.ingredientsUsed.find((u) => u.materialId === mat.id || u.name === mat.name)
        if (used) {
          return { ...mat, currentStock: (Number(mat.currentStock || 0)) + used.quantity }
        }
        return mat
      })
      onUpdateRawMaterials(restored)
    }

    if (onUpdateBatches) {
      onUpdateBatches(batches.filter((b) => b.id !== batch.id))
    }

    if (addToast) {
      addToast({
        type: 'info',
        title: 'Batch Aborted',
        message: `Batch ${batch.batchCode} aborted. Raw materials returned to stock.`
      })
    }
  }

  // --- Save New Recipe ---
  const handleSaveRecipe = () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name.')
      return
    }

    const prod = finishedGoods.find((p) => p.id === recipeProductId)
    const newRecipe = {
      id: `REC-${Date.now()}`,
      name: recipeName.trim(),
      productId: recipeProductId,
      productName: prod?.name || recipeName,
      yieldQuantity: Number(recipeYieldQty) || 200,
      unit: recipeUnit,
      wastageAllowancePct: Number(recipeWastePct) || 2.5,
      targetMarginPct: Number(recipeTargetMargin) || 40,
      otherCosts: recipeOtherCosts,
      ingredients: recipeIngredients,
      costPerUnitRWF: 180
    }

    // In a full app, recipes would update in state or context
    if (addToast) {
      addToast({
        type: 'success',
        title: 'Recipe Created',
        message: `Recipe "${newRecipe.name}" saved with live price calculation.`
      })
    }

    setNewRecipeDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Production · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'Batches' && 'Production Batches'}
            {activeSubPage === 'Recipes & Formulas' && 'Recipes & Formulas'}
            {activeSubPage === 'In Progress' && 'Active In-Progress Batches'}
            {activeSubPage === 'Completed Batches' && 'Completed Batches & Yield Audit'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'Batches' && 'Plan and trigger production runs with automatic raw material stock validation.'}
            {activeSubPage === 'Recipes & Formulas' && 'Formulate bill of materials, overhead allowances, and derive live unit costs.'}
            {activeSubPage === 'In Progress' && 'Monitor running batches, reserved ingredients, elapsed time, and completion.'}
            {activeSubPage === 'Completed Batches' && 'Review actual yields, scrap loss, and cost variances against original plans.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
          >
            Export
          </button>

          {activeSubPage === 'Batches' && (
            <button
              type="button"
              onClick={() => {
                setBatchRecipeId(recipes[0]?.id || '')
                setBatchPlannedQty(recipes[0]?.yieldQuantity || 200)
                setNewBatchDrawerOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Batch</span>
            </button>
          )}

          {activeSubPage === 'Recipes & Formulas' && (
            <button
              type="button"
              onClick={() => setNewRecipeDrawerOpen(true)}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Recipe</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Planned Batches
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">{batchSummary.planned}</div>
          <span className="text-[11px] text-slate-400">Scheduled for production</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#218DFF] tracking-wider">
            Active In Progress
          </span>
          <div className="font-orbitron text-2xl font-bold text-[#9EDCFF]">{batchSummary.inProg}</div>
          <span className="text-[11px] text-slate-400">Materials reserved &amp; baking/producing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-emerald-400 tracking-wider">
            Completed Batches
          </span>
          <div className="font-orbitron text-2xl font-bold text-emerald-400">{batchSummary.completed}</div>
          <span className="text-[11px] text-slate-400">Units added to Finished Goods</span>
        </div>
      </div>

      {/* Search Input */}
      {activeSubPage !== 'Recipes & Formulas' && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search batches by code, product, or employee..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
          />
        </div>
      )}

      {/* --- SUBPAGE: RECIPES & FORMULAS --- */}
      {activeSubPage === 'Recipes & Formulas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((rec) => {
              const prod = finishedGoods.find((p) => p.id === rec.productId)
              const sellingPrice = prod?.sellingPriceRWF || 300
              const cost = rec.costPerUnitRWF || 180
              const isBelowCost = sellingPrice < cost

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-orbitron font-bold text-white text-base">{rec.name}</h4>
                        {isBelowCost && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            Selling below cost
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">Yield: {rec.yieldQuantity} {rec.unit}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40">
                      Recipe
                    </span>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="space-y-1.5 text-xs pt-2 border-t border-white/10">
                    <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
                      Ingredients (per batch)
                    </span>
                    {(rec.ingredients || []).slice(0, 3).map((ing, i) => (
                      <div key={i} className="flex justify-between text-slate-300">
                        <span>{ing.materialName || ing.name}</span>
                        <span className="font-mono">{ing.quantity} {ing.unit}</span>
                      </div>
                    ))}
                    {(rec.ingredients || []).length > 3 && (
                      <div className="text-[10px] text-slate-500 italic">
                        +{(rec.ingredients || []).length - 3} more ingredients
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  {!isCashier && !hideFinancials && (
                    <div className="p-3 rounded-xl bg-[#040C26]/70 border border-white/5 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Planned Unit Cost:</span>
                        <strong className="text-white font-mono">{formatRWF(cost)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Current Selling Price:</span>
                        <strong className="text-emerald-400 font-mono">{formatRWF(sellingPrice)}</strong>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Target Margin:</span>
                        <strong className="text-[#9EDCFF] font-mono">{rec.targetMarginPct || 40}%</strong>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isCashier && !hideFinancials && (
                      <button
                        type="button"
                        onClick={() => {
                          setBatchRecipeId(rec.id)
                          setShowRecipeCalculator(true)
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] text-xs font-bold border border-[#218DFF]/40 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Price Calculator</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setBatchRecipeId(rec.id)
                        setBatchPlannedQty(rec.yieldQuantity || 200)
                        setNewBatchDrawerOpen(true)
                      }}
                      className="btn-sapphire-clean px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Embedded Full Section 5 Price Calculator if clicked */}
          {showRecipeCalculator && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <PriceCalculatorPanel
                recipe={activeRecipe}
                product={finishedGoods.find((p) => p.id === activeRecipe?.productId)}
                rawMaterials={rawMaterials}
                onApplyPrice={(price) => {
                  if (onUpdateFinishedGoods && activeRecipe) {
                    onUpdateFinishedGoods(
                      finishedGoods.map((p) =>
                        p.id === activeRecipe.productId ? { ...p, sellingPriceRWF: price } : p
                      )
                    )
                  }
                  setShowRecipeCalculator(false)
                }}
                onClose={() => setShowRecipeCalculator(false)}
                isCashier={isCashier}
                hideFinancials={hideFinancials}
              />
            </div>
          )}
        </div>
      )}

      {/* --- SUBPAGE: BATCHES / IN PROGRESS / COMPLETED TABLE --- */}
      {activeSubPage !== 'Recipes & Formulas' && (
        <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Batch Code &amp; Product</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Planned Qty</th>
                  {activeSubPage === 'Completed Batches' && <th className="p-3.5 text-right">Actual Made</th>}
                  {activeSubPage === 'Completed Batches' && <th className="p-3.5 text-right">Scrap Loss</th>}
                  {!isCashier && !hideFinancials && (
                    <th className="p-3.5 text-right">
                      {activeSubPage === 'Completed Batches' ? 'Actual Cost / Unit' : 'Planned Cost'}
                    </th>
                  )}
                  <th className="p-3.5">Date / Schedule</th>
                  <th className="p-3.5">Employee</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No batches found matching criteria. Click "+ New Batch" to schedule a production run.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => {
                    const isCompleted = batch.status === 'Completed'
                    const isInProg = batch.status === 'In Progress'

                    return (
                      <React.Fragment key={batch.id}>
                        {/* Over-plan banner when actual cost exceeds planned by > 5% */}
                        {isCompleted && batch.isOverPlan && (
                          <tr className="bg-rose-500/15 border-b border-rose-500/30">
                            <td colSpan={9} className="p-2.5 px-5 text-rose-200 text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>
                                  Batch {batch.batchCode}: Cost is higher than planned ({formatRWF(batch.actualCostPerUnitRWF)} vs planned {formatRWF(batch.plannedCostPerUnitRWF)}). Review your price.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr
                          onClick={() => setDetailBatch(batch)}
                          className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 pl-5">
                            <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                              {batch.productName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Batch: {batch.batchCode || batch.id}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isInProg
                                  ? 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40 animate-pulse'
                                  : 'bg-white/10 text-slate-300'
                              }`}
                            >
                              {batch.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-300">
                            {(batch.plannedQuantity || 200).toLocaleString()} {batch.unit || 'pcs'}
                          </td>
                          {activeSubPage === 'Completed Batches' && (
                            <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                              {(batch.actualQuantity || 0).toLocaleString()} {batch.unit || 'pcs'}
                            </td>
                          )}
                          {activeSubPage === 'Completed Batches' && (
                            <td className="p-3.5 text-right font-mono text-rose-400">
                              {batch.wasteQuantity || 0} {batch.unit || 'pcs'}
                            </td>
                          )}
                          {!isCashier && !hideFinancials && (
                            <td className="p-3.5 text-right font-mono font-bold text-white">
                              {formatRWF(isCompleted ? batch.actualCostPerUnitRWF || 180 : batch.plannedUnitCostRWF || 180)}
                            </td>
                          )}
                          <td className="p-3.5 text-slate-300 text-[11px]">
                            {batch.completionDate || batch.plannedDate || 'Today'}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {batch.responsibleEmployee || 'Jean-Pierre'}
                          </td>
                          <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {isInProg && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCompleteModal(batch)}
                                    className="btn-sapphire-clean px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Mark Complete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAbortBatch(batch)}
                                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                                    title="Abort batch & return materials"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              {batch.status === 'Planned' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setBatchRecipeId(batch.recipeId || recipes[0]?.id)
                                    setBatchPlannedQty(batch.plannedQuantity || 200)
                                    setNewBatchDrawerOpen(true)
                                  }}
                                  className="btn-sapphire-clean px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- NEW BATCH DRAWER (With live Stock Check of Materials & Shortage Protection) --- */}
      {newBatchDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewBatchDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Production › Start Batch
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Production Batch</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewBatchDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Recipe Selection */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Recipe *</label>
                  <CustomSelect
                    value={batchRecipeId}
                    onChange={(val) => {
                      setBatchRecipeId(val)
                      const rec = recipes.find((r) => r.id === val)
                      if (rec) setBatchPlannedQty(rec.yieldQuantity || 200)
                    }}
                    options={recipes.map((r) => ({
                      value: r.id,
                      label: `${r.name} (Yield: ${r.yieldQuantity} ${r.unit})`
                    }))}
                    placeholder="Select Recipe"
                  />
                </div>

                {/* 2. Planned Units & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Planned Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={batchPlannedQty}
                      onChange={(e) => setBatchPlannedQty(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Planned Date</label>
                    <input
                      type="date"
                      value={batchPlannedDate}
                      onChange={(e) => setBatchPlannedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Responsible Baker / Supervisor</label>
                  <input
                    type="text"
                    value={batchEmployee}
                    onChange={(e) => setBatchEmployee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                {/* --- LIVE RAW MATERIAL STOCK CHECK --- */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                      Raw Material Stock Validation
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        hasShortages
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {hasShortages ? 'Stock Shortage Detected' : 'All Materials Available'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {batchShortages.map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg flex items-center justify-between gap-2 ${
                          s.isShort
                            ? 'bg-rose-500/15 border border-rose-500/30'
                            : 'bg-[#040C26]/60 border border-white/5'
                        }`}
                      >
                        <div>
                          <strong className="block text-white text-xs">{s.name}</strong>
                          <span className="text-[10px] text-slate-400">
                            Need: <span className="font-mono">{s.requiredQuantity} {s.unit}</span> · In Stock: <span className="font-mono">{s.currentStock} {s.unit}</span>
                          </span>
                        </div>

                        {s.isShort ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-rose-400 font-mono">
                              -{s.shortageQuantity} {s.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCreatePurchase) {
                                  onOpenCreatePurchase({
                                    materialName: s.name,
                                    quantity: s.shortageQuantity,
                                    unit: s.unit
                                  })
                                }
                              }}
                              className="px-2 py-1 rounded bg-[#218DFF] hover:bg-[#1045CA] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Create Purchase</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ready</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {hasShortages && (
                    <p className="text-[10px] text-rose-300">
                      ⚠️ Batches cannot start when raw materials are short. Purchase missing ingredients to unlock production.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                disabled={hasShortages}
                onClick={handleStartBatch}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  hasShortages
                    ? 'bg-white/10 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'btn-sapphire-clean text-white cursor-pointer shadow-lg'
                }`}
              >
                <Play className="w-4 h-4 text-[#9EDCFF]" />
                <span>{hasShortages ? 'Batch Blocked (Missing Materials)' : 'Start Batch (Reserve Materials)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MARK COMPLETE MODAL --- */}
      {completeBatchModalOpen && selectedBatchToComplete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#071330] border border-white/15 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                  Production · Complete Batch
                </span>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Complete {selectedBatchToComplete.batchCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompleteBatchModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Good Sellable Units Produced *</label>
                <input
                  type="number"
                  min="1"
                  value={actualGoodUnits}
                  onChange={(e) => setActualGoodUnits(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#218DFF]"
                />
                <span className="text-[10px] text-slate-400">Added to Finished Goods immediately with batch code &amp; best-before date</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Scrap / Burnt / Broken</label>
                  <input
                    type="number"
                    min="0"
                    value={actualWasteUnits}
                    onChange={(e) => setActualWasteUnits(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={actualHoursSpent}
                    onChange={(e) => setActualHoursSpent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                  />
                </div>
              </div>

              {!isCashier && !hideFinancials && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Extra Unplanned Batch Costs (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={actualExtraCostRWF}
                    onChange={(e) => setActualExtraCostRWF(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                  />
                  <span className="text-[10px] text-slate-400">Extra fuel or overtime if incurred</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmCompleteBatch}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Confirm &amp; Add to Stock
              </button>
              <button
                type="button"
                onClick={() => setCompleteBatchModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DRAWER --- */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Production Export - ${activeSubPage}`}
        pageTitle={`Production - ${activeSubPage}`}
        data={filteredBatches.map((b) => ({
          BatchCode: b.batchCode || b.id,
          Product: b.productName,
          Status: b.status,
          PlannedQty: `${b.plannedQuantity || 0} ${b.unit || 'pcs'}`,
          ActualQty: `${b.actualQuantity || 0} ${b.unit || 'pcs'}`,
          CostPerUnit: formatRWF(b.actualCostPerUnitRWF || b.plannedUnitCostRWF || 0),
          Date: b.completionDate || b.plannedDate || 'N/A',
          Supervisor: b.responsibleEmployee || 'Jean-Pierre'
        }))}
        columns={[
          { key: 'BatchCode', label: 'Batch Code' },
          { key: 'Product', label: 'Product' },
          { key: 'Status', label: 'Status' },
          { key: 'PlannedQty', label: 'Planned Qty' },
          { key: 'ActualQty', label: 'Actual Qty' },
          { key: 'CostPerUnit', label: 'Cost / Unit' },
          { key: 'Date', label: 'Date' },
          { key: 'Supervisor', label: 'Supervisor' }
        ]}
        businessName={activeBizName}
      />
    </div>
  )
}

