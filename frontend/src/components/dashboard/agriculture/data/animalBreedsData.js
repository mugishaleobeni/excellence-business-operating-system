/**
 * Animal Types, Common Breeds, Measurement Units & Biological Benchmarks
 * Supports flexible farmer-defined animals and breeds with zero emoji glyphs.
 */

export const DEFAULT_ANIMAL_TYPES = [
  'Pigs',
  'Chickens',
  'Cattle',
  'Goats',
  'Sheep',
  'Rabbits',
  'Fish',
  'Bees'
]

export const BREEDS_BY_TYPE = {
  Pigs: ['Large White', 'Landrace', 'Duroc', 'Pietrain', 'Hampshire', 'Crossbreed'],
  Chickens: ['ISA Brown (Layers)', 'Cobb 500 (Broilers)', 'Kuroiler', 'Sasso', 'Local Indigenous'],
  Cattle: ['Holstein Friesian', 'Jersey', 'Ankole Longhorn', 'Sahiwal', 'Boran', 'Friesian-Ankole Cross'],
  Goats: ['Boer (Meat)', 'Alpine (Dairy)', 'Saanen (Dairy)', 'Galla', 'Local Small East African'],
  Sheep: ['Dorper (Meat)', 'Red Maasai', 'Merino (Wool)', 'Blackhead Persian'],
  Rabbits: ['New Zealand White', 'Californian', 'Flemish Giant', 'Chinchilla'],
  Fish: ['Nile Tilapia', 'African Catfish', 'Carp'],
  Bees: ['African Honey Bee (Apis mellifera scutellata)']
}

export const ANIMAL_TYPES_DATA = {
  Pigs: { name: 'Pigs', breeds: BREEDS_BY_TYPE.Pigs, defaultUnit: 'heads' },
  Chickens: { name: 'Chickens', breeds: BREEDS_BY_TYPE.Chickens, defaultUnit: 'birds' },
  Poultry: { name: 'Poultry', breeds: BREEDS_BY_TYPE.Chickens, defaultUnit: 'birds' },
  Cattle: { name: 'Cattle', breeds: BREEDS_BY_TYPE.Cattle, defaultUnit: 'heads' },
  Goats: { name: 'Goats', breeds: BREEDS_BY_TYPE.Goats, defaultUnit: 'heads' },
  Sheep: { name: 'Sheep', breeds: BREEDS_BY_TYPE.Sheep, defaultUnit: 'heads' },
  Rabbits: { name: 'Rabbits', breeds: BREEDS_BY_TYPE.Rabbits, defaultUnit: 'heads' },
  Fish: { name: 'Fish', breeds: BREEDS_BY_TYPE.Fish, defaultUnit: 'fingerlings' },
  Bees: { name: 'Bees', breeds: BREEDS_BY_TYPE.Bees, defaultUnit: 'hives' }
}

export const GESTATION_DAYS = {
  Pigs: 114,      // 3 months, 3 weeks, 3 days
  Cattle: 283,    // ~9 months
  Goats: 150,     // ~5 months
  Sheep: 150,     // ~5 months
  Rabbits: 31,    // 1 month
  Chickens: 21,   // 21 days incubation
  Poultry: 21
}

export const STANDARD_DAILY_FEED_KG = {
  Pigs: 2.0,      // Average grower intake
  Chickens: 0.12, // 120g per laying hen / broiler
  Poultry: 0.12,
  Cattle: 12.0,   // Dry matter / forage + dairy meal
  Goats: 1.5,     // Forage + concentrate
  Sheep: 1.5,
  Rabbits: 0.15
}

export const GESTATION_PERIODS = GESTATION_DAYS
export const FEEDING_BENCHMARKS = STANDARD_DAILY_FEED_KG

export const MEASUREMENT_UNITS = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'liters', label: 'Liters (L)' },
  { value: 'trays', label: 'Trays (30 eggs)' },
  { value: 'crates', label: 'Crates' },
  { value: 'heads', label: 'Heads / Animals' },
  { value: 'birds', label: 'Birds' },
  { value: 'sacks', label: 'Sacks (50 kg)' },
  { value: 'bales', label: 'Bales' }
]

/**
 * Calculates projected delivery or hatch date based on mating date and animal type
 */
export function calculateDeliveryDate(matingDateStr, animalType) {
  if (!matingDateStr) return ''
  const days = GESTATION_DAYS[animalType] || 114
  const date = new Date(matingDateStr)
  if (isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

/**
 * Calculates remaining gestation days
 */
export function calculateRemainingDays(expectedDateStr) {
  if (!expectedDateStr) return 0
  const target = new Date(expectedDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diffTime = target - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
