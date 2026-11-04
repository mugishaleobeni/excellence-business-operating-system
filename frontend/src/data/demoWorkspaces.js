export const INITIAL_DEMO_WORKSPACES = {
  'make-and-sell': {
    architectureId: 'make-and-sell',
    ownerName: 'Eric Ndayisaba',
    businessName: 'Inyange Artisan Bakery & Roastery',
    email: 'eric@inyangebakery.rw',
    phone: '+250 788 301 120',
    location: 'Kigali, Nyarugenge',
    category: 'Bakery, Food Processing & Manufacturing',
    metrics: {
      spendableRWF: 4650000,
      monthlyRevenueRWF: 3420000,
      netProfitRWF: 1380000,
      stockValueRWF: 3890000,
      todayProfitRWF: 295000,
      todayMoneyInRWF: 690000,
      todayCostsRWF: 395000,
      owedToMeRWF: 640000,
      iOweSuppliersRWF: 520000,
      attentionHeadline: '1 Bakery Recipe Underpriced by 8% (Butter +18%)',
      survivalMonths: 6.5
    },
    records: {
      Production: [
        {
          id: 'PRD-101',
          title: 'Batch #408 · Brioche Loaves (120 units)',
          subPage: 'Batch Production Log',
          unitCostRWF: 920,
          sellingPriceRWF: 1500,
          quantity: 120,
          status: 'Healthy 38.6% Margin',
          date: '2026-10-30'
        },
        {
          id: 'PRD-102',
          title: 'Batch #409 · Wedding Tier Cake Order',
          subPage: 'Recipes & Unit Costs',
          unitCostRWF: 64000,
          sellingPriceRWF: 68000,
          quantity: 1,
          status: 'Alert: Underpriced (Butter +18%)',
          date: '2026-10-30'
        },
        {
          id: 'PRD-103',
          title: 'Batch #410 · Whole-Wheat Croissants (200 pcs)',
          subPage: 'Production Stages',
          unitCostRWF: 650,
          sellingPriceRWF: 1200,
          quantity: 200,
          status: 'Baking Stage · 45.8% Margin',
          date: '2026-10-29'
        }
      ],
      Inventory: [
        {
          id: 'INV-101',
          title: 'Azania Wheat Flour (50kg Sacks)',
          subPage: 'Raw Materials',
          unitCostRWF: 44000,
          sellingPriceRWF: 0,
          quantity: 18,
          status: 'Raw Material · In Stock',
          date: '2026-10-30'
        },
        {
          id: 'INV-102',
          title: 'Unsalted Dairy Butter Blocks (25kg)',
          subPage: 'Low Stock Alerts',
          unitCostRWF: 145000,
          sellingPriceRWF: 0,
          quantity: 3,
          status: 'Low Stock Alert (Reorder < 5)',
          date: '2026-10-30'
        },
        {
          id: 'INV-103',
          title: 'Packaged Brioche & Sourdough Loaves',
          subPage: 'Finished Products',
          unitCostRWF: 920,
          sellingPriceRWF: 1500,
          quantity: 95,
          status: 'Finished Goods Ready for Sale',
          date: '2026-10-30'
        }
      ],
      Sales: [
        {
          id: 'SAL-101',
          title: 'Simba Supermarket Morning Bread Delivery',
          subPage: 'Sales Overview',
          amountRWF: 420000,
          customer: 'Simba Supermarket Kimihurura',
          paymentMethod: 'MoMo Business',
          status: 'Paid · Delivered',
          date: '2026-10-30'
        },
        {
          id: 'SAL-102',
          title: 'Custom Corporate Conference Pastry Box (80 pax)',
          subPage: 'Custom & Bulk Orders',
          amountRWF: 270000,
          customer: 'BK Arena Events Team',
          paymentMethod: '50% Deposit (Bank)',
          status: 'Deposit Received (135,000 RWF)',
          date: '2026-10-30'
        }
      ],
      Purchases: [
        {
          id: 'PUR-101',
          title: '20 Sacks Wheat Flour + Yeast Delivery',
          subPage: 'Material Purchases',
          amountRWF: 880000,
          supplier: 'Bakhresa Grain Milling Rwanda',
          status: 'Paid via Bank Transfer',
          date: '2026-10-28'
        },
        {
          id: 'PUR-102',
          title: 'Eco-Kraft Bakery Packaging Boxes (2,000 pcs)',
          subPage: 'Supplier Balances',
          amountRWF: 340000,
          supplier: 'Kigali Print & Pack Ltd',
          status: 'Balance Due in 7 Days',
          date: '2026-10-29'
        }
      ],
      Customers: [
        {
          id: 'CUS-101',
          title: 'Simba Supermarket Kimihurura',
          subPage: 'Customer Directory',
          phone: '+250 788 112 334',
          balanceOwedRWF: 240000,
          status: 'Weekly Wholesale Account'
        },
        {
          id: 'CUS-102',
          title: 'Clarisse & Olivier Wedding Account',
          subPage: 'Order Deposits',
          phone: '+250 788 554 901',
          balanceOwedRWF: 180000,
          status: 'Deposit Paid · Balance on Delivery'
        }
      ],
      Categories: [
        { id: 'cat-bread', name: 'Bread', description: 'Standard loaves, baguettes, and sandwich rolls', status: 'Active' },
        { id: 'cat-cakes', name: 'Cakes', description: 'Celebration cakes, cupcakes, and muffins', status: 'Active' },
        { id: 'cat-pastries', name: 'Pastries', description: 'Croissants, brioches, and danishes', status: 'Active' },
        { id: 'cat-flour', name: 'Flour & Grains', description: 'Wheat flour, rye flour, cornmeal raw inputs', status: 'Active' },
        { id: 'cat-sweet', name: 'Sweeteners', description: 'White sugar, brown sugar, icing sugar', status: 'Active' },
        { id: 'cat-pack', name: 'Packaging', description: 'Bread bags, cake boxes, clips, labels', status: 'Active' }
      ]
    }
  },

  'buy-and-sell': {
    architectureId: 'buy-and-sell',
    ownerName: 'Jean-Paul Habimana',
    businessName: 'Kigali Prime Hardware & Mart',
    email: 'jp@kigaliprime.rw',
    phone: '+250 788 412 890',
    location: 'Kigali, Gasabo (Gisozi)',
    category: 'Retail & Wholesale Hardware Distribution',
    metrics: {
      spendableRWF: 5070000,
      monthlyRevenueRWF: 3280000,
      netProfitRWF: 1410000,
      stockValueRWF: 4380000,
      todayProfitRWF: 312500,
      todayMoneyInRWF: 750000,
      todayCostsRWF: 437500,
      owedToMeRWF: 780000,
      iOweSuppliersRWF: 650000,
      attentionHeadline: '4 Items Low Stock · 3 Dead Stock Items on Shelf',
      survivalMonths: 6.3
    },
    records: {
      Inventory: [
        {
          id: 'INV-201',
          title: 'Twyford Ceramic Floor Tiles (Box)',
          subPage: 'Products & Landed Cost',
          category: 'Flooring & Ceramics',
          sku: '6001421029794',
          barcode: '6001421029794',
          unit: 'box',
          unitCostRWF: 15200,
          purchasePriceRWF: 15200,
          sellingPriceRWF: 19500,
          expectedUnitProfitRWF: 4300,
          expectedMarginPct: 22,
          amountRWF: 936000,
          quantity: 48,
          lowStockAlert: 10,
          supplierName: 'Twyford Tile Factory Outlet',
          dateReceived: '2026-10-25',
          expiryDate: '',
          status: 'Active',
          date: '2026-10-30'
        },
        {
          id: 'INV-202',
          title: 'Sadolin WeatherGuard Paint 20L',
          subPage: 'Stock Levels',
          category: 'Paints & Finishes',
          sku: '6007812904321',
          barcode: '6007812904321',
          unit: 'bucket',
          unitCostRWF: 70500,
          purchasePriceRWF: 70500,
          sellingPriceRWF: 85000,
          expectedUnitProfitRWF: 14500,
          expectedMarginPct: 17,
          amountRWF: 340000,
          quantity: 4,
          lowStockAlert: 5,
          supplierName: 'Plascon & Sadolin Distributors',
          dateReceived: '2026-10-20',
          expiryDate: '2027-10-20',
          status: 'Low Stock Alert (< 5 buckets)',
          date: '2026-10-30'
        },
        {
          id: 'INV-203',
          title: 'Specialty Brass Chandelier #9',
          subPage: 'Best vs Slow Movers',
          category: 'Lighting & Fixtures',
          sku: '6003920194820',
          barcode: '6003920194820',
          unit: 'piece',
          unitCostRWF: 115000,
          purchasePriceRWF: 115000,
          sellingPriceRWF: 135000,
          expectedUnitProfitRWF: 20000,
          expectedMarginPct: 15,
          amountRWF: 405000,
          quantity: 3,
          lowStockAlert: 5,
          supplierName: 'Kigali Electro-Tech Wholesale Ltd',
          dateReceived: '2026-08-15',
          expiryDate: '',
          status: 'Dead Stock (62d on shelf · Money Sleeping)',
          date: '2026-10-15'
        },
        {
          id: 'INV-204',
          title: 'Schneider Electric 16A Circuit Breaker (Single Pole)',
          subPage: 'Stock Levels',
          category: 'Electrical Supplies',
          sku: '6004910283741',
          barcode: '6004910283741',
          unit: 'piece',
          unitCostRWF: 4200,
          purchasePriceRWF: 4200,
          sellingPriceRWF: 6500,
          expectedUnitProfitRWF: 2300,
          expectedMarginPct: 35,
          amountRWF: 8400,
          quantity: 2,
          lowStockAlert: 10,
          supplierName: 'Kigali Electro-Tech Wholesale Ltd',
          dateReceived: '2026-10-28',
          expiryDate: '',
          status: 'Low Stock Alert (< 10 pieces)',
          date: '2026-11-01'
        },
        {
          id: 'INV-205',
          title: 'Blue Triangle 32.5R Cement 50kg',
          subPage: 'Stock Levels',
          category: 'Masonry & Concrete',
          sku: '6008549102847',
          barcode: '6008549102847',
          unit: 'bag',
          unitCostRWF: 11200,
          purchasePriceRWF: 11200,
          sellingPriceRWF: 13000,
          expectedUnitProfitRWF: 1800,
          expectedMarginPct: 14,
          amountRWF: 33600,
          quantity: 3,
          lowStockAlert: 15,
          supplierName: 'Cimerwa Authorized Depot Kigali',
          dateReceived: '2026-10-22',
          expiryDate: '2026-11-20',
          status: 'Critical Low Stock (< 15 bags)',
          date: '2026-11-01'
        },
        {
          id: 'INV-206',
          title: 'Rapid Setting Epoxy Adhesive 500ml',
          subPage: 'Stock Levels',
          category: 'Hardware & Tools',
          sku: '6009812401923',
          barcode: '6009812401923',
          unit: 'can',
          unitCostRWF: 8500,
          purchasePriceRWF: 8500,
          sellingPriceRWF: 12000,
          expectedUnitProfitRWF: 3500,
          expectedMarginPct: 29,
          amountRWF: 51000,
          quantity: 6,
          lowStockAlert: 5,
          supplierName: 'Hardware Express Kigali Ltd',
          dateReceived: '2026-04-10',
          expiryDate: '2026-10-15',
          status: 'Expired (18d ago · Do Not Sell)',
          date: '2026-11-01'
        }
      ],
      Sales: [
        {
          id: 'SAL-201',
          title: 'Invoice #1042 · 25 Boxes Ceramic Tiles + Cement',
          subPage: 'Sales Overview',
          amountRWF: 485000,
          customer: 'Eng. Patrick Construction Site',
          paymentMethod: 'MTN MoMo Business',
          status: 'Paid in Full',
          date: '2026-10-30'
        },
        {
          id: 'SAL-202',
          title: 'Invoice #1043 · Plumbing Pipes & Fittings',
          subPage: 'All Sales',
          amountRWF: 265000,
          customer: 'Nyarutarama Villa Project',
          paymentMethod: 'Cash + Part Credit',
          status: '165,000 Paid · 100,000 Credit Book',
          date: '2026-10-30'
        }
      ],
      Purchases: [
        {
          id: 'PUR-201',
          title: 'Cimerwa Cement 50kg (100 Bags Restock)',
          productTitle: 'Cimerwa Cement 50kg',
          subPage: 'All Purchases',
          quantity: 100,
          unit: 'bag',
          unitCostRWF: 11800,
          amountRWF: 1180000,
          paidAmountRWF: 1180000,
          remainingAmountRWF: 0,
          supplier: 'Cimerwa Authorized Depot Kigali',
          supplierName: 'Cimerwa Authorized Depot Kigali',
          supplierPhone: '+250 788 554 221',
          supplierLocation: 'Gikondo Industrial Park, Kigali',
          paymentMethod: 'Bank Transfer (BK / BPR)',
          status: 'Paid in Full',
          date: '2026-10-28'
        },
        {
          id: 'PUR-202',
          title: 'Sadolin Paint Assorted Colors Restock (25 Buckets)',
          productTitle: 'Sadolin Paint Assorted Colors',
          subPage: 'All Purchases',
          quantity: 25,
          unit: 'bucket',
          unitCostRWF: 26000,
          amountRWF: 650000,
          paidAmountRWF: 250000,
          remainingAmountRWF: 400000,
          supplier: 'Plascon & Sadolin Distributors',
          supplierName: 'Plascon & Sadolin Distributors',
          supplierPhone: '+250 788 332 990',
          supplierLocation: 'Nyabugogo Commercial Center, Kigali',
          paymentMethod: 'Supplier Credit Account',
          status: 'Part-paid · 400,000 RWF Remaining',
          date: '2026-10-29'
        },
        {
          id: 'PUR-203',
          title: 'Electrical Copper Cables & Conduit Pipes Restock (40 Rolls)',
          productTitle: 'Electrical Copper Cables & Conduit Pipes',
          subPage: 'All Purchases',
          quantity: 40,
          unit: 'roll',
          unitCostRWF: 18500,
          amountRWF: 740000,
          paidAmountRWF: 0,
          remainingAmountRWF: 740000,
          supplier: 'Kigali Electro-Tech Wholesale Ltd',
          supplierName: 'Kigali Electro-Tech Wholesale Ltd',
          supplierPhone: '+250 788 776 543',
          supplierLocation: 'Muhima Quarter, Kigali',
          paymentMethod: 'Supplier Credit Account',
          status: 'Unpaid · 740,000 RWF Remaining',
          date: '2026-10-31'
        }
      ],
      Customers: [
        {
          id: 'CUS-201',
          title: 'Construction Client #04 (Eng. Bosco)',
          name: 'Construction Client #04 (Eng. Bosco)',
          subPage: 'Customer',
          phone: '+250 788 609 211',
          email: 'eng.bosco@kigaliconstruct.rw',
          balanceOwedRWF: 240000,
          preferredProducts: 'Twyford Ceramic Floor Tiles, Cimerwa Cement 50kg',
          category: 'Contractor / Wholesale',
          status: '16 Days Overdue · WhatsApp Reminder Ready',
          date: '2026-10-18'
        },
        {
          id: 'CUS-202',
          title: 'Nyarutarama Villa Project',
          name: 'Nyarutarama Villa Project',
          subPage: 'Customer',
          phone: '+250 788 390 118',
          email: 'villa.nyarutarama@gmail.com',
          balanceOwedRWF: 100000,
          preferredProducts: 'Specialty Brass Chandelier #9, LED Ceiling Panels',
          category: 'VIP Project',
          status: 'Active Credit · Due in 5 Days',
          date: '2026-10-25'
        },
        {
          id: 'CUS-203',
          title: 'Simba Supermarket Kimihurura',
          name: 'Simba Supermarket Kimihurura',
          subPage: 'Customer',
          phone: '+250 788 512 889',
          email: 'procurement@simbasupermarket.rw',
          balanceOwedRWF: 0,
          preferredProducts: 'Schneider Electric 32A MCB Breaker',
          category: 'Retail Store',
          status: 'Paid in Full · Good Standing',
          date: '2026-10-30'
        }
      ],
      Suppliers: [
        {
          id: 'SUP-201',
          title: 'Cimerwa Authorized Depot Kigali',
          name: 'Cimerwa Authorized Depot Kigali',
          subPage: 'All Suppliers',
          phone: '+250 788 334 112',
          location: 'Nyabugogo Commercial District, Kigali',
          email: 'depot.nyabugogo@cimerwa.rw',
          amountRWF: 0,
          balanceOwedRWF: 0,
          category: 'Building & Cement Supplies',
          status: 'Active · Zero Debt',
          date: '2026-10-15'
        },
        {
          id: 'SUP-202',
          title: 'Twyford Tile Factory Outlet',
          name: 'Twyford Tile Factory Outlet',
          subPage: 'All Suppliers',
          phone: '+250 788 554 998',
          location: 'Special Economic Zone, Masoro, Kigali',
          email: 'masoro.outlet@twyford.rw',
          amountRWF: 400000,
          balanceOwedRWF: 400000,
          category: 'Flooring & Ceramics',
          status: '400,000 RWF Owed · Supplier Credit',
          date: '2026-10-25'
        },
        {
          id: 'SUP-203',
          title: 'Kigali Electro-Tech Wholesale Ltd',
          name: 'Kigali Electro-Tech Wholesale Ltd',
          subPage: 'All Suppliers',
          phone: '+250 788 776 543',
          location: 'Muhima Quarter, Kigali',
          email: 'orders@electrotech.rw',
          amountRWF: 740000,
          balanceOwedRWF: 740000,
          category: 'Electrical & Lighting Supplies',
          status: '740,000 RWF Owed · Supplier Credit',
          date: '2026-10-31'
        }
      ]
    }
  },

  services: {
    architectureId: 'services',
    ownerName: 'Diane Mukamana',
    businessName: 'Lumina Aesthetics & Technical Studio',
    email: 'diane@luminastudio.rw',
    phone: '+250 788 741 500',
    location: 'Kigali, Kimihurura',
    category: 'Service-Based Bookings, Projects & Maintenance',
    metrics: {
      spendableRWF: 4290000,
      monthlyRevenueRWF: 2960000,
      netProfitRWF: 1580000,
      stockValueRWF: 1120000,
      todayProfitRWF: 284000,
      todayMoneyInRWF: 540000,
      todayCostsRWF: 256000,
      owedToMeRWF: 830000,
      iOweSuppliersRWF: 310000,
      attentionHeadline: '2 Client Milestone Balances Due · 3 Appointments Today',
      survivalMonths: 6.8
    },
    records: {
      Sales: [
        {
          id: 'SAL-301',
          title: 'Bridal Styling & Executive Spa Package (Client: Clarisse)',
          subPage: 'Bookings & Calendar',
          amountRWF: 180000,
          customer: 'Clarisse Uwimana',
          paymentMethod: '100k Deposit (MoMo)',
          status: 'Staff: Aline (15% Comm) · Balance: 80,000 RWF',
          date: '2026-10-30'
        },
        {
          id: 'SAL-302',
          title: 'Office Solar & Hybrid Inverter Installation Project',
          subPage: 'Jobs & Milestones',
          amountRWF: 2400000,
          customer: 'Remera Tech Hub Ltd',
          paymentMethod: 'Bank Milestone Transfer',
          status: 'Received 1.65M · Spent 1.2M · Cash Positive (+450k)',
          date: '2026-10-30'
        },
        {
          id: 'SAL-303',
          title: 'Full Diagnostics & Brake Overhaul (RAD 412B)',
          subPage: 'Service Catalogue',
          amountRWF: 95000,
          customer: 'Jean-Marie K.',
          paymentMethod: 'Cash in Hand',
          status: 'Technician: Eric · Paid in Full',
          date: '2026-10-30'
        }
      ],
      Inventory: [
        {
          id: 'INV-301',
          title: 'Professional Keratin & Organic Spa Treatment Kit',
          subPage: 'Service Supplies',
          unitCostRWF: 38000,
          sellingPriceRWF: 0,
          quantity: 14,
          status: '1.5 kits used today (Recorded per Job)',
          date: '2026-10-30'
        },
        {
          id: 'INV-302',
          title: 'Solar Charge Controllers & Lithium Breakers',
          subPage: 'Spare Parts & Consumables',
          unitCostRWF: 85000,
          sellingPriceRWF: 120000,
          quantity: 8,
          status: 'Allocated to Milestone 2 Jobs',
          date: '2026-10-30'
        }
      ],
      Purchases: [
        {
          id: 'PUR-301',
          title: 'Monthly Salon & Technical Consumables Restock',
          subPage: 'Supply Purchases',
          amountRWF: 420000,
          supplier: 'Kigali Pro Beauty & Tech Supply',
          status: 'Paid via MoMo',
          date: '2026-10-27'
        }
      ],
      Customers: [
        {
          id: 'CUS-301',
          title: 'Remera Tech Hub Ltd',
          subPage: 'Unpaid Balances',
          phone: '+250 788 220 900',
          balanceOwedRWF: 750000,
          status: 'Milestone 3 Final Handover Balance'
        },
        {
          id: 'CUS-302',
          title: 'Clarisse Uwimana',
          subPage: 'Client History',
          phone: '+250 788 912 440',
          balanceOwedRWF: 80000,
          status: 'Bridal Package Balance Due Saturday'
        }
      ]
    }
  },

  agriculture: {
    architectureId: 'agriculture',
    ownerName: 'Aline Uwase',
    businessName: 'Aguka Smart Pig & Feed Farm',
    email: 'aline@agukafarm.rw',
    phone: '+250 788 519 200',
    location: 'Bugesera, Nyamata',
    category: 'Livestock Breeding, Feed & Circular Agriculture',
    metrics: {
      spendableRWF: 5480000,
      monthlyRevenueRWF: 3650000,
      netProfitRWF: 1620000,
      stockValueRWF: 6150000,
      todayProfitRWF: 340000,
      todayMoneyInRWF: 820000,
      todayCostsRWF: 480000,
      owedToMeRWF: 590000,
      iOweSuppliersRWF: 410000,
      attentionHeadline: 'Tunga Feed runs out in 12.5 days (4 kg/day usage)',
      survivalMonths: 6.4
    },
    records: {
      Production: [
        {
          id: 'ANM-401',
          title: 'Landrace Breeding Boar #01 (Tag #BOAR-01)',
          subPage: 'Animal Register',
          category: 'Boar (Breeder)',
          unitCostRWF: 280000,
          amountRWF: 390000,
          quantity: 1,
          status: 'Active Breeder · 14 Mo (145 kg) · Health: Optimal',
          date: '2026-10-28'
        },
        {
          id: 'ANM-402',
          title: 'Large White Breeding Sow #04 (Tag #SOW-04)',
          subPage: 'Animal Register',
          category: 'Sow (Breeder)',
          unitCostRWF: 220000,
          amountRWF: 320000,
          quantity: 1,
          status: 'Gestating (Day 84 · Expected Farrowing Nov 15)',
          date: '2026-10-28'
        },
        {
          id: 'ANM-403',
          title: 'Landrace Replacement Gilts (Pen 2 Batch)',
          subPage: 'Animal Register',
          category: 'Gilt (Breeder)',
          unitCostRWF: 185000,
          amountRWF: 1110000,
          quantity: 6,
          status: '8.5 Months · 118 kg avg · Ready for Breeding',
          date: '2026-10-29'
        },
        {
          id: 'ANM-404',
          title: 'Weaner Piglets Batch #A3 (Litter of Sow #02)',
          subPage: 'Animal Register',
          category: 'Weaners',
          unitCostRWF: 45000,
          amountRWF: 540000,
          quantity: 12,
          status: 'Iron Given · 28 Days Old · Grower Feed',
          date: '2026-10-30'
        },
        {
          id: 'FLD-401',
          title: 'Plot A — Sweet Potato Vines (High-Protein Swine Feed)',
          subPage: 'Field Plots',
          category: 'Forage Crop',
          quantity: 1.5,
          amountRWF: 350000,
          status: 'Harvesting Active · 80 kg/day Harvested',
          date: '2026-10-25'
        },
        {
          id: 'FLD-402',
          title: 'Plot B — Yellow Feed Maize (Dry Grain Harvest)',
          subPage: 'Field Plots',
          category: 'Grain Crop',
          quantity: 2.0,
          amountRWF: 720000,
          status: 'Grain Filling · Harvest Due in 3 Weeks',
          date: '2026-10-26'
        }
      ],
      Inventory: [
        {
          id: 'INV-401',
          title: 'Tunga Balanced Pig Feed (50kg Sacks)',
          subPage: 'Farm Inputs',
          category: 'Animal Feed',
          sku: 'FEED-TNG-50',
          unitCostRWF: 35000,
          sellingPriceRWF: 0,
          quantity: 10,
          amountRWF: 350000,
          status: '520 kg in store · Lasts 18.5 Days (28 kg/day)',
          date: '2026-10-30'
        },
        {
          id: 'INV-402',
          title: 'Mineral & Breeder Vitamin Premix 10kg',
          subPage: 'Farm Inputs',
          category: 'Supplements',
          sku: 'PREMIX-BRD-10',
          unitCostRWF: 28000,
          quantity: 4,
          amountRWF: 112000,
          status: 'In Stock · 4 Buckets',
          date: '2026-10-29'
        },
        {
          id: 'INV-403',
          title: 'Organic Farm Compost & Bio-Slurry Sacks',
          subPage: 'Harvested Stock',
          category: 'Bio-Fertilizer',
          unitCostRWF: 4000,
          sellingPriceRWF: 12000,
          quantity: 85,
          amountRWF: 1020000,
          status: 'Cured & Packaged · Ready for Cooperative Sale',
          date: '2026-10-30'
        }
      ],
      Sales: [
        {
          id: 'SAL-401',
          title: '6 Finished Market Pigs Sold to Kigali Butcheries',
          subPage: 'Farm Sales',
          amountRWF: 990000,
          customer: 'Nyabugogo Prime Meat Supply',
          paymentMethod: 'Bank + MoMo',
          status: 'Paid in Full · Delivered (680 kg)',
          date: '2026-10-30'
        },
        {
          id: 'SAL-402',
          title: '2 Landrace Breeding Gilts Sold to Gatsibo Farmer',
          subPage: 'Farm Sales',
          amountRWF: 480000,
          customer: 'Gatsibo Modern Farm Cooperative',
          paymentMethod: 'Bank Transfer (BK)',
          status: 'Paid in Full · Tag #LR-15, #LR-16',
          date: '2026-10-29'
        }
      ],
      Purchases: [
        {
          id: 'PUR-401',
          title: '10 Sacks Tunga Feed + Mineral Premix & Vaccines',
          subPage: 'Feed & Input Orders',
          amountRWF: 410000,
          supplier: 'Gorilla Feed & AgroVet Bugesera',
          supplierPhone: '+250 788 331 445',
          supplierLocation: 'Nyamata Commercial Center',
          status: 'Paid in Full · Delivered',
          date: '2026-10-29'
        },
        {
          id: 'PUR-402',
          title: 'Veterinary Vaccines & Dewormer (Erysipelas & Ivermectin)',
          subPage: 'Feed & Input Orders',
          amountRWF: 65000,
          supplier: 'Veterinary Solutions Rwanda Ltd',
          supplierPhone: '+250 788 902 110',
          status: 'Paid via MoMo',
          date: '2026-10-27'
        }
      ],
      Expenses: [
        {
          id: 'EXP-401',
          title: 'Monthly Farm Staff Wages (3 Herdsmen & Feeder Staff)',
          subPage: 'All Expenses',
          amountRWF: 180000,
          category: 'Labor & Salaries',
          status: 'Paid in Full',
          date: '2026-10-30'
        },
        {
          id: 'EXP-402',
          title: 'Biosecurity Disinfectant Footbaths & Routine Vet Check',
          subPage: 'All Expenses',
          amountRWF: 65000,
          category: 'Veterinary & Biosecurity',
          status: 'Paid in Full',
          date: '2026-10-28'
        },
        {
          id: 'EXP-403',
          title: 'Solar Water Pump Power & Borehole Valve Maintenance',
          subPage: 'All Expenses',
          amountRWF: 45000,
          category: 'Utilities & Fuel',
          status: 'Paid in Full',
          date: '2026-10-26'
        }
      ],
      Customers: [
        {
          id: 'CUS-401',
          title: 'Nyabugogo Prime Meat Supply',
          subPage: 'Farm Sales',
          phone: '+250 788 402 771',
          balanceOwedRWF: 390000,
          status: 'Monthly Contract Buyer'
        },
        {
          id: 'CUS-402',
          title: 'Bugesera Pineapple Cooperative (Organic Manure)',
          subPage: 'Farm Sales',
          phone: '+250 788 819 305',
          balanceOwedRWF: 200000,
          status: 'AGUKA Circular Partner'
        }
      ]
    }
  },

  'food-and-hospitality': {
    architectureId: 'food-and-hospitality',
    ownerName: 'Patrick Mugisha',
    businessName: 'Mille Collines Bistro & Suites',
    email: 'patrick@millebistro.rw',
    phone: '+250 788 650 900',
    location: 'Kigali, Kiyovu',
    category: 'Restaurant, Cafe & Boutique Accommodation',
    metrics: {
      spendableRWF: 5890000,
      monthlyRevenueRWF: 4120000,
      netProfitRWF: 1740000,
      stockValueRWF: 2450000,
      todayProfitRWF: 385000,
      todayMoneyInRWF: 920000,
      todayCostsRWF: 535000,
      owedToMeRWF: 540000,
      iOweSuppliersRWF: 490000,
      attentionHeadline: '8/10 Rooms Occupied · Kitchen Waste Below 1.4%',
      survivalMonths: 6.7
    },
    records: {
      Sales: [
        {
          id: 'SAL-501',
          title: 'Table #04 · Grilled Lake Kivu Tilapia & Plantains (×2)',
          subPage: 'Active Orders',
          amountRWF: 28000,
          customer: 'Walk-In Diner Table #04',
          paymentMethod: 'MoMo Pay',
          status: 'Recipe Cost: 11,000 RWF · Ingredients Deducted',
          date: '2026-10-30'
        },
        {
          id: 'SAL-502',
          title: 'Suite 201 · Executive View (3 Nights + Dining Folio)',
          subPage: 'Rooms & Reservations',
          amountRWF: 295000,
          customer: 'Dr. Samuel K.',
          paymentMethod: 'Visa + MoMo Deposit',
          status: 'Checked-In · Combined Room & Restaurant Bill',
          date: '2026-10-30'
        }
      ],
      Inventory: [
        {
          id: 'INV-501',
          title: 'Fresh Tilapia Fillets & Irish Potatoes Stock',
          subPage: 'Ingredients Stock',
          unitCostRWF: 5500,
          sellingPriceRWF: 14000,
          quantity: 42,
          status: 'Cold Storage · Auto-Deducts on Kitchen Order',
          date: '2026-10-30'
        },
        {
          id: 'INV-502',
          title: 'Specialty Rwandan Arabica Coffee Beans (kg)',
          subPage: 'Beverage Inventory',
          unitCostRWF: 9500,
          sellingPriceRWF: 3500,
          quantity: 28,
          status: 'Barista Counter Stock Healthy',
          date: '2026-10-30'
        }
      ],
      Purchases: [
        {
          id: 'PUR-501',
          title: 'Fresh Vegetables, Fish & Dairy Morning Market Supply',
          subPage: 'Market Purchases',
          amountRWF: 315000,
          supplier: 'Kimironko Fresh Produce Suppliers',
          status: 'Paid via Cash & MoMo',
          date: '2026-10-30'
        }
      ],
      Customers: [
        {
          id: 'CUS-501',
          title: 'EcoBank Regional Workshop Delegation',
          subPage: 'Corporate Accounts',
          phone: '+250 788 300 450',
          balanceOwedRWF: 540000,
          status: 'Conference Catering + 4 Rooms Invoice Sent'
        }
      ]
    }
  },

  hybrid: {
    architectureId: 'hybrid',
    ownerName: 'Pacifique Nshimiyimana',
    businessName: 'TechPulse Electronics & Repair Hub',
    email: 'pacifique@techpulse.rw',
    phone: '+250 788 990 112',
    location: 'Kigali, CBD Town',
    category: 'Hybrid Retail Products + Technical Repair + Contracting',
    metrics: {
      spendableRWF: 5240000,
      monthlyRevenueRWF: 3790000,
      netProfitRWF: 1660000,
      stockValueRWF: 3920000,
      todayProfitRWF: 355000,
      todayMoneyInRWF: 810000,
      todayCostsRWF: 455000,
      owedToMeRWF: 690000,
      iOweSuppliersRWF: 470000,
      attentionHeadline: 'Retail + Service Combined Margin at 43.8%',
      survivalMonths: 6.6
    },
    records: {
      Sales: [
        {
          id: 'SAL-601',
          title: 'Samsung A55 Screen Part + Express Installation Labor',
          subPage: 'Combined Invoices',
          amountRWF: 120000,
          customer: 'karangwa@gmail.com',
          paymentMethod: 'MoMo Business',
          status: 'Part Stock (-1) + Service Labor Recorded',
          date: '2026-10-30'
        },
        {
          id: 'SAL-602',
          title: 'Office Wi-Fi Access Points (×4) + Cabling Job',
          subPage: 'Service & Job Sales',
          amountRWF: 480000,
          customer: 'Kigali Law Chambers',
          paymentMethod: 'Bank Transfer',
          status: 'Milestone Completed & Paid',
          date: '2026-10-30'
        }
      ],
      Inventory: [
        {
          id: 'INV-601',
          title: 'Samsung A55 Original AMOLED Screen Assembly',
          subPage: 'Selective Stock Switch',
          unitCostRWF: 62000,
          sellingPriceRWF: 95000,
          quantity: 14,
          trackStock: true,
          status: 'Physical Product · Stock Switch: ON',
          date: '2026-10-30'
        },
        {
          id: 'INV-602',
          title: 'Motherboard Micro-Soldering & Diagnostics',
          subPage: 'Selective Stock Switch',
          unitCostRWF: 5000,
          sellingPriceRWF: 45000,
          quantity: 'Service',
          trackStock: false,
          status: 'Pure Service · Stock Switch: OFF',
          date: '2026-10-30'
        }
      ],
      Purchases: [
        {
          id: 'PUR-601',
          title: 'Dubai Electronics Spare Parts & Chargers Shipment',
          subPage: 'All Purchases',
          amountRWF: 1450000,
          supplier: 'Al-Futtaim Tech Parts Cargo',
          status: 'Landed Cost + Customs Recorded',
          date: '2026-10-27'
        }
      ],
      Customers: [
        {
          id: 'CUS-601',
          title: 'Kigali Law Chambers',
          subPage: 'Unified Customers',
          phone: '+250 788 701 888',
          balanceOwedRWF: 190000,
          status: 'IT Maintenance Retainer + Hardware Account'
        }
      ]
    }
  }
}

