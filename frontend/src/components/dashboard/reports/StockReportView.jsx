import React, { useState, useMemo } from 'react'
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingDown,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportPerformanceChart from './ReportPerformanceChart'
import ReportDetailDrawer from './ReportDetailDrawer'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'
import { printReportDocument } from '../../../utils/printDocument'

export default function StockReportView({
  inventoryList = [],
  salesList = [],
  purchasesList = [],
  activeArchId = 'buy-and-sell',
  currentArch = null,
  businessName = 'ExBOS Business',
  hideFinancials = false
}) {
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // 'All' | 'Available' | 'Low Stock' | 'Out of Stock'
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Pagination & Drawer
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isLivestock = activeArchId === 'agriculture'
  const isMakeSell = activeArchId === 'smart-bakery'
  const isFood = activeArchId === 'food-and-hospitality'

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set()
    inventoryList.forEach((item) => {
      const cat = item.category || item.species || item.type
      if (cat) set.add(cat)
    })
    return Array.from(set)
  }, [inventoryList])

  // Compute calculated stock movement for each item
  const stockItems = useMemo(() => {
    return inventoryList.map((item) => {
      const title = item.productTitle || item.title || item.name || 'Stock Item'
      const unit = item.unit || 'pcs'
      const currentQty = Number(item.quantity) || 0
      const minStock = Number(item.minStockAlert ?? item.reorderLevel ?? 5)
      const costPrice = Number(item.purchasePriceRWF ?? item.unitCostRWF ?? item.costPriceRWF ?? 0)
      const sellPrice = Number(item.sellingPriceRWF ?? 0)

      // Calculate added stock from purchases
      const matchingPurchases = purchasesList.filter((p) => {
        const pTitle = (p.productTitle || p.title || p.product || '').toLowerCase()
        return pTitle.includes(title.toLowerCase())
      })
      const qtyAdded = matchingPurchases.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0)

      // Calculate sold stock from sales
      const matchingSales = salesList.filter((s) => {
        const sTitle = (s.productTitle || s.title || s.product || '').toLowerCase()
        return sTitle.includes(title.toLowerCase())
      })
      const qtySold = matchingSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0)

      // Closing Stock Formula: Opening + Added - Sold + Adjustments
      // Here currentQty is current Closing Stock, so:
      // Opening = Closing - Added + Sold
      const openingStock = Math.max(0, currentQty - qtyAdded + qtySold)
      const adjustments = 0
      const closingStock = currentQty
      const stockValuation = closingStock * costPrice

      let status = 'Available'
      if (closingStock <= 0) {
        status = 'Out of Stock'
      } else if (closingStock <= minStock) {
        status = 'Low Stock'
      }

      return {
        id: item.id || `STK-${Math.random()}`,
        product: title,
        category: item.category || item.species || (isMakeSell ? 'Finished Goods' : 'General'),
        unit,
        openingStock,
        qtyAdded,
        qtySold,
        adjustments,
        closingStock,
        stockValuation,
        costPrice,
        sellPrice,
        status,
        // Specific fields for Livestock / Agriculture
        species: item.species,
        breed: item.breed,
        tagNumber: item.tagNumber || item.id,
        purpose: item.purpose || 'Breeding / Trade',
        healthStatus: item.healthStatus || 'Healthy',
        // Specific fields for Make & Sell
        materialType: item.materialType || (item.category?.includes('Raw') ? 'Raw Material' : 'Finished Good'),
        raw: item
      }
    })
  }, [inventoryList, purchasesList, salesList, isMakeSell])

  // Filtered stock items
  const filteredStock = useMemo(() => {
    return stockItems.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.product.toLowerCase().includes(q)
        const matchesCat = (item.category || '').toLowerCase().includes(q)
        const matchesSpecies = (item.species || '').toLowerCase().includes(q)
        const matchesTag = (item.tagNumber || '').toLowerCase().includes(q)
        if (!matchesName && !matchesCat && !matchesSpecies && !matchesTag) return false
      }

      // Status filter
      if (statusFilter !== 'All') {
        if (item.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      // Category filter
      if (categoryFilter !== 'All') {
        if (item.category !== categoryFilter) return false
      }

      return true
    })
  }, [stockItems, searchQuery, statusFilter, categoryFilter])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalProducts = filteredStock.length
    const totalValuation = filteredStock.reduce((acc, i) => acc + i.stockValuation, 0)
    const lowStockCount = filteredStock.filter((i) => i.status === 'Low Stock').length
    const outOfStockCount = filteredStock.filter((i) => i.status === 'Out of Stock').length

    return {
      totalProducts,
      totalValuation,
      lowStockCount,
      outOfStockCount
    }
  }, [filteredStock])

  // Summary Cards for Section 1
  const summaryCards = [
    {
      id: 'total-stock-items',
      title: isLivestock ? 'Total Animals Registered' : 'Total Products',
      value: summaryMetrics.totalProducts,
      subtitle: isLivestock ? 'Active livestock herd' : 'Catalog SKU count',
      meaning: isLivestock ? 'Total number of live animals recorded in the farm register.' : 'Total distinct product SKUs active in inventory.',
      icon: Package,
      colorScheme: 'sapphire',
      isCurrency: false
    },
    {
      id: 'total-valuation',
      title: 'Stock Valuation (Cost)',
      value: formatRWF(summaryMetrics.totalValuation, hideFinancials),
      subtitle: 'Inventory monetary worth',
      meaning: 'Total monetary value of all stock on hand, calculated at landed purchase cost.',
      icon: DollarSign,
      colorScheme: 'emerald',
      isCurrency: true
    },
    {
      id: 'low-stock-alert',
      title: 'Low Stock Items',
      value: summaryMetrics.lowStockCount,
      subtitle: 'Below reorder threshold',
      meaning: 'Items approaching zero requiring purchase reorders to avoid lost sales.',
      icon: AlertTriangle,
      colorScheme: summaryMetrics.lowStockCount > 0 ? 'amber' : 'sapphire',
      isCurrency: false
    },
    {
      id: 'out-of-stock-alert',
      title: 'Out of Stock',
      value: summaryMetrics.outOfStockCount,
      subtitle: 'Zero units on hand',
      meaning: 'Products with completely depleted stock that cannot be fulfilled.',
      icon: XCircle,
      colorScheme: summaryMetrics.outOfStockCount > 0 ? 'rose' : 'sapphire',
      isCurrency: false
    }
  ]

  // Movement Chart Data (Added vs Sold)
  const movementChartData = useMemo(() => {
    return filteredStock.slice(0, 8).map((item) => ({
      label: item.product.length > 10 ? item.product.slice(0, 9) + '…' : item.product,
      added: item.qtyAdded,
      sold: item.qtySold
    }))
  }, [filteredStock])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredStock.length / pageSize))
  const paginatedStock = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredStock.slice(start, start + pageSize)
  }, [filteredStock, currentPage])

  // Export handlers
  const handleExportCsv = () => {
    const columns = isLivestock
      ? [
          { header: 'Tag / Animal ID', key: 'tagNumber' },
          { header: 'Species', key: 'species' },
          { header: 'Breed', key: 'breed' },
          { header: 'Purpose', key: 'purpose' },
          { header: 'Health Status', key: 'healthStatus' },
          { header: 'Valuation (RWF)', key: 'stockValuation' },
          { header: 'Status', key: 'status' }
        ]
      : [
          { header: 'Product', key: 'product' },
          { header: 'Category', key: 'category' },
          { header: 'Opening Stock', key: 'openingStock' },
          { header: 'Added', key: 'qtyAdded' },
          { header: 'Sold', key: 'qtySold' },
          { header: 'Adjustments', key: 'adjustments' },
          { header: 'Closing Stock', key: 'closingStock' },
          { header: 'Stock Value (RWF)', key: 'stockValuation' },
          { header: 'Status', key: 'status' }
        ]
    exportToCsv(
      `ExBOS_Stock_Report_${dateFilter.replace(/\s+/g, '_')}`,
      columns,
      filteredStock,
      ['TOTAL VALUATION', '', '', '', '', '', '', summaryMetrics.totalValuation, '']
    )
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Product / Animal', key: 'product' },
      { header: 'Category', key: 'category' },
      { header: 'Closing', key: 'closingStock' },
      { header: 'Valuation', key: 'stockValuation' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Stock_Report_${dateFilter.replace(/\s+/g, '_')}`,
      'Stock Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredStock
    )
  }

  const handlePrint = () => {
    const columns = isLivestock
      ? [
          { header: 'Tag / Animal ID', key: 'tagNumber' },
          { header: 'Species', key: 'species' },
          { header: 'Breed', key: 'breed' },
          { header: 'Purpose', key: 'purpose' },
          { header: 'Health Status', key: 'healthStatus' },
          { header: 'Valuation (RWF)', key: 'stockValuation' },
          { header: 'Status', key: 'status' }
        ]
      : [
          { header: 'Product', key: 'product' },
          { header: 'Category', key: 'category' },
          { header: 'Opening Stock', key: 'openingStock' },
          { header: 'Added', key: 'qtyAdded' },
          { header: 'Sold', key: 'qtySold' },
          { header: 'Closing Stock', key: 'closingStock' },
          { header: 'Stock Value (RWF)', key: 'stockValuation' },
          { header: 'Status', key: 'status' }
        ]
    printReportDocument({
      title: isLivestock ? 'Livestock Registry & Valuation Report' : 'Inventory Stock & Valuation Report',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: filteredStock
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <ReportControls
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={
          isLivestock
            ? 'Search animals by tag, species, or breed...'
            : 'Search stock by product name or category...'
        }
        totalRecordsCount={filteredStock.length}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportCsv}
        onPrint={handlePrint}
        filterOptions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="All">All Stock Statuses</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock Alerts</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 2: Interactive Analytics (Stock Movement Chart) */}
      <ReportPerformanceChart
        title="Stock Movement (Added vs Sold)"
        subtitle="Quantities added through purchases versus quantities sold"
        data={movementChartData}
        series={[
          { key: 'added', label: 'Stock Added', color: '#10B981' },
          { key: 'sold', label: 'Stock Sold', color: '#218DFF' }
        ]}
        hideFinancials={false}
        isCurrency={false}
        unit="units"
      />

      {/* Section 3: Detailed Stock Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              {isLivestock
                ? 'Livestock Registry & Valuation'
                : 'Inventory Movement & Closing Stock Ledger'}
            </h4>
            <p className="text-[11px] text-slate-400">
              Formula: Closing Stock = Opening + Added − Sold + Net Adjustments
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {filteredStock.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No stock records match the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  {isLivestock ? (
                    <>
                      <th className="py-2.5 px-3">Tag #</th>
                      <th className="py-2.5 px-3">Species & Breed</th>
                      <th className="py-2.5 px-3 text-center">Purpose</th>
                      <th className="py-2.5 px-3 text-center">Health</th>
                      <th className="py-2.5 px-3 text-right">Valuation (RWF)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Opening</th>
                      <th className="py-2.5 px-3 text-right">Added</th>
                      <th className="py-2.5 px-3 text-right">Sold</th>
                      <th className="py-2.5 px-3 text-right">Adjust</th>
                      <th className="py-2.5 px-3 text-right font-bold text-white">Closing</th>
                      <th className="py-2.5 px-3 text-right">Stock Value</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedStock.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedRecord(item.raw || item)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {isLivestock ? (
                      <>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#9EDCFF]">
                          {item.tagNumber || item.id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {item.species || item.product}{' '}
                          <span className="text-slate-400 text-[11px] font-normal">
                            ({item.breed || 'Standard'})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-300">
                          {item.purpose}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px]">
                            {item.healthStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {formatRWF(item.stockValuation, hideFinancials)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            Active Herd
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                          {item.product}
                        </td>
                        <td className="py-2.5 px-3 text-[#9EDCFF]">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {item.openingStock} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                          +{item.qtyAdded}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-300">
                          -{item.qtySold}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {item.adjustments}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          {item.closingStock} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatRWF(item.stockValuation, hideFinancials)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Available'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : item.status === 'Low Stock'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-rose-500/15 text-rose-300'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRecord(item.raw || item)
                          setDrawerOpen(true)
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                        title="View Stock Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-slate-400 font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredStock.length)} of{' '}
              {filteredStock.length} items
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 py-1 text-slate-300 font-mono">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Record Details Drawer */}
      <ReportDetailDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
        reportType="Stock"
      />
    </div>
  )
}

