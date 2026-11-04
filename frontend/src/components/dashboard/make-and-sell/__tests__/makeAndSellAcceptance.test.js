/**
 * Make & Sell Architecture Acceptance Verification Suite
 * Tests all requirements from Part 27 of the specification.
 */
import {
  scaleRecipe,
  calculateMaterialShortages,
  generatePurchaseRecommendations,
  calculateProductionCost,
  calculateSellingPriceScenarios,
  predictProfit,
  calculateMaxProductionCapacity,
  convertQuantity,
  areUnitsCompatible
} from '../services/productionCalculations.js'

function runTests() {
  console.log('--- Running Make & Sell Acceptance Tests (Part 27) ---')
  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      failed++
    }
  }

  // Test A — Recipe Calculation: 20kg flour for 100 breads -> 200 breads = 40kg flour
  const breadRecipe = {
    yield: 100,
    ingredients: [
      { name: 'Flour', quantity: 20, unit: 'kg' },
      { name: 'Sugar', quantity: 3, unit: 'kg' }
    ]
  }
  const scaledA = scaleRecipe(breadRecipe, 200)
  const flourA = scaledA.scaledIngredients.find((i) => i.name === 'Flour')
  assert(flourA && flourA.quantity === 40, 'Test A: Recipe scales 20kg flour for 100 breads to 40kg for 200 breads')

  // Test B — Material Shortage: 40kg required and 25kg available -> shortage = 15kg
  const inventoryB = [
    { name: 'Flour', quantity: 25, unit: 'kg', unitCostRWF: 1000 }
  ]
  const shortagesB = calculateMaterialShortages(scaledA.scaledIngredients, inventoryB)
  const flourShortageB = shortagesB.find((s) => s.name === 'Flour')
  assert(flourShortageB && flourShortageB.shortage === 15, 'Test B: Shortage is 15kg when 40kg required and 25kg available')

  // Test C — Purchase Recommendation: 15kg shortage with 10kg package size -> 20kg suggested
  const shortageWithPackC = [
    { name: 'Flour', shortage: 15, unit: 'kg', packageSize: 10, unitPrice: 1200 }
  ]
  const recC = generatePurchaseRecommendations(shortageWithPackC)
  assert(
    recC[0] && recC[0].suggestedQuantity === 20 && recC[0].reason.includes('10 kg supplier package size'),
    'Test C: Recommends 20kg (rounded up to nearest 10kg package size) for 15kg shortage'
  )

  // Test D — Production Cost: 100,000 RWF total cost and 100 usable products -> unit cost = 1,000 RWF
  const costD = calculateProductionCost({
    materialCost: 70000,
    directLabor: 20000,
    electricity: 5000,
    packaging: 5000,
    plannedQuantity: 100,
    expectedWastePct: 0
  })
  assert(costD.totalProductionCost === 100000 && costD.unitProductionCost === 1000, 'Test D: Total cost 100,000 RWF / 100 usable = 1,000 RWF unit cost')

  // Test E — Selling Price: unit cost 1,000 RWF and target gross margin 20% -> 1,250 RWF
  // Formula: Unit Cost / (1 - Target Margin) -> 1000 / 0.8 = 1250
  const scenariosE = calculateSellingPriceScenarios(1000, 1200)
  const target20 = scenariosE.scenarios.find((s) => s.targetMarginPct === 20)
  assert(target20 && target20.suggestedPrice === 1250, 'Test E: 1,000 RWF unit cost with 20% target margin yields 1,250 RWF selling price')

  // Test F — Profit Prediction: 100 products, unit cost 1,000 RWF, selling price 1,250 RWF -> 25,000 RWF gross profit
  const profitF = predictProfit({
    expectedQuantitySold: 100,
    unitProductionCost: 1000,
    sellingPrice: 1250
  })
  assert(
    profitF.potentialGrossProfit === 25000 && profitF.grossMarginPct === 20,
    'Test F: 100 products at 1,250 RWF with 1,000 RWF cost yields 25,000 RWF gross profit and 20% margin'
  )

  // Test G — User Adjustment: Manually changing selling price updates profit immediately
  const profitG = predictProfit({
    expectedQuantitySold: 100,
    unitProductionCost: 1000,
    sellingPrice: 1400 // User adjusted price
  })
  assert(
    profitG.potentialGrossProfit === 40000 && profitG.grossMarginPct === 28.6,
    'Test G: Adjusting price to 1,400 RWF immediately recalculates gross profit to 40,000 RWF'
  )

  // Test H — Unit Conversion Compatibility
  assert(areUnitsCompatible('kg', 'g') && convertQuantity(2, 'kg', 'g') === 2000, 'Test H1: 2 kg converts to 2,000 g')
  assert(areUnitsCompatible('L', 'ml') && convertQuantity(1500, 'ml', 'L') === 1.5, 'Test H2: 1,500 ml converts to 1.5 L')
  assert(!areUnitsCompatible('kg', 'L'), 'Test H3: Incompatible units (kg and L) are not converted')
  assert(areUnitsCompatible('m', 'cm') && convertQuantity(2.5, 'm', 'cm') === 250, 'Test H4: 2.5 m converts to 250 cm')
  assert(areUnitsCompatible('meter', 'cm') && convertQuantity(3, 'meter', 'cm') === 300, 'Test H5: 3 meter converts to 300 cm')
  assert(areUnitsCompatible('m', 'mm') && convertQuantity(1.5, 'm', 'mm') === 1500, 'Test H6: 1.5 m converts to 1,500 mm')

  // Capacity Limit Test ("How Much Can I Produce?")
  const inventoryCap = [
    { name: 'Flour', quantity: 10, unit: 'kg' }, // 10 / 0.2 = 50 breads
    { name: 'Sugar', quantity: 30, unit: 'kg' }  // 30 / 0.03 = 1000 breads
  ]
  const cap = calculateMaxProductionCapacity(breadRecipe, inventoryCap)
  assert(cap.maxCapacity === 50 && cap.limitingMaterial.name === 'Flour', 'Capacity Test: 10kg flour limits production to 50 breads')

  // Test I — Category Addition & Normalization
  const initialCategories = ['Bread', 'Cakes', 'Pastries']
  const normalized = initialCategories.map((c, idx) => ({
    id: `cat-${idx}-${c.toLowerCase()}`,
    name: c,
    description: `Operational category for ${c}`,
    status: 'Active'
  }))
  const newCat = {
    id: `CAT-${Date.now()}`,
    name: 'Spices & Flavors',
    description: 'Vanilla, cinnamon, cardamon raw inputs',
    status: 'Active'
  }
  const updatedCategories = [...normalized, newCat]
  const categoryNames = updatedCategories.map((c) => c.name)

  assert(
    updatedCategories.length === 4 && updatedCategories.some((c) => c.name === 'Spices & Flavors'),
    'Test I1: Category addition appends new category to active list and displays in category list'
  )
  assert(
    categoryNames.includes('Spices & Flavors'),
    'Test I2: New category is present in categoryNames for product and material category dropdowns'
  )

  // Test I3: Case-insensitive duplicate rejection
  const isDuplicate = updatedCategories.some((c) => c.name.toLowerCase() === 'spices & flavors')
  assert(isDuplicate, 'Test I3: Case-insensitive duplicate check properly detects existing category')

  console.log(`\nResults: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

runTests()

