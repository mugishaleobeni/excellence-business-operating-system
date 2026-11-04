/**
 * ExBOS Make & Sell: Multi-Trade Presets Library
 *
 * Defines domain datasets for 6 manufacturing trades:
 * 1. Tailoring & Garments (Fabrics in meters, zippers, suits, dresses)
 * 2. Carpentry & Furniture (Hardwood timber in meters, varnish, dining tables, chairs)
 * 3. Juice & Beverages (Fresh fruits in kg, bottles in pcs, bottled juices in L/ml)
 * 4. Bakery & Confectionery (Flour in kg, yeast, butter, bread, brioche)
 * 5. Metal Fabrication & Welding (Steel tubes in meters, welding rods, gates, grills)
 * 6. Clean Slate / Zero-Base (0 records, 100% clean for custom entry)
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
    attentionHeadline: 'Production Margin Healthy · 3 Active Garment Runs',
    units: ['m', 'yd', 'pcs', 'roll'],
    categories: ['Fabrics & Textiles', 'Fasteners & Zippers', 'Threads & Trims', 'Formal Suits', 'Dresses & Skirts', 'Shirts & Tops'],
    rawMaterials: [
      {
        id: 'MAT-FAB-01',
        name: 'Kitenge Wax Cotton Print Fabric',
        category: 'Fabrics & Textiles',
        unit: 'm',
        currentStock: 45,
        minimumStockLevel: 20,
        purchasePriceRWF: 3200,
        supplier: 'Kigali Textiles & Drapery Ltd',
        batchCode: 'LOT-FAB-101',
        hasExpiry: false
      },
      {
        id: 'MAT-FAB-02',
        name: 'Italian Wool Suit Fabric (Navy Blue)',
        category: 'Fabrics & Textiles',
        unit: 'm',
        currentStock: 28,
        minimumStockLevel: 15,
        purchasePriceRWF: 14500,
        supplier: 'Muhima Fabric Wholesalers',
        batchCode: 'LOT-WOOL-202',
        hasExpiry: false
      },
      {
        id: 'MAT-ZIP-01',
        name: 'Heavy-Duty Brass Zippers 60cm',
        category: 'Fasteners & Zippers',
        unit: 'pcs',
        currentStock: 50,
        minimumStockLevel: 20,
        purchasePriceRWF: 600,
        supplier: 'Nyamirambo Haberdashery Hub',
        batchCode: 'LOT-ZIP-303',
        hasExpiry: false
      },
      {
        id: 'MAT-THRD-01',
        name: 'High-Tensile Polyester Sewing Thread Spools',
        category: 'Threads & Trims',
        unit: 'pcs',
        currentStock: 35,
        minimumStockLevel: 10,
        purchasePriceRWF: 1200,
        supplier: 'Nyamirambo Haberdashery Hub',
        batchCode: 'LOT-THRD-404',
        hasExpiry: false
      },
      {
        id: 'MAT-LIN-01',
        name: 'Premium Suit Lining Satin Material',
        category: 'Fabrics & Textiles',
        unit: 'm',
        currentStock: 40,
        minimumStockLevel: 15,
        purchasePriceRWF: 2800,
        supplier: 'Kigali Textiles & Drapery Ltd',
        batchCode: 'LOT-LIN-505',
        hasExpiry: false
      }
    ],
    finishedGoods: [
      {
        id: 'PROD-SUIT-01',
        name: 'Custom 2-Piece Italian Wool Suit',
        title: 'Custom 2-Piece Italian Wool Suit',
        category: 'Formal Suits',
        unit: 'pcs',
        currentStock: 5,
        stock: 5,
        minimumStockLevel: 2,
        costPerUnitRWF: 81400,
        sellingPriceRWF: 145000,
        sellingPrice: 145000,
        shelfLifeDays: null,
        batchCode: 'RUN-SUIT-01',
        sku: 'GAR-SUIT-001'
      },
      {
        id: 'PROD-DRESS-02',
        name: 'Kitenge Flared Midi Dress',
        title: 'Kitenge Flared Midi Dress',
        category: 'Dresses & Skirts',
        unit: 'pcs',
        currentStock: 12,
        stock: 12,
        minimumStockLevel: 4,
        costPerUnitRWF: 18200,
        sellingPriceRWF: 38000,
        sellingPrice: 38000,
        shelfLifeDays: null,
        batchCode: 'RUN-DRESS-02',
        sku: 'GAR-DRES-002'
      },
      {
        id: 'PROD-SHIRT-03',
        name: 'Fitted Long-Sleeve Cotton Shirt',
        title: 'Fitted Long-Sleeve Cotton Shirt',
        category: 'Shirts & Tops',
        unit: 'pcs',
        currentStock: 18,
        stock: 18,
        minimumStockLevel: 6,
        costPerUnitRWF: 11500,
        sellingPriceRWF: 26000,
        sellingPrice: 26000,
        shelfLifeDays: null,
        batchCode: 'RUN-SHRT-03',
        sku: 'GAR-SHRT-003'
      }
    ],
    recipes: [
      {
        id: 'REC-SUIT-01',
        name: '2-Piece Wool Suit Cutting & Tailoring',
        productId: 'PROD-SUIT-01',
        productName: 'Custom 2-Piece Italian Wool Suit',
        yieldQuantity: 1,
        unit: 'pcs',
        wastageAllowancePct: 3,
        targetMarginPct: 44,
        costPerUnitRWF: 81400,
        ingredients: [
          { materialId: 'MAT-FAB-02', materialName: 'Italian Wool Suit Fabric (Navy Blue)', quantity: 3.2, unit: 'm', unitCost: 14500 },
          { materialId: 'MAT-LIN-01', materialName: 'Premium Suit Lining Satin Material', quantity: 2.5, unit: 'm', unitCost: 2800 },
          { materialId: 'MAT-ZIP-01', materialName: 'Heavy-Duty Brass Zippers 60cm', quantity: 1, unit: 'pcs', unitCost: 600 },
          { materialId: 'MAT-THRD-01', materialName: 'High-Tensile Polyester Sewing Thread Spools', quantity: 2, unit: 'pcs', unitCost: 1200 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Master Tailor Cutting & Stitching Labor', amount: 25000 }
        ]
      },
      {
        id: 'REC-DRESS-02',
        name: 'Kitenge Flared Dress Pattern',
        productId: 'PROD-DRESS-02',
        productName: 'Kitenge Flared Midi Dress',
        yieldQuantity: 1,
        unit: 'pcs',
        wastageAllowancePct: 2,
        targetMarginPct: 52,
        costPerUnitRWF: 18200,
        ingredients: [
          { materialId: 'MAT-FAB-01', materialName: 'Kitenge Wax Cotton Print Fabric', quantity: 4.5, unit: 'm', unitCost: 3200 },
          { materialId: 'MAT-ZIP-01', materialName: 'Heavy-Duty Brass Zippers 60cm', quantity: 1, unit: 'pcs', unitCost: 600 },
          { materialId: 'MAT-THRD-01', materialName: 'High-Tensile Polyester Sewing Thread Spools', quantity: 1, unit: 'pcs', unitCost: 1200 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Apparel Assembly & Pressing Labor', amount: 2000 }
        ]
      }
    ],
    productionBatches: [
      {
        id: 'RUN-SUIT-101',
        batchCode: 'RUN-101',
        recipeId: 'REC-SUIT-01',
        productId: 'PROD-SUIT-01',
        productName: 'Custom 2-Piece Italian Wool Suit',
        plannedQuantity: 4,
        actualQuantity: 4,
        wasteQuantity: 0,
        unit: 'pcs',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Aimable Habineza (Master Tailor)',
        plannedCostPerUnitRWF: 81400,
        actualCostPerUnitRWF: 81400,
        isOverPlan: false
      },
      {
        id: 'RUN-DRESS-102',
        batchCode: 'RUN-102',
        recipeId: 'REC-DRESS-02',
        productId: 'PROD-DRESS-02',
        productName: 'Kitenge Flared Midi Dress',
        plannedQuantity: 6,
        unit: 'pcs',
        status: 'In Progress',
        plannedDate: new Date().toISOString().slice(0, 10),
        startTime: new Date().toISOString(),
        targetCompletion: new Date(Date.now() + 6 * 3600000).toISOString(),
        responsibleEmployee: 'Chantal Uwineza',
        plannedCostPerUnitRWF: 18200,
        ingredientsUsed: [
          { materialId: 'MAT-FAB-01', name: 'Kitenge Wax Cotton Print Fabric', quantity: 27, unit: 'm' },
          { materialId: 'MAT-ZIP-01', name: 'Heavy-Duty Brass Zippers 60cm', quantity: 6, unit: 'pcs' }
        ]
      }
    ],
    customers: [
      { id: 'CUST-01', name: 'Kigali Fashion House Boutique', phone: '+250 788 123 456', email: 'sales@kigalifashion.rw', balanceRWF: 0, category: 'Wholesale Buyer' },
      { id: 'CUST-02', name: 'Hon. Alexis Gatete (Custom Client)', phone: '+250 789 234 567', email: 'alexis.gatete@gov.rw', balanceRWF: 45000, category: 'Private Client' }
    ],
    suppliers: [
      { id: 'SUPP-01', name: 'Kigali Textiles & Drapery Ltd', phone: '+250 788 345 678', email: 'orders@kigalitextiles.rw', owedRWF: 0, category: 'Textiles Supplier' },
      { id: 'SUPP-02', name: 'Muhima Fabric Wholesalers', phone: '+250 788 456 789', email: 'sales@muhimafabrics.rw', owedRWF: 29000, category: 'Imported Suitings' }
    ]
  },

  carpentry: {
    id: 'carpentry',
    name: 'Carpentry & Furniture',
    tagline: 'Solid Hardwood, Joinery, Home & Office Furniture',
    iconName: 'Hammer',
    category: 'Furniture & Woodworking',
    businessName: 'Gatsata Hardwood & Furniture Works',
    attentionHeadline: 'Carpentry Workshop Active · 4 Furniture Orders in Build',
    units: ['m', 'pcs', 'kg', 'L', 'sheet'],
    categories: ['Lumber & Timber', 'Hardware & Screws', 'Finishing & Paints', 'Dining Tables', 'Chairs & Seating', 'Cabinets & Shelves'],
    rawMaterials: [
      {
        id: 'MAT-TIM-01',
        name: 'Mahogany Planed Hardwood Timber 2x4',
        category: 'Lumber & Timber',
        unit: 'm',
        currentStock: 80,
        minimumStockLevel: 30,
        purchasePriceRWF: 4800,
        supplier: 'Gatsata Timber Depot',
        batchCode: 'LOT-TIM-101',
        hasExpiry: false
      },
      {
        id: 'MAT-VAR-02',
        name: 'Clear Polyurethane Wood Varnish (Gloss)',
        category: 'Finishing & Paints',
        unit: 'L',
        currentStock: 25,
        minimumStockLevel: 10,
        purchasePriceRWF: 8500,
        supplier: 'Sadolin & Robbialac Paints Kigali',
        batchCode: 'LOT-VAR-202',
        hasExpiry: false
      },
      {
        id: 'MAT-GLU-03',
        name: 'Heavy-Duty Woodworking PVA Glue',
        category: 'Hardware & Screws',
        unit: 'kg',
        currentStock: 15,
        minimumStockLevel: 5,
        purchasePriceRWF: 5200,
        supplier: 'Gatsata Hardware Mart',
        batchCode: 'LOT-GLU-303',
        hasExpiry: false
      },
      {
        id: 'MAT-SCR-04',
        name: 'Drywall Hardened Wood Screws 3-inch (Box 100)',
        category: 'Hardware & Screws',
        unit: 'pcs',
        currentStock: 20,
        minimumStockLevel: 8,
        purchasePriceRWF: 4500,
        supplier: 'Gatsata Hardware Mart',
        batchCode: 'LOT-SCR-404',
        hasExpiry: false
      },
      {
        id: 'MAT-SND-05',
        name: 'Industrial Abrasive Sandpaper Sheets (P120/P240)',
        category: 'Hardware & Screws',
        unit: 'sheet',
        currentStock: 60,
        minimumStockLevel: 25,
        purchasePriceRWF: 800,
        supplier: 'Gatsata Hardware Mart',
        batchCode: 'LOT-SND-505',
        hasExpiry: false
      }
    ],
    finishedGoods: [
      {
        id: 'PROD-TBL-01',
        name: 'Handcrafted 6-Seater Mahogany Dining Table',
        title: 'Handcrafted 6-Seater Mahogany Dining Table',
        category: 'Dining Tables',
        unit: 'pcs',
        currentStock: 3,
        stock: 3,
        minimumStockLevel: 1,
        costPerUnitRWF: 206100,
        sellingPriceRWF: 380000,
        sellingPrice: 380000,
        shelfLifeDays: null,
        batchCode: 'RUN-TBL-01',
        sku: 'FUR-TBL-06'
      },
      {
        id: 'PROD-CHR-02',
        name: 'Ergonomic Hardwood Executive Chair',
        title: 'Ergonomic Hardwood Executive Chair',
        category: 'Chairs & Seating',
        unit: 'pcs',
        currentStock: 8,
        stock: 8,
        minimumStockLevel: 3,
        costPerUnitRWF: 48500,
        sellingPriceRWF: 95000,
        sellingPrice: 95000,
        shelfLifeDays: null,
        batchCode: 'RUN-CHR-02',
        sku: 'FUR-CHR-01'
      },
      {
        id: 'PROD-SHF-03',
        name: '3-Tier Minimalist Living Room Bookshelf',
        title: '3-Tier Minimalist Living Room Bookshelf',
        category: 'Cabinets & Shelves',
        unit: 'pcs',
        currentStock: 5,
        stock: 5,
        minimumStockLevel: 2,
        costPerUnitRWF: 62000,
        sellingPriceRWF: 120000,
        sellingPrice: 120000,
        shelfLifeDays: null,
        batchCode: 'RUN-SHF-03',
        sku: 'FUR-SHF-03'
      }
    ],
    recipes: [
      {
        id: 'REC-TBL-01',
        name: '6-Seater Dining Table Joinery & Finishing',
        productId: 'PROD-TBL-01',
        productName: 'Handcrafted 6-Seater Mahogany Dining Table',
        yieldQuantity: 1,
        unit: 'pcs',
        wastageAllowancePct: 5,
        targetMarginPct: 45,
        costPerUnitRWF: 206100,
        ingredients: [
          { materialId: 'MAT-TIM-01', materialName: 'Mahogany Planed Hardwood Timber 2x4', quantity: 28, unit: 'm', unitCost: 4800 },
          { materialId: 'MAT-VAR-02', materialName: 'Clear Polyurethane Wood Varnish (Gloss)', quantity: 2, unit: 'L', unitCost: 8500 },
          { materialId: 'MAT-GLU-03', materialName: 'Heavy-Duty Woodworking PVA Glue', quantity: 1, unit: 'kg', unitCost: 5200 },
          { materialId: 'MAT-SCR-04', materialName: 'Drywall Hardened Wood Screws 3-inch (Box 100)', quantity: 1, unit: 'pcs', unitCost: 4500 },
          { materialId: 'MAT-SND-05', materialName: 'Industrial Abrasive Sandpaper Sheets (P120/P240)', quantity: 6, unit: 'sheet', unitCost: 800 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Master Joiner Carpentry & Sanding Labor', amount: 45000 }
        ]
      }
    ],
    productionBatches: [
      {
        id: 'RUN-TBL-201',
        batchCode: 'RUN-201',
        recipeId: 'REC-TBL-01',
        productId: 'PROD-TBL-01',
        productName: 'Handcrafted 6-Seater Mahogany Dining Table',
        plannedQuantity: 2,
        actualQuantity: 2,
        wasteQuantity: 0,
        unit: 'pcs',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Vincent Mugabo (Lead Joiner)',
        plannedCostPerUnitRWF: 206100,
        actualCostPerUnitRWF: 206100,
        isOverPlan: false
      }
    ],
    customers: [
      { id: 'CUST-01', name: 'Kigali Serena Hotel Residences', phone: '+250 788 567 890', email: 'procurement@serenakigali.rw', balanceRWF: 120000, category: 'Hospitality Partner' },
      { id: 'CUST-02', name: 'Inziza Interior Design Studio', phone: '+250 788 678 901', email: 'orders@inzizadesign.rw', balanceRWF: 0, category: 'Interior Designer' }
    ],
    suppliers: [
      { id: 'SUPP-01', name: 'Gatsata Timber Depot', phone: '+250 788 789 012', email: 'timber@gatsatadepot.rw', owedRWF: 48000, category: 'Hardwood Supplier' },
      { id: 'SUPP-02', name: 'Sadolin & Robbialac Paints Kigali', phone: '+250 788 890 123', email: 'sales@sadolin.rw', owedRWF: 0, category: 'Coatings & Varnishes' }
    ]
  },

  beverage: {
    id: 'beverage',
    name: 'Juice, Beverages & Food Processing',
    tagline: 'Fruit Juicing, Pasteurization, Cold Pressing & Bottling',
    iconName: 'CupSoda',
    category: 'Beverages & Food Processing',
    businessName: 'Akagera Fresh Fruit Juice & Bottling Co.',
    attentionHeadline: 'Juice Pasteurization Scheduled · 2 Cold Storage Batches Fresh',
    units: ['L', 'ml', 'kg', 'pcs', 'box'],
    categories: ['Fresh Fruits & Produce', 'Packaging & Bottles', 'Additives & Sugar', 'Bottled Juices', 'Natural Syrups'],
    rawMaterials: [
      {
        id: 'MAT-FRU-01',
        name: 'Fresh Passion Fruit (Grade A Ripe)',
        category: 'Fresh Fruits & Produce',
        unit: 'kg',
        currentStock: 150,
        minimumStockLevel: 60,
        purchasePriceRWF: 1400,
        supplier: 'Gakenke Organic Farmers Cooperative',
        batchCode: 'LOT-PAS-101',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-BOT-02',
        name: '500ml Clear Food-Grade PET Bottles',
        category: 'Packaging & Bottles',
        unit: 'pcs',
        currentStock: 600,
        minimumStockLevel: 250,
        purchasePriceRWF: 120,
        supplier: 'Rwanda Plastics & Packaging Ltd',
        batchCode: 'LOT-BOT-202',
        hasExpiry: false
      },
      {
        id: 'MAT-CAP-03',
        name: 'Tamper-Evident Screw Caps 28mm (Yellow)',
        category: 'Packaging & Bottles',
        unit: 'pcs',
        currentStock: 800,
        minimumStockLevel: 300,
        purchasePriceRWF: 35,
        supplier: 'Rwanda Plastics & Packaging Ltd',
        batchCode: 'LOT-CAP-303',
        hasExpiry: false
      },
      {
        id: 'MAT-SUG-04',
        name: 'Refined White Cane Sugar',
        category: 'Additives & Sugar',
        unit: 'kg',
        currentStock: 80,
        minimumStockLevel: 30,
        purchasePriceRWF: 1800,
        supplier: 'Kabuye Sugar Works Ltd',
        batchCode: 'LOT-SUG-404',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-LBL-05',
        name: 'Waterproof Glossy Brand Labels 500ml',
        category: 'Packaging & Bottles',
        unit: 'pcs',
        currentStock: 750,
        minimumStockLevel: 250,
        purchasePriceRWF: 75,
        supplier: 'Kigali Modern Prints Ltd',
        batchCode: 'LOT-LBL-505',
        hasExpiry: false
      }
    ],
    finishedGoods: [
      {
        id: 'PROD-JUC-01',
        name: 'Pure Passion Fruit Juice 500ml Bottle',
        title: 'Pure Passion Fruit Juice 500ml Bottle',
        category: 'Bottled Juices',
        unit: 'pcs',
        currentStock: 140,
        stock: 140,
        minimumStockLevel: 40,
        costPerUnitRWF: 818,
        sellingPriceRWF: 1200,
        sellingPrice: 1200,
        shelfLifeDays: 30,
        bestBeforeDate: new Date(Date.now() + 28 * 86400000).toISOString().slice(0, 10),
        batchCode: 'RUN-JUC-01',
        sku: 'BEV-PAS-500'
      },
      {
        id: 'PROD-GIN-02',
        name: 'Ginger Passion Natural Booster 500ml',
        title: 'Ginger Passion Natural Booster 500ml',
        category: 'Bottled Juices',
        unit: 'pcs',
        currentStock: 90,
        stock: 90,
        minimumStockLevel: 30,
        costPerUnitRWF: 940,
        sellingPriceRWF: 1500,
        sellingPrice: 1500,
        shelfLifeDays: 21,
        bestBeforeDate: new Date(Date.now() + 19 * 86400000).toISOString().slice(0, 10),
        batchCode: 'RUN-GIN-02',
        sku: 'BEV-GIN-500'
      }
    ],
    recipes: [
      {
        id: 'REC-JUC-01',
        name: 'Pure Passion 100-Bottle Commercial Run',
        productId: 'PROD-JUC-01',
        productName: 'Pure Passion Fruit Juice 500ml Bottle',
        yieldQuantity: 100,
        unit: 'pcs',
        wastageAllowancePct: 2,
        targetMarginPct: 32,
        costPerUnitRWF: 818,
        ingredients: [
          { materialId: 'MAT-FRU-01', materialName: 'Fresh Passion Fruit (Grade A Ripe)', quantity: 30, unit: 'kg', unitCost: 1400 },
          { materialId: 'MAT-SUG-04', materialName: 'Refined White Cane Sugar', quantity: 6, unit: 'kg', unitCost: 1800 },
          { materialId: 'MAT-BOT-02', materialName: '500ml Clear Food-Grade PET Bottles', quantity: 100, unit: 'pcs', unitCost: 120 },
          { materialId: 'MAT-CAP-03', materialName: 'Tamper-Evident Screw Caps 28mm (Yellow)', quantity: 100, unit: 'pcs', unitCost: 35 },
          { materialId: 'MAT-LBL-05', materialName: 'Waterproof Glossy Brand Labels 500ml', quantity: 100, unit: 'pcs', unitCost: 75 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Pasteurization Power & Water Utilities', amount: 6000 }
        ]
      }
    ],
    productionBatches: [
      {
        id: 'RUN-JUC-301',
        batchCode: 'RUN-301',
        recipeId: 'REC-JUC-01',
        productId: 'PROD-JUC-01',
        productName: 'Pure Passion Fruit Juice 500ml Bottle',
        plannedQuantity: 100,
        actualQuantity: 98,
        wasteQuantity: 2,
        unit: 'pcs',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Emmanuel Mugenzi (Beverage Tech)',
        plannedCostPerUnitRWF: 818,
        actualCostPerUnitRWF: 834.7,
        isOverPlan: false
      }
    ],
    customers: [
      { id: 'CUST-01', name: 'Simba Supermarket (Kigali City Market)', phone: '+250 788 901 234', email: 'orders@simbasupermarket.rw', balanceRWF: 65000, category: 'Retail Chain' },
      { id: 'CUST-02', name: 'Bourbon Coffee Airport Lounge', phone: '+250 788 012 345', email: 'supplies@bourboncoffee.rw', balanceRWF: 0, category: 'Café Chain' }
    ],
    suppliers: [
      { id: 'SUPP-01', name: 'Gakenke Organic Farmers Cooperative', phone: '+250 788 123 789', email: 'gakenkefarmers@coop.rw', owedRWF: 28000, category: 'Fruit Producer' },
      { id: 'SUPP-02', name: 'Rwanda Plastics & Packaging Ltd', phone: '+250 788 234 890', email: 'sales@rwandaplastics.rw', owedRWF: 0, category: 'PET Bottles' }
    ]
  },

  bakery: {
    id: 'bakery',
    name: 'Bakery & Confectionery',
    tagline: 'Artisan Breads, Brioche, Cakes & Pastries',
    iconName: 'UtensilsCrossed',
    category: 'Bakery & Confectionery',
    businessName: 'Kigali Artisan Craft Bakery',
    attentionHeadline: 'Morning Bake Complete · Oven Yield: 98.5%',
    units: ['kg', 'g', 'pcs', 'L', 'bag'],
    categories: ['Flour & Grains', 'Yeast & Leavening', 'Fats & Dairy', 'Daily Breads', 'Brioche & Rolls', 'Pastries & Croissants'],
    rawMaterials: [
      {
        id: 'MAT-B-FLOUR',
        name: 'Premium High-Gluten Wheat Flour',
        category: 'Flour & Grains',
        unit: 'kg',
        currentStock: 120,
        minimumStockLevel: 50,
        purchasePriceRWF: 950,
        supplier: 'Bakhresa Grain Milling Ltd',
        batchCode: 'LOT-FL-101',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-B-YEAST',
        name: 'Instant Dry Baker\'s Yeast (500g)',
        category: 'Yeast & Leavening',
        unit: 'kg',
        currentStock: 8,
        minimumStockLevel: 3,
        purchasePriceRWF: 6500,
        supplier: 'Kigali Baking Ingredients Depot',
        batchCode: 'LOT-YS-202',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-B-BUTR',
        name: 'Pure Unsalted Creamery Butter',
        category: 'Fats & Dairy',
        unit: 'kg',
        currentStock: 16,
        minimumStockLevel: 6,
        purchasePriceRWF: 5800,
        supplier: 'Inyange Dairy Ltd',
        batchCode: 'LOT-BT-303',
        hasExpiry: true,
        expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
      },
      {
        id: 'MAT-B-BAGS',
        name: 'Micro-Perforated Bread Packaging Bags',
        category: 'Flour & Grains',
        unit: 'pcs',
        currentStock: 450,
        minimumStockLevel: 150,
        purchasePriceRWF: 45,
        supplier: 'Kigali Plastics Ltd',
        batchCode: 'LOT-BG-404',
        hasExpiry: false
      }
    ],
    finishedGoods: [
      {
        id: 'PROD-B-BREAD',
        name: 'Standard Sliced Sandwich Loaf (800g)',
        title: 'Standard Sliced Sandwich Loaf (800g)',
        category: 'Daily Breads',
        unit: 'pcs',
        currentStock: 85,
        stock: 85,
        minimumStockLevel: 25,
        costPerUnitRWF: 980,
        sellingPriceRWF: 1500,
        sellingPrice: 1500,
        shelfLifeDays: 4,
        bestBeforeDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        batchCode: 'RUN-BRD-01',
        sku: 'BAK-BRD-800'
      },
      {
        id: 'PROD-B-BRIO',
        name: 'French Butter Brioche Loaf (500g)',
        title: 'French Butter Brioche Loaf (500g)',
        category: 'Brioche & Rolls',
        unit: 'pcs',
        currentStock: 35,
        stock: 35,
        minimumStockLevel: 12,
        costPerUnitRWF: 1620,
        sellingPriceRWF: 2500,
        sellingPrice: 2500,
        shelfLifeDays: 3,
        bestBeforeDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        batchCode: 'RUN-BRI-02',
        sku: 'BAK-BRI-500'
      }
    ],
    recipes: [
      {
        id: 'REC-B-BREAD-50',
        name: 'Standard Sandwich Bread (50 Loaves Batch)',
        productId: 'PROD-B-BREAD',
        productName: 'Standard Sliced Sandwich Loaf (800g)',
        yieldQuantity: 50,
        unit: 'pcs',
        wastageAllowancePct: 2,
        targetMarginPct: 35,
        costPerUnitRWF: 980,
        ingredients: [
          { materialId: 'MAT-B-FLOUR', materialName: 'Premium High-Gluten Wheat Flour', quantity: 35, unit: 'kg', unitCost: 950 },
          { materialId: 'MAT-B-YEAST', materialName: 'Instant Dry Baker\'s Yeast (500g)', quantity: 0.5, unit: 'kg', unitCost: 6500 },
          { materialId: 'MAT-B-BUTR', materialName: 'Pure Unsalted Creamery Butter', quantity: 1.5, unit: 'kg', unitCost: 5800 },
          { materialId: 'MAT-B-BAGS', materialName: 'Micro-Perforated Bread Packaging Bags', quantity: 50, unit: 'pcs', unitCost: 45 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Deck Oven Gas & Baker Shift Labor', amount: 6500 }
        ]
      }
    ],
    productionBatches: [
      {
        id: 'RUN-BRD-401',
        batchCode: 'RUN-401',
        recipeId: 'REC-B-BREAD-50',
        productId: 'PROD-B-BREAD',
        productName: 'Standard Sliced Sandwich Loaf (800g)',
        plannedQuantity: 50,
        actualQuantity: 49,
        wasteQuantity: 1,
        unit: 'pcs',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Jean-Pierre Mugisha (Head Baker)',
        plannedCostPerUnitRWF: 980,
        actualCostPerUnitRWF: 995,
        isOverPlan: false
      }
    ],
    customers: [
      { id: 'CUST-01', name: 'Kigali Supermarket Express', phone: '+250 788 345 678', email: 'orders@kigaliexpress.rw', balanceRWF: 32000, category: 'Wholesale Client' },
      { id: 'CUST-02', name: 'Café Neo Kiyovu', phone: '+250 788 456 789', email: 'kiyovu@cafeneo.rw', balanceRWF: 0, category: 'Coffee Shop' }
    ],
    suppliers: [
      { id: 'SUPP-01', name: 'Bakhresa Grain Milling Ltd', phone: '+250 788 567 890', email: 'flour@bakhresa.rw', owedRWF: 45000, category: 'Flour Mill' },
      { id: 'SUPP-02', name: 'Inyange Dairy Ltd', phone: '+250 788 678 901', email: 'dairy@inyange.rw', owedRWF: 0, category: 'Dairy & Butter' }
    ]
  },

  metalwork: {
    id: 'metalwork',
    name: 'Welding & Metal Fabrication',
    tagline: 'Gates, Grills, Structural Steel, Tanks & Metal Enclosures',
    iconName: 'Wrench',
    category: 'Metal Fabrication',
    businessName: 'Gikondo Precision Steel & Welding Works',
    attentionHeadline: 'Metalwork Yard Active · 2 Sliding Security Gates in Build',
    units: ['m', 'pcs', 'kg', 'sheet', 'box'],
    categories: ['Steel Sections & Tubes', 'Welding Consumables', 'Finishing & Primers', 'Security Gates', 'Window Grills', 'Structural Stands'],
    rawMaterials: [
      {
        id: 'MAT-STL-01',
        name: 'Square Hollow Steel Tube 40x40x2mm',
        category: 'Steel Sections & Tubes',
        unit: 'm',
        currentStock: 72,
        minimumStockLevel: 24,
        purchasePriceRWF: 3800,
        supplier: 'Gikondo Steel Mart Ltd',
        batchCode: 'LOT-STL-101',
        hasExpiry: false
      },
      {
        id: 'MAT-ANG-02',
        name: 'Steel Angle Iron 30x30x3mm',
        category: 'Steel Sections & Tubes',
        unit: 'm',
        currentStock: 48,
        minimumStockLevel: 18,
        purchasePriceRWF: 2900,
        supplier: 'Gikondo Steel Mart Ltd',
        batchCode: 'LOT-ANG-202',
        hasExpiry: false
      },
      {
        id: 'MAT-ROD-03',
        name: 'E6013 Welding Electrodes / Rods (5kg Pack)',
        category: 'Welding Consumables',
        unit: 'pcs',
        currentStock: 12,
        minimumStockLevel: 4,
        purchasePriceRWF: 14000,
        supplier: 'Kigali Industrial Hardware',
        batchCode: 'LOT-ROD-303',
        hasExpiry: false
      },
      {
        id: 'MAT-PRM-04',
        name: 'Anti-Rust Red Oxide Metal Primer (4L)',
        category: 'Finishing & Primers',
        unit: 'pcs',
        currentStock: 10,
        minimumStockLevel: 3,
        purchasePriceRWF: 12500,
        supplier: 'Sadolin Paints Kigali',
        batchCode: 'LOT-PRM-404',
        hasExpiry: false
      },
      {
        id: 'MAT-HNG-05',
        name: 'Heavy Duty Steel Gate Rollers & Hinges',
        category: 'Steel Sections & Tubes',
        unit: 'pcs',
        currentStock: 16,
        minimumStockLevel: 6,
        purchasePriceRWF: 3500,
        supplier: 'Kigali Industrial Hardware',
        batchCode: 'LOT-HNG-505',
        hasExpiry: false
      }
    ],
    finishedGoods: [
      {
        id: 'PROD-GAT-01',
        name: 'Sliding Security Gate (4m x 2.2m)',
        title: 'Sliding Security Gate (4m x 2.2m)',
        category: 'Security Gates',
        unit: 'pcs',
        currentStock: 2,
        stock: 2,
        minimumStockLevel: 1,
        costPerUnitRWF: 344100,
        sellingPriceRWF: 520000,
        sellingPrice: 520000,
        shelfLifeDays: null,
        batchCode: 'RUN-GAT-01',
        sku: 'MTL-GAT-04M'
      },
      {
        id: 'PROD-GRL-02',
        name: 'Burglar-Proof Window Grill (1.5m x 1.2m)',
        title: 'Burglar-Proof Window Grill (1.5m x 1.2m)',
        category: 'Window Grills',
        unit: 'pcs',
        currentStock: 6,
        stock: 6,
        minimumStockLevel: 2,
        costPerUnitRWF: 28500,
        sellingPriceRWF: 48000,
        sellingPrice: 48000,
        shelfLifeDays: null,
        batchCode: 'RUN-GRL-02',
        sku: 'MTL-GRL-15M'
      }
    ],
    recipes: [
      {
        id: 'REC-GAT-01',
        name: 'Sliding Security Gate Cutting & Welding',
        productId: 'PROD-GAT-01',
        productName: 'Sliding Security Gate (4m x 2.2m)',
        yieldQuantity: 1,
        unit: 'pcs',
        wastageAllowancePct: 3,
        targetMarginPct: 34,
        costPerUnitRWF: 344100,
        ingredients: [
          { materialId: 'MAT-STL-01', materialName: 'Square Hollow Steel Tube 40x40x2mm', quantity: 48, unit: 'm', unitCost: 3800 },
          { materialId: 'MAT-ANG-02', materialName: 'Steel Angle Iron 30x30x3mm', quantity: 18, unit: 'm', unitCost: 2900 },
          { materialId: 'MAT-ROD-03', materialName: 'E6013 Welding Electrodes / Rods (5kg Pack)', quantity: 2, unit: 'pcs', unitCost: 14000 },
          { materialId: 'MAT-PRM-04', materialName: 'Anti-Rust Red Oxide Metal Primer (4L)', quantity: 1, unit: 'pcs', unitCost: 12500 },
          { materialId: 'MAT-HNG-05', materialName: 'Heavy Duty Steel Gate Rollers & Hinges', quantity: 2, unit: 'pcs', unitCost: 3500 }
        ],
        otherCosts: [
          { id: 'cost-1', name: 'Master Welder Cutting, Grinding & Spray Labor', amount: 55000 }
        ]
      }
    ],
    productionBatches: [
      {
        id: 'RUN-GAT-501',
        batchCode: 'RUN-501',
        recipeId: 'REC-GAT-01',
        productId: 'PROD-GAT-01',
        productName: 'Sliding Security Gate (4m x 2.2m)',
        plannedQuantity: 1,
        actualQuantity: 1,
        wasteQuantity: 0,
        unit: 'pcs',
        status: 'Completed',
        plannedDate: new Date().toISOString().slice(0, 10),
        completionDate: new Date().toISOString().slice(0, 10),
        responsibleEmployee: 'Fabrice Nkurunziza (Master Welder)',
        plannedCostPerUnitRWF: 344100,
        actualCostPerUnitRWF: 344100,
        isOverPlan: false
      }
    ],
    customers: [
      { id: 'CUST-01', name: 'Horizon Construction Co. Ltd', phone: '+250 788 789 123', email: 'procurement@horizon.rw', balanceRWF: 250000, category: 'General Contractor' },
      { id: 'CUST-02', name: 'Kicukiro Residential Villa Project', phone: '+250 788 890 234', email: 'villa.site@gmail.com', balanceRWF: 0, category: 'Private Builder' }
    ],
    suppliers: [
      { id: 'SUPP-01', name: 'Gikondo Steel Mart Ltd', phone: '+250 788 901 345', email: 'sales@gikondosteel.rw', owedRWF: 120000, category: 'Steel Wholesaler' },
      { id: 'SUPP-02', name: 'Kigali Industrial Hardware', phone: '+250 788 012 456', email: 'orders@kigalihardware.rw', owedRWF: 0, category: 'Hardware Importer' }
    ]
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
