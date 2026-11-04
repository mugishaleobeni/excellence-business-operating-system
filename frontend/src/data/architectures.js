import makeAndSellImage from '../../logo/Make & Sell_ Smart Bakery Dashboard (1).png'
import buyAndSellImage from '../../logo/replace Workers_managing_grocery_store_i…_56acc433_1080p.mp4 to Excellence BOS Buy & Sell Store Dashboard.png'
import servicesImage from '../../logo/replace this Barber_cutting_customer_hair_a529696a_1080p.mp4 toExcellence BOS Salon Management Dashboard.png'
import agricultureImage from '../../logo/replace this Farmers_working_on_vibrant_farm_72b1adbf_1080p to that Agriculture and Livestock Dashboard.png'
import foodHospitalityImage from '../../logo/ExBOS Food & Hospitality Dashboard.png'

export const SIX_ARCHITECTURES = [
  {
    id: 'make-and-sell',
    number: '01',
    name: 'Make & Sell',
    shortName: 'Make & Sell',
    slug: 'make-and-sell',
    headline: 'You Make It. We Help You Manage It.',
    description:
      'From raw materials to finished products, ExBOS helps manufacturers manage production, calculate costs, track inventory, and monitor sales.',
    capabilities: ['Production', 'Raw Materials', 'Finished Goods', 'Sales', 'Profitability'],
    image: makeAndSellImage,
    thumb: makeAndSellImage,
    videoUrl: '',
    examples: ['Bakeries & Confectioneries', 'Tailoring & Garment Workshops', 'Furniture & Carpentry Studios', 'Soap & Cosmetics Producers', 'Food Processing Units'],
    workflows: [
      'Raw Material Procurement & Stock Alerts',
      'Recipe / Formula Unit Cost Auto-Calculation',
      'Batch Production Log (Inputs vs Outputs)',
      'Waste, Spoilage & Margin Underpricing Detection',
      'Custom & Bulk Orders with Deposit Tracking'
    ],
    dashboardFeatures: [
      'True Unit Production Cost vs Selling Price Alert',
      'Raw Material Consumption & Reorder Warnings',
      'Batch Yield Efficiency & Spoilage Monitor',
      'Customer Custom Order Deposit & Balance Tracker'
    ],
    howExbosHelps:
      'Most makers price by guessing and discover too late that raw material price increases wiped out their profit. ExBOS links your recipes and material costs directly to every batch so you know your exact unit margin before selling.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Production Alerts'],
      Stock: ['Finished Goods', 'Raw Materials', 'Low Stock', 'Categories'],
      Production: ['Batches', 'Recipes & Formulas', 'In Progress', 'Completed Batches'],
      Sales: ['All Sales', 'Sales Trends'],
      Purchases: ['All Purchases', 'Unpaid Purchases', 'Purchase Returns'],
      Customers: ['Customer Directory', 'Outstanding Balances'],
      Suppliers: ['All Suppliers', 'Amounts Owed'],
      Expenses: ['All Expenses', 'Expense Categories'],
      Reports: ['Production & Yield', 'Sales & Margins', 'Profit & Loss', 'Cash Movement'],
      Documents: ['Document Explorer', 'Recent Documents', 'Share & Export'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp'],
      Settings: ['Business Profile', 'Team & Permissions', 'Subscription']
    }
  },
  {
    id: 'buy-and-sell',
    number: '02',
    name: 'Buy & Sell',
    shortName: 'Buy & Sell',
    slug: 'buy-and-sell',
    headline: 'Buy Smarter. Sell Better.',
    description:
      'Keep your purchases, suppliers, products, inventory, sales, and customer balances organized in one place.',
    capabilities: ['Purchases', 'Inventory', 'Sales', 'Suppliers', 'Profits'],
    image: buyAndSellImage,
    thumb: buyAndSellImage,
    videoUrl: '',
    examples: ['Retail Shops & Mini-Markets', 'Pharmacies & Cosmetics Stores', 'Hardware & Building Materials', 'Electronics & Phone Boutiques', 'Wholesale Distributors'],
    workflows: [
      'True Landed Cost Calculation (Purchase + Transport + Moto + Loading)',
      'Fast Moving vs Dead Stock ("Money Sleeping on the Shelf") Analysis',
      'Customer Credit Book & Automated Payment Reminders',
      'Supplier Payables & Purchase Reorder Suggestions',
      'Batch Expiry Date & Damaged Goods Tracking'
    ],
    dashboardFeatures: [
      'Product Margin & True Landed Cost Matrix',
      'Dead Stock & Low-Stock Warning System',
      'Customer Credit Book with Overdue Days',
      'Expiry Tracker for Pharmacies & Supermarkets'
    ],
    howExbosHelps:
      'Retailers often confuse daily sales cash with real profit while ignoring transport costs and slow-moving stock. ExBOS calculates landed cost per item, reveals money sleeping on shelves, and tracks every customer debt.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Alerts & Dead Stock'],
      Products: ['All Products', 'Stock', 'Low Stock', 'Categories'],
      Sales: ['All Sales', 'Sales Trends'],
      Purchases: ['All Purchases', 'Unpaid Purchases', 'Purchase Returns'],
      Customers: ['Customer Directory', 'Outstanding Balances'],
      Suppliers: ['All Suppliers', 'Amounts Owed'],
      Expenses: ['All Expenses', 'Expense Categories'],
      Reports: ['Sales Report', 'Stock Report', 'Purchases Report', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts'],
      Settings: ['Business Profile', 'Team & Permissions', 'Subscription'],
      Documents: ['Overview', 'Invoices', 'Receipts', 'Quotations', 'Purchase Orders', 'Statements', 'Sent History', 'Templates'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp']
    }
  },
  {
    id: 'services',
    number: '03',
    name: 'Service-Based Business',
    shortName: 'Service-Based',
    slug: 'services',
    headline: 'Your Skills. Your Business. Your Growth.',
    description:
      'Manage services, bookings, customers, invoices, and payments while staying focused on delivering excellent service.',
    capabilities: ['Services', 'Appointments', 'Jobs', 'Customers', 'Payments'],
    image: servicesImage,
    thumb: servicesImage,
    videoUrl: '',
    examples: ['Salons, Spas & Barbershops', 'Auto & Electronics Repair Workshops', 'Consultancies & Creative Agencies', 'Cleaning & Maintenance Services', 'Construction & Installation Projects'],
    workflows: [
      'Service Catalogue with Duration, Pricing & Consumable Supplies',
      'Appointment & Booking Calendar with Client Reminders',
      'Client Deposits, Milestones & Remaining Balances',
      'Staff Schedule, Commissions & Revenue per Staff Member',
      'Project Estimates, Change Orders & Cash Gap Tracking'
    ],
    dashboardFeatures: [
      'Booking Calendar & No-Show Rate Monitor',
      'Revenue & Commission Breakdown per Staff Member',
      'Consumable Supplies Used per Service (Shampoo, Spare Parts)',
      'Project Milestone Cash Gap (Spent vs Received)'
    ],
    howExbosHelps:
      'Service businesses lose revenue through client no-shows, unrecorded consumables, and unpaid balances. ExBOS tracks deposits, staff productivity, supplies used per job, and client history in one clear workspace.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Upcoming Bookings'],
      Services: ['Service Catalogue', 'Consumables & Supplies', 'Service Categories'],
      'Jobs & Bookings': ['All Jobs', 'Bookings & Calendar', 'In Progress', 'Completed & Invoiced'],
      Customers: ['Customer Directory', 'Outstanding Balances'],
      Suppliers: ['All Suppliers', 'Amounts Owed'],
      Expenses: ['All Expenses', 'Expense Categories'],
      Reports: ['Sales Report', 'Stock Report', 'Purchases Report', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts'],
      Settings: ['Business Profile', 'Staff & Commissions', 'Subscription'],
      Documents: ['Overview', 'Invoices', 'Receipts', 'Quotations', 'Purchase Orders', 'Statements', 'Sent History', 'Templates'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp']
    }
  },
  {
    id: 'agriculture',
    number: '04',
    name: 'Agriculture & Livestock',
    shortName: 'Agriculture & Livestock',
    slug: 'agriculture',
    headline: 'From Farm to Market, Stay in Control.',
    description:
      'Organize crops, livestock, farm expenses, production records, agricultural inventory, and sales with Six-Month Survival Intelligence.',
    capabilities: ['Crops', 'Livestock', 'Farm Inputs', 'Production Costs', 'Sales'],
    image: agricultureImage,
    thumb: agricultureImage,
    videoUrl: '',
    examples: ['Pig Farming & Livestock Breeding', 'Poultry (Layers & Broilers)', 'Dairy Farming & Milk Production', 'Crop & Horticulture Farms', 'Integrated Circular Farms (AGUKA Model)'],
    workflows: [
      'Six-Month Business Survival Calculator (Green / Yellow / Red Status)',
      'Smart Budget Classification (Fixed Capital vs Livestock vs Safety Budget)',
      'Intelligent Feed Management & Run-Out Date Prediction',
      'Livestock Investment & Breeding Readiness Verification',
      'Pig Trading Intelligence & Expansion Sustainability Evaluator'
    ],
    dashboardFeatures: [
      'Six-Month Financial Survival Indicator & Cash Flow Simulator',
      'Feed Duration Forecast (kg remaining & cost per kg)',
      'Smart Breeding Readiness Check (Age, Weight & Health)',
      'Expansion Intelligence & AGUKA Circular Growth Model'
    ],
    howExbosHelps:
      'Farms fail when owners expand livestock before securing 6 months of feed and operating reserves. ExBOS forecasts feed run-out dates, separates breeding from trading profit, and tells you if your farm can survive 6 months without sales.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Survival Runway & AI Advice'],
      Livestock: ['Animal Register', 'Feed Management', 'Breeding & Births', 'Health & Vet Care', 'Trade vs Breed Profit'],
      'Crops & Fields': ['Field Plots', 'Crop Cycles', 'Harvest Records'],
      'Farm Inventory': ['Farm Inputs', 'Harvested Stock', 'Low Stock Alerts'],
      Sales: ['Farm Sales', 'Sales Trends'],
      Purchases: ['Feed & Input Orders', 'Unpaid Purchases'],
      Expenses: ['All Expenses', 'Budget Categories (Auto-Sorted)'],
      Reports: ['Sales Report', 'Stock Report', 'Purchases Report', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts'],
      Settings: ['Farm Profile', 'Survival Period Settings', 'Subscription'],
      Documents: ['Overview', 'Invoices', 'Receipts', 'Quotations', 'Purchase Orders', 'Statements', 'Sent History', 'Templates'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp']
    }
  },
  {
    id: 'food-and-hospitality',
    number: '05',
    name: 'Food & Hospitality',
    shortName: 'Food & Hospitality',
    slug: 'food-and-hospitality',
    headline: 'Serve Better. Waste Less. Earn More.',
    description:
      'Manage restaurant menus, recipes, ingredients, orders, expenses, and hospitality operations with greater clarity.',
    capabilities: ['Menus', 'Recipes', 'Orders', 'Ingredient Stock', 'Accommodation'],
    image: foodHospitalityImage,
    thumb: foodHospitalityImage,
    videoUrl: '',
    examples: ['Restaurants, Cafes & Bistros', 'Boutique Hotels & Guest Houses', 'Catering & Event Kitchens', 'Fast Food & Cloud Kitchens', 'Lodges & Resort Operations'],
    workflows: [
      'Menu & Recipe Costing with Automatic Ingredient Deduction',
      'Live Kitchen Order Queue & Table Billing',
      'Kitchen Spoilage, Portion Control & Waste Tracking',
      'Accommodation Rooms, Reservations & Check-In / Check-Out',
      'Housekeeping Status & Consolidated Guest Folio Billing'
    ],
    dashboardFeatures: [
      'Dual Mode: Restaurant Operations + Accommodation Management',
      'Recipe Food Cost % & Portion Margin Monitor',
      'Live Kitchen Orders & Ingredient Low-Stock Alerts',
      'Room Occupancy, Check-In/Out & Guest Billing'
    ],
    howExbosHelps:
      'Kitchen waste and unmeasured portion sizes quietly drain restaurant profits. ExBOS connects every menu order to ingredient stock and combines restaurant and guest room billing in one unified workspace.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Live Kitchen & Rooms'],
      'Restaurant & Bar': ['Menu Items', 'Orders & Kitchen Queue', 'Tables & Bills'],
      'Rooms & Lodging': ['Rooms Register', 'Reservations & Check-In', 'Guest Folios'],
      'Ingredients & Stock': ['Kitchen Ingredients', 'Low Stock & Waste'],
      Purchases: ['All Purchases', 'Unpaid Purchases'],
      Suppliers: ['All Suppliers', 'Amounts Owed'],
      Expenses: ['All Expenses', 'Expense Categories'],
      Reports: ['Sales Report', 'Stock Report', 'Purchases Report', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts'],
      Settings: ['Restaurant & Rooms Setup', 'Staff & Shifts', 'Subscription'],
      Documents: ['Overview', 'Invoices', 'Receipts', 'Quotations', 'Purchase Orders', 'Statements', 'Sent History', 'Templates'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp']
    }
  },
  {
    id: 'hybrid',
    number: '06',
    name: 'Hybrid Business',
    shortName: 'Hybrid Business',
    slug: 'hybrid',
    headline: 'Multiple Activities. One Powerful System.',
    description:
      'Combine product sales, services, production, and other business activities in one connected workspace.',
    capabilities: ['Multiple Workflows', 'Shared Inventory', 'Finance', 'Consolidated Reports'],
    image:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80',
    thumb:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=360&q=80',
    videoUrl: '',
    examples: ['Electronics Shop + Repair Workshop', 'Bakery + Retail Mini-Market + Catering', 'Agro-Vet Shop + Farm Operations', 'Salon + Cosmetics Retail Boutique', 'Multi-Branch Trading & Contracting Group'],
    workflows: [
      'Modular Activity Switcher (Combine Retail, Service, Production, Farming)',
      'Selective Stock Tracking Switch (Enable only for chosen items)',
      'Unified Cash, MoMo & Bank Ledger Across All Activities',
      'Activity-by-Activity Profit Comparison vs Consolidated View',
      'Custom Pick-Your-Own Dashboard Widgets'
    ],
    dashboardFeatures: [
      'Activity Profitability Comparison Matrix',
      'Per-Item Stock Tracking Switch (Products vs Services)',
      'Shared Debt, Cash & Mobile Money Control Center',
      'Plug-and-Play Module Activator (Add Recipes, Bookings, or Projects)'
    ],
    howExbosHelps:
      'Many African entrepreneurs run businesses that do not fit into a single box—like selling spare parts while offering repair services. ExBOS lets you combine multiple workflows under one login without double-counting money.',
    navigation: {
      Overview: ['Dashboard', 'Where Is My Money', 'Activity Summary'],
      'Products & Stock': ['All Products', 'Track Stock (On/Off)', 'Low Stock Alerts'],
      'Services & Jobs': ['Service Catalogue', 'Job Schedule'],
      Sales: ['All Sales', 'Sales Trends'],
      Purchases: ['All Purchases', 'Unpaid Purchases'],
      Customers: ['Customer Directory', 'Outstanding Balances'],
      Expenses: ['All Expenses', 'Categories & Activity Tags'],
      Reports: ['Sales Report', 'Stock Report', 'Purchases Report', 'Profit & Loss', 'Cash Movement', 'Customer Debts', 'Supplier Debts'],
      Settings: ['Business Activities (On/Off)', 'Dashboard Layout', 'Subscription'],
      Documents: ['Overview', 'Invoices', 'Receipts', 'Quotations', 'Purchase Orders', 'Statements', 'Sent History', 'Templates'],
      Integrations: ['Gmail', 'Google Drive', 'WhatsApp']
    }
  }
]

