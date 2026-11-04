import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Receipt,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportPerformanceChart from './ReportPerformanceChart'
import PaymentMethodDonutChart from './PaymentMethodDonutChart'
import ReportDetailDrawer from './ReportDetailDrawer'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'
import { printReportDocument } from '../../../utils/printDocument'

export default function SalesReportView({
  salesList = [],
  transactions = [],
  activeArchId = 'buy-and-sell',
  currentArch = null,
  businessName = 'ExBOS Business',
  hideFinancials = false
}) {
  // Filters state
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [chartGranularity, setChartGranularity] = useState('Daily')

  // Pagination & Drawer
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Merge and sanitize sales from workspace records and live transactions
  const combinedSales = useMemo(() => {
    const list = []

    // 1. Workspace records['Sales']
    salesList.forEach((s) => {
      const total = Number(s.amountRWF ?? s.total ?? 0)
      const paid = Number(s.paidRWF ?? s.amountPaid ?? total)
      const balance = Number(s.balanceOwedRWF ?? Math.max(0, total - paid))
      const status = s.status || (balance > 0 ? (paid > 0 ? 'Partial' : 'Unpaid') : 'Paid')

      list.push({
        id: s.id || `SALE-${Math.random()}`,
        date: s.date || new Date().toISOString().slice(0, 10),
        product: s.title || s.productTitle || s.product || 'Product Sale',
        customer: s.customerName || s.customer || 'Walk-in Customer',
        quantity: s.quantity || '1 pcs',
        total,
        paid,
        balance,
        method: s.paymentMethod || s.account || 'Cash',
        status,
        raw: s
      })
    })

    // 2. Direct sales in transactions (type === 'in' and not internal transfer)
    transactions
      .filter((t) => t.type === 'in' && !t.isInternalTransfer && !t.title?.toLowerCase().includes('transfer'))
      .forEach((t) => {
        // avoid duplicates if already in salesList
        if (!list.some((existing) => existing.id === t.id)) {
          const total = Number(t.amountRWF || 0)
          const paid = total
          const balance = 0
          list.push({
            id: t.id,
            date: t.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            product: t.title || 'General Sale',
            customer: t.customerName || 'Direct Cash Customer',
            quantity: '1 txn',
            total,
            paid,
            balance,
            method: t.account || 'Cash in Hand (Main Till)',
            status: 'Paid',
            raw: t
          })
        }
      })

    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [salesList, transactions])

  // Apply Date and Search Filters
  const filteredSales = useMemo(() => {
    return combinedSales.filter((item) => {
      // Date filter
      if (!isDateInFilter(item.date, dateFilter, customStart, customEnd)) return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesProduct = (item.product || '').toLowerCase().includes(q)
        const matchesCustomer = (item.customer || '').toLowerCase().includes(q)
        const matchesMethod = (item.method || '').toLowerCase().includes(q)
        const matchesId = (item.id || '').toLowerCase().includes(q)
        if (!matchesProduct && !matchesCustomer && !matchesMethod && !matchesId) return false
      }

      // Payment method filter
      if (paymentFilter !== 'All') {
        if (!item.method.toLowerCase().includes(paymentFilter.toLowerCase())) return false
      }

      // Status filter
      if (statusFilter !== 'All') {
        if (item.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      return true
    })
  }, [combinedSales, dateFilter, customStart, customEnd, searchQuery, paymentFilter, statusFilter])

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, item) => sum + item.total, 0)
    const moneyReceived = filteredSales.reduce((sum, item) => sum + item.paid, 0)
    const unpaidBalance = filteredSales.reduce((sum, item) => sum + item.balance, 0)
    const count = filteredSales.length

    return {
      totalSales,
      moneyReceived,
      unpaidBalance,
      count
    }
  }, [filteredSales])

  // Summary Cards for Section 1
  const summaryCards = [
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: formatRWF(metrics.totalSales, hideFinancials),
      subtitle: `${metrics.count} completed orders`,
      meaning: 'Total gross value of sales made during the selected period.',
      icon: TrendingUp,
      colorScheme: 'sapphire',
      isCurrency: true
    },
    {
      id: 'money-received',
      title: 'Money Received',
      value: formatRWF(metrics.moneyReceived, hideFinancials),
      subtitle: metrics.totalSales > 0 ? `${Math.round((metrics.moneyReceived / metrics.totalSales) * 100)}% collection rate` : '100% collected',
      meaning: 'Actual cash and electronic funds deposited into business accounts.',
      icon: CheckCircle2,
      colorScheme: 'emerald',
      isCurrency: true
    },
    {
      id: 'unpaid-balance',
      title: 'Unpaid Balance',
      value: formatRWF(metrics.unpaidBalance, hideFinancials),
      subtitle: metrics.unpaidBalance > 0 ? 'Pending customer collection' : 'Zero outstanding debt',
      meaning: 'Money customers still owe you on credit purchases.',
      icon: AlertCircle,
      colorScheme: metrics.unpaidBalance > 0 ? 'amber' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'transactions-count',
      title: 'Transactions',
      value: metrics.count,
      subtitle: 'Recorded sales volume',
      meaning: 'Total number of sales transactions recorded in this period.',
      icon: ShoppingCart,
      colorScheme: 'purple',
      isCurrency: false
    }
  ]

  // Chart Data: Group by Date (Daily, Weekly, Monthly)
  const chartData = useMemo(() => {
    const map = {}
    filteredSales.forEach((s) => {
      let key = s.date
      if (chartGranularity === 'Weekly') {
        const d = new Date(s.date)
        const weekNum = Math.ceil(d.getDate() / 7)
        key = `W${weekNum} ${d.toLocaleString('default', { month: 'short' })}`
      } else if (chartGranularity === 'Monthly') {
        const d = new Date(s.date)
        key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      }
      map[key] = (map[key] || 0) + s.total
    })

    const keys = Object.keys(map).slice(-12)
    return keys.map((k) => ({
      label: k,
      sales: map[k]
    }))
  }, [filteredSales, chartGranularity])

  // Payment method breakdown for Donut Chart
  const donutData = useMemo(() => {
    let cash = 0
    let bank = 0
    let mtn = 0
    let airtel = 0

    filteredSales.forEach((s) => {
      const m = (s.method || '').toLowerCase()
      const amt = s.paid
      if (m.includes('momo') || m.includes('mtn')) mtn += amt
      else if (m.includes('airtel')) airtel += amt
      else if (m.includes('bank') || m.includes('bk') || m.includes('bpr')) bank += amt
      else cash += amt
    })

    return [
      { label: 'Cash', value: cash, color: '#10B981' },
      { label: 'Bank', value: bank, color: '#3B82F6' },
      { label: 'MTN MoMo', value: mtn, color: '#F59E0B' },
      { label: 'Airtel Money', value: airtel, color: '#EC4899' }
    ]
  }, [filteredSales])

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize))
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredSales.slice(start, start + pageSize)
  }, [filteredSales, currentPage])

  // Export handlers
  const handleExportCsv = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Product / Item', key: 'product' },
      { header: 'Customer', key: 'customer' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Total (RWF)', key: 'total' },
      { header: 'Paid (RWF)', key: 'paid' },
      { header: 'Balance (RWF)', key: 'balance' },
      { header: 'Payment Method', key: 'method' },
      { header: 'Status', key: 'status' }
    ]
    const summary = ['TOTALS', '', '', '', metrics.totalSales, metrics.moneyReceived, metrics.unpaidBalance, '', '']
    exportToCsv(`ExBOS_Sales_Report_${dateFilter.replace(/\s+/g, '_')}`, columns, filteredSales, summary)
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Product', key: 'product' },
      { header: 'Total', key: 'total' },
      { header: 'Paid', key: 'paid' },
      { header: 'Balance', key: 'balance' },
      { header: 'Method', key: 'method' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Sales_Report_${dateFilter.replace(/\s+/g, '_')}`,
      'Sales Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredSales
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Product / Item', key: 'product' },
      { header: 'Customer', key: 'customer' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Total (RWF)', key: 'total' },
      { header: 'Paid (RWF)', key: 'paid' },
      { header: 'Balance (RWF)', key: 'balance' },
      { header: 'Payment Method', key: 'method' },
      { header: 'Status', key: 'status' }
    ]
    printReportDocument({
      title: 'Official Sales Report',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: filteredSales
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Date filters, search, export buttons */}
      <ReportControls
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        customStart={customStart}
        onCustomStartChange={setCustomStart}
        customEnd={customEnd}
        onCustomEndChange={setCustomEnd}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sales by product, customer, or method..."
        totalRecordsCount={filteredSales.length}
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
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
            >
              <option value="All">All Payment Channels</option>
              <option value="Cash">Cash</option>
              <option value="MoMo">MTN MoMo</option>
              <option value="Bank">Bank</option>
              <option value="Airtel">Airtel Money</option>
            </select>
          </div>
        }
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 2: Interactive Analytics (Performance Chart & Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReportPerformanceChart
            title="Sales Performance"
            subtitle={`Gross sales aggregated by ${chartGranularity.toLowerCase()} intervals`}
            granularity={chartGranularity}
            onGranularityChange={setChartGranularity}
            data={chartData}
            series={[{ key: 'sales', label: 'Sales Value', color: '#218DFF' }]}
            hideFinancials={hideFinancials}
            isCurrency={true}
          />
        </div>

        <div className="lg:col-span-1">
          <PaymentMethodDonutChart
            data={donutData}
            hideFinancials={hideFinancials}
            title="Sales by Payment Method"
          />
        </div>
      </div>

      {/* Section 3: Detailed Sales Data Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Detailed Sales Transactions
            </h4>
            <p className="text-[11px] text-slate-400">
              Click any row to view customer details and payment history
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No sales records found matching the selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product / Item</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Total (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Paid (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Method</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => {
                      setSelectedRecord(sale.raw || sale)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {sale.date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {sale.product}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {sale.customer}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {sale.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(sale.total, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                      {formatRWF(sale.paid, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {sale.balance > 0 ? (
                        <span className="text-amber-300 font-bold">
                          {formatRWF(sale.balance, hideFinancials)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px]">
                        {sale.method}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : sale.status === 'Partial'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRecord(sale.raw || sale)
                          setDrawerOpen(true)
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                        title="View Sale Details"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            <span className="text-slate-400 font-mono">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredSales.length)} of{' '}
              {filteredSales.length}
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
        reportType="Sales"
      />
    </div>
  )
}

