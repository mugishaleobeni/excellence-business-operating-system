import React, { useState, useMemo } from 'react'
import {
  Factory,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportPerformanceChart from './ReportPerformanceChart'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'
import { printReportDocument } from '../../../utils/printDocument'
import { DEFAULT_PRODUCTION_ORDERS } from '../make-and-sell/data/makeSellDefaults'

export default function ProductionReportView({
  orders = DEFAULT_PRODUCTION_ORDERS,
  businessName = 'ExBOS Manufacturing Enterprise',
  hideFinancials = false
}) {
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = o.completionDate || o.plannedDate || '2026-10-30'
      const inDate = isDateInFilter(orderDate, dateFilter, customStart, customEnd)
      if (!inDate) return false

      if (statusFilter !== 'All' && o.status !== statusFilter) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchProduct = (o.productName || '').toLowerCase().includes(q)
        const matchId = (o.id || '').toLowerCase().includes(q)
        const matchEmployee = (o.responsibleEmployee || '').toLowerCase().includes(q)
        if (!matchProduct && !matchId && !matchEmployee) return false
      }

      return true
    })
  }, [orders, dateFilter, customStart, customEnd, statusFilter, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalBatches = filteredOrders.length
    const completedBatches = filteredOrders.filter((o) => o.status === 'Completed').length
    const totalUsableUnits = filteredOrders.reduce(
      (sum, o) => sum + (o.actualQuantity || (o.status === 'Completed' ? o.plannedQuantity : 0)),
      0
    )
    const totalCost = filteredOrders.reduce(
      (sum, o) => sum + (o.totalProductionCostRWF || 0),
      0
    )
    const totalWaste = filteredOrders.reduce((sum, o) => sum + (o.wasteQuantity || 0), 0)
    const avgCostPerUnit = totalUsableUnits > 0 ? Math.round(totalCost / totalUsableUnits) : 0

    return {
      totalBatches,
      completedBatches,
      totalUsableUnits,
      totalCost,
      totalWaste,
      avgCostPerUnit
    }
  }, [filteredOrders])

  const summaryCards = [
    {
      title: 'Total Production Batches',
      value: `${metrics.totalBatches} Orders`,
      subtitle: `${metrics.completedBatches} completed batches`,
      icon: Factory,
      color: 'text-[#218DFF]'
    },
    {
      title: 'Finished Units Produced',
      value: `${metrics.totalUsableUnits} units`,
      subtitle: 'Added to physical sale inventory',
      icon: CheckCircle2,
      color: 'text-emerald-400'
    },
    {
      title: 'Total Manufacturing Cost',
      value: formatRWF(metrics.totalCost, hideFinancials),
      subtitle: 'Materials, direct labor & energy',
      icon: DollarSign,
      color: 'text-white'
    },
    {
      title: 'Average Cost per Unit',
      value: formatRWF(metrics.avgCostPerUnit, hideFinancials),
      subtitle: 'Weighted cost per usable product',
      icon: TrendingUp,
      color: 'text-[#9EDCFF]'
    }
  ]

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

  // Export handlers
  const handleExportCsv = () => {
    const columns = [
      { header: 'Production ID', key: 'id' },
      { header: 'Product', key: 'productName' },
      { header: 'Planned Quantity', key: 'plannedQuantity' },
      { header: 'Actual Quantity', key: 'actualQuantity' },
      { header: 'Date', accessor: (r) => r.completionDate || r.plannedDate },
      { header: 'Production Cost (RWF)', key: 'totalProductionCostRWF' },
      { header: 'Cost per Unit (RWF)', key: 'unitCostRWF' },
      { header: 'Waste Units', key: 'wasteQuantity' },
      { header: 'Status', key: 'status' }
    ]
    exportToCsv(`ExBOS_Production_Report_${dateFilter.replace(/\s+/g, '_')}`, columns, filteredOrders)
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'ID', key: 'id' },
      { header: 'Product', key: 'productName' },
      { header: 'Actual Qty', key: 'actualQuantity' },
      { header: 'Date', accessor: (r) => r.completionDate || r.plannedDate },
      { header: 'Total Cost', key: 'totalProductionCostRWF' },
      { header: 'Unit Cost', key: 'unitCostRWF' },
      { header: 'Status', key: 'status' }
    ]
    exportToTextPdf(
      `ExBOS_Production_Report_${dateFilter.replace(/\s+/g, '_')}`,
      'Production & Manufacturing Report',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      filteredOrders
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Batch ID', key: 'id' },
      { header: 'Product', key: 'productName' },
      { header: 'Planned Qty', key: 'plannedQuantity' },
      { header: 'Actual Qty', key: 'actualQuantity' },
      { header: 'Date', accessor: (r) => r.completionDate || r.plannedDate },
      { header: 'Production Cost (RWF)', key: 'totalProductionCostRWF' },
      { header: 'Unit Cost (RWF)', key: 'unitCostRWF' },
      { header: 'Waste', key: 'wasteQuantity' },
      { header: 'Status', key: 'status' }
    ]
    printReportDocument({
      title: 'Official Production & Manufacturing Report',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: filteredOrders
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
        searchPlaceholder="Search batches by product, batch ID, or supervisor..."
        totalRecordsCount={filteredOrders.length}
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportCsv}
        onPrint={handlePrint}
        filterOptions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="All">All Production Statuses</option>
            <option value="Completed">Completed Batches</option>
            <option value="In Progress">In Progress</option>
            <option value="Planned">Planned</option>
          </select>
        }
      />

      {/* Summary KPI Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Production Report Table (Part 20) */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
              Itemized Production &amp; Batch Yield Log
            </h4>
            <p className="text-[11px] text-slate-400">
              Verified manufacturing runs, inputs consumed, and audited unit costs.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {paginatedOrders.length} of {filteredOrders.length} records
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Factory className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
            <p>No production batches found for the selected period or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Production ID</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Planned Qty</th>
                  <th className="py-2.5 px-3 text-right">Actual Qty</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Production Cost</th>
                  <th className="py-2.5 px-3 text-right">Cost / Unit</th>
                  <th className="py-2.5 px-3 text-right">Waste</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedOrders.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-white">{row.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {row.productName}
                      {row.responsibleEmployee && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          By: {row.responsibleEmployee}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {row.plannedQuantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {row.actualQuantity || (row.status === 'Completed' ? row.plannedQuantity : '—')}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {row.completionDate || row.plannedDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white font-bold">
                      {formatRWF(row.totalProductionCostRWF, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#9EDCFF] font-bold">
                      {formatRWF(row.unitCostRWF, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                      {row.wasteQuantity || 0}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : row.status === 'In Progress'
                            ? 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <span className="text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