export const FINANCIAL_TOOLS = [
  {
    id: 'break-even',
    name: 'Break-Even Analysis Calculator',
    shortName: 'Break-Even Calculator',
    tagline: 'Sales needed to cover operating costs',
    description:
      'Calculate exactly how many products or services you must sell each month to cover your fixed and variable operating costs before earning your first franc of profit.',
    formulaNote: 'Break-Even Units = Fixed Monthly Costs ÷ (Selling Price per Unit − Variable Cost per Unit)',
    enabled: true,
    plans: ['Free', 'Bronze', 'Silver', 'Gold']
  },
  {
    id: 'survival-budget',
    name: 'Survival Budget Planner',
    shortName: 'Survival Budget Planner',
    tagline: 'Cash reserves needed during slow sales',
    description:
      'Estimate the exact cash reserve required to keep your business alive for 6 full months even if sales are slow. Fixed Monthly Costs × 6 = Safety Budget.',
    formulaNote: 'Rent + Salaries + Electricity + Internet + Software = Fixed Monthly Cost × 6 = Six-Month Safety Budget',
    enabled: true,
    plans: ['Free', 'Bronze', 'Silver', 'Gold']
  },
  {
    id: 'startup-cost',
    name: 'Startup Cost Calculator',
    shortName: 'Startup Cost Calculator',
    tagline: 'Money required before opening',
    description:
      'Plan every franc needed before opening your doors—equipment, premises, initial inventory, business registration, marketing, and unexpected setup buffers.',
    formulaNote: 'Total Startup Capital = One-Time Setup Assets + Initial Stock + Licensing + Launch Marketing Reserve',
    enabled: true,
    plans: ['Free', 'Bronze', 'Silver', 'Gold']
  },
  {
    id: 'pricing-profit',
    name: 'Pricing & Profit Calculator',
    shortName: 'Pricing & Profit Calculator',
    tagline: 'Whether product/service pricing is sustainable',
    description:
      'Test whether your product or service selling price covers production, transport, and operating overhead while leaving a sustainable net profit margin.',
    formulaNote: 'Net Profit = (Selling Price − Unit Cost) × Expected Volume − Operating Expenses',
    enabled: true,
    plans: ['Free', 'Bronze', 'Silver', 'Gold']
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund Planner',
    shortName: 'Emergency Fund Planner',
    tagline: 'Cash buffer for unexpected expenses',
    description:
      'Build a dedicated financial shield for equipment breakdowns, supply chain shocks, or sudden market slowdowns based on your monthly operating reality.',
    formulaNote: 'Additional Savings Needed = (Monthly Operating Expenses × Target Reserve Months) − Existing Emergency Savings',
    enabled: true,
    plans: ['Free', 'Bronze', 'Silver', 'Gold']
  }
]

