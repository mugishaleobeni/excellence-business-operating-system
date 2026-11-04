/**
 * ExBOS Make & Sell Production Calculations Service
 * Separates pure business calculations, recipe scaling, shortage detection,
 * cost accounting, selling price scenarios, and profit projections from UI.
 */

// Supported Unit Conversions
export const UNIT_TYPES = {
  WEIGHT: ['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'mg', 'milligram', 'milligrams', 'ton', 'tons'],
  VOLUME: ['l', 'liter', 'liters', 'litre', 'litres', 'ml', 'milliliter', 'milliliters'],
  LENGTH: [
    'm', 'meter', 'meters', 'metre', 'metres',
    'cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres',
    'mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres',
    'yd', 'yard', 'yards',
    'ft', 'feet', 'foot',
    'in', 'inch', 'inches'
  ],
  AREA: ['sqm', 'm2', 'm²', 'square meter', 'square meters'],
  COUNT: [
    'pcs', 'pieces', 'piece', 'unit', 'units',
    'packs', 'pack', 'bags', 'bag', 'boxes', 'box', 'sacks', 'sack',
    'roll', 'rolls', 'sheet', 'sheets', 'bundle', 'bundles',
    'pair', 'pairs', 'set', 'sets', 'loaf', 'loaves',
    'bottle', 'bottles', 'can', 'cans', 'bucket', 'buckets'
  ]
}

export function normalizeUnit(unit = '') {
  const u = String(unit).toLowerCase().trim()
  if (['m', 'meter', 'meters', 'metre', 'metres'].includes(u)) return 'm'
  if (['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'].includes(u)) return 'cm'
  if (['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'].includes(u)) return 'mm'
  if (['yd', 'yard', 'yards'].includes(u)) return 'yd'
  if (['ft', 'feet', 'foot'].includes(u)) return 'ft'
  if (['in', 'inch', 'inches'].includes(u)) return 'in'
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return 'kg'
  if (['g', 'gram', 'grams'].includes(u)) return 'g'
  if (['mg', 'milligram', 'milligrams'].includes(u)) return 'mg'
  if (['ton', 'tons'].includes(u)) return 'ton'
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(u)) return 'l'
  if (['ml', 'milliliter', 'milliliters'].includes(u)) return 'ml'
  if (['sqm', 'm2', 'm²', 'square meter', 'square meters'].includes(u)) return 'sqm'
  if (['pcs', 'pieces', 'piece', 'unit', 'units'].includes(u)) return 'pcs'
  if (['box', 'boxes'].includes(u)) return 'box'
  if (['pack', 'packs'].includes(u)) return 'pack'
  if (['loaf', 'loaves'].includes(u)) return 'loaf'
  if (['roll', 'rolls'].includes(u)) return 'roll'
  if (['sheet', 'sheets'].includes(u)) return 'sheet'
  if (['bag', 'bags', 'sack', 'sacks'].includes(u)) return 'bag'
  if (['bundle', 'bundles'].includes(u)) return 'bundle'
  if (['pair', 'pairs'].includes(u)) return 'pair'
  if (['set', 'sets'].includes(u)) return 'set'
  return u
}

export function areUnitsCompatible(unitA = '', unitB = '') {
  const uA = String(unitA).toLowerCase().trim()
  const uB = String(unitB).toLowerCase().trim()
  if (uA === uB) return true

  for (const group of Object.values(UNIT_TYPES)) {
    if (group.includes(uA) && group.includes(uB)) return true
  }
  return false
}

export function convertQuantity(quantity, fromUnit = '', toUnit = '') {
  const q = Number(quantity) || 0
  const f = normalizeUnit(fromUnit)
  const t = normalizeUnit(toUnit)

  if (f === t || !f || !t) return q

  // Weight: kg <-> g <-> mg
  if (f === 'kg' && t === 'g') return q * 1000
  if (f === 'g' && t === 'kg') return q / 1000
  if (f === 'g' && t === 'mg') return q * 1000
  if (f === 'mg' && t === 'g') return q / 1000
  if (f === 'kg' && t === 'mg') return q * 1000000
  if (f === 'mg' && t === 'kg') return q / 1000000

  // Volume: L <-> ml
  if (f === 'l' && t === 'ml') return q * 1000
  if (f === 'ml' && t === 'l') return q / 1000

  // Length: m <-> cm <-> mm
  if (f === 'm' && t === 'cm') return q * 100
  if (f === 'cm' && t === 'm') return q / 100
  if (f === 'm' && t === 'mm') return q * 1000
  if (f === 'mm' && t === 'm') return q / 1000
  if (f === 'cm' && t === 'mm') return q * 10
  if (f === 'mm' && t === 'cm') return q / 10

  // Non-convertible incompatible units return unchanged
  return q
}

