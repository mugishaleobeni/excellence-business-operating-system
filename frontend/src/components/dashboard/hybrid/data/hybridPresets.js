/**
 * Hybrid Business Specialization Presets (Architecture 06)
 * Multi-Activity: Retail Products + Services & Labor + Food & Dining + Production
 * Zero emojis used; clean Lucide icon names mapped.
 */

export const HYBRID_PRESETS = {
  techRepair: {
    id: 'techRepair',
    name: 'Electronics Store & Technical Workshop',
    category: 'Retail Hardware + Repair Service',
    iconName: 'Wrench',
    businessName: 'TechPulse Electronics & Repair Hub',
    headline: 'Physical Spare Parts Inventory + Billable Technical Labor',
    description: 'Sell electronic accessories and screen parts while billing installation labor and micro-soldering repairs without stock barriers.',
    attentionHeadline: 'Retail + Service Combined Margin at 43.8% · 3 Workbench Jobs Active',
    activeActivities: {
      retail: true,
      service: true,
      food: false,
      production: false
    },
    items: [
      {
        id: 'HYB-001',
        title: 'Samsung A55 Original AMOLED Screen Assembly',
        category: 'Phone Parts',
        activity: 'retail',
        trackStock: true,
        unit: 'pcs',
        currentStock: 14,
        unitCostRWF: 62000,
        sellingPriceRWF: 95000,
        reorderLevel: 3,
        status: 'Physical Good'
      },
      {
        id: 'HYB-002',
        title: 'USB-C 65W Fast GaN Wall Charger',
        category: 'Accessories',
        activity: 'retail',
        trackStock: true,
        unit: 'pcs',
        currentStock: 28,
        unitCostRWF: 12000,
        sellingPriceRWF: 22000,
        reorderLevel: 5,
        status: 'Physical Good'
      },
      {
        id: 'HYB-003',
        title: 'Expert Screen & Battery Replacement Labor',
        category: 'Technical Repair',
        activity: 'service',
        trackStock: false,
        unit: 'job',
        currentStock: 'Unlimited',
        unitCostRWF: 3000,
        sellingPriceRWF: 15000,
        reorderLevel: 0,
        status: 'Service Labor'
      },
      {
        id: 'HYB-004',
        title: 'Motherboard Micro-Soldering & IC Diagnostic',
        category: 'Board Diagnostics',
        activity: 'service',
        trackStock: false,
        unit: 'job',
        currentStock: 'Unlimited',
        unitCostRWF: 5000,
        sellingPriceRWF: 45000,
        reorderLevel: 0,
        status: 'Service Labor'
      }
    ],
    mixedSales: [
      {
        id: 'SAL-H01',
        invoiceNumber: 'INV-MIX-101',
        date: '2026-11-05',
        customerName: 'Jean Damascene',
        customerPhone: '+250 788 456 789',
        items: [
          { title: 'Samsung A55 Screen Assembly', activity: 'retail', quantity: 1, unitPriceRWF: 95000, unitCostRWF: 62000 },
          { title: 'Expert Screen Replacement Labor', activity: 'service', quantity: 1, unitPriceRWF: 15000, unitCostRWF: 3000 }
        ],
        totalAmountRWF: 110000,
        totalCostRWF: 65000,
        netProfitRWF: 45000,
        paymentMethod: 'MTN MoMo Business',
        status: 'Paid in Full'
      }
    ],
    profitMatrix: {
      retail: { revenueRWF: 2350000, costRWF: 1540000, netProfitRWF: 810000, marginPercent: 34.5 },
      service: { revenueRWF: 1440000, costRWF: 220000, netProfitRWF: 1220000, marginPercent: 84.7 },
      food: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 }
    }
  },

  foodRetail: {
    id: 'foodRetail',
    name: 'Artisan Bakery, Cafe & Gourmet Mart',
    category: 'Bakery + Cafe + Retail Mart',
    iconName: 'Coffee',
    businessName: 'Inyange Artisan Bakery & Daily Mart',
    headline: 'Fresh Baked Goods, Barista Coffee Counter & Packaged Mart',
    description: 'Combine prepared bakery loaves, freshly brewed coffee counter, and retail shelf goods on a unified checkout terminal.',
    attentionHeadline: 'Mart & Coffee Counter Active · Mixed Cart Checkout Live',
    activeActivities: {
      retail: true,
      service: false,
      food: true,
      production: true
    },
    items: [
      {
        id: 'HYB-F01',
        title: 'Artisan Sourdough Country Loaf (800g)',
        category: 'Bakery Output',
        activity: 'food',
        trackStock: true,
        unit: 'loaves',
        currentStock: 35,
        unitCostRWF: 1100,
        sellingPriceRWF: 3000,
        reorderLevel: 5,
        status: 'Fresh Daily'
      },
      {
        id: 'HYB-F02',
        title: 'Specialty Espresso / Latte Double Shot',
        category: 'Cafe Counter',
        activity: 'food',
        trackStock: false,
        unit: 'cups',
        currentStock: 'Unlimited',
        unitCostRWF: 600,
        sellingPriceRWF: 2500,
        reorderLevel: 0,
        status: 'Barista Counter'
      },
      {
        id: 'HYB-F03',
        title: 'Organic Honey Glass Jar (500g)',
        category: 'Mart Retail Shelf',
        activity: 'retail',
        trackStock: true,
        unit: 'jars',
        currentStock: 24,
        unitCostRWF: 4200,
        sellingPriceRWF: 7000,
        reorderLevel: 4,
        status: 'Physical Good'
      }
    ],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 890000, costRWF: 520000, netProfitRWF: 370000, marginPercent: 41.6 },
      service: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      food: { revenueRWF: 2150000, costRWF: 780000, netProfitRWF: 1370000, marginPercent: 63.7 }
    }
  },

  salonBoutique: {
    id: 'salonBoutique',
    name: 'Salon Studio & Cosmetics Boutique',
    category: 'Beauty Services + Retail Products',
    iconName: 'Sparkles',
    businessName: 'Lumina Aesthetics & Beauty Boutique',
    headline: 'Hair Styling & Nail Bar + Retail Skincare Boutique',
    description: 'Clients receive haircut or braiding services and purchase take-home styling serums on a single consolidated receipt.',
    attentionHeadline: 'Boutique Cosmetics Shelf + 4 Styling Chairs Active',
    activeActivities: {
      retail: true,
      service: true,
      food: false,
      production: false
    },
    items: [
      {
        id: 'HYB-S01',
        title: 'Argan Oil Moisture Hair Serum (100ml)',
        category: 'Retail Cosmetics',
        activity: 'retail',
        trackStock: true,
        unit: 'bottles',
        currentStock: 18,
        unitCostRWF: 9500,
        sellingPriceRWF: 18000,
        reorderLevel: 4,
        status: 'Physical Good'
      },
      {
        id: 'HYB-S02',
        title: 'Executive Cut, Fade & Beard Grooming',
        category: 'Salon Services',
        activity: 'service',
        trackStock: false,
        unit: 'session',
        currentStock: 'Unlimited',
        unitCostRWF: 1500,
        sellingPriceRWF: 12000,
        reorderLevel: 0,
        status: 'Service Labor'
      }
    ],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 1120000, costRWF: 580000, netProfitRWF: 540000, marginPercent: 48.2 },
      service: { revenueRWF: 2450000, costRWF: 380000, netProfitRWF: 2070000, marginPercent: 84.5 },
      food: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 }
    }
  },

  cleanSlate: {
    id: 'cleanSlate',
    name: 'Clean Slate (Zero-Base Hybrid)',
    category: 'Empty Starting Point',
    iconName: 'RefreshCw',
    businessName: 'My Hybrid Enterprise',
    headline: 'Configure Your Custom Business Activities',
    description: 'Toggle on your specific business activities and start building your product and service catalog from scratch.',
    attentionHeadline: 'Ready for Setup · Toggle your business activities',
    activeActivities: {
      retail: true,
      service: true,
      food: false,
      production: false
    },
    items: [],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      service: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      food: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 }
    }
  },

  other: {
    id: 'other',
    name: 'Custom Multi-Activity Enterprise',
    category: 'Conglomerates & Diversified SMEs',
    iconName: 'HelpCircle',
    businessName: 'Custom Enterprise Partner',
    headline: 'Direct Consultation with Our System Architects',
    description: 'We configure custom multi-activity workflows, complex supply chains, and specialized branches for your enterprise.',
    attentionHeadline: 'Dedicated Engineering Support Available',
    isSupportContact: true,
    whatsappNumber: '+250 781 963 981',
    whatsappMessage: 'Hello EXCELLENCE BOS Team, I run a multi-activity hybrid business and need a custom setup.'
  }
}

