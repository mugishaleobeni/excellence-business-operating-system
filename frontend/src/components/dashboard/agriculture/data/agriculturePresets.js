/**
 * Agribusiness Specialization Presets for Architecture 04 (Agriculture & Livestock)
 * Completely zero-base compatible with individual & batch animal registers.
 * Zero emojis used; clean Lucide icon names mapped.
 */

export const AGRICULTURE_PRESETS = {
  pigs: {
    id: 'pigs',
    name: 'Pig Farming & Swine Breeding',
    category: 'Commercial Swine & Breeding Stock',
    iconName: 'Activity',
    businessName: 'Aguka Modern Swine Breeding Farm',
    headline: 'Gestation Tracking, Farrowing Litters & Feed Depletion Engine',
    description: 'Track breeding sows, boars, farrowing litters, daily feed consumption and real cost of raising pigs.',
    attentionHeadline: 'Swine Herd Active · 2 Gestating Sows Due in 12 Days',
    animalLabel: 'Swine (Pigs)',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 2.0,
    animals: [
      {
        id: 'PIG-001',
        name: 'Big Mama (Lead Sow)',
        type: 'Pigs',
        breed: 'Large White',
        sex: 'Female',
        ageMonths: 18,
        startingWeightKg: 140,
        currentWeightKg: 185,
        purchasePriceRWF: 320000,
        acquiredDate: '2025-08-10',
        location: 'Breeding Pen 1',
        healthStatus: 'Healthy · Gestating',
        totalRaisedCostRWF: 410000,
        activities: [
          { date: '2025-08-10', type: 'Registration', text: 'Acquired at 140 kg' },
          { date: '2026-07-15', type: 'Mating', text: 'Mated with Boar Thor (PIG-003)' },
          { date: '2026-10-25', type: 'Health', text: 'Administered vitamin booster' },
          { date: '2026-11-01', type: 'Weight Check', text: 'Weighed 185 kg' }
        ]
      },
      {
        id: 'PIG-002',
        name: 'Sow Bella',
        type: 'Pigs',
        breed: 'Landrace',
        sex: 'Female',
        ageMonths: 14,
        startingWeightKg: 120,
        currentWeightKg: 160,
        purchasePriceRWF: 280000,
        acquiredDate: '2025-11-20',
        location: 'Breeding Pen 2',
        healthStatus: 'Healthy · Weaning',
        totalRaisedCostRWF: 360000,
        activities: [
          { date: '2025-11-20', type: 'Registration', text: 'Acquired at 120 kg' },
          { date: '2026-10-10', type: 'Birth', text: 'Gave birth to 10 piglets (9 survived)' }
        ]
      },
      {
        id: 'PIG-003',
        name: 'Thor (Master Stud Boar)',
        type: 'Pigs',
        breed: 'Duroc',
        sex: 'Male',
        ageMonths: 20,
        startingWeightKg: 180,
        currentWeightKg: 220,
        purchasePriceRWF: 350000,
        acquiredDate: '2025-06-01',
        location: 'Boar Pen A',
        healthStatus: 'Active Stud',
        totalRaisedCostRWF: 460000,
        activities: [
          { date: '2025-06-01', type: 'Registration', text: 'Acquired as active sire' },
          { date: '2026-07-15', type: 'Mating', text: 'Served Sow Big Mama' }
        ]
      }
    ],
    batches: [
      {
        id: 'BAT-PIG-01',
        name: 'Grower Batch Nov-A',
        type: 'Pigs',
        breed: 'Large White / Duroc Cross',
        quantity: 14,
        avgWeightKg: 45,
        unitCostRWF: 65000,
        acquisitionDate: '2026-09-01',
        location: 'Grower Pen 3',
        notes: 'Targeting 90kg market weight for December sales'
      }
    ],
    feeds: [
      { id: 'FED-PIG-01', name: 'Tunga High-Protein Grower Pellets', brand: 'Tunga Feed Ltd', currentStockKg: 650, costPerKgRWF: 520, reorderLevelKg: 150 },
      { id: 'FED-PIG-02', name: 'Creep Feed for Weaners', brand: 'AgroFeed Rwanda', currentStockKg: 180, costPerKgRWF: 750, reorderLevelKg: 50 },
      { id: 'FED-PIG-03', name: 'Wheat Pollard & Maize Bran', brand: 'Bakhresa Milling', currentStockKg: 400, costPerKgRWF: 320, reorderLevelKg: 100 }
    ],
    gestations: [
      { id: 'GES-01', damId: 'PIG-001', damName: 'Big Mama', sireId: 'PIG-003', sireName: 'Thor', matingDate: '2026-07-20', expectedDate: '2026-11-11', status: 'Due Soon' }
    ],
    healthRecords: [
      { id: 'HLT-01', animalRef: 'PIG-001', diagnosis: 'Routine Booster', treatment: 'Vitamin B-Complex & Iron', date: '2026-10-25', costRWF: 12000, nextDate: '2026-11-25', status: 'Completed' }
    ],
    production: [
      { id: 'PRD-01', date: '2026-10-10', item: 'Piglets Born', quantity: 9, unit: 'piglets', sourceAnimal: 'Sow Bella', status: 'Weaned & Active' }
    ]
  },

  poultry: {
    id: 'poultry',
    name: 'Poultry & Egg Production',
    category: 'Commercial Layers & Broiler Flocks',
    iconName: 'Feather',
    businessName: 'Sunrise Bio-Poultry Farm',
    headline: 'Daily Egg Production, Crates Inventory & Flock Mortality Tracker',
    description: 'Manage layer batches, broiler weight gains, daily egg collection, feed conversion ratios, and vaccine dates.',
    attentionHeadline: 'Layer House 1 Live · 128 Eggs Collected Today (92% Laying Rate)',
    animalLabel: 'Chickens',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 0.125,
    animals: [],
    batches: [
      { id: 'BAT-POU-01', name: 'ISA Brown Layers (House A)', type: 'Chickens', breed: 'ISA Brown (Layers)', quantity: 200, ageWeeks: 28, unitCostRWF: 6500, acquisitionDate: '2026-05-10', location: 'House A (Deep Litter)', notes: 'Peak production cycle' },
      { id: 'BAT-POU-02', name: 'Cobb 500 Broilers (Batch 12)', type: 'Chickens', breed: 'Cobb 500 (Broilers)', quantity: 300, ageWeeks: 5, unitCostRWF: 1200, acquisitionDate: '2026-10-01', location: 'House B (Broiler Pen)', notes: 'Average weight 1.8 kg, ready in 10 days' }
    ],
    feeds: [
      { id: 'FED-POU-01', name: 'Premium Layers Mash (20% Protein)', brand: 'Tunga Feed Ltd', currentStockKg: 850, costPerKgRWF: 540, reorderLevelKg: 200 },
      { id: 'FED-POU-02', name: 'Broiler Finisher Pellets', brand: 'Ubumwe Mills', currentStockKg: 420, costPerKgRWF: 620, reorderLevelKg: 100 }
    ],
    gestations: [],
    healthRecords: [
      { id: 'HLT-POU-01', animalRef: 'ISA Brown Layers (House A)', diagnosis: 'Preventative Newcastle Vaccine', treatment: 'Lasota in Drinking Water', date: '2026-10-18', costRWF: 8500, nextDate: '2026-12-18', status: 'Completed' }
    ],
    production: [
      { id: 'PRD-POU-01', date: '2026-11-05', item: 'Fresh Table Eggs', quantity: 184, broken: 4, available: 180, unit: 'eggs', sold: 120, remaining: 60, status: 'Crated & Fresh' }
    ]
  },

  dairy: {
    id: 'dairy',
    name: 'Dairy & Cattle Farming',
    category: 'Dairy Milk & Bovine Husbandry',
    iconName: 'Milk',
    businessName: 'Nyagatare Prime Dairy Cattle',
    headline: 'Daily Milk Production, Lactation Cycles & Calving Ledger',
    description: 'Track Holstein Friesian cows, daily morning/evening milk yields in liters, artificial insemination, and hay silage.',
    attentionHeadline: 'Milking Parlor Active · 68 Liters Harvested Morning Session',
    animalLabel: 'Cattle',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 12.0,
    animals: [
      {
        id: 'COW-101',
        name: 'Queen Nyampinga',
        type: 'Cattle',
        breed: 'Holstein Friesian',
        sex: 'Female',
        ageMonths: 42,
        startingWeightKg: 420,
        currentWeightKg: 510,
        purchasePriceRWF: 850000,
        acquiredDate: '2024-03-12',
        location: 'Barn Stall 1',
        healthStatus: 'Active Milking (Lactation 2)',
        totalRaisedCostRWF: 1050000,
        activities: [
          { date: '2024-03-12', type: 'Registration', text: 'Acquired high-grade heifer' },
          { date: '2026-05-20', type: 'Calving', text: 'Calved healthy female calf COW-104' },
          { date: '2026-11-05', type: 'Milking', text: 'Morning 18L / Evening 14L' }
        ]
      },
      {
        id: 'COW-102',
        name: 'Inyange Star',
        type: 'Cattle',
        breed: 'Jersey-Friesian Cross',
        sex: 'Female',
        ageMonths: 36,
        startingWeightKg: 380,
        currentWeightKg: 460,
        purchasePriceRWF: 720000,
        acquiredDate: '2024-08-15',
        location: 'Barn Stall 2',
        healthStatus: 'Active Milking (Lactation 1)',
        totalRaisedCostRWF: 890000,
        activities: [
          { date: '2024-08-15', type: 'Registration', text: 'Acquired pregnant heifer' },
          { date: '2026-11-05', type: 'Milking', text: 'Morning 14L / Evening 11L' }
        ]
      }
    ],
    batches: [],
    feeds: [
      { id: 'FED-COW-01', name: 'Dairy Meal 16% Lactation Pellets', brand: 'Tunga Feed Ltd', currentStockKg: 750, costPerKgRWF: 480, reorderLevelKg: 200 },
      { id: 'FED-COW-02', name: 'Baled Chloris Gayana Hay (Rhodes)', brand: 'Eastern Farm Co-op', currentStockKg: 1200, costPerKgRWF: 150, reorderLevelKg: 300 }
    ],
    gestations: [
      { id: 'GES-COW-01', damId: 'COW-102', damName: 'Inyange Star', sireId: 'BULL-AI-09', sireName: 'ABS Semen Bull 9', matingDate: '2026-03-01', expectedDate: '2026-12-09', status: 'Pregnant (Month 8)' }
    ],
    healthRecords: [
      { id: 'HLT-COW-01', animalRef: 'Queen Nyampinga', diagnosis: 'Preventative ECF Tick Dip', treatment: 'Acaricide spray & dewormer', date: '2026-10-20', costRWF: 15000, nextDate: '2026-11-20', status: 'Healthy' }
    ],
    production: [
      { id: 'PRD-COW-01', date: '2026-11-05', item: 'Fresh Raw Cow Milk', quantity: 57, unit: 'liters', available: 57, sold: 45, remaining: 12, status: 'Chilled at 4°C' }
    ]
  },

  'small-ruminants': {
    id: 'small-ruminants',
    name: 'Goats & Sheep Husbandry',
    category: 'Meat & Dairy Small Ruminants',
    iconName: 'ShieldCheck',
    businessName: 'Akagera Boer Goat & Dorper Ranch',
    headline: 'Boer Stud Sires, Kid Weaning & Pasture Rotation',
    description: 'Track meat Boer goats, Dorper sheep, rotational grazing, kidding rates, and slaughter market valuations.',
    attentionHeadline: 'Ranch Paddocks Optimal · 42 Heads Grazing in Sector 3',
    animalLabel: 'Goats & Sheep',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 1.5,
    animals: [
      { id: 'GOAT-01', name: 'Prince Boer 1', type: 'Goats', breed: 'Boer (Meat)', sex: 'Male', ageMonths: 16, startingWeightKg: 45, currentWeightKg: 68, purchasePriceRWF: 180000, acquiredDate: '2025-10-01', location: 'Paddock North', healthStatus: 'Healthy Sire', totalRaisedCostRWF: 220000, activities: [] }
    ],
    batches: [
      { id: 'BAT-GT-01', name: 'Weaned Boer Kids Batch', type: 'Goats', breed: 'Boer Cross', quantity: 18, avgWeightKg: 22, unitCostRWF: 45000, acquisitionDate: '2026-08-15', location: 'Kid Barn 1', notes: 'Growing well on pasture + mineral block' }
    ],
    feeds: [
      { id: 'FED-GT-01', name: 'Goat Mineral Lick Blocks', brand: 'VetAgro', currentStockKg: 80, costPerKgRWF: 1200, reorderLevelKg: 20 }
    ],
    gestations: [],
    healthRecords: [],
    production: []
  },

  crops: {
    id: 'crops',
    name: 'Crops & Horticulture',
    category: 'Commercial Field Crops & Greenhouses',
    iconName: 'Wheat',
    businessName: 'Musanze High-Yield Potato & Veg Farm',
    headline: 'Plot Land Records, Fertilizer Cycles & Harvest Yields',
    description: 'Manage agricultural field plots, seed germination, NPK/UREA input application, and harvest sack accounting.',
    attentionHeadline: 'Field Plot 1 (Irish Potatoes) · Projected Harvest in 18 Days',
    animalLabel: 'Crops',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 0,
    animals: [],
    batches: [],
    feeds: [
      { id: 'FED-CRP-01', name: 'NPK 17-17-17 Fertilizer', brand: 'Rwanda Fertilizer Co', currentStockKg: 500, costPerKgRWF: 850, reorderLevelKg: 150 },
      { id: 'FED-CRP-02', name: 'UREA 46% Nitrogen Fertilizer', brand: 'One Acre Fund', currentStockKg: 300, costPerKgRWF: 920, reorderLevelKg: 100 }
    ],
    gestations: [],
    healthRecords: [],
    production: [
      { id: 'PRD-CRP-01', date: '2026-10-28', item: 'Kinigi Irish Potatoes (Grade A)', quantity: 65, unit: 'sacks', available: 65, sold: 50, remaining: 15, status: 'Stored in Cool Store' }
    ]
  },

  circular: {
    id: 'circular',
    name: 'Integrated Circular Farm (AGUKA Model)',
    category: 'Closed-Loop Multi-Enterprise Agribusiness',
    iconName: 'RefreshCw',
    businessName: 'Aguka Circular Integrated Bio-Farm',
    headline: 'Closed-Loop Swine, Poultry & Crops with Bio-Slurry Recycling',
    description: 'Pigs produce manure for biogas and crop fertilization; crops provide grain for milling; poultry creates daily cash flow.',
    attentionHeadline: 'Circular Loop Optimal · Zero Chemical Fertilizer Purchased This Season',
    animalLabel: 'Mixed Farm',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 2.0,
    animals: [
      { id: 'AGK-PIG-01', name: 'Breeder Sow Alpha', type: 'Pigs', breed: 'Large White', sex: 'Female', ageMonths: 16, startingWeightKg: 130, currentWeightKg: 175, purchasePriceRWF: 290000, acquiredDate: '2025-09-01', location: 'Bio-Pen 1', healthStatus: 'Healthy', totalRaisedCostRWF: 370000, activities: [] }
    ],
    batches: [
      { id: 'AGK-BAT-01', name: 'Circular Layer Flock', type: 'Chickens', breed: 'ISA Brown', quantity: 150, ageWeeks: 24, unitCostRWF: 6000, acquisitionDate: '2026-06-01', location: 'Poultry Shed 1', notes: 'Manure collected for bio-digester' }
    ],
    feeds: [
      { id: 'AGK-FED-01', name: 'Farm-Milled Maize & Soya Feed', brand: 'Farm Produced', currentStockKg: 900, costPerKgRWF: 350, reorderLevelKg: 200 }
    ],
    gestations: [],
    healthRecords: [],
    production: [
      { id: 'AGK-PRD-01', date: '2026-11-05', item: 'Organic Bio-Slurry Fertilizer', quantity: 200, unit: 'liters', available: 200, sold: 100, remaining: 100, status: 'Applied to Maize Plot' }
    ]
  },

  'clean-slate': {
    id: 'clean-slate',
    name: 'Clean Slate (Zero-Base Farm)',
    category: 'Blank Agricultural Ledger',
    iconName: 'Layers',
    businessName: 'My Agribusiness Enterprise',
    headline: 'Completely Clean Farm Registry Ready for Real Data',
    description: 'Start with 0 animals, 0 feeds, and 0 transactions. Ideal for new farm setups or direct record onboarding.',
    attentionHeadline: 'Clean Farm Workspace Live · Ready for First Animal Intake',
    animalLabel: 'Custom',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 0,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  },

  other: {
    id: 'other',
    name: 'Other Agribusiness / Specialized Farm',
    category: 'Custom & Specialized Farming',
    iconName: 'HelpCircle',
    businessName: 'Specialized Agribusiness Workshop',
    headline: 'Direct Implementation Support on WhatsApp',
    description: 'Have a fish farm, bee apiary, rabbitry, or specialized crop farm? Chat with our team for personalized setup.',
    attentionHeadline: 'Official ExBOS Farm Specialist Hotline: +250 781 963 981',
    isSupportContact: true,
    whatsappNumber: '+250 781 963 981',
    whatsappFormatted: '+250 781 963 981',
    whatsappMessage: 'Hello ExBOS Agribusiness Support, I need help setting up my specialized livestock or crop farm workflow.',
    animalLabel: 'Specialized',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 0,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  }
}

export const AGRICULTURE_TRADE_LIST = Object.values(AGRICULTURE_PRESETS)