export const DEFAULT_PRICING_PLANS = [
  {
    id: 'free',
    name: 'Forever Free',
    tier: 'Free',
    priceRWF: 0,
    billingPeriod: 'Forever',
    badge: 'Starter',
    recommended: false,
    accent: 'ice',
    description: 'Essential record keeping and financial survival calculators for new entrepreneurs starting out.',
    limits: { users: 1, products: 35, branches: 1 },
    features: [
      { name: 'Where Is My Money? Core Snapshot', included: true },
      { name: '5 Financial Survival Calculators', included: true },
      { name: 'Daily Sales & Expense Recording', included: true },
      { name: 'Up to 35 Products / Services', included: true },
      { name: 'PDF Report Preview & Print', included: true },
      { name: 'Multi-User Staff Permissions', included: false },
      { name: 'EXCELLENCE BOS WhatsApp Assistant', included: false },
      { name: 'Google Drive & Gmail Automation', included: false }
    ]
  },
  {
    id: 'bronze',
    name: 'Bronze',
    tier: 'Bronze',
    priceRWF: 10000,
    billingPeriod: 'per month',
    badge: 'Growing Small Business',
    recommended: false,
    accent: 'bronze',
    description: 'Complete inventory, customer debt tracking, and landed cost clarity for active shops and makers.',
    limits: { users: 3, products: 300, branches: 1 },
    features: [
      { name: 'Where Is My Money? Core Snapshot', included: true },
      { name: '5 Financial Survival Calculators (Save History)', included: true },
      { name: 'Full Inventory, Landed Cost & Low-Stock Alerts', included: true },
      { name: 'Customer Credit Book & Debt Reminders', included: true },
      { name: 'PDF & CSV Document Exports', included: true },
      { name: 'Up to 3 Staff Accounts', included: true },
      { name: 'EXCELLENCE BOS WhatsApp Assistant', included: false },
      { name: 'Multi-Branch Consolidated Analytics', included: false }
    ]
  },
  {
    id: 'gold',
    name: 'Gold',
    tier: 'Gold',
    priceRWF: 35000,
    billingPeriod: 'per month',
    badge: 'Most Popular · Complete BOS',
    recommended: true,
    accent: 'gold',
    description: 'Unrestricted power across all architectures, AI Survival & Farming Intelligence, WhatsApp Bot, and multi-branch control.',
    limits: { users: 25, products: 'Unlimited', branches: 5 },
    features: [
      { name: 'All 6 Business Architectures & Hybrid Mode', included: true },
      { name: 'Where Is My Money? + Audit Trail & Privacy Lock', included: true },
      { name: 'EXCELLENCE BOS Official WhatsApp Bot Integration', included: true },
      { name: 'Gmail & Google Drive Automated Exports (PDF/XLSX/DOCX)', included: true },
      { name: 'AI Business & 6-Month Survival Forecasting Assistant', included: true },
      { name: 'Up to 5 Branches & 25 Authorized Staff Accounts', included: true },
      { name: 'Priority Onboarding & Dedicated Support', included: true },
      { name: 'Custom Dashboard Layouts & Role Security', included: true }
    ]
  },
  {
    id: 'silver',
    name: 'Silver',
    tier: 'Silver',
    priceRWF: 20000,
    billingPeriod: 'per month',
    badge: 'Professional Operations',
    recommended: false,
    accent: 'silver',
    description: 'Advanced operations, production batch costing, Gmail & Google Drive exports, and team workflows.',
    limits: { users: 8, products: 1500, branches: 2 },
    features: [
      { name: 'Where Is My Money? Core Snapshot', included: true },
      { name: 'Production Recipes, Bookings & Cycle Tracking', included: true },
      { name: 'Customer Credit Book & Supplier Payables', included: true },
      { name: 'Gmail & Google Drive Export (PDF, Excel, Word)', included: true },
      { name: 'Up to 8 Staff Accounts & 2 Branches', included: true },
      { name: 'EXCELLENCE BOS WhatsApp Read Summaries', included: true },
      { name: 'Full AI Expansion & Cash Flow Simulator', included: false },
      { name: '5+ Multi-Branch Enterprise Controls', included: false }
    ]
  }
]

