/**
 * ExBOS Make & Sell: Multi-Trade Presets Acceptance Tests
 * Verifies all 7 craft presets configure domain metadata, units, and categories
 * with zero hardcoded demo inventory (ready for live DB records).
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
assert.strictEqual(tailoring.finishedGoods.length, 0, 'Tailoring finishedGoods must start empty for real data entry')
console.log('[PASS] Test 2: Tailoring trade has meters, yards, and clean zero-demo goods list')

// Test 3: Carpentry trade specifications
const carpentry = TRADE_PRESETS.carpentry
assert.strictEqual(carpentry.category, 'Furniture & Woodworking')
assert(carpentry.units.includes('m'), 'Carpentry must support meters (m)')
assert.strictEqual(carpentry.finishedGoods.length, 0, 'Carpentry finishedGoods must start empty for real data entry')
console.log('[PASS] Test 3: Carpentry trade has timber in meters and clean zero-demo goods list')

// Test 4: Beverage trade specifications
const beverage = TRADE_PRESETS.beverage
assert.strictEqual(beverage.category, 'Beverages & Food Processing')
assert(beverage.units.includes('L'), 'Beverages must support liters (L)')
assert(beverage.units.includes('ml'), 'Beverages must support milliliters (ml)')
assert.strictEqual(beverage.finishedGoods.length, 0, 'Beverage finishedGoods must start empty for real data entry')
console.log('[PASS] Test 4: Beverage trade has liters/ml and clean zero-demo goods list')

// Test 5: Metalwork trade specifications
const metalwork = TRADE_PRESETS.metalwork
assert.strictEqual(metalwork.category, 'Metal Fabrication')
assert(metalwork.units.includes('m'), 'Metalwork must support meters (m)')
assert.strictEqual(metalwork.finishedGoods.length, 0, 'Metalwork finishedGoods must start empty for real data entry')
console.log('[PASS] Test 5: Metalwork trade has steel units in meters and clean zero-demo goods list')

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
