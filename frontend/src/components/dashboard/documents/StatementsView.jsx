import React, { useState, useMemo } from 'react'
import {
  FileText,
  User,
  Building,
  Send,
  Eye,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function StatementsView({
  customers = [],
  suppliers = [],
  documents = [],
  sales = [],
  purchases = [],
  hideFinancials = false,
  onOpenSendModal,
  onOpenPreviewModal,
  onDownloadDoc
}) {
  const [statementType, setStatementType] = useState('Customer') // 'Customer' | 'Supplier'
  const [selectedParty, setSelectedParty] = useState('')
  const [period, setPeriod] = useState('This Month')

  // Auto-pick first party if available
  const partiesList = statementType === 'Customer' ? customers : suppliers

  // Active party details
  const activeParty = useMemo(() => {
    if (!selectedParty && partiesList.length > 0) {
      return partiesList[0]
    }
    return partiesList.find((p) => (p.name || p.customerName || p.supplierName) === selectedParty) || partiesList[0] || null
  }, [partiesList, selectedParty])

  const partyName = activeParty ? (activeParty.name || activeParty.customerName || activeParty.supplierName || 'Account') : 'Select Account'

  // Generate statement ledger entries from documents, sales, and purchases
  const statementEntries = useMemo(() => {
    if (!activeParty) return []
    const name = partyName.toLowerCase()
    const entries = []

    if (statementType === 'Customer') {
      // Find invoices for this customer
      documents
        .filter((d) => d.type === 'Invoice' && (d.recipientName || '').toLowerCase().includes(name))
        .forEach((inv) => {
          entries.push({
            id: inv.id,
            date: inv.date,
            description: `Invoice #${inv.id} — ${inv.title || 'Sale Order'}`,
            billed: Number(inv.amount || 0),
            paid: Number(inv.paidAmount || 0),
            balance: Number(inv.outstandingAmount || 0)
          })
        })

      // Add direct sales matching customer
      sales
        .filter((s) => (s.customerName || s.customer || '').toLowerCase().includes(name))
        .forEach((s) => {
          if (!entries.some((e) => e.id === s.id)) {
            entries.push({
              id: s.id,
              date: s.date,
              description: `Sales Bill #${s.id} — ${s.title || 'Direct Retail'}`,
              billed: Number(s.amountRWF || 0),
              paid: Number(s.paidRWF || (s.status === 'Paid in Full' ? s.amountRWF : 0)),
              balance: Number(s.balanceOwedRWF || 0)
            })
          }
        })
    } else {
      // Supplier Statement
      documents
        .filter((d) => d.type === 'Purchase Order' && (d.recipientName || '').toLowerCase().includes(name))
        .forEach((po) => {
          entries.push({
            id: po.id,
            date: po.date,
            description: `Purchase Order #${po.id} — ${po.title || 'Procurement'}`,
            billed: Number(po.amount || 0),
            paid: Number(po.paidAmount || 0),
            balance: Number(po.outstandingAmount || 0)
          })
        })

      purchases
        .filter((p) => (p.supplierName || p.supplier || '').toLowerCase().includes(name))
        .forEach((p) => {
          if (!entries.some((e) => e.id === p.id)) {
            entries.push({
              id: p.id,
              date: p.date,
              description: `Supplier Bill #${p.id} — ${p.title || 'Stock Delivery'}`,
              billed: Number(p.amountRWF || 0),
              paid: Number(p.paidAmountRWF || 0),
              balance: Number(p.remainingAmountRWF || 0)
            })
          }
        })
    }

    return entries.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [statementType, activeParty, partyName, documents, sales, purchases])

  // Statement summary metrics
  const totalBilled = statementEntries.reduce((acc, e) => acc + e.billed, 0)
  const totalPaid = statementEntries.reduce((acc, e) => acc + e.paid, 0)
  const closingBalance = Math.max(0, totalBilled - totalPaid)

  // Assembled statement document object for preview / send
  const statementDocument = useMemo(() => {
    return {
      id: `STM-${Math.floor(100 + Math.random() * 900)}`,
      type: `${statementType} Statement`,
      title: `${statementType} Statement — ${partyName}`,
      recipientName: partyName,
      recipientPhone: activeParty?.phone || '',
      recipientEmail: activeParty?.email || '',
      date: new Date().toISOString().slice(0, 10),
      amount: totalBilled,
      paidAmount: totalPaid,
      outstandingAmount: closingBalance,
      status: closingBalance > 0 ? 'Balance Due' : 'Settled',
      items: statementEntries.map((e) => ({
        name: e.description,
        quantity: 1,
        unit: 'txn',
        unitPrice: e.billed,
        total: e.billed
      })),
      notes: `Official account statement for ${period}. Net balance due: ${formatRWF(closingBalance)}.`
    }
  }, [statementType, partyName, activeParty, totalBilled, totalPaid, closingBalance, statementEntries, period])

  return (
    <div className="space-y-6">
      {/* Statement Configuration Bar */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h3 className="font-orbitron text-sm font-bold text-white uppercase">
              Account Statement Generator
            </h3>
            <p className="text-[11px] text-slate-400">
              Generate comprehensive audited statements for customers or suppliers
            </p>
          </div>

          {/* Toggle Customer vs Supplier Statement */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-white/5 border border-white/10 self-start">
            <button
              type="button"
              onClick={() => {
                setStatementType('Customer')
                setSelectedParty('')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statementType === 'Customer'
                  ? 'bg-[#218DFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Statement
            </button>
            <button
              type="button"
              onClick={() => {
                setStatementType('Supplier')
                setSelectedParty('')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statementType === 'Supplier'
                  ? 'bg-[#218DFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Supplier Statement
            </button>
          </div>
        </div>

        {/* Selection Dropdowns & Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Select {statementType}:
            </label>
            <select
              value={selectedParty || (activeParty ? (activeParty.name || activeParty.customerName || activeParty.supplierName) : '')}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/15 text-white focus:outline-none"
            >
              {partiesList.map((p) => {
                const name = p.name || p.customerName || p.supplierName
                return (
                  <option key={p.id || name} value={name}>
                    {name}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">
              Statement Period:
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/15 text-white focus:outline-none"
            >
              <option value="This Month">This Month (November 2026)</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Quarter-to-Date">Quarter-to-Date (Q4 2026)</option>
              <option value="All Time">All Time</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => onOpenPreviewModal(statementDocument)}
              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenSendModal(statementDocument)}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed / Invoiced</span>
          <strong className="font-orbitron text-xl text-white block mt-1">
            {formatRWF(totalBilled, hideFinancials)}
          </strong>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Payments Credited</span>
          <strong className="font-orbitron text-xl text-emerald-400 block mt-1">
            {formatRWF(totalPaid, hideFinancials)}
          </strong>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-amber-300">Closing Balance Due</span>
          <strong className="font-orbitron text-xl text-amber-300 block mt-1">
            {formatRWF(closingBalance, hideFinancials)}
          </strong>
        </div>
      </div>

      {/* Statement Ledger Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Statement of Account: {partyName}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Period: {period}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {statementEntries.length} transactions
          </span>
        </div>

        {statementEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transactions found for {partyName} in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Transaction Description</th>
                  <th className="py-2.5 px-3 text-right">Billed (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Paid (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {statementEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-300">{row.date}</td>
                    <td className="py-3 px-3 font-semibold text-white">{row.description}</td>
                    <td className="py-3 px-3 text-right font-mono text-white">
                      {formatRWF(row.billed, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                      {row.paid > 0 ? `-${formatRWF(row.paid, hideFinancials)}` : '0'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                      {formatRWF(row.balance, hideFinancials)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/20 font-bold bg-white/5">
                  <td colSpan={2} className="py-3 px-3 text-white font-orbitron">
                    STATEMENT NET CLOSING BALANCE
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-white">
                    {formatRWF(totalBilled, hideFinancials)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    -{formatRWF(totalPaid, hideFinancials)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-amber-300 text-sm">
                    {formatRWF(closingBalance, hideFinancials)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

