import React, { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Boxes,
  Calendar,
  ChevronDown,
  Clock,
  Eye,
  GitBranch,
  Layers,
  Package,
  Search,
  ShieldAlert,
  TrendingUp,
  Trophy,
  Activity
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' }
]

const DAY_OPTIONS = [
  { id: 'all', label: 'All Days' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
]

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getLocalTodayIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function normalizeToDateIso(rawStr) {
  const s = String(rawStr || '').trim()
  if (!s) return ''
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  const dmyMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`
  const ymdSlash = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
  if (ymdSlash) return `${ymdSlash[1]}-${ymdSlash[2]}-${ymdSlash[3]}`
  const parsed = new Date(s)
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return ''
}

function parseRecordDateInfo(rec) {
  const rawTs = String(
    rec?.timestamp || rec?.createdAt || rec?.updatedAt || rec?.openedAt || rec?.closedAt || rec?.date || ''
  ).trim()
  const dateIso = normalizeToDateIso(rec?.date || rawTs)
  let timeStr = '—'
  if (rawTs.includes('T') && rawTs.length >= 16) {
    timeStr = rawTs.slice(11, 16)
  } else if (rawTs.includes(' ') && rawTs.length >= 16) {
    timeStr = rawTs.slice(11, 16)
  } else if (rec?.time) {
    timeStr = String(rec.time).slice(0, 5)
  }
  let dayName = ''
  if (dateIso.length === 10) {
    const [y, m, d] = dateIso.split('-').map(Number)
    if (y && m && d) {
      const dt = new Date(y, m - 1, d)
      if (!Number.isNaN(dt.getTime())) {
        dayName = WEEKDAY_NAMES[dt.getDay()] || ''
      }
    }
  }
  const sortIso = rawTs.length >= 10 ? rawTs : dateIso ? `${dateIso}T${timeStr === '—' ? '00:00' : timeStr}:00` : ''
  return { dateIso, timeStr, dayName, sortIso }
}

function matchesPeriodAndDay(dateIso, dayName, period, dayOfWeek, todayIso) {
  if (dayOfWeek && dayOfWeek !== 'all') {
    if (!dayName || dayName.toLowerCase() !== dayOfWeek.toLowerCase()) return false
  }
  if (!period || period === 'all') return true
  if (!dateIso || dateIso.length !== 10) return false
  if (period === 'today') return dateIso === todayIso
  if (period === 'month') return dateIso.slice(0, 7) === todayIso.slice(0, 7)
  if (period === '7d') {
    const [ty, tm, td] = todayIso.split('-').map(Number)
    const [dy, dm, dd] = dateIso.split('-').map(Number)
    const t1 = new Date(ty, tm - 1, td).getTime()
    const t2 = new Date(dy, dm - 1, dd).getTime()
    const diffDays = Math.floor((t1 - t2) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }
  return true
}

export default function BranchIntelligenceInspectorPanel({
  activeArchId = 'buy-and-sell',
  onQuickDispatchToBranch
}) {
  const { branches = [], allWorkspaces = {}, hideFinancials = false } = useExbos()

  const [selectedBranchId, setSelectedBranchId] = useState(() => (branches.length > 1 ? 'ALL_COMPARE' : 'main'))
  const [period, setPeriod] = useState('all')
  const [dayOfWeek, setDayOfWeek] = useState('all')
  const [compareSubTab, setCompareSubTab] = useState('graph') // 'graph' | 'branches' | 'products'
  const [singleSubTab, setSingleSubTab] = useState('stock') // 'stock' | 'most_bought' | 'history'
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'low' | 'oos' | 'top'
  const [stockSearch, setStockSearch] = useState('')
  const [stockPage, setStockPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('all') // 'all' | 'sale' | 'expense' | 'purchase' | 'transfer' | 'audit'
  const [actionPage, setActionPage] = useState(1)
  const [graphMetric, setGraphMetric] = useState('netProfitRWF') // 'netProfitRWF' | 'revenueRWF' | 'stockCostValuationRWF' | 'unitsSoldTotal'
  const [topProductsLimit, setTopProductsLimit] = useState(5) // 5 | 10 | 50
  const [expandedTopBranchIds, setExpandedTopBranchIds] = useState({})
  const [serverData, setServerData] = useState(null)

  const toggleBranchTopProducts = (bid) => {
    setExpandedTopBranchIds((prev) => ({ ...prev, [bid]: !prev[bid] }))
  }

  const STOCK_PAGE_SIZE = 8
  const ACTION_PAGE_SIZE = 8

  useEffect(() => {
    setStockPage(1)
  }, [selectedBranchId, stockFilter, stockSearch])

  useEffect(() => {
    setActionPage(1)
  }, [selectedBranchId, actionFilter, period, dayOfWeek])

  useEffect(() => {
    let mounted = true
    const loadIntelligence = async () => {
      try {
        const res = await exbosApi.getBranchIntelligence({
          archId: activeArchId,
          period,
          dayOfWeek
        })
        const payload = res?.data?.data || res?.data
        if (mounted && res?.ok && payload) {
          setServerData(payload)
        }
      } catch {
        /* fallback to live local workspace computation below */
      }
    }
    loadIntelligence()
    return () => {
      mounted = false
    }
  }, [activeArchId, period, dayOfWeek, branches.length, allWorkspaces])

  // Local reactive fallback + instant merge so newly added/deleted products or offline changes reflect in 0ms
  const localIntelligence = useMemo(() => {
    const branchList =
      branches.length > 0
        ? branches
        : [{ id: 'main', name: 'Main HQ', location: 'Headquarters', isMain: true, status: 'Active' }]
    const branchIdSet = new Set(branchList.map((b) => b.id))
    const resolveBid = (rec) => {
      const b = String(rec?.branchId || 'main').trim()
      return branchIdSet.has(b) ? b : 'main'
    }

    const ws = allWorkspaces?.[activeArchId] || {}
    const records = ws.records || {}
    const salesList = [
      ...(records.Sales || []),
      ...(records.ServiceJobs || []),
      ...(records.KitchenOrders || []),
      ...(records.MixedSales || [])
    ]
    const purchasesList = records.Purchases || []
    const expensesList = records.Expenses || []
    const rawCatalog = [...(records.Inventory || []), ...(records.Products || [])]
    const todayIso = getLocalTodayIso()

    const catalogByBranch = {}
    branchList.forEach((b) => {
      catalogByBranch[b.id] = {}
    })

    rawCatalog.forEach((prod) => {
      if (!prod || typeof prod !== 'object') return
      const bid = resolveBid(prod)
      const title = String(prod.title || prod.name || '').trim()
      if (!title) return
      const key = title.toLowerCase()
      if (catalogByBranch[bid][key]) return
      const qty = Number(prod.quantity ?? prod.currentStock ?? prod.stock ?? 0)
      const lowAlert = Number(prod.lowStockAlert ?? 5)
      const costP = Number(prod.purchasePriceRWF ?? prod.unitCostRWF ?? prod.costPerUnitRWF ?? 0)
      const sellP = Number(prod.sellingPriceRWF ?? prod.unitPriceRWF ?? prod.price ?? 0)
      const costVal = Math.round(Math.max(0, qty) * costP)
      const retailVal = Math.round(Math.max(0, qty) * (sellP || costP))
      const expMargin = Math.round(Math.max(0, qty) * Math.max(0, sellP - costP))
      const stockStatus = qty <= 0 ? 'Out of Stock' : qty <= lowAlert ? 'Low Stock' : 'In Stock'

      catalogByBranch[bid][key] = {
        id: String(prod.id || key),
        title,
        category: String(prod.category || 'General'),
        sku: String(prod.sku || prod.barcode || ''),
        unit: String(prod.unit || 'pcs'),
        branchId: bid,
        quantity: qty,
        lowStockAlert: lowAlert,
        purchasePriceRWF: costP,
        sellingPriceRWF: sellP,
        stockCostValuationRWF: costVal,
        stockRetailValuationRWF: retailVal,
        expectedMarginRWF: expMargin,
        stockStatus,
        unitsSold: 0,
        salesCount: 0,
        salesRevenueRWF: 0,
        profitEarnedRWF: 0
      }
    })

    const intelMap = {}
    const actionsMap = {}
    const soldMap = {}
    const crossMap = {}

    branchList.forEach((b) => {
      const bid = b.id
      const prods = Object.values(catalogByBranch[bid])
      actionsMap[bid] = []
      soldMap[bid] = {}
      intelMap[bid] = {
        id: bid,
        name: b.name || bid,
        location: b.location || 'Rwanda',
        isMain: Boolean(b.isMain || bid === 'main'),
        status: b.status || 'Active',
        manager: b.manager || null,
        productsCount: prods.length,
        totalUnitsInStock: prods.reduce((s, p) => s + Number(p.quantity || 0), 0),
        stockCostValuationRWF: prods.reduce((s, p) => s + Number(p.stockCostValuationRWF || 0), 0),
        stockRetailValuationRWF: prods.reduce((s, p) => s + Number(p.stockRetailValuationRWF || 0), 0),
        expectedStockMarginRWF: prods.reduce((s, p) => s + Number(p.expectedMarginRWF || 0), 0),
        lowStockCount: prods.filter((p) => p.stockStatus === 'Low Stock').length,
        outOfStockCount: prods.filter((p) => p.stockStatus === 'Out of Stock').length,
        salesCount: 0,
        unitsSoldTotal: 0,
        revenueRWF: 0,
        costOfGoodsRWF: 0,
        grossProfitRWF: 0,
        purchasesRWF: 0,
        expensesRWF: 0,
        netProfitRWF: 0,
        profitMarginPct: 0
      }
    })

    salesList.forEach((s) => {
      if (!s || typeof s !== 'object') return
      const bid = resolveBid(s)
      const { dateIso, timeStr, dayName, sortIso } = parseRecordDateInfo(s)
      if (!matchesPeriodAndDay(dateIso, dayName, period, dayOfWeek, todayIso)) return

      const amt = Number(s.amountRWF ?? s.totalAmount ?? 0)
      const qty = Number(s.quantity ?? 1) || 1
      const pTitle = String(s.productTitle || s.title || s.name || 'Sale Item').trim()
      const pKey = pTitle.toLowerCase()
      const catEntry = catalogByBranch[bid]?.[pKey]
      const unitCost = Number(s.unitCostRWF ?? s.purchasePriceRWF ?? catEntry?.purchasePriceRWF ?? 0)
      const saleProfit =
        s.profitRWF !== undefined
          ? Number(s.profitRWF)
          : unitCost > 0
          ? amt - Math.round(unitCost * qty)
          : Math.round(amt * 0.35)
      const cogs = Math.max(0, amt - saleProfit)

      const st = intelMap[bid]
      st.salesCount += 1
      st.unitsSoldTotal += qty
      st.revenueRWF += amt
      st.costOfGoodsRWF += cogs
      st.grossProfitRWF += saleProfit

      if (catEntry) {
        catEntry.unitsSold += qty
        catEntry.salesCount += 1
        catEntry.salesRevenueRWF += amt
        catEntry.profitEarnedRWF += saleProfit
      }

      if (!soldMap[bid][pKey]) {
        soldMap[bid][pKey] = {
          title: pTitle,
          category: catEntry?.category || s.category || 'General',
          unitsSold: 0,
          salesCount: 0,
          revenueRWF: 0,
          profitRWF: 0,
          stockLeft: catEntry?.quantity ?? 0,
          stockStatus: catEntry?.stockStatus || 'In Stock'
        }
      }
      soldMap[bid][pKey].unitsSold += qty
      soldMap[bid][pKey].salesCount += 1
      soldMap[bid][pKey].revenueRWF += amt
      soldMap[bid][pKey].profitRWF += saleProfit

      if (!crossMap[pKey]) {
        crossMap[pKey] = { title: pTitle, totalUnitsSold: 0, totalRevenueRWF: 0, totalProfitRWF: 0, byBranch: {} }
      }
      crossMap[pKey].totalUnitsSold += qty
      crossMap[pKey].totalRevenueRWF += amt
      crossMap[pKey].totalProfitRWF += saleProfit
      if (!crossMap[pKey].byBranch[bid]) {
        crossMap[pKey].byBranch[bid] = {
          branchId: bid,
          branchName: st.name,
          unitsSold: 0,
          revenueRWF: 0,
          profitRWF: 0,
          stockLeft: catEntry?.quantity ?? 0
        }
      }
      crossMap[pKey].byBranch[bid].unitsSold += qty
      crossMap[pKey].byBranch[bid].revenueRWF += amt
      crossMap[pKey].byBranch[bid].profitRWF += saleProfit

      actionsMap[bid].push({
        id: String(s.id || `SAL-${actionsMap[bid].length}`),
        category: 'sale',
        actionLabel: 'Sale Recorded',
        title: `${qty}x ${pTitle}`,
        details: `Customer: ${s.customerName || s.customer || 'Walk-in'} · ${s.paymentMethod || 'Cash'}`,
        actorName: s.recordedByName || s.createdBy || st.manager?.name || 'Branch Staff',
        amountRWF: amt,
        profitRWF: saleProfit,
        date: dateIso,
        time: timeStr,
        dayName: dayName || '—',
        sortIso
      })
    })

    purchasesList.forEach((p) => {
      if (!p || typeof p !== 'object') return
      const bid = resolveBid(p)
      const { dateIso, timeStr, dayName, sortIso } = parseRecordDateInfo(p)
      if (!matchesPeriodAndDay(dateIso, dayName, period, dayOfWeek, todayIso)) return
      const amt = Number(p.amountRWF || 0)
      intelMap[bid].purchasesRWF += amt
      actionsMap[bid].push({
        id: String(p.id || `PUR-${actionsMap[bid].length}`),
        category: 'purchase',
        actionLabel: 'Purchase / Restock',
        title: String(p.title || p.productTitle || 'Stock Purchase'),
        details: `Supplier: ${p.supplierName || p.supplier || 'Vendor'}`,
        actorName: p.recordedByName || p.createdBy || intelMap[bid].manager?.name || 'Branch Staff',
        amountRWF: amt,
        date: dateIso,
        time: timeStr,
        dayName: dayName || '—',
        sortIso
      })
    })

    expensesList.forEach((e) => {
      if (!e || typeof e !== 'object') return
      const bid = resolveBid(e)
      const { dateIso, timeStr, dayName, sortIso } = parseRecordDateInfo(e)
      if (!matchesPeriodAndDay(dateIso, dayName, period, dayOfWeek, todayIso)) return
      const amt = Number(e.amountRWF || 0)
      intelMap[bid].expensesRWF += amt
      actionsMap[bid].push({
        id: String(e.id || `EXP-${actionsMap[bid].length}`),
        category: 'expense',
        actionLabel: 'Expense Logged',
        title: String(e.title || e.category || 'Branch Expense'),
        details: String(e.category || e.paymentMethod || 'Operating Cost'),
        actorName: e.recordedByName || e.createdBy || intelMap[bid].manager?.name || 'Branch Staff',
        amountRWF: amt,
        date: dateIso,
        time: timeStr,
        dayName: dayName || '—',
        sortIso
      })
    })

    const outBranches = branchList.map((b) => {
      const bid = b.id
      const st = intelMap[bid]
      st.netProfitRWF = Math.round(st.grossProfitRWF - st.expensesRWF)
      st.profitMarginPct = st.revenueRWF > 0 ? Number(((st.netProfitRWF / st.revenueRWF) * 100).toFixed(1)) : 0
      const prods = Object.values(catalogByBranch[bid]).sort(
        (x, y) => y.unitsSold - x.unitsSold || y.profitEarnedRWF - x.profitEarnedRWF
      )
      st.products = prods
      st.lowStockItems = prods.filter((p) => p.stockStatus !== 'In Stock')
      const topSold = Object.values(soldMap[bid]).sort(
        (x, y) => y.unitsSold - x.unitsSold || y.profitRWF - x.profitRWF
      )
      st.mostBoughtProducts = topSold.slice(0, 50)
      st.topProduct = topSold[0] || null
      st.restockRecommendations = prods
        .filter((p) => p.stockStatus !== 'In Stock' || (p.unitsSold > 0 && p.quantity <= p.unitsSold))
        .slice(0, 8)
      const acts = [...actionsMap[bid]].sort((x, y) => String(y.sortIso || '').localeCompare(String(x.sortIso || '')))
      st.actionsHistory = acts
      st.actionsCount = acts.length
      return st
    })

    const byProfit = [...outBranches].sort((a, b) => b.netProfitRWF - a.netProfitRWF || b.revenueRWF - a.revenueRWF)
    const byRev = [...outBranches].sort((a, b) => b.revenueRWF - a.revenueRWF)
    const byStock = [...outBranches].sort((a, b) => b.stockCostValuationRWF - a.stockCostValuationRWF)

    return {
      branches: outBranches,
      comparison: {
        mostProfitableBranch: byProfit[0] || null,
        topSellingBranch: byRev[0] || null,
        highestStockBranch: byStock[0] || null,
        totalCompanyRevenueRWF: outBranches.reduce((s, b) => s + b.revenueRWF, 0),
        totalCompanyNetProfitRWF: outBranches.reduce((s, b) => s + b.netProfitRWF, 0),
        totalCompanyStockCostRWF: outBranches.reduce((s, b) => s + b.stockCostValuationRWF, 0),
        totalCompanyStockRetailRWF: outBranches.reduce((s, b) => s + b.stockRetailValuationRWF, 0),
        totalCompanyLowStockCount: outBranches.reduce((s, b) => s + b.lowStockCount + b.outOfStockCount, 0),
        crossBranchTopProducts: Object.values(crossMap)
          .map((cp) => ({
            ...cp,
            byBranch: Object.values(cp.byBranch).sort((a, b) => b.unitsSold - a.unitsSold)
          }))
          .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
          .slice(0, 12)
      }
    }
  }, [branches, allWorkspaces, activeArchId, period, dayOfWeek])

  // Prefer live local product counts/stock combined with server audit/transfer/shift history
  const activeIntel = useMemo(() => {
    const serverMatchesFilter =
      serverData &&
      Array.isArray(serverData.branches) &&
      serverData.branches.length > 0 &&
      (!serverData.period || serverData.period === period) &&
      (!serverData.dayOfWeek || serverData.dayOfWeek === dayOfWeek)

    if (!serverMatchesFilter) {
      return localIntelligence
    }
    const serverByBranch = {}
    serverData.branches.forEach((sb) => {
      serverByBranch[sb.id] = sb
    })
    const mergedBranches = localIntelligence.branches.map((lb) => {
      const sb = serverByBranch[lb.id]
      if (!sb) return lb
      // Merge server audit/transfer/shift actions with local sales/expenses/purchases
      const seenIds = new Set(lb.actionsHistory.map((a) => a.id))
      const extraServerActions = (sb.actionsHistory || []).filter((a) => !seenIds.has(a.id))
      const combinedActions = [...lb.actionsHistory, ...extraServerActions].sort((a, b) =>
        String(b.sortIso || '').localeCompare(String(a.sortIso || ''))
      )
      const useServerSales = lb.salesCount === 0 && (sb.salesCount || 0) > 0
      return {
        ...sb,
        ...lb,
        salesCount: useServerSales ? sb.salesCount : lb.salesCount,
        unitsSoldTotal: useServerSales ? sb.unitsSoldTotal : lb.unitsSoldTotal,
        revenueRWF: useServerSales ? sb.revenueRWF : lb.revenueRWF,
        costOfGoodsRWF: useServerSales ? sb.costOfGoodsRWF : lb.costOfGoodsRWF,
        grossProfitRWF: useServerSales ? sb.grossProfitRWF : lb.grossProfitRWF,
        expensesRWF: lb.expensesRWF || sb.expensesRWF || 0,
        netProfitRWF: useServerSales ? sb.netProfitRWF : lb.netProfitRWF,
        mostBoughtProducts:
          lb.mostBoughtProducts && lb.mostBoughtProducts.length > 0
            ? lb.mostBoughtProducts
            : sb.mostBoughtProducts || [],
        topProduct: lb.topProduct || sb.topProduct || null,
        productsCount: lb.productsCount || sb.productsCount,
        totalUnitsInStock: lb.productsCount > 0 ? lb.totalUnitsInStock : sb.totalUnitsInStock,
        stockCostValuationRWF: lb.productsCount > 0 ? lb.stockCostValuationRWF : sb.stockCostValuationRWF,
        stockRetailValuationRWF: lb.productsCount > 0 ? lb.stockRetailValuationRWF : sb.stockRetailValuationRWF,
        expectedStockMarginRWF: lb.productsCount > 0 ? lb.expectedStockMarginRWF : sb.expectedStockMarginRWF,
        products: lb.products.length > 0 ? lb.products : sb.products || [],
        lowStockItems: lb.products.length > 0 ? lb.lowStockItems : sb.lowStockItems || [],
        actionsHistory: combinedActions,
        actionsCount: combinedActions.length
      }
    })
    const byProfit = [...mergedBranches].sort((a, b) => b.netProfitRWF - a.netProfitRWF || b.revenueRWF - a.revenueRWF)
    const byRev = [...mergedBranches].sort((a, b) => b.revenueRWF - a.revenueRWF)
    const byStock = [...mergedBranches].sort((a, b) => b.stockCostValuationRWF - a.stockCostValuationRWF)
    return {
      ...localIntelligence,
      branches: mergedBranches,
      comparison: {
        ...localIntelligence.comparison,
        mostProfitableBranch: byProfit[0] || null,
        topSellingBranch: byRev[0] || null,
        highestStockBranch: byStock[0] || null,
        totalCompanyRevenueRWF: mergedBranches.reduce((s, b) => s + (b.revenueRWF || 0), 0),
        totalCompanyNetProfitRWF: mergedBranches.reduce((s, b) => s + (b.netProfitRWF || 0), 0),
        totalCompanyStockCostRWF: mergedBranches.reduce((s, b) => s + (b.stockCostValuationRWF || 0), 0),
        totalCompanyStockRetailRWF: mergedBranches.reduce((s, b) => s + (b.stockRetailValuationRWF || 0), 0),
        totalCompanyLowStockCount: mergedBranches.reduce(
          (s, b) => s + (b.lowStockCount || 0) + (b.outOfStockCount || 0),
          0
        ),
        crossBranchTopProducts:
          localIntelligence.comparison.crossBranchTopProducts?.length > 0
            ? localIntelligence.comparison.crossBranchTopProducts
            : serverData.comparison?.crossBranchTopProducts || []
      }
    }
  }, [localIntelligence, serverData, period, dayOfWeek])

  const branchRows = activeIntel.branches || []
  const comparison = activeIntel.comparison || {}
  const isCompareMode = selectedBranchId === 'ALL_COMPARE'
  const currentBranch = useMemo(
    () => branchRows.find((b) => b.id === selectedBranchId) || branchRows[0] || null,
    [branchRows, selectedBranchId]
  )

  const filteredBranchProducts = useMemo(() => {
    if (!currentBranch) return []
    let list = [...(currentBranch.products || [])]
    if (stockFilter === 'low') list = list.filter((p) => p.stockStatus === 'Low Stock')
    else if (stockFilter === 'oos') list = list.filter((p) => p.stockStatus === 'Out of Stock')
    else if (stockFilter === 'top') list = list.filter((p) => p.unitsSold > 0)

    const q = stockSearch.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
    }
    return list
  }, [currentBranch, stockFilter, stockSearch])

  const filteredActions = useMemo(() => {
    if (!currentBranch) return []
    const list = currentBranch.actionsHistory || []
    if (actionFilter === 'all') return list
    return list.filter((a) => a.category === actionFilter)
  }, [currentBranch, actionFilter])

  const totalStockPages = Math.max(1, Math.ceil(filteredBranchProducts.length / STOCK_PAGE_SIZE))
  const safeStockPage = Math.min(stockPage, totalStockPages)
  const paginatedBranchProducts = useMemo(() => {
    const start = (safeStockPage - 1) * STOCK_PAGE_SIZE
    return filteredBranchProducts.slice(start, start + STOCK_PAGE_SIZE)
  }, [filteredBranchProducts, safeStockPage])

  const totalActionPages = Math.max(1, Math.ceil(filteredActions.length / ACTION_PAGE_SIZE))
  const safeActionPage = Math.min(actionPage, totalActionPages)
  const paginatedActions = useMemo(() => {
    const start = (safeActionPage - 1) * ACTION_PAGE_SIZE
    return filteredActions.slice(start, start + ACTION_PAGE_SIZE)
  }, [filteredActions, safeActionPage])

  const maxGraphVal = useMemo(() => {
    const vals = branchRows.map((b) => Math.max(0, Number(b[graphMetric] || 0)))
    return Math.max(...vals, 1)
  }, [branchRows, graphMetric])

  return (
    <div className="space-y-3.5 sm:space-y-5">
      {/* 1. Executive Branch Selector + Time Period + Day-of-Week Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/95 border border-[#218DFF]/35 space-y-2.5 sm:space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[9px] sm:text-[10px] font-orbitron uppercase tracking-wider text-[#9EDCFF] font-bold block">
              Executive Multi-Branch Inspector (Zero Branch-Switching Required)
            </span>
            <h4 className="hidden sm:block font-orbitron text-sm sm:text-base font-bold text-white mt-0.5">
              Inspect Any Single Branch or Compare All Branches Side-by-Side
            </h4>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 shrink-0">
            {branchRows.length} Location{branchRows.length === 1 ? '' : 's'} Tracked
          </span>
        </div>

        {/* Zero-Scroll Responsive Branch Selector Grid (2 columns on mobile, wrap on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedBranchId('ALL_COMPARE')}
            className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-between sm:justify-start gap-1.5 cursor-pointer transition-all ${
              isCompareMode
                ? 'bg-[#218DFF] text-white shadow-[0_0_16px_rgba(33,141,255,0.45)]'
                : 'bg-white/10 hover:bg-white/20 text-[#9EDCFF] border border-white/10'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Compare All Branches ({branchRows.length})</span>
            </span>
          </button>

          {branchRows.map((b) => {
            const active = !isCompareMode && currentBranch?.id === b.id
            const alertCnt = (b.lowStockCount || 0) + (b.outOfStockCount || 0)
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranchId(b.id)}
                className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-between sm:justify-start gap-1.5 cursor-pointer transition-all min-w-0 ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_14px_rgba(16,185,129,0.4)]'
                    : 'bg-white/[0.06] hover:bg-white/15 border border-white/10 text-slate-200'
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <GitBranch className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{b.name}</span>
                </span>
                {alertCnt > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono shrink-0 ${
                      active ? 'bg-slate-950/20 text-slate-950' : 'bg-amber-500/25 text-amber-200'
                    }`}
                  >
                    {alertCnt} low
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Mobile Clear Labeled 2-Column Dropdown Filters (< md) */}
        <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-white/10 md:hidden">
          <div className="space-y-1">
            <label className="text-[10px] font-orbitron uppercase tracking-wider text-[#9EDCFF] font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#218DFF]" />
              <span>Period</span>
            </label>
            <div className="relative">
              <select
                aria-label="Filter by Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none bg-[#06143D] border border-[#218DFF]/45 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#218DFF] shadow-inner cursor-pointer"
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#040D29] text-white">
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#9EDCFF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-orbitron uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Day of Week</span>
            </label>
            <div className="relative">
              <select
                aria-label="Filter by Day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full appearance-none bg-[#06143D] border border-emerald-400/45 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 shadow-inner cursor-pointer"
              >
                {DAY_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#040D29] text-white">
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Desktop Pill Filter Row (md+) */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#218DFF]" />
              <span>Period:</span>
            </span>
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                  period === p.id
                    ? 'bg-[#218DFF] text-white'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              <span>Day:</span>
            </span>
            {DAY_OPTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDayOfWeek(d.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  dayOfWeek === d.id
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300'
                }`}
              >
                {d.id === 'all' ? d.label : d.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODE A: MULTI-BRANCH COMPARISON GRAPH & HEAD-TO-HEAD MATRIX         */}
      {/* =================================================================== */}
      {isCompareMode ? (
        <div className="space-y-3.5 sm:space-y-4">
          {/* 1. Compact 2x2 Mobile / 4-Column Desktop Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-emerald-400/35">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300">
                <span className="truncate">Most Profitable Branch</span>
                <Trophy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <div className="font-orbitron text-xs sm:text-base font-extrabold text-white mt-1 truncate">
                {comparison.mostProfitableBranch?.name || '—'}
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-bold text-emerald-400 mt-0.5 truncate">
                Net Profit: {formatRWF(comparison.mostProfitableBranch?.netProfitRWF || 0, hideFinancials)}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-[#218DFF]/35">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold text-[#9EDCFF]">
                <span className="truncate">Total Company Net Profit</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#218DFF] shrink-0" />
              </div>
              <div className="font-orbitron text-xs sm:text-lg font-extrabold text-white mt-1 truncate">
                {formatRWF(comparison.totalCompanyNetProfitRWF || 0, hideFinancials)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                Sales Revenue: {formatRWF(comparison.totalCompanyRevenueRWF || 0, hideFinancials)}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-indigo-400/35">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold text-indigo-300">
                <span className="truncate">Total Stock Cost Valuation</span>
                <Boxes className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </div>
              <div className="font-orbitron text-xs sm:text-lg font-extrabold text-white mt-1 truncate">
                {formatRWF(comparison.totalCompanyStockCostRWF || 0, hideFinancials)}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                Retail Value: {formatRWF(comparison.totalCompanyStockRetailRWF || 0, hideFinancials)}
              </div>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-amber-400/35">
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] uppercase font-bold text-amber-300">
                <span className="truncate">Low / Out-of-Stock Alerts</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </div>
              <div className="font-orbitron text-xs sm:text-lg font-extrabold text-amber-300 mt-1 truncate">
                {comparison.totalCompanyLowStockCount || 0} Product{comparison.totalCompanyLowStockCount === 1 ? '' : 's'}
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                Across all {branchRows.length} branch locations
              </div>
            </div>
          </div>

          {/* 2. Segmented 3-Tab Sub-View Switcher (Eliminates vertical scroll overload) */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#040D29]/95 border border-[#218DFF]/30">
            {[
              { id: 'graph', label: 'Comparison Graph' },
              { id: 'branches', label: `Branch Cards (${branchRows.length})` },
              { id: 'products', label: 'Top Products' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCompareSubTab(tab.id)}
                className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer transition-all text-center truncate ${
                  compareSubTab === tab.id
                    ? 'bg-[#218DFF] text-white shadow-[0_0_12px_rgba(33,141,255,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SUB-TAB 1: Visual Branch Comparison Bar Graph */}
          {compareSubTab === 'graph' && (
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#040D29]/95 border border-white/10 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="font-orbitron text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#218DFF]" />
                    <span>Branch Performance Comparison Graph</span>
                  </h5>
                  <p className="hidden sm:block text-[11px] text-slate-300 mt-0.5">
                    Compare all locations by Net Profit Earning, Sales Revenue, Stock Valuation, or Units Sold.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5 max-w-full">
                  {[
                    { id: 'netProfitRWF', label: 'By Net Profit' },
                    { id: 'revenueRWF', label: 'By Sales Revenue' },
                    { id: 'stockCostValuationRWF', label: 'By Stock Valuation' },
                    { id: 'unitsSoldTotal', label: 'By Units Sold' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setGraphMetric(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer shrink-0 ${
                        graphMetric === m.id
                          ? 'bg-[#218DFF] text-white'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {branchRows.map((b, idx) => {
                  const rawVal = Number(b[graphMetric] || 0)
                  const pct = Math.min(100, Math.max(4, Math.round((Math.max(0, rawVal) / maxGraphVal) * 100)))
                  const isWinner =
                    b.id === comparison.mostProfitableBranch?.id &&
                    (b.netProfitRWF > 0 || b.revenueRWF > 0 || b.stockCostValuationRWF > 0)
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBranchId(b.id)}
                      className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 space-y-1.5 cursor-pointer transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] text-slate-400">#{idx + 1}</span>
                          <strong className="text-white truncate">{b.name}</strong>
                          {isWinner && (
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-bold shrink-0">
                              Top Earner
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 shrink-0">
                            ({b.salesCount} sales · {b.productsCount} products)
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 font-mono text-[11px] sm:text-xs">
                          <span className={b.netProfitRWF < 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            Profit: {formatRWF(b.netProfitRWF, hideFinancials)}
                          </span>
                          <span className="text-[#9EDCFF]">
                            Sales: {formatRWF(b.revenueRWF, hideFinancials)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            rawVal < 0
                              ? 'bg-rose-500'
                              : idx === 0
                              ? 'bg-gradient-to-r from-[#218DFF] to-emerald-400'
                              : 'bg-[#218DFF]'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SUB-TAB 2: Side-by-Side Branch Deep Comparison Cards */}
          {compareSubTab === 'branches' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {branchRows.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#040D29]/95 border border-white/10 hover:border-[#218DFF]/45 space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs sm:text-sm font-bold text-white truncate">{b.name}</strong>
                        {b.isMain && (
                          <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                            Main HQ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Manager:{' '}
                        <strong className="text-slate-200">
                          {b.manager?.name || (b.isMain ? 'Business Owner / HQ' : 'Unassigned')}
                        </strong>
                        {b.manager?.status ? ` (${b.manager.status})` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBranchId(b.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF] text-[#9EDCFF] hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Deep</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">Net Profit</span>
                      <strong className={`font-orbitron text-[11px] sm:text-xs ${b.netProfitRWF < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatRWF(b.netProfitRWF, hideFinancials)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">Sales Revenue</span>
                      <strong className="font-orbitron text-[11px] sm:text-xs text-white">
                        {formatRWF(b.revenueRWF, hideFinancials)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">Stock Valuation</span>
                      <strong className="font-orbitron text-[11px] sm:text-xs text-[#9EDCFF]">
                        {formatRWF(b.stockCostValuationRWF, hideFinancials)}
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">Products &amp; Units</span>
                      <strong className="font-mono text-[11px] sm:text-xs text-white">
                        {b.productsCount} items · {b.totalUnitsInStock} u
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">Low / Out Stock</span>
                      <strong className={`font-mono text-[11px] sm:text-xs ${b.lowStockCount + b.outOfStockCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {b.lowStockCount} low · {b.outOfStockCount} out
                      </strong>
                    </div>
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/5">
                      <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase">#1 Best Product</span>
                      <strong className="text-[11px] sm:text-xs text-emerald-300 truncate block">
                        {b.topProduct ? `${b.topProduct.title} (${b.topProduct.unitsSold || 0} sold)` : 'No sales yet'}
                      </strong>
                    </div>
                  </div>

                  {/* Top 5 / Top 10 Sold Products Per Branch Drawer */}
                  {Array.isArray(b.mostBoughtProducts) && b.mostBoughtProducts.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBranchTopProducts(b.id)}
                          className="text-[11px] font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {expandedTopBranchIds[b.id]
                              ? `Hide Top Sold Products (${b.mostBoughtProducts.length})`
                              : `View Top ${Math.min(topProductsLimit, b.mostBoughtProducts.length)} Sold Products`}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${expandedTopBranchIds[b.id] ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {expandedTopBranchIds[b.id] && (
                          <div className="flex items-center gap-1">
                            {[
                              { limit: 5, label: 'Top 5' },
                              { limit: 10, label: 'Top 10' },
                              { limit: 50, label: 'All Sold' }
                            ].map((opt) => (
                              <button
                                key={opt.limit}
                                type="button"
                                onClick={() => setTopProductsLimit(opt.limit)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                                  topProductsLimit === opt.limit
                                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {expandedTopBranchIds[b.id] && (
                        <div className="space-y-1.5">
                          {b.mostBoughtProducts.slice(0, topProductsLimit).map((mp, idx) => (
                            <div
                              key={mp.title}
                              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2 text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-mono text-[10px] font-bold text-emerald-400 shrink-0">
                                  #{idx + 1}
                                </span>
                                <span className="text-white font-semibold truncate">{mp.title}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                  {mp.unitsSold} sold
                                </span>
                                <span className="text-[#9EDCFF]">
                                  {formatRWF(mp.profitRWF, hideFinancials)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SUB-TAB 3: Cross-Branch Best-Selling Products Matrix */}
          {compareSubTab === 'products' && (
            <div className="p-3.5 sm:p-5 rounded-2xl bg-[#040D29]/95 border border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h5 className="font-orbitron text-xs sm:text-sm font-bold text-white">
                    Top-Performing Products Across Branches
                  </h5>
                  <p className="hidden sm:block text-[11px] text-slate-300">
                    See which products customers buy the most and how each branch performs on that product.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { limit: 5, label: 'Top 5' },
                    { limit: 10, label: 'Top 10' },
                    { limit: 50, label: 'All Sold' }
                  ].map((opt) => (
                    <button
                      key={opt.limit}
                      type="button"
                      onClick={() => setTopProductsLimit(opt.limit)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer ${
                        topProductsLimit === opt.limit
                          ? 'bg-emerald-500 text-slate-950 font-extrabold'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {(!Array.isArray(comparison.crossBranchTopProducts) || comparison.crossBranchTopProducts.length === 0) ? (
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 text-center">
                  No sales recorded across branches for the selected period / day filter yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {comparison.crossBranchTopProducts.slice(0, topProductsLimit).map((cp, idx) => (
                    <div key={cp.title} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-xs text-white truncate">
                          #{idx + 1} {cp.title}
                        </strong>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0">
                          {cp.totalUnitsSold} sold · Profit: {formatRWF(cp.totalProfitRWF, hideFinancials)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(cp.byBranch || []).map((bb) => (
                          <span
                            key={bb.branchId}
                            className="px-2 py-0.5 rounded-lg bg-[#06143D] border border-[#218DFF]/30 text-[10px] text-[#9EDCFF]"
                          >
                            {bb.branchName}: <strong>{bb.unitsSold} sold</strong> (Stock: {bb.stockLeft})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* MODE B: SINGLE-BRANCH DEEP INSPECTOR (STOCK, VALUATION, SALES, LOG) */
        /* =================================================================== */
        currentBranch && (
          <div className="space-y-3.5 sm:space-y-4">
            {/* 1. Compact 2x2 Mobile / 4-Column Desktop Branch KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-[#218DFF]/35">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#9EDCFF] block truncate">
                  {currentBranch.name} · Product Stock
                </span>
                <div className="font-orbitron text-xs sm:text-lg font-extrabold text-white mt-1 truncate">
                  {currentBranch.productsCount} Products · {currentBranch.totalUnitsInStock} Units
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                  Manager: {currentBranch.manager?.name || (currentBranch.isMain ? 'Main HQ' : 'Unassigned')}
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-indigo-400/35">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-indigo-300 block truncate">
                  Branch Stock Valuation (Cost)
                </span>
                <div className="font-orbitron text-xs sm:text-lg font-extrabold text-white mt-1 truncate">
                  {formatRWF(currentBranch.stockCostValuationRWF, hideFinancials)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-[#9EDCFF] mt-0.5 truncate">
                  Retail Value: {formatRWF(currentBranch.stockRetailValuationRWF, hideFinancials)}
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-emerald-400/35">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-300 block truncate">
                  Branch Net Profit &amp; Sales
                </span>
                <div className={`font-orbitron text-xs sm:text-lg font-extrabold mt-1 truncate ${currentBranch.netProfitRWF < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatRWF(currentBranch.netProfitRWF, hideFinancials)}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                  {currentBranch.salesCount} Sales ({formatRWF(currentBranch.revenueRWF, hideFinancials)})
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-[#040D29]/90 border border-amber-400/35">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-amber-300 block truncate">
                  Low Stock &amp; Out of Stock
                </span>
                <div className="font-orbitron text-xs sm:text-lg font-extrabold text-amber-300 mt-1 truncate">
                  {currentBranch.lowStockCount} Low · {currentBranch.outOfStockCount} Out
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-300 mt-0.5 truncate">
                  {currentBranch.lowStockCount + currentBranch.outOfStockCount > 0
                    ? 'Needs restock from Main HQ'
                    : 'All branch stock healthy'}
                </div>
              </div>
            </div>

            {/* 2. Segmented 3-Tab Sub-View Switcher for Single Branch */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-[#040D29]/95 border border-emerald-400/30">
              {[
                { id: 'stock', label: `Branch Stock (${currentBranch.productsCount || 0})` },
                { id: 'most_bought', label: 'Most Bought' },
                { id: 'history', label: `Action History (${filteredActions.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSingleSubTab(tab.id)}
                  className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold cursor-pointer transition-all text-center truncate ${
                    singleSubTab === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SINGLE SUB-TAB 1: Branch Product Stock, Quantity, Valuation & Low-Stock Inspector (Paginated 8/page) */}
            {singleSubTab === 'stock' && (
              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#040D29]/95 border border-white/10 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h5 className="font-orbitron text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#9EDCFF]" />
                      <span>{currentBranch.name} — Product Stock, Quantity &amp; Valuation</span>
                    </h5>
                    <p className="hidden sm:block text-[11px] text-slate-300">
                      Inspect exact shelf quantity, unit cost, selling price, total valuation, and low-stock status.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {[
                      { id: 'all', label: `All (${currentBranch.products?.length || 0})` },
                      { id: 'low', label: `Low Stock (${currentBranch.lowStockCount || 0})` },
                      { id: 'oos', label: `Out of Stock (${currentBranch.outOfStockCount || 0})` },
                      { id: 'top', label: 'Top Performers' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setStockFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer ${
                          stockFilter === tab.id
                            ? 'bg-[#218DFF] text-white'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                    <div className="relative flex-1 sm:flex-initial min-w-[160px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        placeholder="Search branch product..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>
                </div>

                {filteredBranchProducts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-white/[0.03] rounded-xl border border-white/10">
                    No branch products match the current filter.
                  </div>
                ) : (
                  <>
                    {/* Desktop Table (md+) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Product</th>
                            <th className="py-2.5 px-3 text-center">Qty Left</th>
                            <th className="py-2.5 px-3 text-right">Purchase Cost</th>
                            <th className="py-2.5 px-3 text-right">Selling Price</th>
                            <th className="py-2.5 px-3 text-right">Stock Valuation</th>
                            <th className="py-2.5 px-3 text-center">Units Sold</th>
                            <th className="py-2.5 px-3 text-right">Profit Earned</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-200">
                          {paginatedBranchProducts.map((p) => (
                            <tr key={p.id || p.title} className="hover:bg-white/5">
                              <td className="py-2.5 px-3">
                                <strong className="text-white block">{p.title}</strong>
                                <span className="text-[10px] text-slate-400">
                                  {p.category} {p.sku ? `· ${p.sku}` : ''}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-orbitron font-bold text-white">
                                {p.quantity} <span className="text-[10px] text-[#9EDCFF]">{p.unit}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                {formatRWF(p.purchasePriceRWF, hideFinancials)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                                {formatRWF(p.sellingPriceRWF, hideFinancials)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-orbitron font-bold text-[#9EDCFF]">
                                {formatRWF(p.stockCostValuationRWF, hideFinancials)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-300">
                                {p.unitsSold}
                              </td>
                              <td className="py-2.5 px-3 text-right font-orbitron font-bold text-emerald-400">
                                {formatRWF(p.profitEarnedRWF, hideFinancials)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    p.stockStatus === 'Out of Stock'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : p.stockStatus === 'Low Stock'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                                  }`}
                                >
                                  {p.stockStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Responsive Cards (< md) */}
                    <div className="block md:hidden space-y-2">
                      {paginatedBranchProducts.map((p) => (
                        <div key={p.id || p.title} className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <strong className="text-xs font-bold text-white truncate block">{p.title}</strong>
                              <div className="text-[10px] text-slate-400">{p.category}</div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                p.stockStatus === 'Out of Stock'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : p.stockStatus === 'Low Stock'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {p.stockStatus}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-white/10">
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Qty Left</span>
                              <strong className="text-white font-orbitron">
                                {p.quantity} {p.unit}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Stock Valuation</span>
                              <strong className="text-[#9EDCFF] font-orbitron">
                                {formatRWF(p.stockCostValuationRWF, hideFinancials)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Selling Price</span>
                              <strong className="text-white font-mono">
                                {formatRWF(p.sellingPriceRWF, hideFinancials)}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[9px] uppercase">Sold / Profit</span>
                              <strong className="text-emerald-400 font-mono">
                                {p.unitsSold} sold · {formatRWF(p.profitEarnedRWF, hideFinancials)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Bar for Branch Stock */}
                    {totalStockPages > 1 && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                        <button
                          type="button"
                          disabled={safeStockPage <= 1}
                          onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-bold cursor-pointer disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-[11px] font-mono text-slate-300">
                          Page {safeStockPage} of {totalStockPages} ({filteredBranchProducts.length} products)
                        </span>
                        <button
                          type="button"
                          disabled={safeStockPage >= totalStockPages}
                          onClick={() => setStockPage((p) => Math.min(totalStockPages, p + 1))}
                          className="px-3 py-1.5 rounded-xl bg-[#218DFF] hover:bg-[#218DFF]/85 disabled:opacity-40 text-white font-bold cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SINGLE SUB-TAB 2: Most Bought Products & Smart Restock Radar */}
            {singleSubTab === 'most_bought' && (
              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#040D29]/95 border border-emerald-400/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="font-orbitron text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-400" />
                      <span>Most Bought Products in {currentBranch.name}</span>
                    </h5>
                    <p className="hidden sm:block text-[11px] text-slate-300">
                      Ranked by units bought and profit earned in this branch during the selected period &amp; day.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { limit: 5, label: 'Top 5' },
                      { limit: 10, label: 'Top 10' },
                      { limit: 50, label: 'All Sold' }
                    ].map((opt) => (
                      <button
                        key={opt.limit}
                        type="button"
                        onClick={() => setTopProductsLimit(opt.limit)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer ${
                          topProductsLimit === opt.limit
                            ? 'bg-emerald-500 text-slate-950 font-extrabold'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    {!currentBranch.isMain && onQuickDispatchToBranch && (
                      <button
                        type="button"
                        onClick={() => onQuickDispatchToBranch(currentBranch)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Dispatch Stock to {currentBranch.name}</span>
                      </button>
                    )}
                  </div>
                </div>

                {(!currentBranch.mostBoughtProducts || currentBranch.mostBoughtProducts.length === 0) ? (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-400">
                    No sales recorded in {currentBranch.name} for the selected time / day filter yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {currentBranch.mostBoughtProducts.slice(0, topProductsLimit).map((mp, idx) => (
                      <div
                        key={mp.title}
                        className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-300 font-bold">
                              #{idx + 1} Most Bought
                            </span>
                            <div className="text-xs font-bold text-white mt-0.5">{mp.title}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[10px] font-bold">
                            {mp.unitsSold} bought
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/10">
                          <span className="text-slate-300">
                            Profit: <strong className="text-emerald-400">{formatRWF(mp.profitRWF, hideFinancials)}</strong>
                          </span>
                          <span className={mp.stockLeft <= 5 ? 'text-amber-300 font-bold' : 'text-[#9EDCFF]'}>
                            Stock Left: {mp.stockLeft}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SINGLE SUB-TAB 3: Chronological Branch Action & Audit History Timeline */}
            {singleSubTab === 'history' && (
              <div className="p-3.5 sm:p-5 rounded-2xl bg-[#040D29]/95 border border-white/10 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="font-orbitron text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#218DFF]" />
                      <span>{currentBranch.name} — Action &amp; Activity History Timeline</span>
                    </h5>
                    <p className="hidden sm:block text-[11px] text-slate-300">
                      Every sale, expense, stock transfer, cashier shift, and manager action with exact Day, Date &amp; Time.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'All Actions' },
                      { id: 'sale', label: 'Sales' },
                      { id: 'expense', label: 'Expenses' },
                      { id: 'purchase', label: 'Purchases' },
                      { id: 'transfer', label: 'HQ Transfers' },
                      { id: 'audit', label: 'Audits' }
                    ].map((af) => (
                      <button
                        key={af.id}
                        type="button"
                        onClick={() => setActionFilter(af.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          actionFilter === af.id
                            ? 'bg-[#218DFF] text-white'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300'
                        }`}
                      >
                        {af.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredActions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-white/[0.03] rounded-xl border border-white/10">
                    No actions recorded in {currentBranch.name} for the selected period / day filter.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {paginatedActions.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  act.category === 'sale'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                    : act.category === 'expense'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                                    : act.category === 'transfer'
                                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                                    : 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/30'
                                }`}
                              >
                                {act.actionLabel}
                              </span>
                              <strong className="text-white">{act.title}</strong>
                              <span className="text-[11px] text-slate-400">by {act.actorName}</span>
                            </div>
                            {act.details && <div className="text-[11px] text-slate-400">{act.details}</div>}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                            {act.amountRWF > 0 && (
                              <strong
                                className={`font-orbitron text-xs ${
                                  act.category === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                                }`}
                              >
                                {formatRWF(act.amountRWF, hideFinancials)}
                              </strong>
                            )}
                            <span className="text-[10px] font-mono text-[#9EDCFF]">
                              {act.dayName ? `${act.dayName}, ` : ''}
                              {act.date || '—'} {act.time && act.time !== '—' ? `· ${act.time}` : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalActionPages > 1 && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                        <button
                          type="button"
                          disabled={safeActionPage <= 1}
                          onClick={() => setActionPage((p) => Math.max(1, p - 1))}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white font-bold cursor-pointer disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-[11px] font-mono text-slate-300">
                          Page {safeActionPage} of {totalActionPages} ({filteredActions.length} actions)
                        </span>
                        <button
                          type="button"
                          disabled={safeActionPage >= totalActionPages}
                          onClick={() => setActionPage((p) => Math.min(totalActionPages, p + 1))}
                          className="px-3 py-1.5 rounded-xl bg-[#218DFF] hover:bg-[#218DFF]/85 disabled:opacity-40 text-white font-bold cursor-pointer disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}

