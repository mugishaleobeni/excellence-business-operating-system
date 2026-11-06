import React, { useState, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  Receipt,
  User,
  CreditCard,
  Trash2,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordMixedSaleModal from '../modals/RecordMixedSaleModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function MixedSalesDrawerWorkspace() {
  const { demoWorkspaces, deleteDemoRecord } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const mixedSales = hybridWorkspace.records?.MixedSales || []

  const [searchQuery, setSearchQuery] = useState('')
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Filter sales
  const filteredSales = useMemo(() => {
    return mixedSales.filter((sale) => {
      const query = searchQuery.toLowerCase().trim()
      if (!query) return true
      return (
        sale.invoiceNumber?.toLowerCase().includes(query) ||
        sale.customerName?.toLowerCase().includes(query) ||
        sale.paymentMethod?.toLowerCase().includes(query) ||
        sale.items?.some((it) => it.title?.toLowerCase().includes(query))
      )
    })
  }, [mixedSales, searchQuery])

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = mixedSales.reduce((acc, s) => acc + (Number(s.totalAmountRWF) || 0), 0)
    const totalCost = mixedSales.reduce((acc, s) => acc + (Number(s.totalCostRWF) || 0), 0)
    const totalProfit = totalRevenue - totalCost
    const blendedMargin =
      totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      blendedMargin,
      totalSalesCount: mixedSales.length
    }
  }, [mixedSales])

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDemoRecord('hybrid', 'MixedSales', deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getActivityBadgeColor = (act) => {
    switch (act) {
      case 'retail':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'service':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'food':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'production':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    }
  }

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-400" />
            Mixed Sales & Multi-Activity POS Ledger
          </h2>
          <p className="text-xs text-slate-400">
            Check out physical goods, billable hours, and cafe items on a single customer invoice.
          </p>
        </div>
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-emerald-900/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Record Mixed Sale
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Mixed Sales</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {summaryMetrics.totalRevenue.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summaryMetrics.totalSalesCount} Invoices Recorded
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            +{summaryMetrics.totalProfit.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Combined net contribution</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Blended Margin</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400">
            {summaryMetrics.blendedMargin}%
          </div>
          <div className="text-[11px] text-purple-300/80 mt-1">Weighted product + labor margin</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Ticket</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {summaryMetrics.totalSalesCount > 0
              ? Math.round(
                  summaryMetrics.totalRevenue / summaryMetrics.totalSalesCount
                ).toLocaleString()
              : 0}{' '}
            RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per mixed transaction</div>
        </div>
      </div>

      {/* Search Bar & Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-white">
            <span>Invoices Ledger ({filteredSales.length})</span>
          </div>
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice, customer, item..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Invoice & Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items & Activities</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3 text-right">Total Bill</th>
                <th className="px-4 py-3 text-right">Net Profit</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                    No mixed sales recorded yet. Click "+ Record Mixed Sale" to process your first checkout.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const total = Number(sale.totalAmountRWF) || 0
                  const profit = Number(sale.netProfitRWF) || 0
                  const isUnpaid = sale.status?.toLowerCase().includes('debt')

                  return (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-indigo-400" />
                          {sale.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{sale.date}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-200">{sale.customerName}</div>
                        <div className="text-[11px] text-slate-400">{sale.customerPhone}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {sale.items?.map((it, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${getActivityBadgeColor(
                                it.activity
                              )}`}
                            >
                              <span>{it.quantity}x</span>
                              <span className="truncate max-w-[120px]">{it.title}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sale.paymentMethod}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                        {total.toLocaleString()} RWF
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-emerald-400">
                          +{profit.toLocaleString()} RWF
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Margin: {sale.marginPercent || '0'}%
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isUnpaid
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {isUnpaid ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {sale.status || 'Paid in Full'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(sale)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                          title="Void / Delete Sale"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Mixed Sale Modal */}
      <RecordMixedSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Void / Delete Mixed Sale"
          message={`Are you sure you want to void invoice "${deleteTarget.invoiceNumber}" (${Number(deleteTarget.totalAmountRWF).toLocaleString()} RWF)?`}
        />
      )}
    </div>
  )
}

