/**
 * Default Seed Data for Make & Sell Architecture
 * Supports multi-trade manufacturing:
 * - Garments & Tailoring workshops
 * - Furniture & Carpentry studios
 * - Food processing & Beverage producers
 * - Bakeries & Confectioneries
 */

export const DEFAULT_RAW_MATERIALS = [
  // --- Textiles & Tailoring Inputs ---
  {
    id: 'MAT-FABRIC-KITENGE',
    name: 'African Kitenge Cotton Print Fabric',
    category: 'Textiles & Fabrics',
    unit: 'm',
    packageSize: 6, // 6-meter rolls
    purchasePriceRWF: 3500, // per meter
    currentStock: 75,
    minimumStockLevel: 25,
    supplier: 'Utexrwa Textile Mills Ltd',
    supplierPhone: '+250 788 123 789',
    description: '100% combed cotton high-density African wax print fabric.'
  },
  {
    id: 'MAT-THREAD-POLY',
    name: 'Spun Polyester Sewing Thread (Spool)',
    category: 'Tailoring Notions',
    unit: 'roll',
    packageSize: 10,
    purchasePriceRWF: 800,
    currentStock: 30,
    minimumStockLevel: 10,
    supplier: 'Kigali Haberdashery Stores',
    supplierPhone: '+250 788 444 321',
    description: 'Heavy-duty 40/2 polyester machine sewing thread.'
  },
  {
    id: 'MAT-ZIPPER-MET',
    name: 'YKK Brass Metal Dress Zippers (40cm)',
    category: 'Tailoring Notions',
    unit: 'pcs',
    packageSize: 50,
    purchasePriceRWF: 500,
    currentStock: 65,
    minimumStockLevel: 20,
    supplier: 'Kigali Haberdashery Stores',
    supplierPhone: '+250 788 444 321',
    description: 'Heavy duty concealed brass metal teeth zippers.'
  },

  // --- Furniture & Carpentry Inputs ---
  {
    id: 'MAT-TIMBER-MAH',
    name: 'Hardwood Mahogany Planed Timber',
    category: 'Lumber & Timber',
    unit: 'm',
    packageSize: 10,
    purchasePriceRWF: 4200,
    currentStock: 90,
    minimumStockLevel: 30,
    supplier: 'Gikondo Timber Depots Ltd',
    supplierPhone: '+250 788 667 890',
    description: 'Kiln-dried furniture-grade solid mahogany boards.'
  },
  {
    id: 'MAT-VARNISH',
    name: 'Clear Polyurethane Gloss Wood Varnish',
    category: 'Finishes & Solvents',
    unit: 'L',
    packageSize: 5,
    purchasePriceRWF: 8500,
    currentStock: 20,
    minimumStockLevel: 5,
    supplier: 'Sadolin Paints Rwanda',
    supplierPhone: '+250 788 901 234',
    description: 'Scratch-resistant gloss polyurethane coat for tables.'
  },

  // --- Beverage & Food Processing Inputs ---
  {
    id: 'MAT-FRUIT-PASSION',
    name: 'Fresh Organic Passion Fruits',
    category: 'Fresh Produce',
    unit: 'kg',
    packageSize: 50,
    purchasePriceRWF: 1200,
    currentStock: 140,
    minimumStockLevel: 40,
    supplier: 'Musanze Agro Produce Cooperative',
    supplierPhone: '+250 788 332 110',
    description: 'Ripe yellow and purple passion fruits for juicing.'
  },
  {
    id: 'MAT-BOTTLES-500',
    name: '500ml PET Juice Bottles with Tamper Caps',
    category: 'Packaging',
    unit: 'pcs',
    packageSize: 200,
    purchasePriceRWF: 120,
    currentStock: 600,
    minimumStockLevel: 200,
    supplier: 'Rwanda PolyPack Ltd',
    supplierPhone: '+250 788 776 543',
    description: 'Food-grade transparent PET bottles for juice bottling.'
  },

  // --- Bakery & Food Inputs ---
  {
    id: 'MAT-FLOUR',
    name: 'Azania Premium Wheat Flour',
    category: 'Grains & Flours',
    unit: 'kg',
    packageSize: 50, // 50kg sacks
    purchasePriceRWF: 880, // 44,000 RWF per 50kg
    currentStock: 180, // in kg
    minimumStockLevel: 50,
    supplier: 'Bakhresa Grain Milling Rwanda',
    supplierPhone: '+250 788 412 881',
    description: 'High-grade baker wheat flour for loaves and baguettes.'
  },
  {
    id: 'MAT-SUGAR',
    name: 'White Granulated Sugar',
    category: 'Sweeteners',
    unit: 'kg',
    packageSize: 25,
    purchasePriceRWF: 1400,
    currentStock: 45,
    minimumStockLevel: 20,
    supplier: 'Kabuye Sugar Works Ltd',
    supplierPhone: '+250 788 300 120',
    description: 'Refined cane sugar for dough conditioning.'
  },
  {
    id: 'MAT-YEAST',
    name: 'Instant Dry Active Yeast',
    category: 'Leavening Agents',
    unit: 'kg',
    packageSize: 1, // 1kg tins
    purchasePriceRWF: 3200,
    currentStock: 8,
    minimumStockLevel: 3,
    supplier: 'Kigali Bakers Supplies',
    supplierPhone: '+250 788 991 223',
    description: 'High performance active instant dry yeast.'
  },
  {
    id: 'MAT-OIL',
    name: 'Pure Sunflower Cooking Oil',
    category: 'Oils & Fats',
    unit: 'L',
    packageSize: 20, // 20L Jerrycan
    purchasePriceRWF: 3000,
    currentStock: 35,
    minimumStockLevel: 15,
    supplier: 'Mount Meru Soyco Ltd',
    supplierPhone: '+250 788 554 112',
    description: 'Refined cooking oil for bread crumb softness.'
  },
  {
    id: 'MAT-SALT',
    name: 'Fine Iodized Table Salt',
    category: 'Seasonings',
    unit: 'kg',
    packageSize: 1,
    purchasePriceRWF: 600,
    currentStock: 15,
    minimumStockLevel: 5,
    supplier: 'Rwanda Salt Wholesalers',
    supplierPhone: '+250 788 777 400',
    description: 'Pure table salt for gluten strengthening and flavor.'
  },
  {
    id: 'MAT-BUTTER',
    name: 'Unsalted Dairy Butter Blocks',
    category: 'Dairy',
    unit: 'kg',
    packageSize: 25,
    purchasePriceRWF: 5800,
    currentStock: 12,
    minimumStockLevel: 10,
    supplier: 'Blessed Dairies Gicumbi',
    supplierPhone: '+250 788 620 900',
    description: 'Fresh dairy butter for croissants and premium brioche.'
  },
  {
    id: 'MAT-BOX',
    name: 'Eco-Kraft Pastry & Bread Boxes',
    category: 'Packaging',
    unit: 'pcs',
    packageSize: 100,
    purchasePriceRWF: 150,
    currentStock: 450,
    minimumStockLevel: 200,
    supplier: 'Kigali Print & Pack Ltd',
    supplierPhone: '+250 788 230 441',
    description: 'Food-safe biodegradable delivery boxes.'
  }
]

