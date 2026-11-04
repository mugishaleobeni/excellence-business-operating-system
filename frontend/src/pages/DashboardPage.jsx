import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { formatRWF, amountToWords } from '../utils/currencyWords'
import WhereIsMyMoneyPanel from '../components/dashboard/WhereIsMyMoneyPanel'
import FarmingEnhancementsPanel from '../components/dashboard/FarmingEnhancementsPanel'
import DocumentsAndIntegrationsPanel from '../components/dashboard/DocumentsAndIntegrationsPanel'
import DocumentsAndSharingPanel from '../components/dashboard/documents/DocumentsAndSharingPanel'
import UniversalReportPanel from '../components/dashboard/UniversalReportPanel'
import InteractiveModulePanel from '../components/dashboard/InteractiveModulePanel'
import SixMonthSurvivalWidget from '../components/dashboard/SixMonthSurvivalWidget'
import DashboardCustomizer, { useDashboardPrefs } from '../components/dashboard/DashboardCustomizer'
import LanguageDropdown from '../components/common/LanguageDropdown'
import exbosLogo from "../../logo/exboslogo.png"
import RailNavigation from "../components/dashboard/layout/RailNavigation"
import ContextualSidebar from "../components/dashboard/layout/ContextualSidebar"
import DashboardTopNav from "../components/dashboard/layout/DashboardTopNav"
import WidgetCustomizerModal from "../components/dashboard/layout/WidgetCustomizerModal"
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Truck,
  Wallet,
  Users,
  BarChart3,
  FileText,
  Plug,
  Settings,
  Factory,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Eye,
  EyeOff,
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Utensils,
  BedDouble,
  Sliders,
  Plus,
  Megaphone,
  HelpCircle,
  LogOut,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Layers,
  Check,
  UtensilsCrossed,
  Calendar,
  ClipboardList,
  Wheat,
  Activity,
  HeartPulse,
  Coffee,
  Boxes,
  ScrollText,
  BadgeDollarSign
} from 'lucide-react'