/**
 * Scales a Bill of Materials recipe based on desired production output.
 * Test A: 20kg flour for 100 breads -> 200 breads = 40kg flour.
 */
export function scaleRecipe(recipe, desiredQuantity) {
  if (!recipe || !recipe.ingredients) {
    return { yield: desiredQuantity || 1, scaledIngredients: [] }
  }

  const baseYield = Math.max(1, Number(recipe.yield) || 1)
  const targetQty = Math.max(0, Number(desiredQuantity) || 0)
  const scaleFactor = targetQty / baseYield

  const scaledIngredients = recipe.ingredients.map((ing) => {
    const baseQty = Number(ing.quantity) || 0
    const scaledQty = Number((baseQty * scaleFactor).toFixed(3))
    return {
      ...ing,
      baseQuantity: baseQty,
      quantity: scaledQty,
      scaleFactor
    }
  })

  return {
    yield: targetQty,
    baseYield,
    scaleFactor,
    scaledIngredients
  }
}

/**
 * Compares required recipe ingredients against current inventory stock.
 * Test B: 40kg required and 25kg available -> shortage = 15kg.
 */
export function calculateMaterialShortages(scaledIngredients = [], inventoryList = []) {
  return scaledIngredients.map((ing) => {
    // Find matching raw material in inventory by id or name
    const rawMaterial = inventoryList.find((item) => {
      const matchId = ing.materialId && (item.id === ing.materialId || item.code === ing.materialId)
      const matchName = String(item.title || item.name || '').toLowerCase().trim() === String(ing.name || '').toLowerCase().trim()
      return matchId || matchName
    })

    const rawStock = Number(rawMaterial?.quantity ?? rawMaterial?.currentStock ?? 0)
    const stockUnit = rawMaterial?.unit || ing.unit || 'units'
    const ingUnit = ing.unit || stockUnit

    // Normalize stock quantity to recipe ingredient unit if compatible
    let availableInIngUnit = rawStock
    if (areUnitsCompatible(stockUnit, ingUnit)) {
      availableInIngUnit = convertQuantity(rawStock, stockUnit, ingUnit)
    }

    const required = Number(ing.quantity) || 0
    const shortage = Math.max(0, Number((required - availableInIngUnit).toFixed(3)))

    // Latest unit purchase price
    const unitPrice = Number(rawMaterial?.unitCostRWF || rawMaterial?.purchasePriceRWF || ing.unitPriceRWF || 0)
    const packageSize = Number(rawMaterial?.packageSize || ing.packageSize || 0)

    return {
      materialId: rawMaterial?.id || ing.materialId || `MAT-${Math.random().toString(36).substr(2, 5)}`,
      name: ing.name,
      category: rawMaterial?.category || ing.category || 'Raw Material',
      unit: ingUnit,
      stockUnit,
      required,
      available: availableInIngUnit,
      shortage,
      unitPrice,
      packageSize,
      supplier: rawMaterial?.supplier || ing.supplier || 'Primary Supplier',
      isSufficient: shortage === 0
    }
  })
}

/**
 * Generates purchase quantity recommendations based on shortages and package constraints.
 * Test C: 15kg shortage with 10kg package size -> 20kg suggested with reason.
 */
