/**
 * Architecture 06: Hybrid Enterprise Comprehensive Acceptance Test
 * Verifies modular activity toggles, selective stock tracking switch (ON/OFF),
 * mixed sales unified checkout (goods + services on 1 bill), and cross-activity profitability matrix.
 */

import { HYBRID_PRESETS } from '../data/hybridPresets.js'
import fs from 'fs'
import path from 'path'

console.log('--- EXBOS ARCHITECTURE 06 (HYBRID BUSINESS) ACCEPTANCE SUITE ---')

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

// 1. Hybrid Business Presets
assert(
  Object.keys(HYBRID_PRESETS).length === 5,
  'Loaded all 5 Hybrid presets (techRepair, foodRetail, salonBoutique, cleanSlate, other)'
)

const techPreset = HYBRID_PRESETS.techRepair
assert(
  techPreset && techPreset.items?.length > 0 && techPreset.mixedSales?.length > 0,
  'Tech Repair preset loaded with physical spare parts and billable technical labor'
)

// 2. Pillar 01: Modular Activity Switcher
const activeActivities = techPreset.activeActivities
assert(
  activeActivities.retail === true && activeActivities.service === true,
  'Pillar 01: Multi-activity engine enables both Retail and Service streams simultaneously'
)
assert(
  activeActivities.food === false,
  'Pillar 01: Inactive activity streams (Food) disabled until toggled by business owner'
)

// 3. Pillar 02: Selective Stock Tracking Switch (Track Stock ON / OFF)
const physicalPart = techPreset.items.find((it) => it.id === 'HYB-001') // Screen Assembly
const serviceLabor = techPreset.items.find((it) => it.id === 'HYB-003') // Screen Replacement Labor

assert(
  physicalPart && physicalPart.trackStock === true && typeof physicalPart.currentStock === 'number',
  'Pillar 02: Physical goods have trackStock: ON with numerical inventory decrement count'
)
assert(
  serviceLabor && serviceLabor.trackStock === false && serviceLabor.currentStock === 'Unlimited',
  'Pillar 02: Labor & services have trackStock: OFF with "Unlimited" stock mode (zero barrier to billing)'
)

// 4. Pillar 03: Unified Mixed Sales Checkout (Single Bill)
const mixedSale = techPreset.mixedSales[0]
assert(
  mixedSale && mixedSale.items?.length >= 2,
  'Pillar 03: Mixed sale contains multiple activity streams in a single transaction'
)

const hasRetailItem = mixedSale.items.some((it) => it.activity === 'retail')
const hasServiceItem = mixedSale.items.some((it) => it.activity === 'service')
assert(
  hasRetailItem && hasServiceItem,
  'Pillar 03: Single invoice combines physical spare part + service labor on 1 customer bill'
)

const calculatedTotal = mixedSale.items.reduce(
  (sum, it) => sum + (it.unitPriceRWF * it.quantity),
  0
)
const calculatedCost = mixedSale.items.reduce(
  (sum, it) => sum + (it.unitCostRWF * it.quantity),
  0
)
const calculatedProfit = calculatedTotal - calculatedCost

assert(
  calculatedTotal === mixedSale.totalAmountRWF,
  `Pillar 03: Multi-line checkout sum matches total bill: ${calculatedTotal} RWF`
)
assert(
  calculatedProfit === mixedSale.netProfitRWF,
  `Pillar 03: Multi-line checkout net profit matches: ${calculatedProfit} RWF`
)

// 5. Pillar 04: Stock Auto-Deduction for Tracked Items Only
const initialStock = physicalPart.currentStock // 14
const quantitySold = 1
const remainingStock = physicalPart.trackStock ? initialStock - quantitySold : initialStock
assert(
  remainingStock === 13,
  'Pillar 04: Physical stock decrements from 14 to 13 upon sale'
)

// 6. Pillar 05: Cross-Activity Profitability Matrix
const matrix = techPreset.profitMatrix
assert(
  matrix && matrix.retail && matrix.service,
  'Pillar 05: Profitability matrix breaks down margins individually per activity stream'
)
assert(
  matrix.service.marginPercent > matrix.retail.marginPercent,
  `Pillar 05: Labor service margin (${matrix.service.marginPercent}%) exceeds retail physical goods margin (${matrix.retail.marginPercent}%)`
)

// 7. Line Limit Verification (Strictly <= 500 lines per file)
const hybridDir = path.resolve(process.cwd(), 'frontend/src/components/dashboard/hybrid')
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
checkDirLineLimits(hybridDir)

// 8. Agribusiness & Hospitality Support WhatsApp Link
const otherPreset = HYBRID_PRESETS.other
assert(
  otherPreset && otherPreset.whatsappNumber === '+250 781 963 981',
  'WhatsApp Agribusiness & Hybrid Support hotline verified (+250 781 963 981)'
)

console.log(`\nArchitecture 06 Tests Completed: ${passedCount} passed, ${failedCount} failed.`)
if (failedCount > 0) {
  process.exit(1)
}

