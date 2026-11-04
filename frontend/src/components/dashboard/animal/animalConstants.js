/**
 * ExBOS Animal Registration System Constants
 * All 18 categories, species types, dynamic breeds, gestation days, and options.
 */

export const ANIMAL_CATEGORIES = [
  {
    category: 'Pigs',
    types: ['Pig'],
    icon: '🐷',
    defaultBreeds: [
      'Large White',
      'Landrace',
      'Duroc',
      'Hampshire',
      'Pietrain',
      'Berkshire',
      'Local Breed',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 114,
    gestationTerm: 'Farrowing'
  },
  {
    category: 'Cattle',
    types: ['Cow', 'Bull', 'Calf'],
    icon: '🐄',
    defaultBreeds: [
      'Ankole',
      'Friesian',
      'Jersey',
      'Ayrshire',
      'Boran',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 283,
    gestationTerm: 'Calving'
  },
  {
    category: 'Goats',
    types: ['Goat'],
    icon: '🐐',
    defaultBreeds: [
      'Boer',
      'Saanen',
      'Alpine',
      'Local Goat',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 150,
    gestationTerm: 'Kidding'
  },
  {
    category: 'Sheep',
    types: ['Sheep'],
    icon: '🐑',
    defaultBreeds: [
      'Dorper',
      'Merino',
      'Red Maasai',
      'Local Sheep',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 147,
    gestationTerm: 'Lambing'
  },
  {
    category: 'Chickens',
    types: ['Hen', 'Rooster', 'Chick'],
    icon: '🐔',
    defaultBreeds: [
      'Sasso',
      'Kuroiler',
      'Rhode Island Red',
      'Leghorn',
      'Cobb 500',
      'Ross 308',
      'Local Chicken',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 21,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Ducks',
    types: ['Duck'],
    icon: '🦆',
    defaultBreeds: [
      'Pekin',
      'Muscovy',
      'Mallard',
      'Khaki Campbell',
      'Local Duck',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 28,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Turkeys',
    types: ['Turkey'],
    icon: '🦃',
    defaultBreeds: [
      'Broad Breasted White',
      'Bronze',
      'Bourbon Red',
      'Local Turkey',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 28,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Geese',
    types: ['Goose'],
    icon: '🪿',
    defaultBreeds: [
      'Toulouse',
      'Emden',
      'African',
      'Chinese',
      'Local Goose',
      'Other'
    ],
    gestationDays: 30,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Rabbits',
    types: ['Rabbit'],
    icon: '🐇',
    defaultBreeds: [
      'New Zealand White',
      'California',
      'Chinchilla',
      'Flemish Giant',
      'Dutch',
      'Local Rabbit',
      'Crossbreed',
      'Other'
    ],
    gestationDays: 31,
    gestationTerm: 'Kindling'
  },
  {
    category: 'Guinea Fowl',
    types: ['Guinea Fowl'],
    icon: '🪶',
    defaultBreeds: [
      'Helmeted Guinea Fowl',
      'Pearl',
      'Lavender',
      'White',
      'Local Guinea Fowl',
      'Other'
    ],
    gestationDays: 27,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Quails',
    types: ['Quail'],
    icon: '🐦',
    defaultBreeds: [
      'Japanese Quail',
      'Bobwhite',
      'Coturnix',
      'Button Quail',
      'Other'
    ],
    gestationDays: 17,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Pigeons',
    types: ['Pigeon'],
    icon: '🕊️',
    defaultBreeds: [
      'Homing Pigeon',
      'King',
      'Fantail',
      'Local Pigeon',
      'Other'
    ],
    gestationDays: 18,
    gestationTerm: 'Hatching'
  },
  {
    category: 'Horses',
    types: ['Horse'],
    icon: '🐎',
    defaultBreeds: [
      'Thoroughbred',
      'Arabian',
      'Quarter Horse',
      'Local Horse',
      'Other'
    ],
    gestationDays: 340,
    gestationTerm: 'Foaling'
  },
  {
    category: 'Donkeys',
    types: ['Donkey'],
    icon: '🫏',
    defaultBreeds: [
      'Standard Donkey',
      'Miniature',
      'Mammoth',
      'Local Donkey',
      'Other'
    ],
    gestationDays: 365,
    gestationTerm: 'Foaling'
  },
  {
    category: 'Camels',
    types: ['Camel'],
    icon: '🐫',
    defaultBreeds: [
      'Dromedary (One-hump)',
      'Bactrian (Two-hump)',
      'Somali Camel',
      'Other'
    ],
    gestationDays: 390,
    gestationTerm: 'Calving'
  },
  {
    category: 'Fish',
    types: ['Tilapia', 'Catfish', 'Other Fish'],
    icon: '🐟',
    defaultBreeds: [
      'Nile Tilapia (Oreochromis niloticus)',
      'African Sharptooth Catfish (Clarias gariepinus)',
      'Common Carp',
      'Silver Carp',
      'Other'
    ],
    gestationDays: 0,
    gestationTerm: 'Spawning'
  },
  {
    category: 'Bees',
    types: ['Honeybee Colony'],
    icon: '🐝',
    defaultBreeds: [
      'African Honeybee (Apis mellifera scutellata)',
      'Italian Bee',
      'Carniolan Bee',
      'Local Colony',
      'Other'
    ],
    gestationDays: 0,
    gestationTerm: 'Swarming'
  },
  {
    category: 'Other Animals',
    types: ['Custom Animal Type'],
    icon: '🐾',
    defaultBreeds: ['Standard Breed', 'Local Breed', 'Crossbreed', 'Other'],
    gestationDays: 0,
    gestationTerm: 'Birth'
  }
]

// Origin options
export const ORIGIN_OPTIONS = [
  'Purchased',
  'Born on Farm',
  'Gift / Donation',
  'Transferred from Another Farm',
  'Other'
]

// Animal Status
export const STATUS_OPTIONS = [
  'Active',
  'Sold',
  'Deceased',
  'Transferred'
]

// Purpose options
export const PURPOSE_OPTIONS = [
  'Breeding',
  'Meat',
  'Eggs',
  'Milk',
  'Multipurpose',
  'Other'
]

// Payment Method options
export const PAYMENT_METHODS = [
  'Cash in Hand (Till)',
  'MTN MoMo Business',
  'Airtel Money',
  'Bank Transfer (BK / Equity)',
  'Other'
]

// Payment Status
export const PAYMENT_STATUSES = [
  'Paid',
  'Partially Paid',
  'Unpaid'
]

// Helper to look up category info by animal type name
export function getCategoryByAnimalType(animalType) {
  if (!animalType) return ANIMAL_CATEGORIES[0]
  for (const cat of ANIMAL_CATEGORIES) {
    if (cat.types.some((t) => t.toLowerCase() === animalType.toLowerCase())) {
      return cat
    }
  }
  return ANIMAL_CATEGORIES.find((c) => c.category === 'Other Animals') || ANIMAL_CATEGORIES[0]
}

// Helper to calculate expected birth date given mating date and gestation days
export function calculateExpectedBirthDate(matingDateStr, gestationDays) {
  if (!matingDateStr || !gestationDays || gestationDays <= 0) return ''
  try {
    const d = new Date(matingDateStr)
    if (isNaN(d.getTime())) return ''
    d.setDate(d.getDate() + Number(gestationDays))
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

