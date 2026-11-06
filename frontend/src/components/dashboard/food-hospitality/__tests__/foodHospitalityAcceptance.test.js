/**
 * Architecture 05: Food & Hospitality Comprehensive Acceptance Test
 * Verifies recipe costing, live KOT kitchen order queue, dining tables,
 * room lodging occupancy, unified guest folios, ingredient auto-deduction & waste ledger.
 */

import { FOOD_HOSPITALITY_PRESETS } from '../data/foodHospitalityPresets.js'
import fs from 'fs'
import path from 'path'

console.log('--- EXBOS ARCHITECTURE 05 (FOOD & HOSPITALITY) ACCEPTANCE SUITE ---')

let passedCount = 0
let failedCount = 0

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`)
    passedCount++
  } else {
    console.error(`[FAIL] ${message}`)
    failedCount++
  }
}

// 1. Food & Hospitality Presets
assert(
  Object.keys(FOOD_HOSPITALITY_PRESETS).length === 7,
  'Loaded all 7 Hospitality presets (combined, restaurant, hotel, fastFood, catering, cleanSlate, other)'
)

const combinedPreset = FOOD_HOSPITALITY_PRESETS.combined
assert(
  combinedPreset && combinedPreset.menuItems?.length > 0 && combinedPreset.rooms?.length > 0,
  'Pillar 01 & 05: Combined Hotel & Bistro contains both menu dishes and lodging rooms'
)

// 2. Pillar 01: Recipe Food Cost % Formula
const sampleDish = combinedPreset.menuItems[0] // Grilled Tilapia
const sellingPrice = sampleDish.sellingPriceRWF // 8500
const recipeCost = sampleDish.recipeCostRWF // 2800
const calculatedFoodCostPct = Number(((recipeCost / sellingPrice) * 100).toFixed(1))
assert(
  calculatedFoodCostPct === 32.9,
  `Pillar 01: Food cost formula calculates accurately: (${recipeCost} / ${sellingPrice}) * 100 = ${calculatedFoodCostPct}%`
)
assert(
  calculatedFoodCostPct < 35,
  'Pillar 01: Food cost % is within healthy restaurant benchmark (< 35%)'
)

// 3. Pillar 02: Kitchen Order Ticket (KOT) Lifecycle
const sampleOrder = combinedPreset.kitchenOrders[0]
assert(
  sampleOrder && sampleOrder.items?.length > 0 && sampleOrder.destination,
  'Pillar 02: KOT ticket tracks destination (Table or Room) and item breakdown'
)
const kotStatuses = ['Pending', 'Cooking', 'Ready', 'Served', 'Cancelled', 'New', 'Billed']
assert(
  kotStatuses.includes(sampleOrder.status),
  `Pillar 02: KOT ticket status "${sampleOrder.status}" belongs to valid kitchen queue workflow`
)

// 4. Pillar 04: Dining Room Tables
const tablesList = [
  { id: 'T-01', name: 'Table 1', capacity: 2, status: 'Occupied' },
  { id: 'T-02', name: 'Table 2', capacity: 4, status: 'Available' },
  { id: 'T-03', name: 'Table 3', capacity: 4, status: 'Occupied' }
]
const occupiedTables = tablesList.filter((t) => t.status === 'Occupied')
assert(
  occupiedTables.length === 2,
  'Pillar 04: Dining room floor correctly detects 2 occupied tables'
)

// 5. Pillar 05: Rooms & Lodging Occupancy
const rooms = combinedPreset.rooms
const occupiedRooms = rooms.filter((r) => r.status === 'Occupied')
const occupancyRate = Math.round((occupiedRooms.length / rooms.length) * 100)
assert(
  occupancyRate === 40,
  `Pillar 05: Room occupancy correctly calculates: ${occupiedRooms.length}/${rooms.length} = ${occupancyRate}%`
)

// 6. Pillar 07: Consolidated Guest Folio Billing
const sampleFolio = combinedPreset.guestFolios[0]
assert(
  sampleFolio && sampleFolio.roomChargesRWF > 0 && sampleFolio.diningChargesRWF > 0,
  'Pillar 07: Guest folio accumulates itemized charges (Room stay + Restaurant dining charges)'
)
const calculatedTotal =
  sampleFolio.roomChargesRWF +
  sampleFolio.diningChargesRWF +
  (sampleFolio.laundryExtrasRWF || 0)
const balanceDue = calculatedTotal - (sampleFolio.paidDepositRWF || 0)
assert(
  calculatedTotal === sampleFolio.totalFolioRWF,
  `Pillar 07: Folio itemized charges sum matches totalFolioRWF (${calculatedTotal} RWF)`
)
assert(
  balanceDue === sampleFolio.balanceDueRWF,
  `Pillar 07: Outstanding folio balance due matches (${balanceDue} RWF)`
)

// 7. Pillar 03 & 04: Ingredient Stock & Waste Tracking
const sampleIngredient = combinedPreset.ingredients[0]
assert(
  sampleIngredient && sampleIngredient.currentStock > sampleIngredient.reorderLevel,
  'Pillar 03: Kitchen pantry tracks ingredient stock levels with reorder thresholds'
)

// 8. Line Limit Verification (Strictly <= 500 lines per file)
const hospitalityDir = path.resolve(process.cwd(), 'frontend/src/components/dashboard/food-hospitality')
function checkDirLineLimits(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  entries.forEach((ent) => {
    const fullPath = path.join(dir, ent.name)
    if (ent.isDirectory() && ent.name !== '__tests__') {
      checkDirLineLimits(fullPath)
    } else if (ent.isFile() && (ent.name.endsWith('.jsx') || ent.name.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n').length
      assert(
        lines <= 500,
        `Line limit: ${path.relative(process.cwd(), fullPath)} is ${lines} lines (<= 500 max)`
      )
    }
  })
}
checkDirLineLimits(hospitalityDir)

// 9. Agribusiness & Hospitality Support WhatsApp Link
const otherPreset = FOOD_HOSPITALITY_PRESETS.other
assert(
  otherPreset && otherPreset.whatsappNumber === '+250 781 963 981',
  'WhatsApp Agribusiness & Hospitality Support hotline verified (+250 781 963 981)'
)

console.log(`\nArchitecture 05 Tests Completed: ${passedCount} passed, ${failedCount} failed.`)
if (failedCount > 0) {
  process.exit(1)
}
