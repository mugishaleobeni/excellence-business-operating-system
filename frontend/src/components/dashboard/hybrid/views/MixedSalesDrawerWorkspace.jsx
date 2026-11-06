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
  Layers,
  BarChart3,
  Percent,
  Calendar,
  ArrowUpRight
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordMixedSaleModal from '../modals/RecordMixedSaleModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function MixedSalesDrawerWorkspace({
  activeModule = 'Sales',
  activePage = 'All Sales',
  onSwitchPage = () => {}
}) {
  const { demoWorkspaces, deleteDemoRecord } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const mixedSales = hybridWorkspace.records?.MixedSales || []

  const isSalesTrendsView = activePage === 'Sales Trends'

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
    const avgBasket = mixedSales.length > 0 ? Math.round(totalRevenue / mixedSales.length) : 0

    // Split revenue by activity
    let retailRev = 0
    let serviceRev = 0
    let foodRev = 0
    mixedSales.forEach((s) => {
      (s.items || []).forEach((it) => {
        const itemTotal = (Number(it.sellingPriceRWF) || 0) * (Number(it.qty) || 1)
        if (it.activity === 'retail') retailRev += itemTotal
        else if (it.activity === 'service') serviceRev += itemTotal
        else if (it.activity === 'food') foodRev += itemTotal
      })
    })

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      blendedMargin,
      avgBasket,
      totalSalesCount: mixedSales.length,
      retailRev,
      serviceRev,
      foodRev
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
              {isSalesTrendsView ? 'Multi-Activity Trends' : 'Unified Till Drawer'}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            {isSalesTrendsView ? (
              <>
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Sales Trends &amp; Revenue Velocity
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 text-emerald-400" />
                Unified Mixed Sales Drawer
              </>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSalesTrendsView
              ? 'Multi-stream revenue velocity, blended margin trajectory, and activity volume distribution.'
              : 'Single invoice checkout combining physical parts, billable service labor, and counter items.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isSalesTrendsView ? (
            <button
              onClick={() => onSwitchPage('Sales', 'All Sales')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
            >
              <Receipt className="w-4 h-4 text-emerald-400" /> All Invoices
            </button>
          ) : (
            <button
              onClick={() => onSwitchPage('Sales', 'Sales Trends')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Sales Trends
            </button>
          )}

          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-4 h-4" /> New Mixed Sale
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {summaryMetrics.totalRevenue.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {summaryMetrics.totalSalesCount} Mixed Invoices
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Basket Size</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-300">
            {summaryMetrics.avgBasket.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per customer checkout</div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Blended Net Margin</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300">
            {summaryMetrics.blendedMargin}%
          </div>
          <div className="text-[11px] text-purple-300/80 mt-1">Goods + Service Labor</div>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Combined Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">
            {summaryMetrics.totalProfit.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">Retained cash flow</div>
        </div>
      </div>

      {/* VIEW 1: SALES TRENDS & VELOCITY */}
      {isSalesTrendsView ? (
        <div className="space-y-4">
          {/* Activity Split Revenue Bars */}
          <div className="bg-white/[0.02] p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Multi-Stream Revenue Distribution</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[11px] text-blue-300 block font-semibold uppercase">Retail Physical Goods</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {summaryMetrics.retailRev.toLocaleString()} RWF
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {summaryMetrics.totalRevenue > 0
                    ? `${((summaryMetrics.retailRev / summaryMetrics.totalRevenue) * 100).toFixed(1)}% of total sales`
                    : '0% of total sales'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-[11px] text-purple-300 block font-semibold uppercase">Billable Service Labor</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {summaryMetrics.serviceRev.toLocaleString()} RWF
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {summaryMetrics.totalRevenue > 0
                    ? `${((summaryMetrics.serviceRev / summaryMetrics.totalRevenue) * 100).toFixed(1)}% of total sales`
                    : '0% of total sales'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[11px] text-amber-300 block font-semibold uppercase">Food &amp; Dining Counter</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {summaryMetrics.foodRev.toLocaleString()} RWF
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {summaryMetrics.totalRevenue > 0
                    ? `${((summaryMetrics.foodRev / summaryMetrics.totalRevenue) * 100).toFixed(1)}% of total sales`
                    : '0% of total sales'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Trend Breakdown */}
          <div className="bg-white/[0.02] p-5 rounded-2xl shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Recent Transaction Velocity</span>
            </h3>

            <div className="space-y-2 pt-1">
              {mixedSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/20 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold text-xs">
                      {sale.invoiceNumber?.slice(-3) || 'INV'}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-white">{sale.customerName || 'Walk-in Client'}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {sale.date || 'Today'} · {sale.paymentMethod || 'Cash'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-emerald-400">
                      +{Number(sale.totalAmountRWF || 0).toLocaleString()} RWF
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {(sale.items || []).length} items in basket
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: ALL MIXED INVOICES TABLE */
        <div className="bg-white/[0.02] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Mixed Invoices ({filteredSales.length})</span>
            </div>
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice, customer, item..."
                className="w-full bg-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400 border-b border-white/5 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Invoice &amp; Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Basket Contents (Multi-Activity)</th>
                  <th className="px-4 py-3 text-center">Settlement</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Net Margin</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                      No sales found. Click "+ New Mixed Sale" to record a checkout basket.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const rev = Number(sale.totalAmountRWF) || 0
                    const cost = Number(sale.totalCostRWF) || 0
                    const profit = rev - cost
                    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0.0'

                    return (
                      <tr key={sale.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-semibold text-white">{sale.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{sale.date}</div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-slate-200 font-medium">{sale.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Walk-in / Account</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {sale.items?.map((it, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded text-[10px] font-semibold ${getActivityBadgeColor(
                                  it.activity
                                )}`}
                              >
                                {it.title} ({it.qty}x)
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                            {sale.paymentMethod || 'Cash'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                          {rev.toLocaleString()} RWF
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-emerald-400">{margin}%</span>
                          <div className="text-[10px] text-slate-500">
                            +{profit.toLocaleString()} RWF
                          </div>
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setDeleteTarget(sale)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                            title="Delete Sale"
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
      )}

      {/* Sale Modal */}
      <RecordMixedSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Mixed Sale Invoice"
          message={`Are you sure you want to remove invoice "${deleteTarget.invoiceNumber}"? Total amount: ${deleteTarget.totalAmountRWF?.toLocaleString()} RWF.`}
        />
      )}
    </div>
  )
}
