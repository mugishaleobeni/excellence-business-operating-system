import React, { useState, useMemo } from 'react'
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowRight,
  Sliders,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  Save,
  RotateCcw,
  Zap,
  Gauge
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import {
  scaleRecipe,
  calculateMaterialShortages,
  generatePurchaseRecommendations,
  calculateProductionCost,
  calculateSellingPriceScenarios,
  predictProfit,
  calculateMaxProductionCapacity,
  calculateAffordableProduction
} from '../services/productionCalculations'

export default function ProductionCalculator({
  products = [],
  recipes = [],
  rawMaterials = [],
  onStartProduction = null,
  onCreatePurchaseDraft = null,
  onSaveDraft = null,
  hideFinancials = false,
  addToast = null
}) {
  // Step 1: Product & Quantity Selection
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null
  }, [products, selectedProductId])

  const associatedRecipe = useMemo(() => {
    if (!selectedProduct) return recipes[0] || null
    return (
      recipes.find((r) => r.id === selectedProduct.recipeId || r.productId === selectedProduct.id) ||
      recipes[0] ||
      null
    )
  }, [recipes, selectedProduct])

  const [desiredQuantity, setDesiredQuantity] = useState(
    associatedRecipe ? Number(associatedRecipe.yield) : 100
  )

  // Step 4: Cost Inputs
  const [directLabor, setDirectLabor] = useState(associatedRecipe?.laborCostRWF || 15000)
  const [electricity, setElectricity] = useState(associatedRecipe?.overheadCostRWF || 3000)
  const [packaging, setPackaging] = useState(5000)
  const [otherCosts, setOtherCosts] = useState(2000)
  const [expectedWastePct, setExpectedWastePct] = useState(associatedRecipe?.expectedWastePct || 2)

  // Step 5: Pricing Inputs
  const [chosenSellingPrice, setChosenSellingPrice] = useState(
    selectedProduct?.sellingPriceRWF || 1400
  )
  const [targetMargin, setTargetMargin] = useState(0.25) // 25% default
  const [expectedSoldQty, setExpectedSoldQty] = useState(desiredQuantity)

  // Capacity & Budget Planner State
  const [activeTab, setActiveTab] = useState('calculator') // 'calculator' | 'capacity' | 'budget'
  const [purchasingBudget, setPurchasingBudget] = useState(50000)

  // Scaled Recipe Calculation (Test A)
  const scaled = useMemo(() => {
    return scaleRecipe(associatedRecipe, desiredQuantity)
  }, [associatedRecipe, desiredQuantity])

  // Material Shortages vs Inventory (Test B)
  const shortages = useMemo(() => {
    return calculateMaterialShortages(scaled.scaledIngredients, rawMaterials)
  }, [scaled, rawMaterials])

  const totalRawMaterialCost = useMemo(() => {
    return shortages.reduce((sum, item) => sum + Math.round(item.required * item.unitPrice), 0)
  }, [shortages])

  const hasShortages = useMemo(() => {
    return shortages.some((item) => item.shortage > 0)
  }, [shortages])

  // Purchase Recommendations (Test C)
  const initialRecommendations = useMemo(() => {
    return generatePurchaseRecommendations(shortages)
  }, [shortages])

  const [recommendations, setRecommendations] = useState(initialRecommendations)

  // Keep recommendations in sync when shortages change
  React.useEffect(() => {
    setRecommendations(generatePurchaseRecommendations(shortages))
  }, [shortages])

  const totalPurchaseBudgetRequired = useMemo(() => {
    return recommendations.reduce((sum, item) => sum + (item.estimatedTotal || 0), 0)
  }, [recommendations])

  // Production Cost Calculation (Test D)
  const costSummary = useMemo(() => {
    return calculateProductionCost({
      materialCost: totalRawMaterialCost,
      directLabor,
      electricity,
      packaging,
      otherCosts,
      plannedQuantity: desiredQuantity,
      expectedWastePct
    })
  }, [totalRawMaterialCost, directLabor, electricity, packaging, otherCosts, desiredQuantity, expectedWastePct])

  // Selling Price Scenarios (Test E)
  const priceScenarios = useMemo(() => {
    return calculateSellingPriceScenarios(costSummary.unitProductionCost, chosenSellingPrice)
  }, [costSummary.unitProductionCost, chosenSellingPrice])

  // Profit Prediction (Test F & G)
  const profitProjection = useMemo(() => {
    return predictProfit({
      expectedQuantitySold: expectedSoldQty,
      unitProductionCost: costSummary.unitProductionCost,
      sellingPrice: chosenSellingPrice,
      discounts: 0,
      additionalSellingExpenses: 0
    })
  }, [expectedSoldQty, costSummary.unitProductionCost, chosenSellingPrice])

  // Capacity calculation ("How Much Can I Produce?")
  const capacity = useMemo(() => {
    return calculateMaxProductionCapacity(associatedRecipe, rawMaterials)
  }, [associatedRecipe, rawMaterials])

  // Budget planner calculation
  const budgetPlan = useMemo(() => {
    return calculateAffordableProduction(purchasingBudget, associatedRecipe, rawMaterials)
  }, [purchasingBudget, associatedRecipe, rawMaterials])

  // Update recommendations quantity
  const handleUpdateRecommendationQty = (materialId, newQty) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.materialId === materialId) {
          const qty = Math.max(0, Number(newQty) || 0)
          return {
            ...rec,
            suggestedQuantity: qty,
            estimatedTotal: Math.round(qty * rec.unitPrice)
          }
        }
        return rec
      })
    )
  }

  // Update recommendations unit price
  const handleUpdateRecommendationPrice = (materialId, newPrice) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.materialId === materialId) {
          const price = Math.max(0, Number(newPrice) || 0)
          return {
            ...rec,
            unitPrice: price,
            estimatedTotal: Math.round(rec.suggestedQuantity * price)
          }
        }
        return rec
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0B215E] via-[#071644] to-[#040C26] border border-[#218DFF]/30 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF] shadow-inner">
            <Calculator className="w-6 h-6 text-[#218DFF]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-bold uppercase tracking-wider bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/30">
                Core Planning Engine
              </span>
              <span className="text-xs text-slate-300">Make &amp; Sell</span>
            </div>
            <h2 className="font-orbitron text-xl sm:text-2xl font-black text-white mt-1">
              Production &amp; Profit Calculator
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Plan manufacturing batches, analyze material shortages, calculate true unit costs, and optimize selling prices before spending money.
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/15 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'calculator'
                ? 'exbos-glass-pill-active border border-white/30 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Full Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('capacity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'capacity'
                ? 'exbos-glass-pill-active border border-white/30 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Capacity Limit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'budget'
                ? 'exbos-glass-pill-active border border-white/30 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Budget Planner
          </button>
        </div>
      </div>

      {/* CAPACITY LIMIT VIEW */}
      {activeTab === 'capacity' && (
        <div className="exbos-glass-card p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Inventory Capacity Analysis
              </span>
              <h3 className="font-orbitron text-xl font-bold text-white mt-1">
                How Much Can I Produce Right Now?
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Calculates maximum production output without purchasing any new raw materials.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase block font-bold">Selected Product</span>
              <span className="text-sm font-bold text-white">{selectedProduct?.name}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#071644] to-[#040C26] border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">
                Maximum Immediate Output
              </span>
              <div className="font-orbitron text-3xl sm:text-4xl font-extrabold text-white">
                {capacity.maxCapacity} {selectedProduct?.unit || 'units'}
              </div>
              <p className="text-xs text-slate-300">
                You currently have enough unreserved materials to produce approximately{' '}
                <strong className="text-emerald-300">{capacity.maxCapacity} {selectedProduct?.unit || 'units'}</strong>.
              </p>
            </div>

            {capacity.limitingMaterial && (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-right space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">
                  Limiting Raw Material
                </span>
                <strong className="text-sm text-white block">
                  {capacity.limitingMaterial.name}
                </strong>
                <span className="text-xs font-mono text-slate-300">
                  {capacity.limitingMaterial.available} {capacity.limitingMaterial.unit} available
                </span>
              </div>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="space-y-3">
            <h4 className="font-orbitron text-xs font-bold text-slate-300 uppercase tracking-wider">
              Component Availability Breakdown
            </h4>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                    <th className="py-2.5 px-3">Ingredient</th>
                    <th className="py-2.5 px-3">Stock Available</th>
                    <th className="py-2.5 px-3">Required per Unit</th>
                    <th className="py-2.5 px-3 text-right">Max Output Supported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {capacity.breakdown.map((row) => (
                    <tr key={row.material} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">{row.material}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {row.available} {row.unit}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {Number(row.neededPerUnit.toFixed(4))} {row.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#9EDCFF]">
                        {row.possibleUnits} {selectedProduct?.unit || 'units'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setDesiredQuantity(capacity.maxCapacity)
                setActiveTab('calculator')
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Zap className="w-4 h-4" />
              <span>Produce Available Quantity ({capacity.maxCapacity})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/20 transition-all"
            >
              <span>Calculate Materials for More</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTION BUDGET PLANNER VIEW */}
      {activeTab === 'budget' && (
        <div className="exbos-glass-card p-6 space-y-6">
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF]">
                Purchasing Budget Planner
              </span>
              <h3 className="font-orbitron text-xl font-bold text-white mt-1">
                What Can I Manufacture with My Cash Budget?
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Combines available warehouse stock with cash-purchased materials to maximize yield.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-[#9EDCFF]">
                Available Purchasing Budget (RWF)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={purchasingBudget}
                onChange={(e) => setPurchasingBudget(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-base font-orbitron font-bold text-white focus:outline-none focus:border-[#218DFF]"
              />
              <span className="text-[11px] text-slate-400">Cash available today for material replenishment</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Stock Capacity</span>
              <strong className="font-orbitron text-xl text-white block mt-1">
                {budgetPlan.currentCapacity} {selectedProduct?.unit || 'units'}
              </strong>
              <span className="text-[11px] text-slate-400">From stock in storage</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Budget Expansion</span>
              <strong className="font-orbitron text-xl text-emerald-400 block mt-1">
                +{budgetPlan.additionalUnitsAffordable} {selectedProduct?.unit || 'units'}
              </strong>
              <span className="text-[11px] text-slate-400">From {formatRWF(budgetPlan.budget)} purchase</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1045CA]/30 via-[#071644] to-[#040C26] border border-[#218DFF]/40 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-[#9EDCFF] tracking-wider">
                Total Achievable Production
              </span>
              <div className="font-orbitron text-3xl font-black text-white mt-1">
                {budgetPlan.totalPotentialProduction} {selectedProduct?.unit || 'units'}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Produces {budgetPlan.currentCapacity} from existing inventory + {budgetPlan.additionalUnitsAffordable} from budget replenishment.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setDesiredQuantity(budgetPlan.totalPotentialProduction)
                setActiveTab('calculator')
              }}
              className="px-5 py-2.5 rounded-xl bg-[#218DFF] hover:bg-[#3ba0ff] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all"
            >
              <span>Load Into Production Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FULL 6-SECTION INTERACTIVE PRODUCTION CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          {/* SECTION 1 — PRODUCT & QUANTITY (Test A) */}
          <div className="exbos-glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="w-7 h-7 rounded-xl bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold text-xs flex items-center justify-center">
                01
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                  Select Product &amp; Planned Production Output
                </h3>
                <p className="text-[11px] text-slate-400">
                  Choose what you want to manufacture and how many units to produce.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Finished Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title} ({p.unit || 'pcs'})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400">
                  Catalog Price: <strong>{formatRWF(selectedProduct?.sellingPriceRWF, hideFinancials)}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">
                  Desired Production Quantity ({selectedProduct?.unit || 'units'})
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={desiredQuantity}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value) || 1)
                    setDesiredQuantity(val)
                    setExpectedSoldQty(val)
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm font-orbitron font-bold text-white focus:outline-none focus:border-[#218DFF]"
                />
                <span className="text-[11px] text-slate-400">
                  Recipe Base Yield: {associatedRecipe?.yield} {associatedRecipe?.unit || 'units'} · Scale Factor: {scaled.scaleFactor}x
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Linked Recipe / BOM</label>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-0.5">
                  <span className="font-semibold text-white block truncate">
                    {associatedRecipe?.name || 'Standard Production Recipe'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {associatedRecipe?.ingredients?.length || 0} ingredients registered
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 — MATERIAL REQUIREMENTS & INVENTORY CHECK (Test B) */}
          <div className="exbos-glass-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold text-xs flex items-center justify-center">
                  02
                </div>
                <div>
                  <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                    Material Requirements &amp; Inventory Shortage Check
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Comparing scaled recipe quantities against available unreserved stock in storage.
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto flex items-center gap-1.5 ${
                  hasShortages
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {hasShortages ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Insufficient Materials — Purchases Required</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>All Raw Materials Available in Stock</span>
                  </>
                )}
              </span>
            </div>

            {/* Material Requirements Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                    <th className="py-2.5 px-3">Raw Material</th>
                    <th className="py-2.5 px-3 text-right">Required Quantity</th>
                    <th className="py-2.5 px-3 text-right">In Stock</th>
                    <th className="py-2.5 px-3 text-right">Shortage</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Material Cost</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {shortages.map((item) => (
                    <tr key={item.materialId} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {item.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{item.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white font-bold">
                        {item.required} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {item.available} {item.unit}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        item.shortage > 0 ? 'text-amber-300' : 'text-emerald-400'
                      }`}>
                        {item.shortage > 0 ? `-${item.shortage} ${item.unit}` : '0'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatRWF(item.unitPrice, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatRWF(Math.round(item.required * item.unitPrice), hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.shortage > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {item.shortage > 0 ? 'Shortage' : 'In Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/20 font-bold bg-white/5">
                    <td colSpan={5} className="py-2.5 px-3 text-white font-orbitron text-xs">
                      TOTAL ESTIMATED RAW MATERIAL COST
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white text-sm">
                      {formatRWF(totalRawMaterialCost, hideFinancials)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* SECTION 3 — PURCHASING RECOMMENDATIONS (Test C) */}
          {hasShortages && (
            <div className="exbos-glass-card p-6 space-y-4 border-l-4 border-amber-400">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 font-orbitron font-bold text-xs flex items-center justify-center">
                    03
                  </div>
                  <div>
                    <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                      Purchase Recommendations &amp; Replenishment Budget
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Based on missing quantities and supplier packaging constraints (e.g. 10kg, 25kg, 50kg sacks).
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Purchasing Budget</span>
                  <strong className="font-orbitron text-base text-amber-300">
                    {formatRWF(totalPurchaseBudgetRequired, hideFinancials)}
                  </strong>
                </div>
              </div>

              {/* Editable Recommendation Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-right">Shortage</th>
                      <th className="py-2.5 px-3">Package Constraint Reason</th>
                      <th className="py-2.5 px-3 text-right">Suggested Purchase</th>
                      <th className="py-2.5 px-3 text-right">Estimated Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Estimated Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recommendations.map((rec) => (
                      <tr key={rec.materialId} className="hover:bg-white/5 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">{rec.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-300 font-bold">
                          {rec.shortage} {rec.unit}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-300 max-w-xs">
                          {rec.reason}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={rec.suggestedQuantity}
                            onChange={(e) => handleUpdateRecommendationQty(rec.materialId, e.target.value)}
                            className="w-24 px-2 py-1 text-right font-mono font-bold rounded-lg bg-[#071644] border border-white/20 text-white focus:outline-none"
                          />
                          <span className="ml-1 text-[11px] text-slate-400">{rec.unit}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={rec.unitPrice}
                            onChange={(e) => handleUpdateRecommendationPrice(rec.materialId, e.target.value)}
                            className="w-24 px-2 py-1 text-right font-mono rounded-lg bg-[#071644] border border-white/20 text-white focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                          {formatRWF(rec.estimatedTotal, hideFinancials)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Purchase Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <p className="text-[11px] text-slate-400">
                  Clicking &quot;Create Purchase Draft&quot; prepares the supplier orders without deducting cash or increasing inventory until goods are confirmed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (onCreatePurchaseDraft) {
                      onCreatePurchaseDraft(recommendations)
                    } else if (addToast) {
                      addToast({
                        type: 'info',
                        title: 'Purchase Orders Drafted',
                        message: `Drafted ${recommendations.length} material purchase orders totaling ${formatRWF(totalPurchaseBudgetRequired)}.`
                      })
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Create Purchase Draft ({formatRWF(totalPurchaseBudgetRequired)})</span>
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4 — PRODUCTION COST ESTIMATION (Test D) */}
          <div className="exbos-glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="w-7 h-7 rounded-xl bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold text-xs flex items-center justify-center">
                04
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                  Production Cost Estimation
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total Production Cost = Raw Materials + Direct Labor + Electricity + Packaging + Overhead
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Materials (Calculated)</span>
                <input
                  type="text"
                  readOnly
                  value={formatRWF(costSummary.materialCost, hideFinancials)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-white"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9EDCFF]">Direct Labor (RWF)</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={directLabor}
                  onChange={(e) => setDirectLabor(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9EDCFF]">Electricity (RWF)</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={electricity}
                  onChange={(e) => setElectricity(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9EDCFF]">Packaging (RWF)</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={packaging}
                  onChange={(e) => setPackaging(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9EDCFF]">Other Overhead (RWF)</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={otherCosts}
                  onChange={(e) => setOtherCosts(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-300">Expected Spoilage (%)</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={expectedWastePct}
                  onChange={(e) => setExpectedWastePct(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-amber-300 focus:outline-none"
                />
              </div>
            </div>

            {/* Cost Summary Pill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Production Cost</span>
                <strong className="font-orbitron text-xl text-white block mt-0.5">
                  {formatRWF(costSummary.totalProductionCost, hideFinancials)}
                </strong>
                <span className="text-[11px] text-slate-400">All materials &amp; overhead combined</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Expected Usable Units</span>
                <strong className="font-orbitron text-xl text-emerald-400 block mt-0.5">
                  {costSummary.expectedUsableUnits} {selectedProduct?.unit || 'units'}
                </strong>
                <span className="text-[11px] text-slate-400">
                  {costSummary.expectedDefectiveUnits > 0
                    ? `Accounting for ${costSummary.expectedDefectiveUnits} defective/waste units`
                    : '100% usable yield forecast'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-[#1045CA]/25 to-[#071644] border border-[#218DFF]/40">
                <span className="text-[10px] uppercase font-bold text-[#9EDCFF]">Unit Production Cost</span>
                <strong className="font-orbitron text-2xl text-white block mt-0.5">
                  {formatRWF(costSummary.unitProductionCost, hideFinancials)}
                </strong>
                <span className="text-[11px] text-[#9EDCFF]/80">Cost per usable {selectedProduct?.unit || 'unit'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 5 — SELLING PRICE & PROFIT RECOMMENDATION (Test E) */}
          <div className="exbos-glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="w-7 h-7 rounded-xl bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold text-xs flex items-center justify-center">
                05
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                  Selling Price &amp; Profit Recommendations
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compare your current selling price with recommended prices across target profit margins.
                </p>
              </div>
            </div>

            {priceScenarios.isCurrentBelowCost && (
              <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  <strong>Warning:</strong> Your current selling price ({formatRWF(chosenSellingPrice)}) is below the estimated unit production cost ({formatRWF(costSummary.unitProductionCost)}). Each item sold results in a loss!
                </span>
              </div>
            )}

            {/* Target Margin Scenarios Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {priceScenarios.scenarios.map((sc) => {
                const isSelected = chosenSellingPrice === sc.suggestedPrice
                return (
                  <button
                    key={sc.targetMarginPct}
                    type="button"
                    onClick={() => setChosenSellingPrice(sc.suggestedPrice)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#218DFF]/25 border-[#218DFF] shadow-lg ring-1 ring-[#218DFF]'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {sc.targetMarginPct}% Target Margin
                      </span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#218DFF] text-[9px] font-bold text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <strong className="font-orbitron text-lg text-white block mt-1">
                      {formatRWF(sc.suggestedPrice, hideFinancials)}
                    </strong>
                    <div className="text-[11px] text-emerald-400 font-mono mt-1">
                      +{formatRWF(sc.profitPerUnit, hideFinancials)} profit/unit
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Manual Price Override */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Active Selling Price for this Batch</span>
                <span className="text-[11px] text-slate-400">
                  You can type any custom price. Changing the price here updates projected profit without altering catalog prices until confirmed.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">RWF</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={chosenSellingPrice}
                  onChange={(e) => setChosenSellingPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="w-36 px-3 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-sm font-orbitron font-bold text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 6 — PROFIT PREDICTION & CONFIRMATION (Test F & G) */}
          <div className="exbos-glass-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <div className="w-7 h-7 rounded-xl bg-[#218DFF]/20 text-[#9EDCFF] font-orbitron font-bold text-xs flex items-center justify-center">
                06
              </div>
              <div>
                <h3 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                  Profit Prediction &amp; Batch Confirmation
                </h3>
                <p className="text-[11px] text-slate-400">
                  Projected revenue, Cost of Goods Sold (COGS), and potential gross profit.
                </p>
              </div>
            </div>

            {/* Financial Projection Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Units Expected to Sell</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max={costSummary.expectedUsableUnits}
                    value={expectedSoldQty}
                    onChange={(e) => setExpectedSoldQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-20 px-2 py-0.5 font-orbitron font-bold text-sm rounded bg-[#071644] border border-white/20 text-white"
                  />
                  <span className="text-xs text-slate-400">/ {costSummary.expectedUsableUnits}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Expected Sales Revenue</span>
                <strong className="font-orbitron text-lg text-white block mt-1">
                  {formatRWF(profitProjection.expectedRevenue, hideFinancials)}
                </strong>
                <span className="text-[11px] text-slate-400">
                  at {formatRWF(chosenSellingPrice)}/unit
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cost of Goods Sold</span>
                <strong className="font-orbitron text-lg text-slate-300 block mt-1">
                  {formatRWF(profitProjection.expectedCogs, hideFinancials)}
                </strong>
                <span className="text-[11px] text-slate-400">
                  at {formatRWF(costSummary.unitProductionCost)}/unit
                </span>
              </div>

              <div className={`p-4 rounded-xl border ${
                profitProjection.isLoss
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              }`}>
                <span className="text-[10px] uppercase font-bold block">
                  Potential Gross Profit
                </span>
                <strong className="font-orbitron text-xl block mt-1">
                  {formatRWF(profitProjection.potentialGrossProfit, hideFinancials)}
                </strong>
                <span className="text-[11px] font-bold block">
                  {profitProjection.grossMarginPct}% Gross Margin
                </span>
              </div>
            </div>

            {/* Production Action Bar */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/15 flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="text-xs text-slate-300">
                <span>Production Plan: </span>
                <strong className="text-white">
                  {desiredQuantity} {selectedProduct?.unit || 'units'} {selectedProduct?.name}
                </strong>
                <span className="mx-2 text-slate-500">|</span>
                <span>Unit Cost: </span>
                <strong className="text-[#9EDCFF]">{formatRWF(costSummary.unitProductionCost)}</strong>
                <span className="mx-2 text-slate-500">|</span>
                <span>Projected Profit: </span>
                <strong className="text-emerald-400">{formatRWF(profitProjection.potentialGrossProfit)}</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onSaveDraft) {
                      onSaveDraft({
                        productId: selectedProduct?.id,
                        productName: selectedProduct?.name,
                        plannedQuantity: desiredQuantity,
                        unitCost: costSummary.unitProductionCost,
                        sellingPrice: chosenSellingPrice,
                        status: 'Draft'
                      })
                    } else if (addToast) {
                      addToast({
                        type: 'info',
                        title: 'Draft Saved',
                        message: `Saved production plan for ${desiredQuantity} ${selectedProduct?.name} without altering stock.`
                      })
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer border border-white/20 transition-all"
                >
                  <Save className="w-4 h-4 text-slate-300" />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onStartProduction) {
                      onStartProduction({
                        productId: selectedProduct?.id,
                        productName: selectedProduct?.name,
                        plannedQuantity: desiredQuantity,
                        unitCostRWF: costSummary.unitProductionCost,
                        sellingPriceRWF: chosenSellingPrice,
                        totalProductionCostRWF: costSummary.totalProductionCost,
                        status: 'In Progress'
                      })
                    } else if (addToast) {
                      addToast({
                        type: 'success',
                        title: 'Production Started',
                        message: `Started production order for ${desiredQuantity} ${selectedProduct?.name}.`
                      })
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Production ({desiredQuantity} units)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