export const DEFAULT_PLATINUM_PROGRAM = {
  name: 'Platinum & Diamond Loyalty Program',
  requiredReferrals: 5,
  rewardTitle: '30% Discount Across All PYLARIX Products + 3 Months Complimentary Gold Access',
  description:
    'Invite fellow entrepreneurs to build resilient businesses on EXCELLENCE BOS. Once your verified referrals reach the target set by the Super Administrator, unlock Platinum/Diamond status automatically.',
  active: true
}

export const FAQ_ITEMS = [
  {
    q: 'What is EXCELLENCE BOS?',
    a: 'EXCELLENCE BOS (Excellence Business Operations System) by PYLARIX is a business operations platform designed to help businesses organize their daily activities, manage records, track cash across drawers, MoMo, and banks, and understand true financial performance.'
  },
  {
    q: 'Can I use EXCELLENCE BOS for free?',
    a: 'Yes. The Forever Free plan provides access to core business record keeping, the "Where Is My Money?" snapshot, and our 5 financial survival planning tools within defined usage limits.'
  },
  {
    q: 'Can I change my subscription plan?',
    a: 'Yes. Businesses can request an upgrade or downgrade between Forever Free, Bronze, Silver, and Gold at any time, subject to applicable billing and subscription policies.'
  },
  {
    q: 'What is the Break-Even Calculator?',
    a: 'It estimates the exact sales volume and revenue required to cover your fixed and variable operating costs, helping entrepreneurs plan rationally before starting or expanding a business.'
  },
  {
    q: 'What is Platinum / Diamond Membership?',
    a: 'Platinum / Diamond is a configurable loyalty and referral reward program managed by the Super Administrator. When you refer the required number of verified businesses to EXCELLENCE BOS, you earn exclusive rewards such as discounts on PYLARIX products and complimentary Gold access.'
  },
  {
    q: 'Can I use EXCELLENCE BOS on my phone?',
    a: 'Yes. EXCELLENCE BOS is engineered with a responsive Liquid Sapphire interface that adapts seamlessly across smartphones, tablets, laptops, and desktop monitors.'
  },
  {
    q: 'What happens if my subscription expires?',
    a: 'Our policy is to preserve all your business records safely and restrict only paid-tier capabilities until renewal—your historical data is never automatically deleted when a subscription lapses.'
  }
]