export function generatePurchaseRecommendations(materialShortages = []) {
  return materialShortages
    .filter((item) => item.shortage > 0)
    .map((item) => {
      const shortage = item.shortage
      const packSize = item.packageSize

      let suggestedQuantity = shortage
      let reason = `Exact shortage required for production (${shortage} ${item.unit})`

      if (packSize && packSize > 0) {
        const packsNeeded = Math.ceil(shortage / packSize)
        suggestedQuantity = Number((packsNeeded * packSize).toFixed(2))
        reason = `Rounded up from ${shortage} ${item.unit} to nearest ${packSize} ${item.unit} supplier package size (${packsNeeded} packages = ${suggestedQuantity} ${item.unit})`
      }

      const unitPrice = item.unitPrice || 0
      const estimatedTotal = Math.round(suggestedQuantity * unitPrice)

      return {
        ...item,
        suggestedQuantity,
        reason,
        unitPrice,
        estimatedTotal,
        accepted: true
      }
    })
}

/**
 * Calculates estimated production cost per usable unit.
 * Test D: 100,000 RWF total cost and 100 usable products -> 1,000 RWF unit cost.
 */
export function calculateProductionCost({
  materialCost = 0,
  directLabor = 0,
  electricity = 0,
  packaging = 0,
  otherCosts = 0,
  plannedQuantity = 100,
  expectedWastePct = 0
}) {
  const totalProductionCost = Math.round(
    Number(materialCost || 0) +
    Number(directLabor || 0) +
    Number(electricity || 0) +
    Number(packaging || 0) +
    Number(otherCosts || 0)
  )

  const planned = Math.max(1, Number(plannedQuantity) || 1)
  const wasteRate = Math.min(99, Math.max(0, Number(expectedWastePct) || 0)) / 100
  const expectedUsableUnits = Math.max(1, Math.round(planned * (1 - wasteRate)))
  const expectedDefectiveUnits = planned - expectedUsableUnits

  const unitProductionCost = Math.round(totalProductionCost / expectedUsableUnits)

  return {
    materialCost: Number(materialCost) || 0,
    directLabor: Number(directLabor) || 0,
    electricity: Number(electricity) || 0,
    packaging: Number(packaging) || 0,
    otherCosts: Number(otherCosts) || 0,
    totalProductionCost,
    plannedQuantity: planned,
    expectedUsableUnits,
    expectedDefectiveUnits,
    unitProductionCost
  }
}

/**
 * Suggests selling prices based on target gross margins.
 * Test E: unit cost of 1,000 RWF and 20% target margin -> 1,250 RWF suggested price.
 */
export function calculateSellingPriceScenarios(unitCost = 0, currentPrice = 0) {
  const cost = Number(unitCost) || 0
  const cur = Number(currentPrice) || 0

  const currentGrossProfit = Math.round(cur - cost)
  const currentMarginPct = cur > 0 ? Number(((currentGrossProfit / cur) * 100).toFixed(1)) : 0

  const targetMargins = [0.20, 0.25, 0.30, 0.35]

  const scenarios = targetMargins.map((margin) => {
    // Selling Price = Unit Cost / (1 - Target Margin)
    const suggestedPrice = cost > 0 && margin < 1
      ? Math.round(cost / (1 - margin))
      : 0
    const profitPerUnit = Math.round(suggestedPrice - cost)
    return {
      targetMarginPct: Math.round(margin * 100),
      suggestedPrice,
      profitPerUnit,
      isBelowCost: suggestedPrice < cost
    }
  })

  return {
    unitCost: cost,
    currentPrice: cur,
    currentGrossProfit,
    currentMarginPct,
    isCurrentBelowCost: cur > 0 && cur < cost,
    scenarios
  }
}

/**
 * Projects potential gross profit and revenue.
 * Test F: 100 products, unit cost 1,000 RWF, selling price 1,250 RWF -> 25,000 RWF potential gross profit.
 */
