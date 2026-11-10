// Empty Clean Initial Workspaces for Real Database Usage
// All mock/demo records removed to strictly fetch and persist live real user data

const EMPTY_RECORD_BUCKETS = {
  Sales: [],
  Purchases: [],
  Inventory: [],
  Products: [],
  Production: [],
  Customers: [],
  Suppliers: [],
  Expenses: [],
  Services: [],
  Consumables: [],
  Staff: [],
  Jobs: [],
  ServiceJobs: [],
  Categories: [],
  RawMaterials: [],
  Recipes: [],
  Animals: [],
  Batches: [],
  Feeds: [],
  FeedingLogs: [],
  Gestations: [],
  HealthRecords: [],
  MenuItems: [],
  KitchenOrders: [],
  Ingredients: [],
  Rooms: [],
  GuestFolios: [],
  WasteLogs: [],
  HybridItems: [],
  MixedSales: [],
  Documents: [],
  SentHistory: [],
  TeamMembers: []
}

const ZERO_METRICS = {
  spendableRWF: 0,
  monthlyRevenueRWF: 0,
  netProfitRWF: 0,
  stockValueRWF: 0,
  todayProfitRWF: 0,
  todayMoneyInRWF: 0,
  todayCostsRWF: 0,
  owedToMeRWF: 0,
  iOweSuppliersRWF: 0,
  attentionHeadline: 'Ready for entries · All systems live',
  survivalMonths: 0
}

export const INITIAL_DEMO_WORKSPACES = {
  'make-and-sell': {
    architectureId: 'make-and-sell',
    ownerName: 'Business Owner',
    businessName: 'Make & Sell Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Manufacturing & Workshop',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  },
  'buy-and-sell': {
    architectureId: 'buy-and-sell',
    ownerName: 'Business Owner',
    businessName: 'Buy & Sell Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Wholesale & Retail Commerce',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  },
  services: {
    architectureId: 'services',
    ownerName: 'Business Owner',
    businessName: 'Services Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Professional & Client Services',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  },
  agriculture: {
    architectureId: 'agriculture',
    ownerName: 'Business Owner',
    businessName: 'Agriculture Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Farming & Livestock',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  },
  'food-and-hospitality': {
    architectureId: 'food-and-hospitality',
    ownerName: 'Business Owner',
    businessName: 'Food & Hospitality Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Restaurant, Bar & Lodging',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  },
  hybrid: {
    architectureId: 'hybrid',
    ownerName: 'Business Owner',
    businessName: 'Hybrid Multi-Trade Enterprise',
    email: 'owner@exbos.rw',
    phone: '+250 788 000 000',
    location: 'Kigali, Rwanda',
    category: 'Multi-Activity Enterprise',
    metrics: { ...ZERO_METRICS },
    records: { ...EMPTY_RECORD_BUCKETS }
  }
}