export const SEO_ARTICLES = [
  {
    slug: 'how-to-calculate-business-profit',
    title: 'How to Calculate True Business Profit (And Stop Confusing Sales with Profit)',
    category: 'Financial Mastery',
    readTime: '5 min read',
    summary:
      'Why daily cash in the drawer is not profit—and how to deduct landed cost, transport, spoilage, and fixed overhead to see what your business truly earned.',
    takeaways: [
      'Always include ticket, moto, loading, and packaging in your product Landed Cost.',
      'Separate personal/home withdrawals from business operating expenses.',
      'Deduct monthly fixed costs (rent, salaries, electricity, internet) before declaring net profit.'
    ]
  },
  {
    slug: 'six-month-business-survival-reserve',
    title: 'How Much Money a Business Needs to Survive Six Months of Slow Sales',
    category: 'Survival Planning',
    readTime: '6 min read',
    summary:
      'Many businesses fail not because the idea was bad, but because the founder did not know the real cost of survival. Learn the Fixed Monthly Cost × 6 Safety Budget formula.',
    takeaways: [
      'Calculate Rent + Salaries + Electricity + Software + Internet = Monthly Fixed Cost.',
      'Multiply your Monthly Fixed Cost by 6 to establish your Safety Budget.',
      'Never expand or buy extra equipment if it drops your survival coverage below 3 months.'
    ]
  },
  {
    slug: 'manage-inventory-in-a-small-shop',
    title: 'How to Manage Inventory in a Small Shop and Eliminate Dead Stock',
    category: 'Buy & Sell Operations',
    readTime: '4 min read',
    summary:
      'Money sleeping on the shelf is silent business failure. Discover how to spot slow movers, set reorder points, and prevent expiry losses.',
    takeaways: [
      'Tag every item with its buying price, landed cost, and selling margin.',
      'Review items with zero sales over 30 days ("Dead Stock") and convert them back into cash.',
      'Track expiry dates for pharmacy, grocery, and cosmetics products 60 days ahead.'
    ]
  },
  {
    slug: 'calculate-business-break-even-point',
    title: 'How to Calculate Your Business Break-Even Point Before Investing',
    category: 'Startup Planning',
    readTime: '5 min read',
    summary:
      'Before signing a lease or buying stock, know the exact number of customers or units you need every day just to pay the bills.',
    takeaways: [
      'Contribution Margin = Selling Price per Unit minus Variable Cost per Unit.',
      'Break-Even Units = Total Monthly Fixed Costs ÷ Contribution Margin.',
      'Use the ExBOS Break-Even Calculator to test different pricing strategies before launch.'
    ]
  },
  {
    slug: 'record-business-expenses-accurately',
    title: 'How to Record Business Expenses Across Cash, Mobile Money (MoMo), and Bank',
    category: 'Cash Control',
    readTime: '4 min read',
    summary:
      'When cash, MoMo wallets, and bank accounts get mixed with personal spending, money disappears without a trace. Here is how to reconcile daily movements.',
    takeaways: [
      'Keep a dedicated business MoMo line separate from personal wallet numbers.',
      'Compare counted cash in the till against expected cash every evening.',
      'Log every transaction via Dashboard or EXCELLENCE BOS WhatsApp immediately.'
    ]
  },
  {
    slug: 'choose-a-business-management-system',
    title: 'How to Choose a Business Management System That Fits Your Business Architecture',
    category: 'Systems & Growth',
    readTime: '5 min read',
    summary:
      'A bakery, a retail pharmacy, a hair salon, and a pig farm do not operate the same way. Learn how architecture-aware software adapts to your workflow.',
    takeaways: [
      'Choose a platform that matches how you create value: Make & Sell, Buy & Sell, Services, Agriculture, Hospitality, or Hybrid.',
      'Ensure the system answers three daily questions: Did I make money today? Who owes me? What needs attention?',
      'Verify that your reports can export cleanly to PDF, Excel, Word, CSV, and Google Drive.'
    ]
  }
]