export const DEFAULT_FINISHED_PRODUCTS = [
  // --- Tailoring & Apparel ---
  {
    id: 'FP-DRESS-KITENGE',
    name: 'Tailored African Kitenge Flared Dress',
    category: 'Tailored Garments',
    unit: 'pcs',
    sellingPriceRWF: 25000,
    unitProductionCostRWF: 14200,
    currentStock: 18,
    minimumStock: 5,
    sku: 'GAR-DRS-01',
    recipeId: 'REC-DRESS-KITENGE',
    description: 'Custom tailored African print flare dress.'
  },
  {
    id: 'FP-SHIRT-MENS',
    name: "Men's Custom Fitted Long-Sleeve Shirt",
    category: 'Tailored Garments',
    unit: 'pcs',
    sellingPriceRWF: 18000,
    unitProductionCostRWF: 9800,
    currentStock: 12,
    minimumStock: 4,
    sku: 'GAR-SHT-02',
    recipeId: 'REC-SHIRT-MENS',
    description: 'Modern cut tailored long-sleeve cotton shirt.'
  },

  // --- Furniture & Woodworking ---
  {
    id: 'FP-TABLE-DINING',
    name: 'Handcrafted 6-Seater Mahogany Dining Table',
    category: 'Furniture',
    unit: 'pcs',
    sellingPriceRWF: 180000,
    unitProductionCostRWF: 98000,
    currentStock: 4,
    minimumStock: 2,
    sku: 'FUR-TBL-06',
    recipeId: 'REC-TABLE-DINING',
    description: 'Solid hardwood polished dining table.'
  },
  {
    id: 'FP-CHAIR-OFFICE',
    name: 'Ergonomic Hardwood Office Chair',
    category: 'Furniture',
    unit: 'pcs',
    sellingPriceRWF: 45000,
    unitProductionCostRWF: 24000,
    currentStock: 8,
    minimumStock: 3,
    sku: 'FUR-CHR-01',
    recipeId: 'REC-CHAIR-OFFICE',
    description: 'Contoured hardwood executive desk chair.'
  },

  // --- Beverages & Food Processing ---
  {
    id: 'FP-JUICE-PASSION',
    name: 'Pure Passion Fruit Juice (500ml Bottle)',
    category: 'Beverages',
    unit: 'bottle',
    sellingPriceRWF: 1000,
    unitProductionCostRWF: 480,
    currentStock: 120,
    minimumStock: 30,
    sku: 'BEV-JUC-500',
    recipeId: 'REC-JUICE-100',
    description: 'Chilled 100% natural passion fruit juice.'
  },

  // --- Bakery Goods ---
  {
    id: 'FP-BREAD-01',
    name: 'Golden Sliced Bread (Standard 800g)',
    category: 'Daily Bread',
    unit: 'pcs',
    sellingPriceRWF: 1400,
    unitProductionCostRWF: 980,
    currentStock: 85,
    minimumStock: 20,
    sku: 'FP-BRD-800G',
    recipeId: 'REC-BREAD-100',
    description: 'Enriched soft white family sliced loaf.'
  },
  {
    id: 'FP-BRIOCHE-02',
    name: 'French Butter Brioche Loaf',
    category: 'Artisan Pastry',
    unit: 'pcs',
    sellingPriceRWF: 2500,
    unitProductionCostRWF: 1620,
    currentStock: 40,
    minimumStock: 15,
    sku: 'FP-BRI-500G',
    recipeId: 'REC-BRIOCHE-50',
    description: 'Rich egg and pure butter brioche bread.'
  },
  {
    id: 'FP-CROISSANT-03',
    name: 'Flaky Butter Croissants',
    category: 'Artisan Pastry',
    unit: 'pcs',
    sellingPriceRWF: 1200,
    unitProductionCostRWF: 750,
    currentStock: 60,
    minimumStock: 25,
    sku: 'FP-CRS-100P',
    recipeId: 'REC-CROISSANT-100',
    description: 'Hand-laminated flaky pure dairy butter croissants.'
  }
]

