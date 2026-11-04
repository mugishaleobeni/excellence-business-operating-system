import React, { useState, useMemo } from 'react'
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { printReportDocument } from '../../../utils/printDocument'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportDetailDrawer from './ReportDetailDrawer'
import RecordDebtPaymentModal from './RecordDebtPaymentModal'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'

export default function SupplierDebtsReportView({
  suppliersList = [],
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

  // Pagination & Drawer & Modal
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [payTargetRecord, setPayTargetRecord] = useState(null)

  // Map suppliers with their purchase orders and debt balances
  const supplierDebtsData = useMemo(() => {
    const today = new Date()

    return suppliersList.map((s) => {
      const name = s.name || s.supplierName || 'Supplier'
      // Find matching purchases for this supplier
      const matchingPurchases = purchasesList.filter((p) => {
        const pSupp = (p.supplierName || p.supplier || '').toLowerCase()
        return pSupp && (pSupp.includes(name.toLowerCase()) || name.toLowerCase().includes(pSupp))
      })

      const totalPurchaseAmount = matchingPurchases.reduce((acc, p) => acc + (Number(p.amountRWF ?? p.total ?? 0)), 0)
      const totalPaid = matchingPurchases.reduce((acc, p) => acc + (Number(p.paidRWF ?? p.amountPaid ?? 0)), 0)

      // Outstanding balance: from record itself or calculated
      const directBalance = Number(s.amountRWF ?? s.balanceOwedRWF ?? s.outstanding ?? 0)
      const calculatedBalance = Math.max(0, totalPurchaseAmount - totalPaid)
      const outstanding = directBalance > 0 ? directBalance : calculatedBalance
      const purchaseAmount = Math.max(totalPurchaseAmount, outstanding)
      const paid = Math.max(0, purchaseAmount - outstanding)

      const dueDateStr = s.dueDate || '2026-11-20'
      const dueDate = new Date(dueDateStr)
      const isOverdue = outstanding > 0 && dueDate < today

      let status = 'Paid'
      if (outstanding > 0) {
        status = paid > 0 ? 'Partial' : 'Unpaid'
      }

      return {
        id: s.id || `SUPP-${Math.random()}`,
        supplierName: name,
        phone: s.phone || '0788•••111',
        category: s.category || 'Supplies',
        purchaseAmount,
        amountPaid: paid,
        outstanding,
        dueDate: dueDateStr,
        isOverdue,
        status,
        date: s.date || '2026-11-01',
        raw: s
      }
    }).sort((a, b) => b.outstanding - a.outstanding)
  }, [suppliersList, purchasesList])

  // Filtered supplier records
  const filteredDebts = useMemo(() => {
    return supplierDebtsData.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = s.supplierName.toLowerCase().includes(q)
        const matchesCat = (s.category || '').toLowerCase().includes(q)
        if (!matchesName && !matchesCat) return false
      }

      // Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Overdue') {
          if (!s.isOverdue) return false
        } else if (s.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [supplierDebtsData, searchQuery, statusFilter])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalSupplierDebt = filteredDebts.reduce((acc, s) => acc + s.outstanding, 0)
    const overduePayments = filteredDebts.filter((s) => s.isOverdue).reduce((acc, s) => acc + s.outstanding, 0)
    const suppliersOwed = filteredDebts.filter((s) => s.outstanding > 0).length
    const paidThisMonth = filteredDebts.reduce((acc, s) => acc + s.amountPaid, 0)

    return {
      totalSupplierDebt,
      overduePayments,
      suppliersOwed,
      paidThisMonth
    }
  }, [filteredDebts])

  // 4 Summary Cards
  const summaryCards = [
    {
      id: 'supp-total-debt',
      title: 'Total Supplier Debt',
      value: formatRWF(metrics.totalSupplierDebt, hideFinancials),
      subtitle: `${metrics.suppliersOwed} vendors owed`,
      meaning: 'Total accounts payable obligations owed to suppliers for inventory and inputs.',
      icon: DollarSign,
      colorScheme: metrics.totalSupplierDebt > 0 ? 'rose' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'supp-overdue',
      title: 'Overdue Payments',
      value: formatRWF(metrics.overduePayments, hideFinancials),
      subtitle: metrics.overduePayments > 0 ? 'Urgent supplier bills past due' : 'Zero overdue invoices',
      meaning: 'Procurement bills that have passed their agreed payment term date.',
      icon: AlertTriangle,
      colorScheme: metrics.overduePayments > 0 ? 'rose' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'supp-owed-count',
      title: 'Suppliers Owed',
      value: metrics.suppliersOwed,
      subtitle: 'Active creditors',
      meaning: 'Number of individual vendors awaiting pending payments.',
      icon: Building2,
      colorScheme: 'purple',
      isCurrency: false
    },
    {
      id: 'supp-paid-month',
      title: 'Paid This Month',
      value: formatRWF(metrics.paidThisMonth, hideFinancials),
      subtitle: 'Disbursed settlements',
      meaning: 'Total debt payments disbursed to suppliers from business accounts this month.',
      icon: CheckCircle2,
      colorScheme: 'emerald',
      isCurrency: true
    }
  ]

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDebts.length / pageSize))
  const paginatedDebts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDebts.slice(start, start + pageSize)
  }, [filteredDebts, currentPage])

  // Export handlers
  const handleExportCsv = () => {
    const columns = [
      { header: 'Supplier', key: 'supplierName' },
      { header: 'Category', key: 'category' },
      { header: 'Purchase Amount (RWF)', key: 'purchaseAmount' },
      { header: 'Amount Paid (RWF)', key: 'amountPaid' },
      { header: 'Outstanding (RWF)', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    exportToCsv(
      `ExBOS_Supplier_Debts_${dateFilter.replace(/\s+/g, '_')}`,
      columns,
      filteredDebts,
      ['TOTAL SUPPLIER DEBT', '', '', '', metrics.totalSupplierDebt, '', '']
    )
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Supplier', key: 'supplierName' },
      { header: 'Purchase Total', key: 'purchaseAmount' },
      { header: 'Paid', key: 'amountPaid' },
      { header: 'Outstanding', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Supplier_Debts_${dateFilter.replace(/\s+/g, '_')}`,
      'Supplier Debts Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredDebts
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Supplier', key: 'supplierName' },
      { header: 'Category', key: 'category' },
      { header: 'Purchase Total (RWF)', key: 'purchaseAmount' },
      { header: 'Paid (RWF)', key: 'amountPaid' },
      { header: 'Outstanding (RWF)', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    printReportDocument({
      title: 'Supplier Payables & Debts Statement',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: filteredDebts
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
        searchPlaceholder="Search suppliers by name or category..."
        totalRecordsCount={filteredDebts.length}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportCsv}
        onPrint={handlePrint}
        filterOptions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Overdue">Overdue Only</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Fully Paid</option>
          </select>
        }
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 3: Detailed Supplier Debts Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Supplier Payables &amp; Creditor Ledger
            </h4>
            <p className="text-[11px] text-slate-400">
              Disburse vendor payments and automatically reconcile accounts
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No supplier debt records found matching filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Purchase Total (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Outstanding</th>
                  <th className="py-2.5 px-3 text-center">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedDebts.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setSelectedRecord(s.raw || s)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                        {s.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {s.category}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatRWF(s.purchaseAmount, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {formatRWF(s.amountPaid, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {s.outstanding > 0 ? (
                        <span className="text-rose-400">
                          {formatRWF(s.outstanding, hideFinancials)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 RWF</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={s.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {s.dueDate}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : s.isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : s.status === 'Partial'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {s.isOverdue ? 'Overdue' : s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(s.raw || s)
                            setDrawerOpen(true)
                          }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="View Supplier Ledger"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {s.outstanding > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayTargetRecord(s.raw || s)
                              setPayModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Disburse Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
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
              {Math.min(currentPage * pageSize, filteredDebts.length)} of{' '}
              {filteredDebts.length}
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
        reportType="Supplier Debt"
        onRecordPayment={(rec) => {
          setPayTargetRecord(rec)
          setPayModalOpen(true)
        }}
      />

      {/* Record Repayment Modal */}
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