const MODULE_ICONS = {
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

const MODULE_SHORT_LABELS = {
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

const DASHBOARD_QUICK_ACTIONS = {
  'make-and-sell': [
    { label: 'New Sale', module: 'Sales', page: 'All Sales' },
    { label: 'New Batch', module: 'Production', page: 'Batches' },
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

export default function DashboardPage() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    hideFinancials,
    setHideFinancials,
    user,
    logout,
    architectures,
    superAdminBroadcast,
    transactions,
    demoWorkspaces,
    addDemoRecord,
    addTransaction
  } = useExbos()

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // 1. Resolve initial Architecture (URL > localStorage > user profile > default 'buy-and-sell')
  const [activeArchId, setActiveArchId] = useState(() => {
    return (
      searchParams.get('arch') ||
      localStorage.getItem('exbos_active_arch') ||
      user?.architectureId ||
      'buy-and-sell'
    )
  })

  // 2. Resolve initial Module (URL > localStorage > default 'Overview')
  const [activeModule, setActiveModule] = useState(() => {
    const archId =
      searchParams.get('arch') ||
      localStorage.getItem('exbos_active_arch') ||
      user?.architectureId ||
      'buy-and-sell'
    const arch = architectures?.find((a) => a.id === archId) || architectures?.[1] || {}
    const nav = arch.navigation || {}
    const urlMod = searchParams.get('module') || searchParams.get('mod')
    const savedMod = localStorage.getItem(`exbos_active_module_${archId}`)
    const targetMod = urlMod || savedMod
    if (targetMod && nav[targetMod]) {
      return targetMod
    }
    return 'Overview'
  })

  // 3. Resolve initial Subpage (URL > localStorage > default 'Dashboard' or first subpage)
  const [activePage, setActivePage] = useState(() => {
    const archId =
      searchParams.get('arch') ||
      localStorage.getItem('exbos_active_arch') ||
      user?.architectureId ||
      'buy-and-sell'
    const arch = architectures?.find((a) => a.id === archId) || architectures?.[1] || {}
    const nav = arch.navigation || {}
    const urlMod = searchParams.get('module') || searchParams.get('mod')
    const savedMod = localStorage.getItem(`exbos_active_module_${archId}`)
    const targetMod = (urlMod || savedMod) && nav[urlMod || savedMod] ? (urlMod || savedMod) : 'Overview'
    const pages = nav[targetMod] || ['Dashboard']

    const urlPage = searchParams.get('page') || searchParams.get('sub')
    const savedPage = localStorage.getItem(`exbos_active_page_${archId}`)
    const targetPage = urlPage || savedPage
    if (targetPage && pages.includes(targetPage)) {
      return targetPage
    }
    return pages[0] || 'Dashboard'
  })

  // Keep URL parameters and localStorage synchronized so on refresh the user stays on their exact page
  useEffect(() => {
    const currentUrlArch = searchParams.get('arch')
    const currentUrlMod = searchParams.get('module')
    const currentUrlPage = searchParams.get('page')

    if (
      currentUrlArch !== activeArchId ||
      currentUrlMod !== activeModule ||
      currentUrlPage !== activePage
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('arch', activeArchId)
          if (activeModule) next.set('module', activeModule)
          if (activePage) next.set('page', activePage)
          return next
        },
        { replace: true }
      )
    }

    try {
      localStorage.setItem('exbos_active_arch', activeArchId)
      localStorage.setItem(`exbos_active_module_${activeArchId}`, activeModule)
      localStorage.setItem(`exbos_active_page_${activeArchId}`, activePage)
    } catch (e) {
      // ignore
    }
  }, [activeArchId, activeModule, activePage, searchParams, setSearchParams])

  // Listen for browser Back/Forward navigation changes in searchParams
  useEffect(() => {
    const urlArch = searchParams.get('arch')
    const urlMod = searchParams.get('module')
    const urlPage = searchParams.get('page')

    if (urlArch && urlArch !== activeArchId) {
      setActiveArchId(urlArch)
    }
    if (urlMod && urlMod !== activeModule) {
      setActiveModule(urlMod)
    }
    if (urlPage && urlPage !== activePage) {
      setActivePage(urlPage)
    }
  }, [searchParams])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_dismissed_alert_ids')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Auto-hide notification dropdown when clicking outside
  useEffect(() => {
    if (!notifOpen) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const [chartPeriod, setChartPeriod] = useState('Monthly')
  const [hospitalityMode, setHospitalityMode] = useState('restaurant') // 'restaurant' | 'accommodation'
  const [dismissBroadcast, setDismissBroadcast] = useState(false)
  const [workspaceScrolled, setWorkspaceScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [addCardModalOpen, setAddCardModalOpen] = useState(false)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [workflowType, setWorkflowType] = useState('sale') // 'sale' | 'expense' | 'inventory' | 'customer' | 'supplier'
  const [workflowTitle, setWorkflowTitle] = useState('')
  const [workflowAmount, setWorkflowAmount] = useState('')
  const [workflowParty, setWorkflowParty] = useState('')
  const [workflowAccount, setWorkflowAccount] = useState('MoMo Business (MTN)')
  const [workflowQty, setWorkflowQty] = useState('1')
  const [workflowUnitCost, setWorkflowUnitCost] = useState('')
  const [workflowSellingPrice, setWorkflowSellingPrice] = useState('')
  const [workflowNotice, setWorkflowNotice] = useState('')

  // User-configurable active overview cards (4 default cards per request)
  const [visibleMetricCards, setVisibleMetricCards] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_visible_metric_cards')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      // ignore
    }
    return ['owed_to_me', 'i_owe', 'expenses', 'income']
  })

  const toggleMetricCardVisibility = (cardId) => {
    setVisibleMetricCards((prev) => {
      const next = prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
      try {
        localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
      } catch (e) {
        // ignore
      }
      return next
    })
  }

  const handleWorkspaceScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    setWorkspaceScrolled(scrollTop > 16)
    const maxScroll = scrollHeight - clientHeight
    const pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0
    setScrollProgress(Math.min(100, Math.max(0, pct)))
  }
  const { prefs: dashPrefs, toggleWidget, toggleCard, move: moveWidget, reset: resetDashPrefs } = useDashboardPrefs()
  const widgetStyle = (id) => ({
    order: dashPrefs.order.indexOf(id),
    display: dashPrefs.hidden[id] ? 'none' : 'block'
  })

  // Hybrid Selective Stock Switch Demo State
  const [hybridItems, setHybridItems] = useState([
    { id: 1, name: 'Samsung A55 Screen Assembly', type: 'Product', price: 95000, cost: 62000, trackStock: true, stock: 14 },
    { id: 2, name: 'Motherboard Micro-Soldering Service', type: 'Service', price: 45000, cost: 5000, trackStock: false, stock: 'N/A' },
    { id: 3, name: 'Original 45W Fast Charger', type: 'Product', price: 28000, cost: 16500, trackStock: true, stock: 32 },
    { id: 4, name: 'On-Site Network Installation Job', type: 'Project/Job', price: 380000, cost: 190000, trackStock: false, stock: 'Milestone 2/3' }
  ])

  useEffect(() => {
    const qArch = searchParams.get('arch')
    if (qArch && architectures.some((a) => a.id === qArch)) {
      setActiveArchId(qArch)
    }
  }, [searchParams, architectures])

  // Global Keyboard Shortcut: Ctrl+S / Cmd+S / Ctrl+K / Cmd+K focuses Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey
      const key = e.key?.toLowerCase()
      if (isCtrlOrMeta && (key === 's' || key === 'k')) {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentArch =
    architectures.find((a) => a.id === activeArchId) || architectures[1]
  const navMap = currentArch.navigation || {}
  const moduleKeys = Object.keys(navMap)
  const subPages = navMap[activeModule] || ['Dashboard']

  const pinnedList = useMemo(
    () => (activeArchId === 'make-and-sell' ? ['Documents', 'Integrations', 'Settings'] : ['Documents', 'Integrations']),
    [activeArchId]
  )

  const mainModules = useMemo(
    () => moduleKeys.filter((mod) => !pinnedList.includes(mod)),
    [moduleKeys, pinnedList]
  )
  const pinnedModules = useMemo(
    () => pinnedList.filter((mod) => navMap[mod] || moduleKeys.includes(mod)),
    [navMap, moduleKeys, pinnedList]
  )

  // Active Demo Workspace & User Identity for Current Architecture
  const activeDemoWorkspace =
    demoWorkspaces?.[activeArchId] || {}
  const demoMetrics = activeDemoWorkspace.metrics || {}
  const isUserMatchingArch = user && user.architectureId === activeArchId
  const activeOwnerName = isUserMatchingArch
    ? user.name
    : activeDemoWorkspace.ownerName || `${currentArch.shortName} Business Owner`
  const activeBusinessName = isUserMatchingArch
    ? user.businessName
    : activeDemoWorkspace.businessName || `${currentArch.shortName} Enterprise`
  const activeEmail = isUserMatchingArch
    ? user.email
    : activeDemoWorkspace.email || 'owner@exbos.rw'
  const activeInitials =
    activeBusinessName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'EB'

  // Strictly filter transactions by active architecture
  const archTransactions = useMemo(() => {
    return (transactions || []).filter(
      (tx) => (tx.architectureId || 'buy-and-sell') === activeArchId
    )
  }, [transactions, activeArchId])

  const handleArchSwitch = (newArchId) => {
    setActiveArchId(newArchId)
    const newArch = architectures?.find((a) => a.id === newArchId) || architectures?.[1] || {}
    const nav = newArch.navigation || {}
    const savedMod = localStorage.getItem(`exbos_active_module_${newArchId}`)
    const nextMod = savedMod && nav[savedMod] ? savedMod : 'Overview'
    const subList = nav[nextMod] || ['Dashboard']
    const savedPage = localStorage.getItem(`exbos_active_page_${newArchId}`)
    const nextPage = savedPage && subList.includes(savedPage) ? savedPage : (subList[0] || 'Dashboard')

    setActiveModule(nextMod)
    setActivePage(nextPage)
  }

  const handleModuleClick = (mod) => {
    setActiveModule(mod)
    const firstSub = (navMap[mod] || ['Dashboard'])[0]
    setActivePage(firstSub)
    setMobileSidebarOpen(false)
  }

  const [widgetSearch, setWidgetSearch] = useState('')

  // Live aggregated financial and operational data across all navigation modules
  const liveDashboardData = useMemo(() => {
    const records = activeDemoWorkspace.records || {}
    const salesList = records['Sales'] || []
    const purchasesList = records['Purchases'] || []
    const expensesList = records['Expenses'] || []
    const inventoryList = records['Inventory'] || []
    const customersList = records['Customers'] || []
    const suppliersList = records['Suppliers'] || []
    const productionList = records['Production'] || []

    const inTx = archTransactions.filter((t) => t.type === 'in').reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)
    const outTx = archTransactions.filter((t) => t.type === 'out').reduce((acc, t) => acc + (Number(t.amountRWF) || 0), 0)

    const rawSales = salesList.reduce((acc, s) => acc + (Number(s.amountRWF) || 0), 0) + inTx
    const totalSales = rawSales > 0 ? rawSales : (demoMetrics.monthlyRevenueRWF ?? 0)

    const rawPurchases = purchasesList.reduce((acc, p) => acc + (Number(p.amountRWF) || 0), 0)
    const totalPurchases = rawPurchases > 0 ? rawPurchases : (demoMetrics.monthlyPurchasesRWF ?? 0)

    const rawExpenses = expensesList.reduce((acc, e) => acc + (Number(e.amountRWF) || 0), 0) + outTx
    const totalExpenses = rawExpenses > 0 ? rawExpenses : (demoMetrics.todayCostsRWF ? demoMetrics.todayCostsRWF * 22 : 0)

    const rawCustDebts = customersList.reduce((acc, c) => acc + (Number(c.balanceOwedRWF ?? c.amountRWF) || 0), 0)
    const customerDebts = rawCustDebts > 0 ? rawCustDebts : (demoMetrics.owedToMeRWF ?? 0)

    const rawSuppDebts = suppliersList.reduce((acc, s) => acc + (Number(s.amountRWF ?? s.balanceOwedRWF) || 0), 0)
    const supplierDebts = rawSuppDebts > 0 ? rawSuppDebts : (demoMetrics.iOweSuppliersRWF ?? 0)

    const rawStock = inventoryList.reduce((acc, i) => {
      const q = Number(i.quantity) || 0
      const c = Number(i.purchasePriceRWF ?? i.unitCostRWF) || 0
      return acc + (q * c)
    }, 0)
    const stockValue = rawStock > 0 ? rawStock : (demoMetrics.stockValueRWF ?? 0)

    const netProfit = (totalSales - totalPurchases - totalExpenses) || (demoMetrics.netProfitRWF ?? 0)
    const spendable = (demoMetrics.spendableRWF ?? 0) || Math.max(0, totalSales - totalExpenses)

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      customerDebts,
      supplierDebts,
      stockValue,
      netProfit,
      spendable,
      customersCount: customersList.length,
      suppliersCount: suppliersList.length,
      salesCount: salesList.length,
      purchasesCount: purchasesList.length,
      inventoryCount: inventoryList.length,
      productionCount: productionList.length
    }
  }, [activeDemoWorkspace, archTransactions, demoMetrics])

  // Catalog of customizable widgets for all navigation areas
  const AVAILABLE_WIDGETS = useMemo(() => [
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
      getSubtitle: () => `${liveDashboardData.salesCount} sales records`,
      actionLabel: 'See Trends',
      onAction: () => { handleModuleClick('Sales'); setActivePage('Sales Trends') }
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
      getSubtitle: () => `${liveDashboardData.customersCount} customer accounts`,
      actionLabel: 'Collect',
      onAction: () => { handleModuleClick('Customers'); setActivePage('Outstanding Balances') }
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
      getSubtitle: () => `${liveDashboardData.suppliersCount} suppliers tracked`,
      actionLabel: 'Suppliers',
      onAction: () => { handleModuleClick('Suppliers'); setActivePage('Amounts Owed') }
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
      getSubtitle: () => `${liveDashboardData.purchasesCount} purchase orders`,
      actionLabel: 'Purchases',
      onAction: () => { handleModuleClick('Purchases'); setActivePage('All Purchases') }
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
      onAction: () => { handleModuleClick('Expenses'); setActivePage('All Expenses') }
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
      getSubtitle: () => `${liveDashboardData.inventoryCount} items on shelf`,
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
      onAction: () => { handleModuleClick('Overview'); setActivePage('Where Is My Money') }
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
      onAction: () => { handleModuleClick('Reports'); setActivePage('Profit & Loss') }
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
      getValue: () => `${liveDashboardData.productionCount} Active Batches`,
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
      onAction: () => { handleModuleClick('Overview'); setActivePage('Survival Runway & AI Advice') }
    }
  ], [liveDashboardData, hideFinancials, navMap, demoMetrics])

  const isCardVisible = (widget) => {
    return widget.aliases.some((alias) => visibleMetricCards.includes(alias))
  }

  const handleToggleWidget = (widget) => {
    const isCurrentlyVisible = isCardVisible(widget)
    if (isCurrentlyVisible) {
      const next = visibleMetricCards.filter((id) => !widget.aliases.includes(id))
      setVisibleMetricCards(next)
      try {
        localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
      } catch (e) {}
    } else {
      const next = [...visibleMetricCards, widget.id]
      setVisibleMetricCards(next)
      try {
        localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
      } catch (e) {}
    }
  }

  const handleRemoveCard = (e, widget) => {
    e.stopPropagation()
    const next = visibleMetricCards.filter((id) => !widget.aliases.includes(id))
    setVisibleMetricCards(next)
    try {
      localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
    } catch (e) {}
  }

  const filteredWidgets = useMemo(() => {
    if (!widgetSearch.trim()) return AVAILABLE_WIDGETS
    const q = widgetSearch.toLowerCase()
    return AVAILABLE_WIDGETS.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.navModule.toLowerCase().includes(q) ||
        w.desc.toLowerCase().includes(q) ||
        w.badge.toLowerCase().includes(q)
    )
  }, [AVAILABLE_WIDGETS, widgetSearch])

  // Dynamic business & platform alerts (auto-hides hardcoded mock demo alerts in live mode)
  const activeBusinessAlerts = useMemo(() => {
    const list = []
    const records = activeDemoWorkspace.records || {}
    const customers = records['Customers'] || []

    // Has user entered live transactions or created custom customer records?
    const hasLiveActivity = archTransactions.length > 0 || customers.some((c) => !String(c.id || '').startsWith('CUS-201'))

    // 1. Overdue Customer Debt alert:
    // When live or in other architectures, NEVER show the mock "Construction Client #04".
    // Only show if there is an actual customer with debt in the current workspace.
    const overdueCustomer = customers.find((c) => {
      const owes = Number(c.balanceOwedRWF ?? c.amountRWF) || 0
      if (owes <= 0) return false
      // In live mode or in non-buy-and-sell architectures, auto-hide the mock "Construction Client #04"
      if (String(c.title || c.name || '').includes('Construction Client #04') && (hasLiveActivity || activeArchId !== 'buy-and-sell')) {
        return false
      }
      return true
    })

    if (overdueCustomer) {
      const owes = Number(overdueCustomer.balanceOwedRWF ?? overdueCustomer.amountRWF) || 0
      list.push({
        id: `debt-${overdueCustomer.id || overdueCustomer.title}`,
        type: 'debt',
        title: 'Overdue Customer Debt',
        message: `${overdueCustomer.title || overdueCustomer.name} is overdue (${formatRWF(owes, hideFinancials)}).`,
        bg: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
        actionLabel: 'View Balance',
        onAction: () => {
          handleModuleClick('Customers')
          setActivePage((navMap['Customers'] || ['Customer Directory'])[0])
          setNotifOpen(false)
        }
      })
    }

    // 2. Cash & MoMo Reconciled:
    // Auto-hidden when live transactions exist or when dismissed
    if (!hasLiveActivity && !dismissedAlertIds.includes('momo-reconciled') && activeArchId === 'buy-and-sell') {
      list.push({
        id: 'momo-reconciled',
        type: 'reconciled',
        title: 'Cash & MoMo Reconciled',
        message: 'Morning till matches expected balance.',
        bg: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200',
        actionLabel: 'Where Is My Money',
        onAction: () => {
          handleModuleClick('Overview')
          setActivePage('Where Is My Money')
          setNotifOpen(false)
        }
      })
    }

    return list.filter((item) => !dismissedAlertIds.includes(item.id))
  }, [activeDemoWorkspace, archTransactions, activeArchId, hideFinancials, dismissedAlertIds, navMap])

  const chartSeries =
    chartPeriod === 'Daily'
      ? [
          { label: 'MON', val: 380000, pct: 45 },
          { label: 'TUE', val: 420000, pct: 52 },
          { label: 'WED', val: 395000, pct: 48 },
          { label: 'THU', val: 540000, pct: 68 },
          { label: 'FRI', val: 610000, pct: 76 },
          { label: 'SAT', val: 750000, pct: 94 },
          { label: 'SUN', val: 510000, pct: 64 }
        ]
      : chartPeriod === 'Weekly'
      ? [
          { label: 'WK 1', val: 1650000, pct: 55 },
          { label: 'WK 2', val: 1920000, pct: 64 },
          { label: 'WK 3', val: 2180000, pct: 73 },
          { label: 'WK 4', val: 2850000, pct: 95 }
        ]
      : [
          { label: 'JAN', val: 1420000, pct: 38 },
          { label: 'FEB', val: 1890000, pct: 54 },
          { label: 'MAR', val: 2120000, pct: 60 },
          { label: 'APR', val: 2150000, pct: 61 },
          { label: 'MAY', val: 2680000, pct: 78 },
          { label: 'JUN', val: 2410000, pct: 69 },
          { label: 'JUL', val: 3280000, pct: 96 }
        ]

  // Interactive Financial Curve Timeframe & Hover State
  const [graphTimeframe, setGraphTimeframe] = useState('Months') // 'Days' | 'Weeks' | 'Months'
  const [activeCurveIndex, setActiveCurveIndex] = useState(5) // default to Jun/peak

  // Multi-Timeframe Datasets for all 6 Architectures
  const financialDatasets = {
    'buy-and-sell': {
      Days: [
        { label: 'Mon', income: 480000, expense: 310000, change: '+18%' },
        { label: 'Tue', income: 520000, expense: 280000, change: '+22%' },
        { label: 'Wed', income: 410000, expense: 390000, change: '+5%' },
        { label: 'Thu', income: 680000, expense: 340000, change: '+29%' },
        { label: 'Fri', income: 790000, expense: 420000, change: '+34%' },
        { label: 'Sat', income: 940000, expense: 480000, change: '+41%' },
        { label: 'Sun', income: 360000, expense: 190000, change: '+14%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 2450000, expense: 1420000, change: '+19%' },
        { label: 'Wk 2', income: 2890000, expense: 1650000, change: '+26%' },
        { label: 'Wk 3', income: 3120000, expense: 1810000, change: '+31%' },
        { label: 'Wk 4', income: 3680000, expense: 2100000, change: '+38%' }
      ],
      Months: [
        { label: 'Jan', income: 14200000, expense: 8900000, change: '+12%' },
        { label: 'Feb', income: 16800000, expense: 9800000, change: '+18%' },
        { label: 'Mar', income: 15400000, expense: 9200000, change: '+14%' },
        { label: 'Apr', income: 17900000, expense: 10400000, change: '+21%' },
        { label: 'May', income: 21500000, expense: 11900000, change: '+28%' },
        { label: 'Jun', income: 24800000, expense: 13200000, change: '+37%' },
        { label: 'Jul', income: 26200000, expense: 14100000, change: '+39%' },
        { label: 'Aug', income: 27500000, expense: 14600000, change: '+42%' },
        { label: 'Sep', income: 23100000, expense: 12800000, change: '+25%' },
        { label: 'Oct', income: 25400000, expense: 13700000, change: '+31%' },
        { label: 'Nov', income: 28900000, expense: 15200000, change: '+45%' },
        { label: 'Dec', income: 31400000, expense: 16800000, change: '+52%' }
      ]
    },
    'make-and-sell': {
      Days: [
        { label: 'Mon', income: 430000, expense: 290000, change: '+16%' },
        { label: 'Tue', income: 490000, expense: 310000, change: '+20%' },
        { label: 'Wed', income: 530000, expense: 340000, change: '+22%' },
        { label: 'Thu', income: 580000, expense: 320000, change: '+27%' },
        { label: 'Fri', income: 720000, expense: 410000, change: '+33%' },
        { label: 'Sat', income: 860000, expense: 450000, change: '+39%' },
        { label: 'Sun', income: 410000, expense: 220000, change: '+17%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 2150000, expense: 1320000, change: '+18%' },
        { label: 'Wk 2', income: 2680000, expense: 1540000, change: '+24%' },
        { label: 'Wk 3', income: 2940000, expense: 1690000, change: '+29%' },
        { label: 'Wk 4', income: 3420000, expense: 1950000, change: '+36%' }
      ],
      Months: [
        { label: 'Jan', income: 13500000, expense: 8400000, change: '+14%' },
        { label: 'Feb', income: 15200000, expense: 9100000, change: '+17%' },
        { label: 'Mar', income: 16900000, expense: 9900000, change: '+22%' },
        { label: 'Apr', income: 18400000, expense: 10600000, change: '+26%' },
        { label: 'May', income: 20800000, expense: 11800000, change: '+31%' },
        { label: 'Jun', income: 23600000, expense: 12900000, change: '+38%' },
        { label: 'Jul', income: 25100000, expense: 13800000, change: '+41%' },
        { label: 'Aug', income: 26400000, expense: 14200000, change: '+44%' },
        { label: 'Sep', income: 22800000, expense: 12600000, change: '+27%' },
        { label: 'Oct', income: 24900000, expense: 13500000, change: '+33%' },
        { label: 'Nov', income: 27800000, expense: 14900000, change: '+43%' },
        { label: 'Dec', income: 30500000, expense: 16200000, change: '+49%' }
      ]
    },
    'services': {
      Days: [
        { label: 'Mon', income: 380000, expense: 180000, change: '+24%' },
        { label: 'Tue', income: 620000, expense: 240000, change: '+38%' },
        { label: 'Wed', income: 450000, expense: 210000, change: '+26%' },
        { label: 'Thu', income: 890000, expense: 320000, change: '+47%' },
        { label: 'Fri', income: 980000, expense: 360000, change: '+52%' },
        { label: 'Sat', income: 320000, expense: 140000, change: '+21%' },
        { label: 'Sun', income: 150000, expense: 80000, change: '+10%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 1980000, expense: 920000, change: '+25%' },
        { label: 'Wk 2', income: 2450000, expense: 1080000, change: '+33%' },
        { label: 'Wk 3', income: 2850000, expense: 1240000, change: '+39%' },
        { label: 'Wk 4', income: 3340000, expense: 1410000, change: '+46%' }
      ],
      Months: [
        { label: 'Jan', income: 12400000, expense: 6200000, change: '+21%' },
        { label: 'Feb', income: 14800000, expense: 7100000, change: '+27%' },
        { label: 'Mar', income: 16200000, expense: 7800000, change: '+30%' },
        { label: 'Apr', income: 18100000, expense: 8600000, change: '+35%' },
        { label: 'May', income: 21200000, expense: 9800000, change: '+42%' },
        { label: 'Jun', income: 24500000, expense: 10900000, change: '+49%' },
        { label: 'Jul', income: 25800000, expense: 11400000, change: '+51%' },
        { label: 'Aug', income: 27100000, expense: 11900000, change: '+54%' },
        { label: 'Sep', income: 21900000, expense: 10100000, change: '+36%' },
        { label: 'Oct', income: 24600000, expense: 11200000, change: '+44%' },
        { label: 'Nov', income: 28400000, expense: 12600000, change: '+53%' },
        { label: 'Dec', income: 32100000, expense: 13900000, change: '+60%' }
      ]
    },
    'agriculture': {
      Days: [
        { label: 'Mon', income: 320000, expense: 390000, change: '-4%' },
        { label: 'Tue', income: 580000, expense: 260000, change: '+28%' },
        { label: 'Wed', income: 640000, expense: 280000, change: '+32%' },
        { label: 'Thu', income: 510000, expense: 310000, change: '+22%' },
        { label: 'Fri', income: 880000, expense: 350000, change: '+43%' },
        { label: 'Sat', income: 1050000, expense: 420000, change: '+49%' },
        { label: 'Sun', income: 420000, expense: 180000, change: '+20%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 2100000, expense: 1450000, change: '+18%' },
        { label: 'Wk 2', income: 2650000, expense: 1620000, change: '+26%' },
        { label: 'Wk 3', income: 3150000, expense: 1780000, change: '+35%' },
        { label: 'Wk 4', income: 3820000, expense: 1980000, change: '+44%' }
      ],
      Months: [
        { label: 'Jan', income: 11800000, expense: 7800000, change: '+14%' },
        { label: 'Feb', income: 13900000, expense: 8600000, change: '+19%' },
        { label: 'Mar', income: 17200000, expense: 9800000, change: '+28%' },
        { label: 'Apr', income: 19500000, expense: 10600000, change: '+34%' },
        { label: 'May', income: 22800000, expense: 11900000, change: '+41%' },
        { label: 'Jun', income: 25900000, expense: 13100000, change: '+48%' },
        { label: 'Jul', income: 27400000, expense: 13800000, change: '+51%' },
        { label: 'Aug', income: 28900000, expense: 14400000, change: '+55%' },
        { label: 'Sep', income: 21500000, expense: 11800000, change: '+29%' },
        { label: 'Oct', income: 24800000, expense: 12900000, change: '+38%' },
        { label: 'Nov', income: 28100000, expense: 14200000, change: '+49%' },
        { label: 'Dec', income: 31900000, expense: 15800000, change: '+56%' }
      ]
    },
    'food-and-hospitality': {
      Days: [
        { label: 'Mon', income: 390000, expense: 260000, change: '+19%' },
        { label: 'Tue', income: 440000, expense: 270000, change: '+22%' },
        { label: 'Wed', income: 510000, expense: 290000, change: '+26%' },
        { label: 'Thu', income: 620000, expense: 330000, change: '+31%' },
        { label: 'Fri', income: 980000, expense: 480000, change: '+46%' },
        { label: 'Sat', income: 1250000, expense: 560000, change: '+54%' },
        { label: 'Sun', income: 780000, expense: 350000, change: '+36%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 2380000, expense: 1520000, change: '+21%' },
        { label: 'Wk 2', income: 2840000, expense: 1740000, change: '+29%' },
        { label: 'Wk 3', income: 3260000, expense: 1910000, change: '+36%' },
        { label: 'Wk 4', income: 3980000, expense: 2240000, change: '+47%' }
      ],
      Months: [
        { label: 'Jan', income: 13900000, expense: 8900000, change: '+18%' },
        { label: 'Feb', income: 15800000, expense: 9800000, change: '+23%' },
        { label: 'Mar', income: 17600000, expense: 10500000, change: '+27%' },
        { label: 'Apr', income: 19200000, expense: 11200000, change: '+31%' },
        { label: 'May', income: 22400000, expense: 12600000, change: '+39%' },
        { label: 'Jun', income: 25800000, expense: 13900000, change: '+47%' },
        { label: 'Jul', income: 27900000, expense: 14800000, change: '+51%' },
        { label: 'Aug', income: 29400000, expense: 15500000, change: '+55%' },
        { label: 'Sep', income: 23600000, expense: 13100000, change: '+33%' },
        { label: 'Oct', income: 26100000, expense: 14200000, change: '+40%' },
        { label: 'Nov', income: 29800000, expense: 15900000, change: '+52%' },
        { label: 'Dec', income: 34500000, expense: 17900000, change: '+62%' }
      ]
    },
    'hybrid': {
      Days: [
        { label: 'Mon', income: 460000, expense: 300000, change: '+20%' },
        { label: 'Tue', income: 540000, expense: 280000, change: '+27%' },
        { label: 'Wed', income: 610000, expense: 350000, change: '+30%' },
        { label: 'Thu', income: 690000, expense: 340000, change: '+34%' },
        { label: 'Fri', income: 840000, expense: 410000, change: '+40%' },
        { label: 'Sat', income: 1020000, expense: 490000, change: '+48%' },
        { label: 'Sun', income: 380000, expense: 190000, change: '+18%' }
      ],
      Weeks: [
        { label: 'Wk 1', income: 2280000, expense: 1440000, change: '+20%' },
        { label: 'Wk 2', income: 2790000, expense: 1680000, change: '+27%' },
        { label: 'Wk 3', income: 3180000, expense: 1850000, change: '+33%' },
        { label: 'Wk 4', income: 3750000, expense: 2120000, change: '+42%' }
      ],
      Months: [
        { label: 'Jan', income: 13800000, expense: 8700000, change: '+16%' },
        { label: 'Feb', income: 15900000, expense: 9600000, change: '+21%' },
        { label: 'Mar', income: 17400000, expense: 10200000, change: '+25%' },
        { label: 'Apr', income: 19600000, expense: 11100000, change: '+30%' },
        { label: 'May', income: 22100000, expense: 12300000, change: '+37%' },
        { label: 'Jun', income: 25200000, expense: 13600000, change: '+46%' },
        { label: 'Jul', income: 26900000, expense: 14300000, change: '+49%' },
        { label: 'Aug', income: 28400000, expense: 15000000, change: '+53%' },
        { label: 'Sep', income: 23200000, expense: 12900000, change: '+32%' },
        { label: 'Oct', income: 25800000, expense: 14100000, change: '+39%' },
        { label: 'Nov', income: 29200000, expense: 15600000, change: '+50%' },
        { label: 'Dec', income: 33100000, expense: 17200000, change: '+58%' }
      ]
    }
  }

  const activeArchDatasets =
    financialDatasets[activeArchId] || financialDatasets['buy-and-sell']

  // Compute chart series dynamically: When user inputs real transactions, reflect them in the timeline
  const computedChartData = useMemo(() => {
    const defaultData = activeArchDatasets[graphTimeframe] || activeArchDatasets.Months
    const hasTransactions = archTransactions && archTransactions.length > 0
    if (!hasTransactions) {
      // Clean zero baseline ready for live entries
      return defaultData.map((d) => ({
        ...d,
        income: 0,
        expense: 0,
        change: '+0%'
      }))
    }

    // Accumulate total user recorded money in and money out for this architecture
    const totalIn = archTransactions.filter((t) => t.type === 'in').reduce((acc, t) => acc + (t.amountRWF || 0), 0)
    const totalOut = archTransactions.filter((t) => t.type === 'out').reduce((acc, t) => acc + (t.amountRWF || 0), 0)

    // Distribute progressively across current timeframe points with latest having highest weight
    return defaultData.map((d, idx) => {
      const weight = (idx + 1) / defaultData.length
      const inc = Math.round(totalIn * weight)
      const exp = Math.round(totalOut * weight)
      return {
        ...d,
        income: inc,
        expense: exp,
        change: inc > exp ? `+${Math.round(((inc - exp) / (exp || 1)) * 100)}%` : '+0%'
      }
    })
  }, [activeArchDatasets, graphTimeframe, archTransactions])

  const currentChartData = computedChartData

  // Generate smooth SVG curve path matching reference wave
  const buildSmoothPath = (data, valueKey, width = 800, height = 220, paddingY = 24) => {
    if (!data || data.length === 0) return { linePath: '', areaPath: '', points: [] }
    const maxVal = Math.max(...data.map((d) => d[valueKey] || 1))
    const minVal = Math.min(...data.map((d) => d[valueKey] || 0)) * 0.7
    const range = Math.max(maxVal - minVal, 1)

    const stepX = (width - 40) / (data.length - 1)
    const points = data.map((d, i) => {
      const x = 20 + i * stepX
      const normalized = (d[valueKey] - minVal) / range
      const y = height - paddingY - normalized * (height - paddingY * 2)
      return { x, y, data: d }
    })

    if (points.length === 1) {
      return { linePath: `M ${points[0].x} ${points[0].y}`, areaPath: '', points }
    }

    // Catmull-Rom to Cubic Bézier spline for soft wave curves
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    const areaPath = `${d} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    return { linePath: d, areaPath, points }
  }

  return (
    <div className="exbos-dashboard-bg">
      {/* THREE-PANEL SHELL (Section 6.3) */}
      <div
        className={`w-full dashboard-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${sidebarCompact && !sidebarCollapsed ? 'is-sidebar-compact' : ''}`}
      >
        {/* PANEL A: PRIMARY NAVIGATION RAIL */}
        <RailNavigation
          exbosLogo={exbosLogo}
          mainModules={mainModules}
          pinnedModules={pinnedModules}
          MODULE_ICONS={MODULE_ICONS}
          MODULE_SHORT_LABELS={MODULE_SHORT_LABELS}
          activeModule={activeModule}
          handleModuleClick={handleModuleClick}
          toggleTheme={toggleTheme}
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
        />

        {/* PANEL B: SECONDARY NAVIGATION SIDEBAR */}
        <ContextualSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarCompact={sidebarCompact}
          setSidebarCompact={setSidebarCompact}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          activeOwnerName={activeOwnerName}
          activeBusinessName={activeBusinessName}
          activeInitials={activeInitials}
          subPages={subPages}
          activePage={activePage}
          setActivePage={setActivePage}
          activeModule={activeModule}
          currentArch={currentArch}
        />

        {/* PANEL C: MAIN CONTENT WORKSPACE */}
        <main className="exbos-glass-workspace min-w-0">
          {/* Top Sticky Header Bar with Scroll Blur & Indicator */}
          <DashboardTopNav
            workspaceScrolled={workspaceScrolled}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
            currentArch={currentArch}
            activeModule={activeModule}
            activePage={activePage}
            searchInputRef={searchInputRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            notifRef={notifRef}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            activeBusinessAlerts={activeBusinessAlerts}
            setDismissedAlertIds={setDismissedAlertIds}
            user={user}
            logout={logout}
            navigate={navigate}
            scrollProgress={scrollProgress}
          />

          {/* SCROLLABLE INNER WORKSPACE BODY WITH ANIMATED CARDS */}
          <div
            className="exbos-workspace-scrollable-body space-y-6"
            onScroll={handleWorkspaceScroll}
          >

          {/* SECTION 5.9 DESIGN RULE FOR ALL SIX: TOP ANSWERS THREE PLAIN-LANGUAGE QUESTIONS */}


          {/* DYNAMIC CONTENT ROUTING INSIDE MAIN WORKSPACE */}
          {activePage === 'Where Is My Money' || activeModule === 'Finance' ? (
            <WhereIsMyMoneyPanel activeArchId={activeArchId} />
          ) : activeModule === 'Reports' ? (
            <UniversalReportPanel
              activePage={activePage}
              activeArchId={activeArchId}
              currentArch={currentArch}
            />
          ) : activeModule === 'Documents' ? (
            <DocumentsAndSharingPanel
              activePage={activePage}
              activeArchId={activeArchId}
            />
          ) : activeModule === 'Integrations' ? (
            <DocumentsAndIntegrationsPanel
              mode="integrations"
              activePage={activePage}
              activeArchId={activeArchId}
            />
          ) : activeArchId === 'agriculture' && activePage === 'Survival Runway & AI Advice' ? (
            <FarmingEnhancementsPanel activeSubPage={activePage} />
          ) : activeModule !== 'Overview' || activePage !== 'Dashboard' ? (
            <InteractiveModulePanel
              activeArchId={activeArchId}
              currentArch={currentArch}
              activeModule={activeModule}
              activePage={activePage}
              onSwitchArch={handleArchSwitch}
              onSwitchPage={(mod, page) => {
                setActiveModule(mod)
                setActivePage(page)
              }}
            />
          ) : (
            /* CLEAN NEO-GLASSMORPHISM WORKSPACE (Step-by-Step Clean Base following Reference) */
            <div className="flex flex-col gap-6">
              {/* Reference Header: Dashboard / All Your Workflows And Performance */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Dashboard Overview
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9EDCFF]/80 mt-1">
                    Real-time financial status &amp; operational workflows · {currentArch.name}
                  </p>
                </div>

                {/* Header Controls: Customize Widgets + Architecture Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAddCardModalOpen(true)}
                    className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white cursor-pointer flex items-center gap-2 transition-all shadow-sm"
                    title="Add or remove dashboard widgets"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>Customize Widgets</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] text-white">
                      {AVAILABLE_WIDGETS.filter(isCardVisible).length}
                    </span>
                  </button>

                  {(DASHBOARD_QUICK_ACTIONS[activeArchId] || DASHBOARD_QUICK_ACTIONS['buy-and-sell']).map((act, i) => (
                    <button
                      key={act.label}
                      type="button"
                      onClick={() => {
                        handleModuleClick(act.module)
                        setActivePage(act.page)
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all shadow-md ${
                        i === 0
                          ? 'exbos-glass-pill-active border border-white/30 text-white hover:bg-white/30'
                          : 'bg-white/10 hover:bg-white/20 border border-white/20 text-[#9EDCFF] hover:text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4 text-[#9EDCFF]" />
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AGRICULTURE & LIVESTOCK REAL-TIME STATUS BAR (animals by type, feed days left, vet dates due) */}
              {activeArchId === 'agriculture' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Animals by Type */}
                  <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>Animals by Type</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                        63 Herd Total
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">🐷 Pigs (Swine):</span>
                        <span className="font-bold text-white font-mono">57 (12 Gilts, 8 Sows, 3 Boars, 34 Piglets)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">🐔 Poultry:</span>
                        <span className="font-bold text-white font-mono">750 (450 Layers, 300 Broilers)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">🐄 Dairy Cattle:</span>
                        <span className="font-bold text-white font-mono">6 (4 Cows, 2 Calves)</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-semibold text-[11px]">Breeding Ready: 100%</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleModuleClick('Livestock')
                          setActivePage('Animal Register')
                        }}
                        className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <span>Animal Register</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 2. Feed Days Left */}
                  <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
                        <Wheat className="w-4 h-4 text-[#218DFF]" />
                        <span>Feed Days Left</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF]">
                        Optimal Stock
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
                        18.5 Days
                      </div>
                      <p className="text-[11px] text-slate-300">
                        520 kg Tunga Feed &amp; Premix in store · 28 kg/day herd intake
                      </p>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-300 text-[11px]">Run-out forecast: Nov 20</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleModuleClick('Livestock')
                          setActivePage('Feed Management')
                        }}
                        className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <span>Log Feeding</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 3. Vet Dates Due */}
                  <div className="exbos-glass-card p-5 space-y-3 relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <HeartPulse className="w-4 h-4 text-amber-400" />
                        <span>Vet Dates Due</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                        3 Upcoming
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Piglet Iron Injection:</span>
                        <span className="text-amber-300 font-bold font-mono">Due in 2 days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Breeder Sow Deworming:</span>
                        <span className="text-amber-300 font-bold font-mono">Due in 5 days</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Erysipelas Booster:</span>
                        <span className="text-slate-400 font-mono">Due in 12 days</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Biosecurity Level: High</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleModuleClick('Livestock')
                          setActivePage('Health & Vet Care')
                        }}
                        className="text-[#9EDCFF] hover:text-white font-semibold flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                      >
                        <span>Vet Care</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC NEO-GLASS METRIC CARDS (Customizable for all Navigation Modules) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {AVAILABLE_WIDGETS.filter(isCardVisible).map((w) => {
                  const Icon = w.icon
                  return (
                    <div
                      key={w.id}
                      className="exbos-glass-card p-5 flex flex-col justify-between relative overflow-hidden group transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold uppercase tracking-wider ${w.color} flex items-center gap-1.5`}>
                            <Icon className={`w-3.5 h-3.5 ${w.color}`} />
                            <span>{w.name}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.badgeBg}`}>
                              {w.badge}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveCard(e, w)}
                              title={`Remove ${w.name} card`}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/15 text-slate-400 hover:text-rose-300 transition-all cursor-pointer border-0 bg-transparent"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-1">
                          {w.getValue()}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
                        <span className="text-slate-300 text-[11px] truncate max-w-[160px]">
                          {w.getSubtitle()}
                        </span>
                        <button
                          type="button"
                          onClick={w.onAction}
                          className="text-[#9EDCFF] hover:text-white font-semibold cursor-pointer flex items-center gap-1 bg-transparent border-0 p-0 transition-colors"
                        >
                          <span>{w.actionLabel}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* "+ Add Widget / Card" Dashed Card */}
                <div
                  onClick={() => setAddCardModalOpen(true)}
                  className="exbos-glass-card p-5 min-h-[140px] flex flex-col items-center justify-center text-center border-2 border-dashed border-white/20 hover:border-[#218DFF]/60 hover:bg-white/5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/10 group-hover:bg-[#218DFF]/25 border border-white/15 group-hover:border-[#218DFF]/50 flex items-center justify-center text-[#9EDCFF] group-hover:text-white transition-all mb-2 shadow-sm">
                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                  <strong className="text-xs font-orbitron font-bold text-white group-hover:text-[#9EDCFF] transition-colors block">
                    + Add Widget / Card
                  </strong>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors mt-0.5">
                    Sales, Customers, Stock &amp; more
                  </span>
                </div>
              </div>

              {/* MANAGE / CUSTOMIZE WIDGETS MODAL DIALOG */}
              <WidgetCustomizerModal
                isOpen={addCardModalOpen}
                onClose={() => setAddCardModalOpen(false)}
                widgetSearch={widgetSearch}
                setWidgetSearch={setWidgetSearch}
                AVAILABLE_WIDGETS={AVAILABLE_WIDGETS}
                filteredWidgets={filteredWidgets}
                isCardVisible={isCardVisible}
                handleToggleWidget={handleToggleWidget}
                setVisibleMetricCards={setVisibleMetricCards}
              />

              {/* LIVE WORKFLOW & DATA ENTRY MODAL (Direct production entry updating cards, graph, and ledger) */}
              {workflowModalOpen && (
                <div
                  className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-300"
                  onClick={() => setWorkflowModalOpen(false)}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(33,141,255,0.25)] p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#1045CA]/40 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF] shadow-inner">
                          <Plus className="w-5 h-5 text-[#218DFF]" />
                        </div>
                        <div>
                          <h3 className="font-orbitron text-base sm:text-lg font-extrabold text-white tracking-tight">
                            Record Live Workflow Entry
                          </h3>
                          <p className="text-xs text-[#9EDCFF]/80 mt-0.5">
                            Data updates your Overview KPI cards, Financial Curve, and Ledger instantly
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWorkflowModalOpen(false)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer border border-white/15 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {workflowNotice && (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{workflowNotice}</span>
                      </div>
                    )}

                    {/* Entry Type Selector */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10">
                      {[
                        { id: 'sale', label: 'Sale / Income', icon: TrendingUp },
                        { id: 'expense', label: 'Expense', icon: TrendingDown },
                        { id: 'inventory', label: 'Stock / Item', icon: Package },
                        { id: 'customer', label: 'Receivable', icon: Users },
                        { id: 'supplier', label: 'Payable', icon: Truck }
                      ].map((t) => {
                        const isCur = workflowType === t.id
                        const TIcon = t.icon
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setWorkflowType(t.id)}
                            className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 cursor-pointer transition-all border ${
                              isCur
                                ? 'bg-gradient-to-r from-[#218DFF] to-[#1045CA] border-[#9EDCFF]/50 text-white shadow-sm'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <TIcon className="w-3.5 h-3.5" />
                            <span className="truncate">{t.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Form Fields */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!workflowTitle.trim()) return

                        const amt = Number(workflowAmount) || 0
                        const uCost = Number(workflowUnitCost) || 0
                        const sPrice = Number(workflowSellingPrice) || 0
                        const qty = Number(workflowQty) || 1

                        if (workflowType === 'sale') {
                          addDemoRecord(activeArchId, 'Sales', {
                            title: workflowTitle.trim(),
                            subPage: 'Sales Order Entry',
                            customer: workflowParty.trim() || 'Direct Client',
                            amountRWF: amt,
                            paymentMethod: workflowAccount,
                            status: 'Completed Sale'
                          })
                        } else if (workflowType === 'expense') {
                          addDemoRecord(activeArchId, 'Purchases', {
                            title: workflowTitle.trim(),
                            subPage: 'Operating Expenses',
                            supplier: workflowParty.trim() || 'Operational Vendor',
                            amountRWF: amt,
                            status: 'Paid Outflow'
                          })
                        } else if (workflowType === 'inventory') {
                          addDemoRecord(activeArchId, 'Inventory', {
                            title: workflowTitle.trim(),
                            subPage: 'Stock Items',
                            unitCostRWF: uCost,
                            sellingPriceRWF: sPrice,
                            quantity: qty,
                            trackStock: true,
                            status: 'In Stock'
                          })
                        } else if (workflowType === 'customer') {
                          addDemoRecord(activeArchId, 'Customers', {
                            title: workflowTitle.trim(),
                            subPage: 'Customer Balances',
                            phone: workflowParty.trim() || '+250 788 000 000',
                            balanceOwedRWF: amt,
                            status: 'Pending Receivable'
                          })
                        } else if (workflowType === 'supplier') {
                          addDemoRecord(activeArchId, 'Purchases', {
                            title: workflowTitle.trim(),
                            subPage: 'Supplier Balances',
                            supplier: workflowParty.trim() || 'Key Supplier',
                            amountRWF: amt,
                            status: 'Pending Invoice'
                          })
                        }

                        setWorkflowNotice(`Successfully recorded "${workflowTitle.trim()}"! Metrics and curve updated.`)
                        setTimeout(() => {
                          setWorkflowModalOpen(false)
                          setWorkflowNotice('')
                        }, 1200)
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                          {workflowType === 'sale'
                            ? 'Sale Item / Service Rendered *'
                            : workflowType === 'expense'
                            ? 'Expense / Purchase Description *'
                            : workflowType === 'inventory'
                            ? 'Item / Product Name *'
                            : workflowType === 'customer'
                            ? 'Client / Customer Name *'
                            : 'Supplier / Vendor Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={workflowTitle}
                          onChange={(e) => setWorkflowTitle(e.target.value)}
                          placeholder={
                            workflowType === 'sale'
                              ? 'e.g. 5 Bags Cement & Nails'
                              : workflowType === 'expense'
                              ? 'e.g. Monthly Warehouse Rent'
                              : workflowType === 'inventory'
                              ? 'e.g. Samsung 25W Fast Charger'
                              : workflowType === 'customer'
                              ? 'e.g. Kigali Builders Ltd'
                              : 'e.g. Bralirwa Distributor'
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>

                      {workflowType === 'inventory' ? (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                              Unit Cost (RWF)
                            </label>
                            <input
                              type="number"
                              value={workflowUnitCost}
                              onChange={(e) => setWorkflowUnitCost(e.target.value)}
                              placeholder="12000"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                              Sell Price (RWF)
                            </label>
                            <input
                              type="number"
                              value={workflowSellingPrice}
                              onChange={(e) => setWorkflowSellingPrice(e.target.value)}
                              placeholder="18000"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={workflowQty}
                              onChange={(e) => setWorkflowQty(e.target.value)}
                              placeholder="10"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                              Amount (RWF) *
                            </label>
                            <input
                              type="number"
                              required
                              value={workflowAmount}
                              onChange={(e) => setWorkflowAmount(e.target.value)}
                              placeholder="150000"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm font-bold text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                              {workflowType === 'customer'
                                ? 'Client Phone'
                                : workflowType === 'supplier'
                                ? 'Supplier Phone / Ref'
                                : 'Party / Contact'}
                            </label>
                            <input
                              type="text"
                              value={workflowParty}
                              onChange={(e) => setWorkflowParty(e.target.value)}
                              placeholder={
                                workflowType === 'customer' || workflowType === 'supplier'
                                  ? '+250 788 123 456'
                                  : 'Client / Vendor'
                              }
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-[#218DFF]"
                            />
                          </div>
                        </div>
                      )}

                      {(workflowType === 'sale' || workflowType === 'expense') && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                            Account / Payment Channel
                          </label>
                          <select
                            value={workflowAccount}
                            onChange={(e) => setWorkflowAccount(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none"
                          >
                            <option value="Cash in Hand (Main Till)">Cash in Hand (Main Till)</option>
                            <option value="MoMo Business (MTN)">MoMo Business (MTN 0788•••)</option>
                            <option value="Airtel Money (Business)">Airtel Money (Business)</option>
                            <option value="Bank Account (BK Corporate)">Bank Account (BK Corporate)</option>
                            <option value="Equity Bank Business">Equity Bank Business</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/15">
                        <button
                          type="button"
                          onClick={() => setWorkflowModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] border border-white/40 text-xs font-bold text-white cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Save &amp; Update Dashboard</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              <div className="exbos-glass-card p-6 sm:p-7 space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                        Financial Trajectory
                      </span>
                      <span className="text-xs text-slate-300">
                        {currentArch.number} · {currentArch.name}
                      </span>
                    </div>
                    <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
                      Cash Performance Curve
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Visualizing income elevation, true costs, and profit velocity over time.
                    </p>
                  </div>

                  {/* Days / Weeks / Months Switcher Pill (Matching reference UX) */}
                  <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/15 self-start sm:self-auto">
                    {['Days', 'Weeks', 'Months'].map((tab) => {
                      const isActive = graphTimeframe === tab
                      return (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => {
                            setGraphTimeframe(tab)
                            setActiveCurveIndex(
                              tab === 'Days' ? 5 : tab === 'Weeks' ? 2 : 5
                            )
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            isActive
                              ? 'exbos-glass-pill-active border-white/30 text-white shadow-sm'
                              : 'bg-transparent border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {tab}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* SVG Curve Canvas with Responsive Y-Axis, Clear Baseline, and Dynamic Hover Tooltip */}
                {(() => {
                  const svgWidth = 880
                  const svgHeight = 250
                  const paddingLeft = 56
                  const paddingRight = 28
                  const paddingTop = 36
                  const paddingBottom = 42

                  // Calculate true max from active data and create clean rounded ceiling
                  const rawMax = Math.max(...currentChartData.map((d) => Math.max(d.income, d.expense)), 1000)
                  // Round max value up to a clean multiple
                  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)))
                  const maxVal = Math.ceil((rawMax * 1.15) / magnitude) * magnitude
                  const minVal = 0
                  const range = maxVal - minVal

                  // Format short money for Y-axis (e.g. 200k, 150k, 100k, 50k, 0 or 30M, 20M, 10M, 0)
                  const formatShortMoney = (val) => {
                    if (val === 0) return '0'
                    if (val >= 1000000) {
                      return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`
                    }
                    if (val >= 1000) {
                      return `${Math.round(val / 1000)}k`
                    }
                    return `${Math.round(val)}`
                  }

                  const yAxisSteps = [
                    { pct: 0, val: maxVal },
                    { pct: 0.25, val: maxVal * 0.75 },
                    { pct: 0.5, val: maxVal * 0.5 },
                    { pct: 0.75, val: maxVal * 0.25 },
                    { pct: 1, val: 0 }
                  ]

                  // Catmull-Rom smooth spline calculation with dedicated padding for responsive axes
                  const buildCustomPath = (data, valueKey) => {
                    if (!data || data.length === 0) return { linePath: '', areaPath: '', points: [] }
                    const stepX = (svgWidth - paddingLeft - paddingRight) / (data.length - 1)
                    const points = data.map((d, i) => {
                      const x = paddingLeft + i * stepX
                      const norm = (d[valueKey] - minVal) / range
                      const y = (svgHeight - paddingBottom) - norm * (svgHeight - paddingTop - paddingBottom)
                      return { x, y, data: d }
                    })

                    let d = `M ${points[0].x} ${points[0].y}`
                    for (let i = 0; i < points.length - 1; i++) {
                      const p0 = points[i === 0 ? i : i - 1]
                      const p1 = points[i]
                      const p2 = points[i + 1]
                      const p3 = points[i + 2 < points.length ? i + 2 : i + 1]
                      const cp1x = p1.x + (p2.x - p0.x) / 6
                      const cp1y = p1.y + (p2.y - p0.y) / 6
                      const cp2x = p2.x - (p3.x - p1.x) / 6
                      const cp2y = p2.y - (p3.y - p1.y) / 6
                      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
                    }

                    const areaPath = `${d} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`
                    return { linePath: d, areaPath, points }
                  }

                  const incomeCurve = buildCustomPath(currentChartData, 'income')
                  const expenseCurve = buildCustomPath(currentChartData, 'expense')
                  const safeIndex = Math.min(activeCurveIndex, currentChartData.length - 1)
                  const activePoint = incomeCurve.points[safeIndex] || incomeCurve.points[0]
                  const activeData = currentChartData[safeIndex] || currentChartData[0]
                  const xRatio = activePoint ? activePoint.x / svgWidth : 0.5
                  const tooltipTranslateX = xRatio > 0.75 ? '-92%' : xRatio < 0.22 ? '-8%' : '-50%'

                  return (
                    <div className="relative pt-6 pb-2 select-none w-full">
                      {/* Floating Glass Tooltip Tag above Active Point (Shows Income, Expense, and Net Profit on hover) */}
                      {activePoint && (
                        <div
                          className="absolute z-30 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#06143b]/95 border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_28px_rgba(33,141,255,0.45)] transition-all duration-150 pointer-events-none backdrop-blur-xl"
                          style={{
                            left: `${(activePoint.x / svgWidth) * 100}%`,
                            top: `${Math.max(4, activePoint.y - 74)}px`,
                            transform: `translateX(${tooltipTranslateX})`
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#218DFF]" />
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                              Income:
                            </span>
                            <strong className="font-orbitron text-xs sm:text-sm font-extrabold text-white">
                              {formatRWF(activeData.income, hideFinancials)}
                            </strong>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-bold text-[10px]">
                              {activeData.change || '+24%'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] pt-1 border-t border-white/10 w-full justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400" />
                              <span className="text-slate-300">Expense:</span>
                              <strong className="text-rose-300 font-bold">
                                {formatRWF(activeData.expense, hideFinancials)}
                              </strong>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">Net:</span>
                              <strong className="text-emerald-400 font-bold font-orbitron">
                                +{formatRWF(activeData.income - activeData.expense, hideFinancials)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SVG Wave Graphic with Dynamic Y-Axis Labels & Grounded Baseline */}
                      <div className="w-full overflow-hidden">
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          preserveAspectRatio="xMidYMid meet"
                          className="w-full h-64 sm:h-80 overflow-visible"
                        >
                          <defs>
                            {/* Wave Liquid Sapphire Gradient Fill */}
                            <linearGradient id="sapphireWaveGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#218DFF" stopOpacity="0.55" />
                              <stop offset="60%" stopColor="#1045CA" stopOpacity="0.22" />
                              <stop offset="100%" stopColor="#040C26" stopOpacity="0.01" />
                            </linearGradient>

                            {/* Expense Wave Fill */}
                            <linearGradient id="expenseWaveGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
                              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.01" />
                            </linearGradient>

                            {/* Glow Filter */}
                            <filter id="glowSapphire" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3.5" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Horizontal Y-Axis Grid Lines & Responsive Y-Axis Scale Labels (e.g. 1.1M, 800k, 550k, 270k, 0) */}
                          {yAxisSteps.map((step, i) => {
                            const yPos = paddingTop + step.pct * (svgHeight - paddingTop - paddingBottom)
                            const isBaseline = i === yAxisSteps.length - 1
                            return (
                              <g key={i}>
                                <line
                                  x1={paddingLeft}
                                  y1={yPos}
                                  x2={svgWidth - paddingRight}
                                  y2={yPos}
                                  stroke={isBaseline ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}
                                  strokeDasharray={isBaseline ? 'none' : '4 4'}
                                  strokeWidth={isBaseline ? '1.5' : '1'}
                                />
                                <text
                                  x={paddingLeft - 12}
                                  y={yPos + 4}
                                  textAnchor="end"
                                  className={`font-orbitron text-[10px] sm:text-[11px] font-bold ${
                                    isBaseline ? 'fill-slate-300' : 'fill-slate-400'
                                  }`}
                                >
                                  {formatShortMoney(step.val)}
                                </text>
                              </g>
                            )
                          })}

                          {/* Shaded Area Fills */}
                          <path d={incomeCurve.areaPath} fill="url(#sapphireWaveGrad)" />
                          <path d={expenseCurve.areaPath} fill="url(#expenseWaveGrad)" />

                          {/* Secondary Expense Stroke */}
                          <path
                            d={expenseCurve.linePath}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2.5"
                            strokeOpacity="0.8"
                            strokeDasharray="5 3"
                          />

                          {/* Primary Income Flow Wave Stroke (Continuous Sapphire Wave) */}
                          <path
                            d={incomeCurve.linePath}
                            fill="none"
                            stroke="#218DFF"
                            strokeWidth="3.5"
                            filter="url(#glowSapphire)"
                          />

                          {/* Vertical Dashed Guideline to Hovered Point */}
                          {activePoint && (
                            <>
                              <line
                                x1={activePoint.x}
                                y1={activePoint.y}
                                x2={activePoint.x}
                                y2={svgHeight - paddingBottom}
                                stroke="#9EDCFF"
                                strokeDasharray="4 4"
                                strokeWidth="2"
                                strokeOpacity="0.95"
                              />

                              {/* Glowing Wave Marker Dot on Income Curve */}
                              <circle
                                cx={activePoint.x}
                                cy={activePoint.y}
                                r="8"
                                fill="#ffffff"
                                stroke="#218DFF"
                                strokeWidth="4"
                              />
                              <circle
                                cx={activePoint.x}
                                cy={activePoint.y}
                                r="16"
                                fill="#218DFF"
                                fillOpacity="0.25"
                                className="animate-ping"
                              />

                              {/* Coordinate Marker on Expense Curve at same X */}
                              {expenseCurve.points[safeIndex] && (
                                <circle
                                  cx={expenseCurve.points[safeIndex].x}
                                  cy={expenseCurve.points[safeIndex].y}
                                  r="5"
                                  fill="#ffffff"
                                  stroke="#f43f5e"
                                  strokeWidth="3"
                                />
                              )}
                            </>
                          )}

                          {/* Interactive Hover Zones for seamless mouse cursor movement */}
                          {incomeCurve.points.map((pt, i) => (
                            <rect
                              key={i}
                              x={pt.x - 24}
                              y="0"
                              width="48"
                              height={svgHeight}
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setActiveCurveIndex(i)}
                              onClick={() => setActiveCurveIndex(i)}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* X-Axis Timeline Labels with Money Amount on Each Point */}
                      <div
                        className="flex items-start justify-between pt-2 text-xs"
                        style={{ paddingLeft: `${(paddingLeft / svgWidth) * 100}%`, paddingRight: `${(paddingRight / svgWidth) * 100}%` }}
                      >
                        {currentChartData.map((d, i) => {
                          const isCur = i === safeIndex
                          return (
                            <button
                              key={d.label}
                              type="button"
                              onMouseEnter={() => setActiveCurveIndex(i)}
                              onClick={() => setActiveCurveIndex(i)}
                              className={`flex flex-col items-center gap-0.5 cursor-pointer border-0 bg-transparent transition-all p-0 ${
                                isCur
                                  ? 'text-white font-black scale-105'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="font-orbitron text-[11px] font-bold tracking-wider">
                                {d.label}
                              </span>
                              {/* Money Tag on X-axis */}
                              <span className={`text-[9px] font-mono transition-colors ${
                                isCur ? 'text-[#9EDCFF] font-bold' : 'text-slate-400'
                              }`}>
                                {formatShortMoney(d.income)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Footer Legend & Live Summary */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1.5 rounded-full bg-[#218DFF] shadow-sm inline-block" />
                      <span className="text-white font-semibold">Income Flow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1.5 rounded-full bg-rose-400 shadow-sm inline-block" />
                      <span className="text-white font-semibold">Expenses &amp; Outflow</span>
                    </div>
                  </div>

                  <div className="text-slate-300 text-[11px]">
                    Viewing {graphTimeframe.toLowerCase()} trajectory for <strong className="text-[#9EDCFF]">{currentArch.name}</strong>
                  </div>
                </div>
              </div>

              {/* Clean Reference Content Section (Executions, Tabs, Search, List) */}
              <div className="exbos-glass-card p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-6">
                    <h3 className="font-orbitron text-lg font-bold text-white">
                      Executions
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="text-white border-b-2 border-white pb-1 cursor-pointer">
                        Workflows
                      </span>
                      <span className="text-slate-400 hover:text-white cursor-pointer pb-1">
                        Permissions
                      </span>
                      <span className="text-slate-400 hover:text-white cursor-pointer pb-1">
                        Logs
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      placeholder="Search executions..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none w-48 transition-all"
                    />
                  </div>
                </div>

                {/* Clean Frosted List / Live Workflow Canvas */}
                <div className="space-y-3">
                  {archTransactions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 flex items-center justify-center text-[#9EDCFF]">
                        <Plus className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white font-orbitron">No Workflows Executed Yet</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Your production workspace is clean and ready. Click &quot;New Workflow / Transaction&quot; above to record your first sale, expense, or stock movement.
                      </p>
                    </div>
                  ) : (
                    archTransactions.slice(0, 6).map((row, idx) => (
                      <div
                        key={row.id || idx}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            row.type === 'in' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            0{idx + 1}
                          </div>
                          <div>
                            <strong className="block text-sm font-semibold text-white">
                              {row.title}
                            </strong>
                            <span className="text-xs text-slate-400">
                              {row.createdAt || 'Just now'} · {row.category} · via {row.account}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`font-orbitron text-sm font-bold ${
                            row.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {row.type === 'in' ? '+' : '-'}{formatRWF(row.amountRWF, hideFinancials)}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#9EDCFF] font-medium">
                            {row.status || 'Posted'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}

