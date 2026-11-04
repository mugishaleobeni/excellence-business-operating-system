import React, { useState, useMemo } from 'react'
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
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

export default function CustomerDebtsReportView({
  customersList = [],
  salesList = [],
  activeArchId = 'buy-and-sell',
  currentArch = null,
  businessName = 'ExBOS Business',
  hideFinancials = false,
  onRecordCustomerPayment = null
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

  // Map customers with their aggregated sales & debt balances
  const customerDebtsData = useMemo(() => {
    const today = new Date()

    return customersList.map((c) => {
      const name = c.name || c.customerName || 'Customer'
      // Find matching sales for this customer
      const matchingSales = salesList.filter((s) => {
        const sCust = (s.customerName || s.customer || '').toLowerCase()
        return sCust && (sCust.includes(name.toLowerCase()) || name.toLowerCase().includes(sCust))
      })

      const totalSalesAmount = matchingSales.reduce((acc, s) => acc + (Number(s.amountRWF ?? s.total ?? 0)), 0)
      const totalPaid = matchingSales.reduce((acc, s) => acc + (Number(s.paidRWF ?? s.amountPaid ?? 0)), 0)

      // Outstanding balance: from record itself or calculated
      const directBalance = Number(c.balanceOwedRWF ?? c.amountRWF ?? c.outstanding ?? 0)
      const calculatedBalance = Math.max(0, totalSalesAmount - totalPaid)
      const outstanding = directBalance > 0 ? directBalance : calculatedBalance
      const totalDebt = Math.max(totalSalesAmount, outstanding)
      const paid = Math.max(0, totalDebt - outstanding)

      // Due date check
      const dueDateStr = c.dueDate || '2026-11-15'
      const dueDate = new Date(dueDateStr)
      const isOverdue = outstanding > 0 && dueDate < today

      let status = 'Paid'
      if (outstanding > 0) {
        status = paid > 0 ? 'Partial' : 'Unpaid'
      }

      return {
        id: c.id || `CUST-${Math.random()}`,
        customerName: name,
        phone: c.phone || '0788•••000',
        totalDebt,
        amountPaid: paid,
        outstanding,
        dueDate: dueDateStr,
        isOverdue,
        status,
        date: c.date || '2026-11-01',
        raw: c
      }
    }).sort((a, b) => b.outstanding - a.outstanding)
  }, [customersList, salesList])

  // Filtered customer records
  const filteredDebts = useMemo(() => {
    return customerDebtsData.filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = c.customerName.toLowerCase().includes(q)
        const matchesPhone = (c.phone || '').toLowerCase().includes(q)
        if (!matchesName && !matchesPhone) return false
      }

      // Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Overdue') {
          if (!c.isOverdue) return false
        } else if (c.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false
        }
      }

      return true
    })
  }, [customerDebtsData, searchQuery, statusFilter])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalOutstanding = filteredDebts.reduce((acc, c) => acc + c.outstanding, 0)
    const overdueDebt = filteredDebts.filter((c) => c.isOverdue).reduce((acc, c) => acc + c.outstanding, 0)
    const customersOwing = filteredDebts.filter((c) => c.outstanding > 0).length
    const collectedThisMonth = filteredDebts.reduce((acc, c) => acc + c.amountPaid, 0)

    return {
      totalOutstanding,
      overdueDebt,
      customersOwing,
      collectedThisMonth
    }
  }, [filteredDebts])

  // 4 Summary Cards
  const summaryCards = [
    {
      id: 'cust-total-outstanding',
      title: 'Total Outstanding',
      value: formatRWF(metrics.totalOutstanding, hideFinancials),
      subtitle: `${metrics.customersOwing} customers with balance`,
      meaning: 'Total open accounts receivable owed by customers across all sales.',
      icon: DollarSign,
      colorScheme: metrics.totalOutstanding > 0 ? 'amber' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'cust-overdue',
      title: 'Overdue Debt',
      value: formatRWF(metrics.overdueDebt, hideFinancials),
      subtitle: metrics.overdueDebt > 0 ? 'Past agreed payment date' : 'Zero overdue payments',
      meaning: 'Customer credit that has exceeded the specified repayment due date.',
      icon: AlertTriangle,
      colorScheme: metrics.overdueDebt > 0 ? 'rose' : 'sapphire',
      isCurrency: true
    },
    {
      id: 'cust-owing-count',
      title: 'Customers Owing',
      value: metrics.customersOwing,
      subtitle: 'Active debtors',
      meaning: 'Number of individual clients who have an unsettled credit balance.',
      icon: Users,
      colorScheme: 'purple',
      isCurrency: false
    },
    {
      id: 'cust-collected',
      title: 'Collected This Month',
      value: formatRWF(metrics.collectedThisMonth, hideFinancials),
      subtitle: 'Recovered receivables',
      meaning: 'Total debt payments received and posted to bank or cash accounts this month.',
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
      { header: 'Customer', key: 'customerName' },
      { header: 'Phone', key: 'phone' },
      { header: 'Total Debt (RWF)', key: 'totalDebt' },
      { header: 'Amount Paid (RWF)', key: 'amountPaid' },
      { header: 'Outstanding (RWF)', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    exportToCsv(
      `ExBOS_Customer_Debts_${dateFilter.replace(/\s+/g, '_')}`,
      columns,
      filteredDebts,
      ['TOTAL OUTSTANDING', '', '', '', metrics.totalOutstanding, '', '']
    )
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Customer', key: 'customerName' },
      { header: 'Total Debt', key: 'totalDebt' },
      { header: 'Paid', key: 'amountPaid' },
      { header: 'Outstanding', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Customer_Debts_${dateFilter.replace(/\s+/g, '_')}`,
      'Customer Debts Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredDebts
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Customer', key: 'customerName' },
      { header: 'Phone', key: 'phone' },
      { header: 'Total Debt (RWF)', key: 'totalDebt' },
      { header: 'Paid (RWF)', key: 'amountPaid' },
      { header: 'Outstanding (RWF)', key: 'outstanding' },
      { header: 'Due Date', key: 'dueDate' },
      { header: 'Status', key: 'status' }
    ]
    printReportDocument({
      title: 'Customer Debts & Receivables Statement',
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
        searchPlaceholder="Search debtors by name or phone..."
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
            <option value="All">All Debt Statuses</option>
            <option value="Overdue">Overdue Only</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Fully Paid</option>
          </select>
        }
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 3: Detailed Customer Debts Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Customer Debt Aging &amp; Receivables Ledger
            </h4>
            <p className="text-[11px] text-slate-400">
              Track open customer credit and record cash/MoMo repayments directly
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No customer debts found matching current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total Debt (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Outstanding</th>
                  <th className="py-2.5 px-3 text-center">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedDebts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setSelectedRecord(c.raw || c)
                      setDrawerOpen(true)
                    }}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                        {c.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.phone}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatRWF(c.totalDebt, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {formatRWF(c.amountPaid, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {c.outstanding > 0 ? (
                        <span className="text-amber-300">
                          {formatRWF(c.outstanding, hideFinancials)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0 RWF</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={c.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {c.dueDate}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : c.isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : c.status === 'Partial'
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {c.isOverdue ? 'Overdue' : c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(c.raw || c)
                            setDrawerOpen(true)
                          }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="View Customer Ledger"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {c.outstanding > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayTargetRecord(c.raw || c)
                              setPayModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Record Repayment"
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
        reportType="Customer Debt"
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
        type="customer"
        onConfirm={(data) => {
          if (onRecordCustomerPayment) onRecordCustomerPayment(data)
        }}
      />
    </div>
  )
}

