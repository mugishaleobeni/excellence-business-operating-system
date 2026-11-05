import {
  LayoutDashboard,
  Package,
  Factory,
  Sparkles,
  Calendar,
  Activity,
  Wheat,
  Boxes,
  UtensilsCrossed,
  BedDouble,
  Coffee,
  ShoppingBag,
  Truck,
  Users,
  TrendingDown,
  BarChart3,
  Settings,
  FileText,
  Plug
} from 'lucide-react'

export const MODULE_ICONS = {
  Overview: LayoutDashboard,
  Stock: Package,
  Production: Factory,
  Products: Package,
  'Products & Stock': Package,
  Services: Sparkles,
  'Services & Jobs': Sparkles,
  'Jobs & Bookings': Calendar,
  Livestock: Activity,
  'Crops & Fields': Wheat,
  'Farm Inventory': Boxes,
  'Restaurant & Bar': UtensilsCrossed,
  'Rooms & Lodging': BedDouble,
  'Ingredients & Stock': Coffee,
  Sales: ShoppingBag,
  Purchases: Truck,
  Customers: Users,
  Suppliers: Truck,
  Expenses: TrendingDown,
  Reports: BarChart3,
  Settings: Settings,
  Documents: FileText,
  Integrations: Plug
}

export const MODULE_SHORT_LABELS = {
  Overview: 'Overv',
  Stock: 'Stock',
  Production: 'Produ',
  Products: 'Produ',
  'Products & Stock': 'Stock',
  Services: 'Servi',
  'Services & Jobs': 'Jobs',
  'Jobs & Bookings': 'Jobs',
  Livestock: 'Lives',
  'Crops & Fields': 'Crops',
  'Farm Inventory': 'Inven',
  'Restaurant & Bar': 'Resta',
  'Rooms & Lodging': 'Rooms',
  'Ingredients & Stock': 'Ingre',
  Sales: 'Sales',
  Purchases: 'Purch',
  Customers: 'Custo',
  Suppliers: 'Suppl',
  Expenses: 'Expen',
  Reports: 'Repor',
  Settings: 'Setti',
  Documents: 'Docum',
  Integrations: 'Integ'
}

export const DASHBOARD_QUICK_ACTIONS = {
  'make-and-sell': [
    { label: 'New Sale', module: 'Sales', page: 'All Sales' },
    { label: 'New Run', module: 'Production', page: 'Runs' },
    { label: 'New Purchase', module: 'Purchases', page: 'All Purchases' }
  ],
  'buy-and-sell': [
    { label: 'New Sale', module: 'Sales', page: 'All Sales' },
    { label: 'New Purchase', module: 'Purchases', page: 'All Purchases' },
    { label: 'New Expense', module: 'Expenses', page: 'All Expenses' }
  ],
  services: [
    { label: 'New Job', module: 'Jobs & Bookings', page: 'All Jobs' },
    { label: 'New Booking', module: 'Jobs & Bookings', page: 'Bookings & Calendar' },
    { label: 'New Expense', module: 'Expenses', page: 'All Expenses' }
  ],
  agriculture: [
    { label: 'Record Sale', module: 'Sales', page: 'Farm Sales' },
    { label: 'Log Feeding', module: 'Livestock', page: 'Feed Management' },
    { label: 'New Expense', module: 'Expenses', page: 'All Expenses' }
  ],
  'food-and-hospitality': [
    { label: 'New Order', module: 'Restaurant & Bar', page: 'Orders & Kitchen Queue' },
    { label: 'New Reservation', module: 'Rooms & Lodging', page: 'Reservations & Check-In' },
    { label: 'New Expense', module: 'Expenses', page: 'All Expenses' }
  ],
  hybrid: [
    { label: 'New Sale', module: 'Sales', page: 'All Sales' },
    { label: 'New Job', module: 'Services & Jobs', page: 'Job Schedule' },
    { label: 'New Expense', module: 'Expenses', page: 'All Expenses' }
  ]
}

