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
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  },

  poultry: {
    id: 'poultry',
    name: 'Poultry & Egg Production',
    category: 'Commercial Layers & Broiler Flocks',
    iconName: 'Feather',
    businessName: 'Poultry & Egg Farm',
    headline: 'Daily Egg Production, Crates Inventory & Flock Mortality Tracker',
    description: 'Manage layer batches, broiler weight gains, daily egg collection, feed conversion ratios, and vaccine dates.',
    attentionHeadline: 'Layer & Broiler Registry Active · Ready for intake',
    animalLabel: 'Chickens',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 0.125,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  },

  dairy: {
    id: 'dairy',
    name: 'Dairy & Cattle Farming',
    category: 'Dairy Milk & Bovine Husbandry',
    iconName: 'Milk',
    businessName: 'Dairy Cattle Farm',
    headline: 'Daily Milk Production, Lactation Cycles & Calving Ledger',
    description: 'Track dairy cows, daily morning/evening milk yields in liters, artificial insemination, and hay silage.',
    attentionHeadline: 'Milking Parlor Active · Ready for daily yields',
    animalLabel: 'Cattle',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 12.0,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  },

  'small-ruminants': {
    id: 'small-ruminants',
    name: 'Goats & Sheep Husbandry',
    category: 'Meat & Dairy Small Ruminants',
    iconName: 'ShieldCheck',
    businessName: 'Goat & Sheep Ranch',
    headline: 'Boer Stud Sires, Kid Weaning & Pasture Rotation',
    description: 'Track meat Boer goats, Dorper sheep, rotational grazing, kidding rates, and slaughter market valuations.',
    attentionHeadline: 'Ranch Paddocks Optimal · Ready for pasture management',
    animalLabel: 'Goats & Sheep',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 1.5,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
  },

  circular: {
    id: 'circular',
    name: 'Integrated Circular Farm (AGUKA Model)',
    category: 'Closed-Loop Multi-Livestock Agribusiness',
    iconName: 'RefreshCw',
    businessName: 'Circular Integrated Bio-Farm',
    headline: 'Closed-Loop Swine, Poultry & Cattle with Bio-Slurry Recycling',
    description: 'Pigs produce manure for biogas and organic bio-slurry; poultry creates daily cash flow; multi-livestock integration optimizes feed conversion.',
    attentionHeadline: 'Circular Loop Optimal · Integrated bio-cycle ready',
    animalLabel: 'Mixed Farm',
    feedUnit: 'kg',
    dailyFeedPerHeadKg: 2.0,
    animals: [],
    batches: [],
    feeds: [],
    gestations: [],
    healthRecords: [],
    production: []
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
    description: 'Have a fish farm, bee apiary, rabbitry, or specialized livestock venture? Chat with our team for personalized setup.',
    attentionHeadline: 'Official ExBOS Farm Specialist Hotline: +250 781 963 981',
    isSupportContact: true,
    whatsappNumber: '+250 781 963 981',
    whatsappFormatted: '+250 781 963 981',
    whatsappMessage: 'Hello ExBOS Agribusiness Support, I need help setting up my specialized livestock farming workflow.',
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
