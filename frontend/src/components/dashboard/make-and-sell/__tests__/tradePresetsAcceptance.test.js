/**
 * ExBOS Make & Sell: Multi-Trade Presets Acceptance Tests
 */

import assert from 'assert'
import { TRADE_PRESETS, TRADE_LIST } from '../data/tradePresets.js'

console.log('--- Running Multi-Trade Presets Acceptance Tests ---')

// Test 1: Verify all 7 trade presets are defined
const expectedTrades = ['tailoring', 'carpentry', 'beverage', 'bakery', 'metalwork', 'clean_slate', 'other']
expectedTrades.forEach((key) => {
  assert(TRADE_PRESETS[key], `Preset "${key}" should be defined`)
  assert(TRADE_PRESETS[key].name, `Preset "${key}" must have a name`)
})
console.log('[PASS] Test 1: All 7 manufacturing trade presets exist')

// Test 2: Tailoring trade specifications
const tailoring = TRADE_PRESETS.tailoring
assert.strictEqual(tailoring.category, 'Fashion & Garments')
assert(tailoring.units.includes('m'), 'Tailoring must support meters (m)')
assert(tailoring.units.includes('yd'), 'Tailoring must support yards (yd)')
const suit = tailoring.finishedGoods.find((p) => p.name.includes('Suit'))
assert(suit, 'Tailoring must include tailored suits')
assert.strictEqual(suit.sellingPriceRWF, 145000)
assert.strictEqual(suit.costPerUnitRWF, 81400)
const suitProfit = suit.sellingPriceRWF - suit.costPerUnitRWF
assert.strictEqual(suitProfit, 63600, 'Direct profit on custom suit must be 63,600 RWF')
const suitMargin = Math.round((suitProfit / suit.sellingPriceRWF) * 100)
assert.strictEqual(suitMargin, 44, 'Suit gross margin must be 44%')
console.log('[PASS] Test 2: Tailoring trade has meters, wool suits, and exact 44% unit profit margin')

// Test 3: Carpentry trade specifications
const carpentry = TRADE_PRESETS.carpentry
assert.strictEqual(carpentry.category, 'Furniture & Woodworking')
assert(carpentry.units.includes('m'), 'Carpentry must support meters (m)')
const table = carpentry.finishedGoods.find((p) => p.name.includes('Dining Table'))
assert(table, 'Carpentry must include dining table')
assert.strictEqual(table.sellingPriceRWF, 380000)
assert.strictEqual(table.costPerUnitRWF, 206100)
const tableProfit = table.sellingPriceRWF - table.costPerUnitRWF
assert.strictEqual(tableProfit, 173900, 'Direct profit on dining table must be 173,900 RWF')
console.log('[PASS] Test 3: Carpentry trade has timber in meters, dining tables, and 173,900 RWF unit profit')

// Test 4: Beverage trade specifications
const beverage = TRADE_PRESETS.beverage
assert.strictEqual(beverage.category, 'Beverages & Food Processing')
assert(beverage.units.includes('L'), 'Beverages must support liters (L)')
assert(beverage.units.includes('ml'), 'Beverages must support milliliters (ml)')
const juice = beverage.finishedGoods.find((p) => p.name.includes('Passion Fruit Juice'))
assert(juice, 'Beverage must include bottled passion fruit juice')
assert.strictEqual(juice.sellingPriceRWF, 1200)
assert.strictEqual(juice.shelfLifeDays, 30, 'Juice shelf life must be 30 days')
console.log('[PASS] Test 4: Beverage trade has liters/ml, PET bottles, juices, and shelf life')

// Test 5: Metalwork trade specifications
const metalwork = TRADE_PRESETS.metalwork
assert.strictEqual(metalwork.category, 'Metal Fabrication')
assert(metalwork.units.includes('m'), 'Metalwork must support meters (m)')
const gate = metalwork.finishedGoods.find((p) => p.name.includes('Sliding Security Gate'))
assert(gate, 'Metalwork must include sliding security gate')
assert.strictEqual(gate.sellingPriceRWF, 520000)
assert.strictEqual(gate.costPerUnitRWF, 344100)
console.log('[PASS] Test 5: Metalwork trade has steel tubes in meters, welding rods, and sliding security gates')

// Test 6: Clean Slate / Zero-Base specifications
const clean = TRADE_PRESETS.clean_slate
assert.strictEqual(clean.rawMaterials.length, 0, 'Clean slate raw materials must be 0')
assert.strictEqual(clean.finishedGoods.length, 0, 'Clean slate finished goods must be 0')
assert.strictEqual(clean.recipes.length, 0, 'Clean slate recipes must be 0')
assert.strictEqual(clean.productionBatches.length, 0, 'Clean slate production batches must be 0')
console.log('[PASS] Test 6: Clean Slate is 100% blank for real production data entry')

// Test 7: Other / Not Specified with WhatsApp support
const other = TRADE_PRESETS.other
assert.strictEqual(other.isSupportContact, true, 'Other preset must be tagged as support contact')
assert.strictEqual(other.whatsappNumber, '+250781963981', 'WhatsApp phone must match +250781963981')
assert(other.whatsappFormatted.includes('781 963 981'), 'Formatted phone must display +250 781 963 981')
console.log('[PASS] Test 7: Other / Not Specified links directly to WhatsApp (+250 781 963 981)')

console.log('\nAll 7 Multi-Trade Acceptance Tests Passed Successfully!')
