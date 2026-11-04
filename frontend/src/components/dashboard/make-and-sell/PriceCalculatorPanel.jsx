import React, { useState, useMemo } from 'react'
import {
  Calculator,
  Percent,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  Plus,
  Trash2,
  RotateCcw,
  Layers,
  ArrowUpRight,
  Check,
  X
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

/**
 * Section 5: Price calculator from raw materials used
 *
 * Implements the exact 7-step formula:
 * 1. Material cost per batch = Sum(qty * unitCost)
 * 2. Total cost per batch = Material cost + Other costs
 * 3. Cost per unit = Total cost / yield
 * 4. Cost per good unit = Cost per unit / (1 - wastage%)
 * 5a. Price by margin = Cost per good unit / (1 - margin%)
 * 5b. Price by markup = Cost per good unit * (1 + markup%)
 * 6. Suggested price = Step 5 rounded up as chosen (10, 50, 100, 500 RWF or none)
 * 7. Results: Cost per unit, suggested price, profit per unit, profit per batch, margin% and markup%
 */
export default function PriceCalculatorPanel({
  product = null,
  recipe = null,
  rawMaterials = [],
  onApplyPrice = null,
  onClose = null,
  isCashier = false,
  hideFinancials = false
}) {
  // Cashier role protection: hide costs, margins, and calculator
  if (isCashier || hideFinancials) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h4 className="text-sm font-orbitron font-bold text-white">Access Restricted</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Price calculations and cost breakdowns are restricted to Manager and Admin roles. Cashier accounts can only view established selling prices.
        </p>
      </div>
    )
  }

  // Cost Basis: Latest purchase price vs Average stock cost
  const [costBasis, setCostBasis] = useState('latest') // 'latest' | 'average'

  // Profit mode toggle: 'margin' | 'markup'
  const [profitMode, setProfitMode] = useState('margin')
  const [targetPercentage, setTargetPercentage] = useState(recipe?.targetMarginPct || 40)

  // Rounding options: 10, 50, 100, 500, or 0 (none)
  const [roundingOption, setRoundingOption] = useState(10)

  // Batch Yield & Wastage
  const [batchYield, setBatchYield] = useState(recipe?.yieldQuantity || 200)
  const [wastagePct, setWastagePct] = useState(recipe?.wastageAllowancePct ?? 2.5)

  // Ingredients State (pre-filled from recipe or default worked example)
  const [ingredients, setIngredients] = useState(() => {
    if (recipe?.ingredients && recipe.ingredients.length > 0) {
      return recipe.ingredients.map((ing) => {
        const mat = rawMaterials.find((m) => m.id === ing.materialId || m.name === ing.materialName)
        const unitCost = mat?.purchasePriceRWF || ing.unitCost || 1000
        return {
          id: ing.materialId || `ing-${Math.random()}`,
          name: ing.materialName || mat?.name || 'Raw Material',
          quantity: ing.quantity || 1,
          unit: ing.unit || mat?.unit || 'kg',
          unitCost: Number(unitCost)
        }
      })
    }
    // Default Worked Example from Section 5
    return [
      { id: 'ing-flour', name: 'Flour (Wheat)', quantity: 20, unit: 'kg', unitCost: 1200 },
      { id: 'ing-sugar', name: 'Sugar (White Granulated)', quantity: 3, unit: 'kg', unitCost: 1800 }
    ]
  })

  // Other costs per batch (gas, labour, packaging, transport, electricity)
  const [otherCosts, setOtherCosts] = useState(() => {
    if (recipe?.otherCosts && recipe.otherCosts.length > 0) {
      return recipe.otherCosts
    }
    return [
      { id: 'cost-gas-labour', name: 'Gas & Bakery Labour', amount: 6600 },
      { id: 'cost-packaging', name: 'Packaging Bags & Ties', amount: 0 }
    ]
  })

  const [showComparison, setShowComparison] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // Handle ingredient changes
  const updateIngredient = (index, field, value) => {
    setIngredients((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addIngredientRow = () => {
    const firstMat = rawMaterials[0]
    setIngredients((prev) => [
      ...prev,
      {
        id: `ing-${Date.now()}`,
        name: firstMat?.name || 'New Ingredient',
        quantity: 1,
        unit: firstMat?.unit || 'kg',
        unitCost: Number(firstMat?.purchasePriceRWF || 1000)
      }
    ])
  }

  const removeIngredientRow = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  // Handle other costs changes
  const updateOtherCost = (index, field, value) => {
    setOtherCosts((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const addOtherCostRow = () => {
    setOtherCosts((prev) => [
      ...prev,
      { id: `other-${Date.now()}`, name: 'Additional Cost (e.g. Transport)', amount: 1000 }
    ])
  }

  const removeOtherCostRow = (index) => {
    setOtherCosts((prev) => prev.filter((_, i) => i !== index))
  }

  // --- Calculations (Section 5) ---
  const calculations = useMemo(() => {
    // 1. Material cost per batch
    const materialCost = ingredients.reduce((sum, ing) => {
      return sum + (Number(ing.quantity) || 0) * (Number(ing.unitCost) || 0)
    }, 0)

    // 2. Total other costs
    const otherCostTotal = otherCosts.reduce((sum, cost) => {
      return sum + (Number(cost.amount) || 0)
    }, 0)

    // Total cost per batch
    const totalCostPerBatch = materialCost + otherCostTotal

    // 3. Cost per unit
    const safeYield = Math.max(Number(batchYield) || 1, 1)
    const costPerUnit = totalCostPerBatch / safeYield

    // 4. Cost per good unit (accounting for wastage allowance)
    const safeWastage = Math.min(Math.max(Number(wastagePct) || 0, 0), 99) / 100
    const costPerGoodUnit = costPerUnit / (1 - safeWastage)

    // 5. Price calculation
    const pct = Math.min(Math.max(Number(targetPercentage) || 0, 0), 99) / 100
    let rawPrice = costPerGoodUnit

    if (profitMode === 'margin') {
      // Step 5a: Cost per good unit / (1 - margin%)
      rawPrice = costPerGoodUnit / Math.max(1 - pct, 0.01)
    } else {
      // Step 5b: Cost per good unit * (1 + markup%)
      rawPrice = costPerGoodUnit * (1 + pct)
    }

    // 6. Rounding up as chosen (10, 50, 100, 500 RWF or none)
    let suggestedPrice = rawPrice
    if (roundingOption > 0) {
      suggestedPrice = Math.ceil(rawPrice / roundingOption) * roundingOption
    } else {
      suggestedPrice = Math.round(rawPrice)
    }

    // 7. Results shown
    const profitPerUnit = suggestedPrice - costPerGoodUnit
    const goodUnitsProduced = safeYield * (1 - safeWastage)
    const profitPerBatch = profitPerUnit * goodUnitsProduced

    const actualMarginPct = suggestedPrice > 0 ? (profitPerUnit / suggestedPrice) * 100 : 0
    const actualMarkupPct = costPerGoodUnit > 0 ? (profitPerUnit / costPerGoodUnit) * 100 : 0

    // Compare with current product selling price if available
    const currentPrice = Number(product?.sellingPriceRWF || product?.sellingPrice || product?.price || 0)
    const priceDiff = suggestedPrice - currentPrice
    const isSellingBelowCost = currentPrice > 0 && currentPrice < costPerGoodUnit

    return {
      materialCost,
      otherCostTotal,
      totalCostPerBatch,
      costPerUnit,
      costPerGoodUnit,
      rawPrice,
      suggestedPrice,
      profitPerUnit,
      profitPerBatch,
      actualMarginPct,
      actualMarkupPct,
      currentPrice,
      priceDiff,
      isSellingBelowCost,
      goodUnitsProduced
    }
  }, [ingredients, otherCosts, batchYield, wastagePct, profitMode, targetPercentage, roundingOption, product])

  const handleUseThisPrice = () => {
    if (onApplyPrice) {
      onApplyPrice(calculations.suggestedPrice)
    }
    setAppliedSuccess(true)
    setTimeout(() => setAppliedSuccess(false), 2500)
  }

  return (
    <div className="exbos-glass-card p-5 sm:p-6 space-y-6 max-w-4xl mx-auto border border-white/15">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Section 5 · Pricing Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40">
              Live Price Calculator
            </span>
            {calculations.isSellingBelowCost && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                Selling Below Cost
              </span>
            )}
          </div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#218DFF]" />
            <span>Price Calculator from Raw Materials</span>
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Derive unit cost directly from recipe raw materials, apply your target profit, and calculate suggested selling price.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer self-start sm:self-auto"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Applied Success Banner */}
      {appliedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Updated product selling price to {formatRWF(calculations.suggestedPrice)}!</span>
        </div>
      )}

      {/* Warning banner when selling below cost */}
      {calculations.isSellingBelowCost && (
        <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <strong className="block font-bold">Selling Below Cost Alert</strong>
            <span>
              Your current selling price ({formatRWF(calculations.currentPrice)}) is less than the production cost per good unit ({formatRWF(calculations.costPerGoodUnit)}). Review your price to prevent operating losses.
            </span>
          </div>
        </div>
      )}

      {/* Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Ingredients, Other Costs & Batch Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* Ingredients Table */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Raw Material Ingredients</span>
              </span>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-[11px] font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Ingredient</span>
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div
                  key={ing.id || idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-[#040C26]/60 border border-white/5 text-xs"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      placeholder="Ingredient name"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1">
                    <input
                      type="number"
                      step="any"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-right focus:outline-none focus:border-[#218DFF]"
                    />
                    <span className="text-slate-400 text-[11px]">{ing.unit}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-slate-300 font-mono text-[11px]">
                      {formatRWF((Number(ing.quantity) || 0) * (Number(ing.unitCost) || 0))}
                    </span>
                    <div className="text-[9px] text-slate-500">
                      @{Number(ing.unitCost).toLocaleString()}/{ing.unit}
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredientRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400 font-medium">Material Cost Subtotal:</span>
              <strong className="text-white font-mono text-sm">{formatRWF(calculations.materialCost)}</strong>
            </div>
          </div>

          {/* Other Costs per Batch */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Other Costs per Batch</span>
              </span>
              <button
                type="button"
                onClick={addOtherCostRow}
                className="text-[11px] font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Add Cost</span>
              </button>
            </div>

            <div className="space-y-2">
              {otherCosts.map((cost, idx) => (
                <div
                  key={cost.id || idx}
                  className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-[#040C26]/60 border border-white/5 text-xs"
                >
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={cost.name}
                      onChange={(e) => updateOtherCost(idx, 'name', e.target.value)}
                      placeholder="e.g. Gas & Labour"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div className="col-span-5">
                    <div className="relative">
                      <input
                        type="number"
                        value={cost.amount}
                        onChange={(e) => updateOtherCost(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs text-right pr-12 focus:outline-none focus:border-[#218DFF]"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[10px] text-slate-400">RWF</span>
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    {otherCosts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOtherCostRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400 font-medium">Other Costs Subtotal:</span>
              <strong className="text-white font-mono text-sm">{formatRWF(calculations.otherCostTotal)}</strong>
            </div>
          </div>

          {/* Batch Yield & Wastage Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Batch Yield (Expected Units)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={batchYield}
                  onChange={(e) => setBatchYield(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#218DFF]"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">units</span>
              </div>
              <span className="text-[10px] text-slate-400">Total units planned from 1 batch</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">Wastage Allowance %</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={wastagePct}
                  onChange={(e) => setWastagePct(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#218DFF]"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-400">Expected trim/burn/break loss (e.g. 2.5%)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Strategy & Live Output Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Profit Mode Toggle & Rounding */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <span className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
              Target Profit Strategy
            </span>

            {/* Toggle: Margin % vs Markup % */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#040C26] border border-white/10">
                <button
                  type="button"
                  onClick={() => setProfitMode('margin')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    profitMode === 'margin'
                      ? 'bg-[#218DFF] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Margin %
                </button>
                <button
                  type="button"
                  onClick={() => setProfitMode('markup')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    profitMode === 'markup'
                      ? 'bg-[#218DFF] text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Markup %
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {profitMode === 'margin'
                  ? 'Margin %: Profit as a percentage of the selling price.'
                  : 'Markup %: Profit added as a percentage on top of unit cost.'}
              </p>
            </div>

            {/* Target Percentage Input & Quick Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-300 font-semibold">
                  Target {profitMode === 'margin' ? 'Margin' : 'Markup'}:
                </label>
                <div className="relative w-28">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={targetPercentage}
                    onChange={(e) => setTargetPercentage(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white font-mono text-sm text-right pr-7 focus:outline-none focus:border-[#218DFF]"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                </div>
              </div>

              {/* Quick Pills */}
              <div className="flex items-center gap-1.5">
                {[25, 30, 35, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPercentage(pct)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                      targetPercentage === pct
                        ? 'bg-[#218DFF]/20 text-[#9EDCFF] border-[#218DFF]/50'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Rounding Options */}
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <label className="text-xs text-slate-300 font-semibold block">Price Rounding</label>
              <select
                value={roundingOption}
                onChange={(e) => setRoundingOption(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white text-xs focus:outline-none focus:border-[#218DFF] cursor-pointer"
              >
                <option value={10}>Nearest 10 RWF (Recommended)</option>
                <option value={50}>Nearest 50 RWF</option>
                <option value={100}>Nearest 100 RWF</option>
                <option value={500}>Nearest 500 RWF</option>
                <option value={0}>Exact (No rounding)</option>
              </select>
            </div>
          </div>

          {/* Result Card (Neon Sapphire Hero Card) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1045CA]/30 via-[#071544]/60 to-[#040C26] border border-[#218DFF]/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                Recommended Price
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {calculations.actualMarginPct.toFixed(1)}% Margin · {calculations.actualMarkupPct.toFixed(1)}% Markup
              </span>
            </div>

            {/* Giant Suggested Price */}
            <div className="text-center py-2">
              <div className="text-[11px] text-slate-300 uppercase tracking-widest font-semibold mb-1">
                Suggested Selling Price
              </div>
              <div className="font-orbitron text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-glow">
                {formatRWF(calculations.suggestedPrice)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">per sellable unit</div>
            </div>

            {/* Unit Economics Breakdown */}
            <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Cost per Good Unit:</span>
                <span className="font-mono text-white font-semibold">
                  {formatRWF(calculations.costPerGoodUnit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Profit per Unit:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +{formatRWF(calculations.profitPerUnit)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Expected Profit per Batch:</span>
                <span className="font-mono text-emerald-300 font-bold">
                  +{formatRWF(calculations.profitPerBatch)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Total Batch Production Cost:</span>
                <span className="font-mono">{formatRWF(calculations.totalCostPerBatch)}</span>
              </div>
            </div>

            {/* Comparison with Current Price */}
            {product && calculations.currentPrice > 0 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Current Price:</span>
                  <span className="font-mono">{formatRWF(calculations.currentPrice)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Price Change:</span>
                  <span
                    className={`font-mono ${
                      calculations.priceDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {calculations.priceDiff >= 0 ? '+' : ''}
                    {formatRWF(calculations.priceDiff)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleUseThisPrice}
                className="w-full btn-sapphire-clean py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Check className="w-4 h-4 text-[#9EDCFF]" />
                <span>Use This Price</span>
              </button>

              <div className="flex items-center gap-2">
                {product && (
                  <button
                    type="button"
                    onClick={() => setShowComparison(!showComparison)}
                    className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer border border-white/10"
                  >
                    {showComparison ? 'Hide Compare' : 'Compare'}
                  </button>
                )}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer border border-white/10"
                  >
                    Keep Current Price
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

