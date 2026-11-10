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
    items: [],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      service: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
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
    items: [],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      service: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      food: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 }
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
    items: [],
    mixedSales: [],
    profitMatrix: {
      retail: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
      service: { revenueRWF: 0, costRWF: 0, netProfitRWF: 0, marginPercent: 0 },
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

