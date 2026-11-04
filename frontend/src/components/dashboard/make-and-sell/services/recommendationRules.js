/**
 * ExBOS Make & Sell Recommendation Rules
 * Deterministic business rules evaluating inventory thresholds,
 * recipe shortages, margins, and supplier purchase price variances.
 */

export function evaluateMakeSellRecommendations({
  rawMaterials = [],
  shortages = [],
  currentMarginPct = 0,
  targetMarginPct = 25,
  currentUnitCost = 0,
  previousUnitCost = 0,
  selectedProduct = null,
  supplierPrices = []
}) {
  const recommendations = []

  // 1. Low Raw Material Stock Rule
  rawMaterials.forEach((mat) => {
    const qty = Number(mat.quantity ?? mat.currentStock ?? 0)
    const minStock = Number(mat.minimumStockLevel ?? mat.lowStockAlert ?? 5)
    if (qty <= minStock) {
      recommendations.push({
        id: `REC-STOCK-${mat.id}`,
        type: 'LOW_STOCK',
        severity: qty === 0 ? 'critical' : 'warning',
        title: `Low Raw Material Stock: ${mat.title || mat.name}`,
        message: `Current stock of ${mat.title || mat.name} (${qty} ${mat.unit || 'units'}) is at or below minimum threshold (${minStock} ${mat.unit || 'units'}).`,
        material: mat,
        data: { available: qty, minStock, unit: mat.unit },
        actions: ['View Stock', 'Calculate Purchase', 'Create Purchase Draft']
      })
    }
  })

  // 2. Insufficient Production Materials Rule
  shortages.forEach((sh) => {
    if (sh.shortage > 0) {
      recommendations.push({
        id: `REC-SHORTAGE-${sh.materialId}`,
        type: 'INSUFFICIENT_MATERIALS',
        severity: 'danger',
        title: `Insufficient Material: ${sh.name}`,
        message: `You need ${sh.shortage} ${sh.unit} more ${sh.name} to complete this planned production order.`,
        data: { required: sh.required, available: sh.available, shortage: sh.shortage, unit: sh.unit },
        actions: ['View Calculation', 'Create Purchase Draft', 'Adjust Production Quantity']
      })
    }
  })

  // 3. Low Profit Margin Rule
  if (currentMarginPct > 0 && currentMarginPct < targetMarginPct) {
    recommendations.push({
      id: `REC-MARGIN-${selectedProduct?.id || 'PROD'}`,
      type: 'LOW_MARGIN',
      severity: 'warning',
      title: 'Gross Margin Below Target',
      message: `Your estimated gross margin of ${currentMarginPct}% is below your target of ${targetMarginPct}%.`,
      data: { currentMarginPct, targetMarginPct },
      actions: ['Review Cost', 'Adjust Selling Price', 'Keep Current Price']
    })
  }

  // 4. High Production Cost vs Previous Batch Rule
  if (previousUnitCost > 0 && currentUnitCost > previousUnitCost) {
    const diff = currentUnitCost - previousUnitCost
    const diffPct = Number(((diff / previousUnitCost) * 100).toFixed(1))
    if (diffPct >= 5) {
      recommendations.push({
        id: 'REC-COST-INCREASE',
        type: 'HIGH_PRODUCTION_COST',
        severity: 'info',
        title: 'Production Cost Increased',
        message: `Estimated unit production cost (${currentUnitCost} RWF) has increased by +${diffPct}% (+${diff} RWF) compared to previous comparable batch (${previousUnitCost} RWF).`,
        data: { currentUnitCost, previousUnitCost, diff, diffPct },
        actions: ['Compare Costs', 'Review Material Prices', 'Dismiss']
      })
    }
  }

  // 5. Possible Material Savings Rule
  supplierPrices.forEach((sp) => {
    if (sp.historicalPrice > 0 && sp.latestPrice > sp.historicalPrice) {
      const saving = sp.latestPrice - sp.historicalPrice
      recommendations.push({
        id: `REC-SAVING-${sp.materialId}`,
        type: 'POSSIBLE_SAVINGS',
        severity: 'success',
        title: `Possible Material Savings on ${sp.name}`,
        message: `A previously recorded supplier (${sp.supplierName}) provided ${sp.name} at ${sp.historicalPrice} RWF/${sp.unit}, which is ${saving} RWF cheaper than latest rate (${sp.latestPrice} RWF).`,
        data: { sp, saving },
        actions: ['Compare Supplier Prices', 'Use Price for Estimate', 'Dismiss']
      })
    }
  })

  return recommendations
}