export const DEFAULT_RECIPES = [
  // --- Tailoring & Apparel BOM ---
  {
    id: 'REC-DRESS-KITENGE',
    name: 'Kitenge Flared Dress Formula',
    productId: 'FP-DRESS-KITENGE',
    productName: 'Tailored African Kitenge Flared Dress',
    yield: 1,
    unit: 'pcs',
    expectedWastePct: 3,
    laborCostRWF: 4000,
    overheadCostRWF: 1500,
    ingredients: [
      {
        materialId: 'MAT-FABRIC-KITENGE',
        name: 'African Kitenge Cotton Print Fabric',
        quantity: 3.5, // 3.5 meters
        unit: 'm',
        unitPriceRWF: 3500,
        packageSize: 6
      },
      {
        materialId: 'MAT-THREAD-POLY',
        name: 'Spun Polyester Sewing Thread (Spool)',
        quantity: 1,
        unit: 'roll',
        unitPriceRWF: 800,
        packageSize: 10
      },
      {
        materialId: 'MAT-ZIPPER-MET',
        name: 'YKK Brass Metal Dress Zippers (40cm)',
        quantity: 1,
        unit: 'pcs',
        unitPriceRWF: 500,
        packageSize: 50
      }
    ]
  },

  // --- Furniture & Carpentry BOM ---
  {
    id: 'REC-TABLE-DINING',
    name: '6-Seater Mahogany Dining Table Formula',
    productId: 'FP-TABLE-DINING',
    productName: 'Handcrafted 6-Seater Mahogany Dining Table',
    yield: 1,
    unit: 'pcs',
    expectedWastePct: 5,
    laborCostRWF: 25000,
    overheadCostRWF: 12000,
    ingredients: [
      {
        materialId: 'MAT-TIMBER-MAH',
        name: 'Hardwood Mahogany Planed Timber',
        quantity: 14, // 14 meters
        unit: 'm',
        unitPriceRWF: 4200,
        packageSize: 10
      },
      {
        materialId: 'MAT-VARNISH',
        name: 'Clear Polyurethane Gloss Wood Varnish',
        quantity: 2, // 2 Liters
        unit: 'L',
        unitPriceRWF: 8500,
        packageSize: 5
      }
    ]
  },

  // --- Beverage / Juicing BOM ---
  {
    id: 'REC-JUICE-100',
    name: 'Natural Passion Juice Batch (100 Bottles)',
    productId: 'FP-JUICE-PASSION',
    productName: 'Pure Passion Fruit Juice (500ml Bottle)',
    yield: 100,
    unit: 'bottle',
    expectedWastePct: 2,
    laborCostRWF: 5000,
    overheadCostRWF: 3000,
    ingredients: [
      {
        materialId: 'MAT-FRUIT-PASSION',
        name: 'Fresh Organic Passion Fruits',
        quantity: 25, // 25 kg
        unit: 'kg',
        unitPriceRWF: 1200,
        packageSize: 50
      },
      {
        materialId: 'MAT-BOTTLES-500',
        name: '500ml PET Juice Bottles with Tamper Caps',
        quantity: 100,
        unit: 'pcs',
        unitPriceRWF: 120,
        packageSize: 200
      },
      {
        materialId: 'MAT-SUGAR',
        name: 'White Granulated Sugar',
        quantity: 4,
        unit: 'kg',
        unitPriceRWF: 1400,
        packageSize: 25
      }
    ]
  },

  // --- Bakery BOM ---
  {
    id: 'REC-BREAD-100',
    name: 'Standard Bread Recipe (100 Loaves)',
    productId: 'FP-BREAD-01',
    productName: 'Golden Sliced Bread (Standard 800g)',
    yield: 100, // 100 loaves yield per Part 7 of specification
    unit: 'pcs',
    expectedWastePct: 2,
    laborCostRWF: 15000,
    overheadCostRWF: 10000,
    ingredients: [
      {
        materialId: 'MAT-FLOUR',
        name: 'Azania Premium Wheat Flour',
        quantity: 20, // 20 kg
        unit: 'kg',
        unitPriceRWF: 880,
        packageSize: 50
      },
      {
        materialId: 'MAT-SUGAR',
        name: 'White Granulated Sugar',
        quantity: 3, // 3 kg
        unit: 'kg',
        unitPriceRWF: 1400,
        packageSize: 25
      },
      {
        materialId: 'MAT-YEAST',
        name: 'Instant Dry Active Yeast',
        quantity: 1, // 1 kg
        unit: 'kg',
        unitPriceRWF: 3200,
        packageSize: 1
      },
      {
        materialId: 'MAT-OIL',
        name: 'Pure Sunflower Cooking Oil',
        quantity: 2, // 2 Liters
        unit: 'L',
        unitPriceRWF: 3000,
        packageSize: 20
      },
      {
        materialId: 'MAT-SALT',
        name: 'Fine Iodized Table Salt',
        quantity: 0.5, // 0.5 kg
        unit: 'kg',
        unitPriceRWF: 600,
        packageSize: 1
      }
    ]
  },
  {
    id: 'REC-BRIOCHE-50',
    name: 'Artisan Butter Brioche Recipe (50 Loaves)',
    productId: 'FP-BRIOCHE-02',
    productName: 'French Butter Brioche Loaf',
    yield: 50,
    unit: 'pcs',
    expectedWastePct: 3,
    laborCostRWF: 12000,
    overheadCostRWF: 8000,
    ingredients: [
      {
        materialId: 'MAT-FLOUR',
        name: 'Azania Premium Wheat Flour',
        quantity: 15,
        unit: 'kg',
        unitPriceRWF: 880,
        packageSize: 50
      },
      {
        materialId: 'MAT-BUTTER',
        name: 'Unsalted Dairy Butter Blocks',
        quantity: 4,
        unit: 'kg',
        unitPriceRWF: 5800,
        packageSize: 25
      },
      {
        materialId: 'MAT-SUGAR',
        name: 'White Granulated Sugar',
        quantity: 2.5,
        unit: 'kg',
        unitPriceRWF: 1400,
        packageSize: 25
      },
      {
        materialId: 'MAT-YEAST',
        name: 'Instant Dry Active Yeast',
        quantity: 0.6,
        unit: 'kg',
        unitPriceRWF: 3200,
        packageSize: 1
      },
      {
        materialId: 'MAT-SALT',
        name: 'Fine Iodized Table Salt',
        quantity: 0.3,
        unit: 'kg',
        unitPriceRWF: 600,
        packageSize: 1
      }
    ]
  },
  {
    id: 'REC-CROISSANT-100',
    name: 'Flaky Croissants Recipe (100 Pcs)',
    productId: 'FP-CROISSANT-03',
    productName: 'Flaky Butter Croissants',
    yield: 100,
    unit: 'pcs',
    expectedWastePct: 4,
    laborCostRWF: 18000,
    overheadCostRWF: 9000,
    ingredients: [
      {
        materialId: 'MAT-FLOUR',
        name: 'Azania Premium Wheat Flour',
        quantity: 12,
        unit: 'kg',
        unitPriceRWF: 880,
        packageSize: 50
      },
      {
        materialId: 'MAT-BUTTER',
        name: 'Unsalted Dairy Butter Blocks',
        quantity: 6,
        unit: 'kg',
        unitPriceRWF: 5800,
        packageSize: 25
      },
      {
        materialId: 'MAT-SUGAR',
        name: 'White Granulated Sugar',
        quantity: 1.5,
        unit: 'kg',
        unitPriceRWF: 1400,
        packageSize: 25
      },
      {
        materialId: 'MAT-YEAST',
        name: 'Instant Dry Active Yeast',
        quantity: 0.5,
        unit: 'kg',
        unitPriceRWF: 3200,
        packageSize: 1
      },
      {
        materialId: 'MAT-SALT',
        name: 'Fine Iodized Table Salt',
        quantity: 0.25,
        unit: 'kg',
        unitPriceRWF: 600,
        packageSize: 1
      }
    ]
  }
]

