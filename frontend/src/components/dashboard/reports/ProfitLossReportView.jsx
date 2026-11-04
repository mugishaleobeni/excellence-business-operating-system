import React, { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import ReportControls from './ReportControls'
import ReportSummaryCards from './ReportSummaryCards'
import ReportPerformanceChart from './ReportPerformanceChart'
import { isDateInFilter, exportToCsv, exportToTextPdf } from './reportUtils'
import { printReportDocument } from '../../../utils/printDocument'

export default function ProfitLossReportView({
  salesList = [],
  purchasesList = [],
  expensesList = [],
  transactions = [],
  inventoryList = [],
  activeArchId = 'buy-and-sell',
  currentArch = null,
  businessName = 'ExBOS Business',
  hideFinancials = false
}) {
  const [dateFilter, setDateFilter] = useState('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 1. Filtered Sales within period
  const filteredSales = useMemo(() => {
    return salesList.filter((s) => isDateInFilter(s.date, dateFilter, customStart, customEnd))
  }, [salesList, dateFilter, customStart, customEnd])

  // 2. Filtered Expenses within period
  const filteredExpenses = useMemo(() => {
    const list = [...expensesList]
    transactions
      .filter((t) => t.type === 'out' && !t.isInternalTransfer && !t.title?.toLowerCase().includes('transfer'))
      .forEach((t) => {
        if (!list.some((e) => e.id === t.id)) {
          list.push({
            id: t.id,
            date: t.createdAt?.slice(0, 10),
            title: t.title,
            category: t.category || 'Operational Overhead',
            amountRWF: Number(t.amountRWF || 0)
          })
        }
      })
    return list.filter((e) => isDateInFilter(e.date, dateFilter, customStart, customEnd))
  }, [expensesList, transactions, dateFilter, customStart, customEnd])

  // Calculate COGS:
  // For each sale, determine product cost * quantity sold
  const cogsCalculated = useMemo(() => {
    let totalCogs = 0
    filteredSales.forEach((sale) => {
      const pName = (sale.productTitle || sale.title || sale.product || '').toLowerCase()
      const qtySold = Number(sale.quantity) || 1

      // Find matching item in inventory to get unit cost
      const match = inventoryList.find((i) => {
        const iName = (i.productTitle || i.title || i.name || '').toLowerCase()
        return iName && (iName.includes(pName) || pName.includes(iName))
      })

      const unitCost = match
        ? Number(match.purchasePriceRWF ?? match.unitCostRWF ?? 0)
        : Number(sale.costPriceRWF ?? sale.unitCostRWF ?? Math.round((Number(sale.amountRWF || 0) * 0.65) / qtySold))

      totalCogs += unitCost * qtySold
    })
    return totalCogs
  }, [filteredSales, inventoryList])

  // Core Financial Aggregations
  const financialTotals = useMemo(() => {
    const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.amountRWF ?? s.total ?? 0)), 0)
    const totalCOGS = cogsCalculated
    const grossProfit = totalRevenue - totalCOGS

    // Group expenses by category
    const expenseByCategory = {}
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'Other Operating Expenses'
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + (Number(e.amountRWF ?? e.amount ?? 0))
    })

    const totalOpEx = Object.values(expenseByCategory).reduce((acc, v) => acc + v, 0)
    const netProfit = grossProfit - totalOpEx
    const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0
    const netMarginPct = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      expenseByCategory,
      totalOpEx,
      netProfit,
      grossMarginPct,
      netMarginPct
    }
  }, [filteredSales, cogsCalculated, filteredExpenses])

  // 4 Summary Cards
  const summaryCards = [
    {
      id: 'pl-revenue',
      title: 'Sales Revenue',
      value: formatRWF(financialTotals.totalRevenue, hideFinancials),
      subtitle: `${filteredSales.length} orders recognized`,
      meaning: 'Total gross sales generated under accrual accounting for this period.',
      icon: TrendingUp,
      colorScheme: 'sapphire',
      isCurrency: true
    },
    {
      id: 'pl-cogs',
      title: 'Cost of Goods Sold',
      value: formatRWF(financialTotals.totalCOGS, hideFinancials),
      subtitle: `${100 - financialTotals.grossMarginPct}% of revenue`,
      meaning: 'Direct cost of inventory sold (not total purchase orders).',
      icon: TrendingDown,
      colorScheme: 'amber',
      isCurrency: true
    },
    {
      id: 'pl-opex',
      title: 'Operating Expenses',
      value: formatRWF(financialTotals.totalOpEx, hideFinancials),
      subtitle: `${Object.keys(financialTotals.expenseByCategory).length} expense categories`,
      meaning: 'Day-to-day business overheads: salaries, rent, transport, utilities.',
      icon: Layers,
      colorScheme: 'rose',
      isCurrency: true
    },
    {
      id: 'pl-net-profit',
      title: 'Net Profit',
      value: formatRWF(financialTotals.netProfit, hideFinancials),
      subtitle: `${financialTotals.netMarginPct}% Net Margin`,
      meaning: 'Net bottom-line earnings retained after deducting COGS and all expenses.',
      icon: financialTotals.netProfit >= 0 ? CheckCircle2 : AlertCircle,
      colorScheme: financialTotals.netProfit >= 0 ? 'emerald' : 'rose',
      isCurrency: true
    }
  ]

  // Monthly Comparison Chart
  const chartData = useMemo(() => {
    // Generate comparison data points
    return [
      {
        label: 'Revenue',
        amount: financialTotals.totalRevenue
      },
      {
        label: 'COGS',
        amount: financialTotals.totalCOGS
      },
      {
        label: 'Expenses',
        amount: financialTotals.totalOpEx
      },
      {
        label: 'Net Profit',
        amount: Math.max(0, financialTotals.netProfit)
      }
    ]
  }, [financialTotals])

  // Export handlers
  const handleExportCsv = () => {
    const statementRows = [
      { description: 'Sales Revenue', amount: financialTotals.totalRevenue, type: 'Income' },
      { description: 'Cost of Goods Sold (COGS)', amount: -financialTotals.totalCOGS, type: 'Direct Cost' },
      { description: 'GROSS PROFIT', amount: financialTotals.grossProfit, type: 'Gross Spread' },
      ...Object.entries(financialTotals.expenseByCategory).map(([cat, amt]) => ({
        description: `Expense: ${cat}`,
        amount: -amt,
        type: 'Operating Expense'
      })),
      { description: 'TOTAL OPERATING EXPENSES', amount: -financialTotals.totalOpEx, type: 'Total OpEx' },
      { description: 'NET PROFIT / (LOSS)', amount: financialTotals.netProfit, type: 'Net Bottom Line' }
    ]

    const columns = [
      { header: 'Financial Description', key: 'description' },
      { header: 'Amount (RWF)', key: 'amount' },
      { header: 'Classification', key: 'type' }
    ]
    exportToCsv(`ExBOS_Profit_Loss_${dateFilter.replace(/\s+/g, '_')}`, columns, statementRows)
  }

  const handleExportPdf = () => {
    const columns = [
      { header: 'Description', key: 'description' },
      { header: 'Amount (RWF)', key: 'amount' }
    ]
    const statementRows = [
      { description: 'Sales Revenue', amount: formatRWF(financialTotals.totalRevenue) },
      { description: 'Cost of Goods Sold', amount: `-${formatRWF(financialTotals.totalCOGS)}` },
      { description: 'Gross Profit', amount: formatRWF(financialTotals.grossProfit) },
      { description: 'Operating Expenses', amount: `-${formatRWF(financialTotals.totalOpEx)}` },
      { description: 'Net Profit', amount: formatRWF(financialTotals.netProfit) }
    ]
    exportToTextPdf(
      `ExBOS_Profit_Loss_${dateFilter.replace(/\s+/g, '_')}`,
      'Profit & Loss Statement',
      dateFilter,
      businessName,
      summaryCards,
      columns,
      statementRows
    )
  }

  const handlePrint = () => {
    const columns = [
      { header: 'Financial Description', key: 'description' },
      { header: 'Amount (RWF)', key: 'amount' }
    ]
    const statementRows = [
      { description: 'Sales Revenue', amount: formatRWF(financialTotals.totalRevenue) },
      { description: 'Cost of Goods Sold (COGS)', amount: `-${formatRWF(financialTotals.totalCOGS)}` },
      { description: 'Gross Profit', amount: formatRWF(financialTotals.grossProfit) },
      ...Object.entries(financialTotals.expenseByCategory).map(([cat, amt]) => ({
        description: `Operating Expense: ${cat}`,
        amount: `-${formatRWF(amt)}`
      })),
      { description: 'Total Operating Expenses', amount: `-${formatRWF(financialTotals.totalOpEx)}` },
      { description: 'Net Profit / (Loss)', amount: formatRWF(financialTotals.netProfit) }
    ]
    printReportDocument({
      title: 'Audited Profit & Loss Statement',
      period: dateFilter,
      businessName,
      summaryCards,
      columns,
      rows: statementRows
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
        searchPlaceholder="Search expense items or revenue..."
        onExportPdf={handleExportPdf}
        onExportExcel={handleExportCsv}
        onPrint={handlePrint}
      />

      {/* Section 1: Summary Cards */}
      <ReportSummaryCards cards={summaryCards} hideFinancials={hideFinancials} />

      {/* Section 2: Profit Performance Visual Chart */}
      <ReportPerformanceChart
        title="Profit Performance & Spread"
        subtitle="Revenue vs Cost of Goods Sold vs Operating Expenses vs Net Bottom Line"
        data={chartData}
        series={[{ key: 'amount', label: 'Amount (RWF)', color: '#218DFF' }]}
        hideFinancials={hideFinancials}
        isCurrency={true}
      />

      {/* Section 3: Detailed Financial Breakdown Statement Table */}
      <div className="exbos-glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="font-orbitron text-base font-bold text-white">
              Financial Breakdown Statement
            </h4>
            <p className="text-[11px] text-slate-400">
              Verified Profit &amp; Loss breakdown according to accounting principles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 font-mono text-xs text-[#9EDCFF]">
              Period: {dateFilter}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                <th className="py-2.5 px-4 text-left">Description</th>
                <th className="py-2.5 px-4 text-right">Amount (RWF)</th>
                <th className="py-2.5 px-4 text-right">% of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* Revenue */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 font-semibold text-white font-sans flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Sales Revenue
                </td>
                <td className="py-3 px-4 text-right font-bold text-white">
                  +{formatRWF(financialTotals.totalRevenue, hideFinancials)}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">100%</td>
              </tr>

              {/* COGS */}
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-slate-300 font-sans flex items-center gap-2 pl-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Cost of Goods Sold (COGS)
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-400">
                  -{formatRWF(financialTotals.totalCOGS, hideFinancials)}
                </td>
                <td className="py-3 px-4 text-right text-slate-400">
                  {financialTotals.totalRevenue > 0
                    ? `${Math.round((financialTotals.totalCOGS / financialTotals.totalRevenue) * 100)}%`
                    : '0%'}
                </td>
              </tr>

              {/* Gross Profit Bar */}
              <tr className="bg-white/5 font-bold">
                <td className="py-3 px-4 text-[#9EDCFF] font-orbitron font-bold">
                  GROSS PROFIT
                </td>
                <td className="py-3 px-4 text-right font-bold text-[#9EDCFF] font-orbitron text-sm">
                  {formatRWF(financialTotals.grossProfit, hideFinancials)}
                </td>
                <td className="py-3 px-4 text-right text-[#9EDCFF] font-bold">
                  {financialTotals.grossMarginPct}% Margin
                </td>
              </tr>

              {/* Operating Expenses Sub-header */}
              <tr>
                <td colSpan={3} className="py-2.5 px-4 text-[10px] font-orbitron text-slate-400 uppercase tracking-wider bg-black/20">
                  Operating Expenses
                </td>
              </tr>

              {Object.keys(financialTotals.expenseByCategory).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-slate-500 italic text-center">
                    No operating expenses recorded for this period.
                  </td>
                </tr>
              ) : (
                Object.entries(financialTotals.expenseByCategory).map(([cat, amt]) => (
                  <tr key={cat} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 text-slate-300 font-sans flex items-center gap-2 pl-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {cat}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-rose-300">
                      -{formatRWF(amt, hideFinancials)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      {financialTotals.totalRevenue > 0
                        ? `${Math.round((amt / financialTotals.totalRevenue) * 100)}%`
                        : '—'}
                    </td>
                  </tr>
                ))
              )}

              {/* Total OpEx */}
              <tr className="bg-rose-500/10 font-bold border-t border-white/10">
                <td className="py-3 px-4 text-rose-300 font-sans pl-6">
                  Total Operating Expenses
                </td>
                <td className="py-3 px-4 text-right font-bold text-rose-400">
                  -{formatRWF(financialTotals.totalOpEx, hideFinancials)}
                </td>
                <td className="py-3 px-4 text-right text-rose-300">
                  {financialTotals.totalRevenue > 0
                    ? `${Math.round((financialTotals.totalOpEx / financialTotals.totalRevenue) * 100)}%`
                    : '—'}
                </td>
              </tr>

              {/* Net Profit Bar */}
              <tr
                className={`border-t-2 ${
                  financialTotals.netProfit >= 0
                    ? 'bg-emerald-500/20 border-emerald-400/50'
                    : 'bg-rose-500/20 border-rose-400/50'
                }`}
              >
                <td className="py-4 px-4 font-orbitron font-extrabold text-white text-sm">
                  NET PROFIT / (LOSS)
                </td>
                <td
                  className={`py-4 px-4 text-right font-orbitron font-extrabold text-base ${
                    financialTotals.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatRWF(financialTotals.netProfit, hideFinancials)}
                </td>
                <td
                  className={`py-4 px-4 text-right font-orbitron font-bold ${
                    financialTotals.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {financialTotals.netMarginPct}% Net Margin
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

