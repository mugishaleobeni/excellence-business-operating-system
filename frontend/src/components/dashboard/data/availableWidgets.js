import {
  TrendingUp,
  Users,
  Truck,
  TrendingDown,
  Package,
  Wallet,
  BadgeDollarSign,
  Factory,
  Calendar,
  Activity,
  UtensilsCrossed,
  ShieldCheck
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export function getAvailableWidgets({
  liveDashboardData = {},
  hideFinancials = false,
  navMap = {},
  demoMetrics = {},
  handleModuleClick = () => {},
  setActivePage = () => {}
}) {
  return [
    {
      id: 'sales',
      aliases: ['income', 'sales'],
      name: 'Sales & Revenue',
      navModule: 'Sales',
      navPage: 'All Sales',
      desc: 'Total sales revenue, verified income & orders',
      badge: 'Revenue',
      icon: TrendingUp,
      color: 'text-[#218DFF]',
      badgeBg: 'bg-[#218DFF]/20 text-[#9EDCFF]',
      getValue: () => formatRWF(liveDashboardData.totalSales, hideFinancials),
      getSubtitle: () => `${liveDashboardData.salesCount || 0} sales records`,
      actionLabel: 'See Trends',
      onAction: () => {
        handleModuleClick('Sales')
        setActivePage('Sales Trends')
      }
    },
    {
      id: 'owed_to_me',
      aliases: ['owed_to_me', 'customers'],
      name: 'Customers (Who Owes You)',
      navModule: 'Customers',
      navPage: 'Outstanding Balances',
      desc: 'Accounts receivable & customer credit book',
      badge: 'Receivables',
      icon: Users,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300',
      getValue: () => formatRWF(liveDashboardData.customerDebts, hideFinancials),
      getSubtitle: () => `${liveDashboardData.customersCount || 0} customer accounts`,
      actionLabel: 'Collect',
      onAction: () => {
        handleModuleClick('Customers')
        setActivePage('Outstanding Balances')
      }
    },
    {
      id: 'i_owe',
      aliases: ['i_owe', 'suppliers'],
      name: 'Suppliers (You Owe Money)',
      navModule: 'Suppliers',
      navPage: 'Amounts Owed',
      desc: 'Accounts payable & supplier credit invoices',
      badge: 'Payables',
      icon: Truck,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-300',
      getValue: () => formatRWF(liveDashboardData.supplierDebts, hideFinancials),
      getSubtitle: () => `${liveDashboardData.suppliersCount || 0} suppliers tracked`,
      actionLabel: 'Suppliers',
      onAction: () => {
        handleModuleClick('Suppliers')
        setActivePage('Amounts Owed')
      }
    },
    {
      id: 'purchases',
      aliases: ['purchases'],
      name: 'Purchases & Restock',
      navModule: 'Purchases',
      navPage: 'All Purchases',
      desc: 'Inbound stock orders & procurement cost',
      badge: 'Procurement',
      icon: Truck,
      color: 'text-indigo-400',
      badgeBg: 'bg-indigo-500/15 text-indigo-300',
      getValue: () => formatRWF(liveDashboardData.totalPurchases, hideFinancials),
      getSubtitle: () => `${liveDashboardData.purchasesCount || 0} purchase orders`,
      actionLabel: 'Purchases',
      onAction: () => {
        handleModuleClick('Purchases')
        setActivePage('All Purchases')
      }
    },
    {
      id: 'expenses',
      aliases: ['expenses'],
      name: 'Expenses & Overhead',
      navModule: 'Expenses',
      navPage: 'All Expenses',
      desc: 'Operating costs, rent, transport & utilities',
      badge: 'True Costs',
      icon: TrendingDown,
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-300',
      getValue: () => formatRWF(liveDashboardData.totalExpenses, hideFinancials),
      getSubtitle: () => 'Overhead & landed cost',
      actionLabel: 'Breakdown',
      onAction: () => {
        handleModuleClick('Expenses')
        setActivePage('All Expenses')
      }
    },
    {
      id: 'stock_value',
      aliases: ['stock_value', 'products'],
      name: 'Products & Stock Value',
      navModule: 'Products',
      navPage: 'Stock',
      desc: 'Physical inventory on shelves & landed valuation',
      badge: 'Stock Shelf',
      icon: Package,
      color: 'text-[#9EDCFF]',
      badgeBg: 'bg-white/15 text-[#9EDCFF]',
      getValue: () => formatRWF(liveDashboardData.stockValue, hideFinancials),
      getSubtitle: () => `${liveDashboardData.inventoryCount || 0} items on shelf`,
      actionLabel: 'Stock Shelf',
      onAction: () => {
        if (navMap['Products']) {
          handleModuleClick('Products')
          setActivePage((navMap['Products'] || ['Stock'])[1] || 'Stock')
        } else if (navMap['Products & Stock']) {
          handleModuleClick('Products & Stock')
          setActivePage('All Products')
        } else if (navMap['Farm Inventory']) {
          handleModuleClick('Farm Inventory')
          setActivePage('Farm Inputs')
        } else {
          handleModuleClick('Products')
          setActivePage('Stock')
        }
      }
    },
    {
      id: 'spendable_cash',
      aliases: ['spendable_cash', 'money'],
      name: 'Real Spendable Cash',
      navModule: 'Overview',
      navPage: 'Where Is My Money',
      desc: 'Cash in till, MTN MoMo Business & Bank balance',
      badge: 'In Till',
      icon: Wallet,
      color: 'text-[#9EDCFF]',
      badgeBg: 'bg-[#218DFF]/20 text-white',
      getValue: () => formatRWF(liveDashboardData.spendable, hideFinancials),
      getSubtitle: () => 'Cash + MoMo + Bank',
      actionLabel: 'Reconcile',
      onAction: () => {
        handleModuleClick('Overview')
        setActivePage('Where Is My Money')
      }
    },
    {
      id: 'net_profit',
      aliases: ['net_profit', 'profit'],
      name: 'Estimated Net Profit',
      navModule: 'Reports',
      navPage: 'Profit & Loss',
      desc: 'Net margin after direct costs & expenses',
      badge: 'Profit Margin',
      icon: BadgeDollarSign,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300',
      getValue: () => formatRWF(liveDashboardData.netProfit, hideFinancials),
      getSubtitle: () => 'Verified retained profit',
      actionLabel: 'P&L Statement',
      onAction: () => {
        handleModuleClick('Reports')
        setActivePage('Profit & Loss')
      }
    },
    {
      id: 'production',
      aliases: ['production', 'batches'],
      name: 'Production & Batches',
      navModule: 'Production',
      navPage: 'Batches',
      desc: 'Manufacturing batches, recipe yields & outputs',
      badge: 'Production',
      icon: Factory,
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/20 text-purple-300',
      getValue: () => `${liveDashboardData.productionCount || 0} Active Batches`,
      getSubtitle: () => 'Recipe & yield monitoring',
      actionLabel: 'Batches',
      onAction: () => {
        if (navMap['Production']) {
          handleModuleClick('Production')
          setActivePage('Batches')
        } else {
          handleModuleClick('Overview')
          setActivePage('Dashboard')
        }
      }
    },
    {
      id: 'services_jobs',
      aliases: ['services_jobs', 'jobs'],
      name: 'Jobs & Bookings',
      navModule: 'Jobs & Bookings',
      navPage: 'All Jobs',
      desc: 'Customer bookings, staff schedule & completed jobs',
      badge: 'Bookings',
      icon: Calendar,
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/20 text-cyan-300',
      getValue: () => 'Calendar Active',
      getSubtitle: () => 'Client appointments & tasks',
      actionLabel: 'Jobs & Bookings',
      onAction: () => {
        if (navMap['Jobs & Bookings']) {
          handleModuleClick('Jobs & Bookings')
          setActivePage('All Jobs')
        } else if (navMap['Services']) {
          handleModuleClick('Services')
          setActivePage('Service Catalogue')
        } else {
          handleModuleClick('Overview')
          setActivePage('Dashboard')
        }
      }
    },
    {
      id: 'agriculture_farm',
      aliases: ['agriculture_farm', 'livestock'],
      name: 'Livestock & Farm Records',
      navModule: 'Livestock',
      navPage: 'Animal Register',
      desc: 'Animal register, feed duration & crop cycles',
      badge: 'Farm Status',
      icon: Activity,
      color: 'text-lime-400',
      badgeBg: 'bg-lime-500/20 text-lime-300',
      getValue: () => `${demoMetrics.survivalMonths || 6} Mo Feed Left`,
      getSubtitle: () => 'Feed & herd health tracker',
      actionLabel: 'Animal Register',
      onAction: () => {
        if (navMap['Livestock']) {
          handleModuleClick('Livestock')
          setActivePage('Animal Register')
        } else {
          handleModuleClick('Overview')
          setActivePage('Dashboard')
        }
      }
    },
    {
      id: 'hospitality_orders',
      aliases: ['hospitality_orders', 'orders'],
      name: 'Restaurant Orders & Rooms',
      navModule: 'Restaurant & Bar',
      navPage: 'Orders & Kitchen Queue',
      desc: 'Live kitchen orders, table bills & room check-ins',
      badge: 'Hospitality',
      icon: UtensilsCrossed,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300',
      getValue: () => 'Kitchen Queue Live',
      getSubtitle: () => 'Tables & room folios',
      actionLabel: 'Kitchen Orders',
      onAction: () => {
        if (navMap['Restaurant & Bar']) {
          handleModuleClick('Restaurant & Bar')
          setActivePage('Orders & Kitchen Queue')
        } else {
          handleModuleClick('Overview')
          setActivePage('Dashboard')
        }
      }
    },
    {
      id: 'survival_runway',
      aliases: ['survival_runway'],
      name: 'Operations Safety Runway',
      navModule: 'Overview',
      navPage: 'Survival Runway & AI Advice',
      desc: 'Six-month business survival safety indicator',
      badge: 'Runway Score',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300',
      getValue: () => `${demoMetrics.survivalMonths || 6} Months`,
      getSubtitle: () => 'Survival runway protected',
      actionLabel: 'AI Advice',
      onAction: () => {
        handleModuleClick('Overview')
        setActivePage('Survival Runway & AI Advice')
      }
    }
  ]
}

