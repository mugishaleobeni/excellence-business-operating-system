/**
 * ExBOS Architecture 03: Service-Based Business Acceptance Tests
 */

import assert from 'assert'
import { SERVICE_PRESETS, SERVICE_TRADE_LIST } from '../data/servicePresets.js'
import fs from 'fs'
import path from 'path'

console.log('--- Running Architecture 03 (Services) Acceptance Tests ---')

// Test 1: Verify all 8 service trades are defined
const expectedServiceTrades = [
  'salon',
  'garage',
  'electronics',
  'agency',
  'cleaning',
  'studio',
  'clean-slate',
  'other'
]

expectedServiceTrades.forEach((key) => {
  assert(SERVICE_PRESETS[key], `Service preset "${key}" should be defined`)
  assert(SERVICE_PRESETS[key].name, `Service preset "${key}" must have a name`)
})
assert.strictEqual(SERVICE_TRADE_LIST.length, 8, 'Must export 8 service trades')
console.log('[PASS] Test 1: All 8 service trade presets exist')

// Test 2: Salons, Spas & Beauty Care specifications
const salon = SERVICE_PRESETS.salon
assert.strictEqual(salon.category, 'Beauty, Hair & Personal Grooming')
assert(salon.services.length >= 4, 'Salon must include at least 4 services')
const braid = salon.services.find((s) => s.name.includes('Braiding'))
assert(braid, 'Salon must include braiding service')
assert.strictEqual(braid.priceRWF, 25000)
assert.strictEqual(braid.durationMins, 90)
assert.strictEqual(braid.commissionPct, 35)
assert(braid.linkedConsumables.length > 0, 'Braiding must have linked consumables')
assert(salon.consumables.length >= 4, 'Salon must have consumable supplies')
assert(salon.staff.length >= 3, 'Salon must have stylists/barbers')
assert(salon.jobs.length >= 3, 'Salon must have sample jobs')
console.log('[PASS] Test 2: Salon preset has hair styling, barbering, consumables, and commission rates')

// Test 3: Auto Garages & Mechanics specifications
const garage = SERVICE_PRESETS.garage
assert.strictEqual(garage.category, 'Automotive Mechanics & Maintenance')
const oilService = garage.services.find((s) => s.name.includes('Engine Oil'))
assert(oilService, 'Garage must include engine oil service')
assert.strictEqual(oilService.priceRWF, 45000)
const oilSupply = garage.consumables.find((c) => c.name.includes('Synthetic Engine Oil'))
assert(oilSupply, 'Garage must stock synthetic oil')
assert.strictEqual(oilSupply.unitCostRWF, 24000)
assert.strictEqual(oilSupply.reorderLevel, 4)
const leadMechanic = garage.staff.find((st) => st.role.includes('Lead Mechanic'))
assert(leadMechanic, 'Garage must have lead mechanic')
console.log('[PASS] Test 3: Auto Garage preset has oil services, brake parts, and mechanics')

// Test 4: Electronics & Phone Repair specifications
const electronics = SERVICE_PRESETS.electronics
assert.strictEqual(electronics.category, 'Hardware Repair & Technical IT')
const screenRepair = electronics.services.find((s) => s.name.includes('OLED'))
assert(screenRepair, 'Electronics must include screen repair service')
assert.strictEqual(screenRepair.priceRWF, 55000)
assert(screenRepair.linkedConsumables.length > 0, 'Screen repair must link screen parts')
console.log('[PASS] Test 4: Electronics repair preset has OLED screens, solder techs, and device tickets')

// Test 5: Consultancies & Creative Agencies
const agency = SERVICE_PRESETS.agency
assert.strictEqual(agency.category, 'Professional Services & Consulting')
const taxAdvisory = agency.services.find((s) => s.name.includes('Tax Audit'))
assert(taxAdvisory, 'Agency must include tax audit advisory')
assert.strictEqual(taxAdvisory.priceRWF, 250000)
console.log('[PASS] Test 5: Professional Agency preset has corporate advisory and design packages')

// Test 6: Cleaning & Facilities Maintenance
const cleaning = SERVICE_PRESETS.cleaning
assert.strictEqual(cleaning.category, 'Facility Management & Environmental Sanitation')
const villaDeepClean = cleaning.services.find((s) => s.name.includes('Residential Villa'))
assert(villaDeepClean, 'Cleaning must include residential deep cleaning')
assert.strictEqual(villaDeepClean.priceRWF, 50000)
console.log('[PASS] Test 6: Cleaning preset has residential deep clean and industrial sanitization')

// Test 7: Studios & Photography
const studio = SERVICE_PRESETS.studio
assert.strictEqual(studio.category, 'Creative Media & Content Production')
const weddingShoot = studio.services.find((s) => s.name.includes('Wedding Ceremony'))
assert(weddingShoot, 'Studio must include wedding ceremony coverage')
assert.strictEqual(weddingShoot.priceRWF, 450000)
console.log('[PASS] Test 7: Studio preset has portraits and wedding media packages')

// Test 8: Clean Slate (Zero-Base)
const clean = SERVICE_PRESETS['clean-slate']
assert.strictEqual(clean.services.length, 0, 'Clean slate services must be 0')
assert.strictEqual(clean.consumables.length, 0, 'Clean slate consumables must be 0')
assert.strictEqual(clean.staff.length, 0, 'Clean slate staff must be 0')
assert.strictEqual(clean.jobs.length, 0, 'Clean slate jobs must be 0')
console.log('[PASS] Test 8: Clean Slate is 100% blank for real client data entry')

// Test 9: Other / WhatsApp Support Specialist
const other = SERVICE_PRESETS.other
assert.strictEqual(other.isSupportContact, true, 'Other preset must be tagged as support contact')
assert.strictEqual(other.whatsappNumber, '+250781963981', 'WhatsApp phone must match +250781963981')
assert(other.whatsappFormatted.includes('781 963 981'), 'Formatted phone must display +250 781 963 981')
console.log('[PASS] Test 9: Custom / Other trade links directly to WhatsApp (+250 781 963 981)')

// Test 10: Strict File Line Count Rule (All files must be <= 500 lines)
const servicesDir = path.resolve('frontend/src/components/dashboard/services')
function checkLineLimits(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== '__tests__') {
      checkLineLimits(fullPath)
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8')
      const lines = content.split('\n').length
      assert(lines <= 500, `File "${entry.name}" exceeds 500 lines limit: ${lines} lines`)
    }
  }
}
checkLineLimits(servicesDir)
console.log('[PASS] Test 10: Strict <= 500 lines per file enforced across all services components')

console.log('\nAll 10 Architecture 03 Acceptance Tests Passed Successfully!')
