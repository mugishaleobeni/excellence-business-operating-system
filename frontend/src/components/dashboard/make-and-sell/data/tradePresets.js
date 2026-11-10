/**
 * ExBOS Make & Sell: Multi-Trade Presets Library
 *
 * Configures domain metadata, standard measurement units, and product/material categories
 * for 7 workshop trades with ZERO hardcoded demo records.
 * Live data is strictly fetched from and saved to the backend database.
 *
 * Trades:
 * 1. Tailoring & Garments (Fabrics in meters, garments, custom suits, dresses)
 * 2. Carpentry & Furniture (Timber in meters, hardware, joinery, tables, chairs)
 * 3. Juice & Beverages (Fruit, bottles in pcs, bottled juices in L/ml)
 * 4. Bakery & Confectionery (Flour in kg, yeast, butter, bread, pastries)
 * 5. Metal Fabrication & Welding (Steel sections in meters, welding consumables, gates)
 * 6. Clean Slate / Zero-Base (Custom blank manufacturing)
 * 7. Other / Not Specified (Direct WhatsApp engineering support: +250 781 963 981)
 */

export const TRADE_PRESETS = {
  tailoring: {
    id: 'tailoring',
    name: 'Tailoring & Garments',
    tagline: 'Textiles, Fashion, Apparel & Custom Tailoring',
    iconName: 'Scissors',
    category: 'Fashion & Garments',
    businessName: 'Kigali Premier Apparel Studio',
    attentionHeadline: 'Tailoring Workshop Active · Ready for Orders',
    units: ['m', 'yd', 'pcs', 'roll'],
    categories: ['Fabrics & Textiles', 'Fasteners & Zippers', 'Threads & Trims', 'Formal Suits', 'Dresses & Skirts', 'Shirts & Tops'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  carpentry: {
    id: 'carpentry',
    name: 'Carpentry & Furniture',
    tagline: 'Solid Hardwood, Joinery, Home & Office Furniture',
    iconName: 'Hammer',
    category: 'Furniture & Woodworking',
    businessName: 'Gatsata Hardwood & Furniture Works',
    attentionHeadline: 'Carpentry Workshop Active · Ready for Builds',
    units: ['m', 'pcs', 'kg', 'L', 'sheet'],
    categories: ['Lumber & Timber', 'Hardware & Screws', 'Finishing & Paints', 'Dining Tables', 'Chairs & Seating', 'Cabinets & Shelves'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  beverage: {
    id: 'beverage',
    name: 'Juice, Beverages & Food Processing',
    tagline: 'Fruit Juicing, Pasteurization, Cold Pressing & Bottling',
    iconName: 'CupSoda',
    category: 'Beverages & Food Processing',
    businessName: 'Akagera Fresh Fruit Juice & Bottling Co.',
    attentionHeadline: 'Beverage Processing Active · Ready for Production',
    units: ['L', 'ml', 'kg', 'pcs', 'box'],
    categories: ['Fresh Fruits & Produce', 'Packaging & Bottles', 'Additives & Sugar', 'Bottled Juices', 'Natural Syrups'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  bakery: {
    id: 'bakery',
    name: 'Bakery & Confectionery',
    tagline: 'Artisan Breads, Brioche, Cakes & Pastries',
    iconName: 'UtensilsCrossed',
    category: 'Bakery & Confectionery',
    businessName: 'Kigali Artisan Craft Bakery',
    attentionHeadline: 'Bakery Workshop Active · Ready for Bakes',
    units: ['kg', 'g', 'pcs', 'L', 'bag'],
    categories: ['Flour & Grains', 'Yeast & Leavening', 'Fats & Dairy', 'Daily Breads', 'Brioche & Rolls', 'Pastries & Croissants'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  metalwork: {
    id: 'metalwork',
    name: 'Welding & Metal Fabrication',
    tagline: 'Gates, Grills, Structural Steel, Tanks & Metal Enclosures',
    iconName: 'Wrench',
    category: 'Metal Fabrication',
    businessName: 'Gikondo Precision Steel & Welding Works',
    attentionHeadline: 'Metalwork Yard Active · Ready for Fabrication',
    units: ['m', 'pcs', 'kg', 'sheet', 'box'],
    categories: ['Steel Sections & Tubes', 'Welding Consumables', 'Finishing & Primers', 'Security Gates', 'Window Grills', 'Structural Stands'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  clean_slate: {
    id: 'clean_slate',
    name: 'Clean Slate (Zero-Base)',
    tagline: '100% Blank Workspace for Real Data Entry',
    iconName: 'Sparkles',
    category: 'Custom Manufacturing',
    businessName: 'My Production Enterprise',
    attentionHeadline: 'Ready for entries · All systems live',
    units: ['pcs', 'kg', 'm', 'L', 'g', 'ml', 'yd', 'roll', 'sheet', 'bag', 'box'],
    categories: ['Raw Materials', 'Finished Goods'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  },

  other: {
    id: 'other',
    name: 'Other / Not Specified',
    tagline: 'Specialized Workshop? Contact Engineering on WhatsApp',
    iconName: 'HelpCircle',
    category: 'Specialized Workshop',
    businessName: 'Specialized Production Enterprise',
    attentionHeadline: 'Custom Workshop Configuration · Support Available',
    isSupportContact: true,
    whatsappNumber: '+250781963981',
    whatsappFormatted: '+250 781 963 981',
    whatsappMessage: 'Hello ExBOS Support, I have a manufacturing workshop and need a custom setup.',
    units: ['pcs', 'kg', 'm', 'L', 'box'],
    categories: ['Raw Materials', 'Finished Goods'],
    rawMaterials: [],
    finishedGoods: [],
    recipes: [],
    productionBatches: [],
    customers: [],
    suppliers: []
  }
}

export const TRADE_LIST = Object.values(TRADE_PRESETS)