export function predictProfit({
  expectedQuantitySold = 100,
  unitProductionCost = 1000,
  sellingPrice = 1250,
  discounts = 0,
  additionalSellingExpenses = 0
}) {
  const qty = Math.max(0, Number(expectedQuantitySold) || 0)
  const cost = Number(unitProductionCost) || 0
  const price = Number(sellingPrice) || 0
  const disc = Number(discounts) || 0
  const extraExpenses = Number(additionalSellingExpenses) || 0

  const expectedGrossRevenue = Math.round(qty * price)
  const netRevenue = Math.max(0, expectedGrossRevenue - disc)
  const expectedCogs = Math.round(qty * cost)
  const potentialGrossProfit = Math.round(netRevenue - expectedCogs)
  const grossMarginPct = netRevenue > 0
    ? Number(((potentialGrossProfit / netRevenue) * 100).toFixed(1))
    : 0

  const estimatedNetProfit = Math.round(potentialGrossProfit - extraExpenses)
  const netMarginPct = netRevenue > 0
    ? Number(((estimatedNetProfit / netRevenue) * 100).toFixed(1))
    : 0

  return {
    expectedQuantitySold: qty,
    unitProductionCost: cost,
    sellingPrice: price,
    expectedRevenue: netRevenue,
    expectedCogs,
    potentialGrossProfit,
    grossMarginPct,
    estimatedNetProfit,
    netMarginPct,
    isLoss: potentialGrossProfit < 0
  }
}

/**
 * Calculates maximum possible production based on the limiting raw material.
 * "How Much Can I Produce?"
 */
export function calculateMaxProductionCapacity(recipe, inventoryList = []) {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
    return { maxCapacity: 0, limitingMaterial: null, breakdown: [] }
  }

  const baseYield = Math.max(1, Number(recipe.yield) || 1)
  let minCapacity = Infinity
  let limitingMaterial = null
  const breakdown = []

  for (const ing of recipe.ingredients) {
    const rawMaterial = inventoryList.find((item) => {
      const matchId = ing.materialId && (item.id === ing.materialId || item.code === ing.materialId)
      const matchName = String(item.title || item.name || '').toLowerCase().trim() === String(ing.name || '').toLowerCase().trim()
      return matchId || matchName
    })

    const rawStock = Number(rawMaterial?.quantity ?? rawMaterial?.currentStock ?? 0)
    const stockUnit = rawMaterial?.unit || ing.unit || 'units'
    const ingUnit = ing.unit || stockUnit

    let available = rawStock
    if (areUnitsCompatible(stockUnit, ingUnit)) {
      available = convertQuantity(rawStock, stockUnit, ingUnit)
    }

    const neededPerUnit = (Number(ing.quantity) || 0) / baseYield
    const possibleUnits = neededPerUnit > 0 ? Math.floor(available / neededPerUnit) : 0

    breakdown.push({
      material: ing.name,
      available,
      neededPerUnit,
      unit: ingUnit,
      possibleUnits
    })

    if (possibleUnits < minCapacity) {
      minCapacity = possibleUnits
      limitingMaterial = {
        name: ing.name,
        available,
        unit: ingUnit,
        neededPerUnit,
        possibleUnits
      }
    }
  }

  const maxCapacity = minCapacity === Infinity ? 0 : Math.max(0, minCapacity)

  return {
    maxCapacity,
    limitingMaterial,
    breakdown
  }
}

/**
 * Estimates affordable production given a purchasing budget.
 */
export function calculateAffordableProduction(budget = 0, recipe, inventoryList = []) {
  const currentCapacity = calculateMaxProductionCapacity(recipe, inventoryList)
  const baseYield = Math.max(1, Number(recipe.yield) || 1)

  // Calculate material cost per unit for newly purchased inputs
  let costPerUnitProduction = 0
  if (recipe?.ingredients) {
    for (const ing of recipe.ingredients) {
      const raw = inventoryList.find((i) => i.title === ing.name || i.name === ing.name)
      const price = Number(raw?.unitCostRWF || raw?.purchasePriceRWF || ing.unitPriceRWF || 0)
      const needed = (Number(ing.quantity) || 0) / baseYield
      costPerUnitProduction += needed * price
    }
  }

  const additionalUnitsAffordable = costPerUnitProduction > 0
    ? Math.floor(budget / costPerUnitProduction)
    : 0

  return {
    currentCapacity: currentCapacity.maxCapacity,
    limitingMaterial: currentCapacity.limitingMaterial,
    budget: Number(budget) || 0,
    costPerUnitProduction: Math.round(costPerUnitProduction),
    additionalUnitsAffordable,
    totalPotentialProduction: currentCapacity.maxCapacity + additionalUnitsAffordable
  }
}
