import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportPerformanceChart from './ReportPerformanceChart'
import ReportDetailDrawer from './ReportDetailDrawer'
import RecordDebtPaymentModal from './RecordDebtPaymentModal'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'
import { printReportDocument } from '../../../utils/printDocument'

export default function PurchasesReportView({
  purchasesList = [],
  activeArchId = 'buy-and-sell',
  currentArch = null,
  businessName = 'ExBOS Business',
  hideFinancials = false,
  onRecordSupplierPayment = null
}) {
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [supplierFilter, setSupplierFilter] = useState('All')

  // Pagination & Drawer & Modal
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payTargetRecord, setPayTargetRecord] = useState(null)

  // Map and sanitize purchases
  const sanitizedPurchases = useMemo(() => {
    return purchasesList.map((p) => {
      const total = Number(p.amountRWF ?? p.total ?? 0)
      const paid = Number(p.paidRWF ?? p.amountPaid ?? (p.status === 'Paid' ? total : 0))
      const balance = Number(p.remainingAmountRWF ?? p.balanceOwedRWF ?? Math.max(0, total - paid))
      const status = p.status || (balance > 0 ? (paid > 0 ? 'Partial' : 'Unpaid') : 'Paid')

      return {
        id: p.id || `PUR-${Math.random()}`,
        date: p.date || new Date().toISOString().slice(0, 10),
        supplier: p.supplierName || p.supplier || 'General Supplier',
        product: p.productTitle || p.title || p.product || 'Procured Stock',
        quantity: p.quantity ? `${p.quantity} ${p.unit || 'pcs'}` : '1 order',
        total,
        paid,
        balance,
        status,
        raw: p
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [purchasesList])

  // Extract suppliers list for dropdown
  const suppliers = useMemo(() => {
    const set = new Set()
    sanitizedPurchases.forEach((p) => {
      if (p.supplier) set.add(p.supplier)
    })
    return Array.from(set)
  }, [sanitizedPurchases])

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return sanitizedPurchases.filter((p) => {
      // Date filter
      if (!isDateInFilter(p.date, dateFilter, customStart, customEnd)) return false

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesSupplier = p.supplier.toLowerCase().includes(q)
        const matchesProduct = p.product.toLowerCase().includes(q)
        const matchesId = p.id.toLowerCase().includes(q)
        if (!matchesSupplier && !matchesProduct && !matchesId) return false
      }

      // Status
      if (statusFilter !== 'All') {
        if (p.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      }

      // Supplier
      if (supplierFilter !== 'All') {
        if (p.supplier !== supplierFilter) return false
      }

      return true
    })
  }, [sanitizedPurchases, dateFilter, customStart, customEnd, searchQuery, statusFilter, supplierFilter])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalPurchases = filteredPurchases.reduce((acc, p) => acc + p.total, 0)
    const amountPaid = filteredPurchases.reduce((acc, p) => acc + p.paid, 0)
    const supplierDebt = filteredPurchases.reduce((acc, p) => acc + p.balance, 0)
    const orderCount = filteredPurchases.length

    return {
      totalPurchases,
      amountPaid,
      supplierDebt,
      orderCount
    }
  }, [filteredPurchases])

  // 4 Summary Cards for Section 1
  const summaryCards = [
    {
      id: 'total-purchases',
      title: 'Total Purchases',
      value: formatRWF(metrics.totalPurchases, hideFinancials),
      subtitle: `${metrics.orderCount} purchase orders`,
      meaning: 'Total gross value of goods and supplies purchased in this period.',
      icon: ShoppingBag,
      colorScheme: 'sapphire',
      isCurrency: true
    },
    {
      id: 'amount-paid',
      title: 'Amount Paid',
      value: formatRWF(metrics.amountPaid, hideFinancials),
      subtitle: metrics.totalPurchases > 0 ? `${Math.round((metrics.amountPaid / metrics.totalPurchases) * 100)}% settled` : '100% settled',
      meaning: 'Total cash and bank transfers disbursed to suppliers.',
      icon: CheckCircle2,
      colorScheme: 'emerald',
      isCurrency: true
    },
    {
      id: 'supplier-debt',
      title: 'Supplier Debt',
      value: formatRWF(metrics.supplierDebt, hideFinancials),
      subtitle: metrics.supplierDebt > 0 ? 'Pending payment obligations' : 'No supplier balances due',
      meaning: 'Total unpaid balances owed to vendors and inventory suppliers.',
      icon: AlertTriangle,
      colorScheme: metrics.supplierDebt > 0 ? 'rose' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'purchase-orders',
      title: 'Purchase Orders',
      value: metrics.orderCount,
      subtitle: 'Fulfilled orders',
      meaning: 'Count of completed procurement receipts and purchase orders.',
      icon: CreditCard,
      colorScheme: 'purple',
      isCurrency: false
    }
  ]

  // Monthly Purchases vs Supplier Payments Chart Data
  const chartData = useMemo(() => {
    const map = {}
    filteredPurchases.forEach((p) => {
      const d = new Date(p.date)
      const key = d.toLocaleString('default', { month: 'short' })
      if (!map[key]) {
        map[key] = { label: key, purchases: 0, paid: 0 }
      }
      map[key].purchases += p.total
      map[key].paid += p.paid
    })
    return Object.values(map).slice(-8)
  }, [filteredPurchases])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPurchases.length / pageSize))
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPurchases.slice(start, start + pageSize)
  }, [filteredPurchases, currentPage])

  // Export handlers
  const handleExportCsv = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Supplier', key: 'supplier' },
      { header: 'Product / Item', key: 'product' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Total (RWF)', key: 'total' },
      { header: 'Paid (RWF)', key: 'paid' },
      { header: 'Balance (RWF)', key: 'balance' },
      { header: 'Status', key: 'status' }
    ]
    exportToCsv(
      `ExBOS_Purchases_Report_${dateFilter.replace(/\s+/g, '_')}`,
      columns,
      filteredPurchases,
      ['TOTALS', '', '', '', metrics.totalPurchases, metrics.amountPaid, metrics.supplierDebt, '']
    )
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Supplier', key: 'supplier' },
      { header: 'Product', key: 'product' },
      { header: 'Total', key: 'total' },
      { header: 'Paid', key: 'paid' },
      { header: 'Balance', key: 'balance' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Purchases_Report_${dateFilter.replace(/\s+/g, '_')}`,
      'Purchases Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredPurchases
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Date', key: 'date' },
      { header: 'Supplier', key: 'supplier' },
      { header: 'Product / Item', key: 'product' },
      { header: 'Quantity', key: 'quantity' },
      { header: 'Total (RWF)', key: 'total' },
      { header: 'Paid (RWF)', key: 'paid' },
      { header: 'Balance (RWF)', key: 'balance' },
      { header: 'Status', key: 'status' }
    ]
    printReportDocument({
      title: 'Official Purchases & Procurement Report',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: filteredPurchases
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
        searchPlaceholder="Search purchases by supplier or item..."
        totalRecordsCount={filteredPurchases.length}
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

            {suppliers.length > 0 && (
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="All">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 2: Interactive Purchases vs Payments Chart */}
      <ReportPerformanceChart
        title="Monthly Purchases & Supplier Payments"
        subtitle="Gross inventory procurement value versus supplier payment disbursements"
        data={chartData}
        series={[
          { key: 'purchases', label: 'Purchases', color: '#218DFF' },
          { key: 'paid', label: 'Payments Disbursed', color: '#10B981' }
        ]}
        hideFinancials={hideFinancials}
        isCurrency={true}
      />

      {/* Section 3: Detailed Purchases Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Purchases &amp; Procurement Ledger
            </h4>
            <p className="text-[11px] text-slate-400">
              Click any row to view order details or settle supplier balance
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No purchases recorded for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Product / Item</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Total (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Paid (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedPurchases.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedRecord(p.raw || p)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {p.date}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {p.supplier}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {p.product}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {p.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(p.total, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">
                      {formatRWF(p.paid, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {p.balance > 0 ? (
                        <span className="text-amber-300 font-bold">
                          {formatRWF(p.balance, hideFinancials)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : p.status === 'Partial'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRecord(p.raw || p)
                          setDrawerOpen(true)
                        }}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                        title="View Purchase Details"
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
              {Math.min(currentPage * pageSize, filteredPurchases.length)} of{' '}
              {filteredPurchases.length}
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

      {/* Drawer */}
      <ReportDetailDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
        reportType="Purchases"
        onRecordPayment={(rec) => {
          setPayTargetRecord(rec)
          setPayModalOpen(true)
        }}
      />

      {/* Supplier Payment Modal */}
      <RecordDebtPaymentModal
        isOpen={payModalOpen}
        onClose={() => {
          setPayModalOpen(false)
          setPayTargetRecord(null)
        }}
        record={payTargetRecord}
        type="supplier"
        onConfirm={(data) => {
          if (onRecordSupplierPayment) onRecordSupplierPayment(data)
        }}
      />
    </div>
  )
}