export const DEFAULT_PRODUCTION_ORDERS = [
  {
    id: 'PO-2026-201',
    productId: 'FP-DRESS-KITENGE',
    productName: 'Tailored African Kitenge Flared Dress',
    recipeId: 'REC-DRESS-KITENGE',
    plannedQuantity: 5,
    actualQuantity: 5,
    status: 'Completed',
    plannedDate: '2026-10-28',
    completionDate: '2026-10-29',
    responsibleEmployee: 'Faustin Nkurunziza',
    totalProductionCostRWF: 71000,
    unitCostRWF: 14200,
    wasteQuantity: 0,
    notes: 'Custom boutique order for Kigali Cultural Ensemble.'
  },
  {
    id: 'PO-2026-301',
    productId: 'FP-TABLE-DINING',
    productName: 'Handcrafted 6-Seater Mahogany Dining Table',
    recipeId: 'REC-TABLE-DINING',
    plannedQuantity: 2,
    actualQuantity: 2,
    status: 'Completed',
    plannedDate: '2026-10-27',
    completionDate: '2026-10-30',
    responsibleEmployee: 'Emmanuel Bizimana',
    totalProductionCostRWF: 196000,
    unitCostRWF: 98000,
    wasteQuantity: 0,
    notes: 'Solid mahogany dining suite for residential client.'
  },
  {
    id: 'PO-2026-401',
    productId: 'FP-JUICE-PASSION',
    productName: 'Pure Passion Fruit Juice (500ml Bottle)',
    recipeId: 'REC-JUICE-100',
    plannedQuantity: 100,
    actualQuantity: 98,
    status: 'Completed',
    plannedDate: '2026-11-02',
    completionDate: '2026-11-02',
    responsibleEmployee: 'Chantal Umutoni',
    totalProductionCostRWF: 47040,
    unitCostRWF: 480,
    wasteQuantity: 2,
    notes: 'Freshly bottled batch delivered to retail kiosks.'
  },
  {
    id: 'PO-2026-101',
    productId: 'FP-BREAD-01',
    productName: 'Golden Sliced Bread (Standard 800g)',
    recipeId: 'REC-BREAD-100',
    plannedQuantity: 200,
    actualQuantity: 200,
    status: 'Completed',
    plannedDate: '2026-10-30',
    completionDate: '2026-10-30',
    responsibleEmployee: 'Jean-Pierre Mugisha',
    totalProductionCostRWF: 196000,
    unitCostRWF: 980,
    wasteQuantity: 4,
    notes: 'Morning wholesale batch for supermarkets and delivery vans.'
  },
  {
    id: 'PO-2026-102',
    productId: 'FP-BRIOCHE-02',
    productName: 'French Butter Brioche Loaf',
    recipeId: 'REC-BRIOCHE-50',
    plannedQuantity: 50,
    actualQuantity: 48,
    status: 'In Progress',
    plannedDate: '2026-11-03',
    responsibleEmployee: 'Marie-Claire Uwera',
    totalProductionCostRWF: 81000,
    unitCostRWF: 1620,
    wasteQuantity: 2,
    notes: 'Second proofing and baking in progress.'
  },
  {
    id: 'PO-2026-103',
    productId: 'FP-CROISSANT-03',
    productName: 'Flaky Butter Croissants',
    recipeId: 'REC-CROISSANT-100',
    plannedQuantity: 100,
    actualQuantity: 0,
    status: 'Planned',
    plannedDate: '2026-11-04',
    responsibleEmployee: 'Jean-Pierre Mugisha',
    totalProductionCostRWF: 75000,
    unitCostRWF: 750,
    wasteQuantity: 0,
    notes: 'Scheduled for tomorrow early morning 5:00 AM lamination.'
  }
]

