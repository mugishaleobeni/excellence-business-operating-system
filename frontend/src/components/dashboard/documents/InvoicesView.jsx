import React, { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  Plus,
  Send,
  Eye,
  Download,
  Bell,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function InvoicesView({
  documents = [],
  hideFinancials = false,
  onCreateInvoice,
  onOpenSendModal,
  onOpenPreviewModal,
  onOpenReminderModal,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const invoices = useMemo(() => {
    return documents.filter((d) => d.type === 'Invoice')
  }, [documents])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchRec = (inv.recipientName || '').toLowerCase().includes(q)
        const matchId = (inv.id || '').toLowerCase().includes(q)
        if (!matchRec && !matchId) return false
      }
      if (statusFilter !== 'All') {
        if (inv.status !== statusFilter) return false
      }
      return true
    })
  }, [invoices, searchQuery, statusFilter])

  // Summary counts
  const totalBilled = filteredInvoices.reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
  const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + (Number(i.outstandingAmount) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices by customer or #ID..."
            style={{ backgroundColor: '#071644', color: '#ffffff' }}
            className="w-full pl-9 pr-3 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none"
          >
            <option value="All">All Invoices</option>
            <option value="Paid">Paid in Full</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>

          <button
            type="button"
            onClick={onCreateInvoice}
            className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 text-[#9EDCFF]" />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoices</span>
          <strong className="font-orbitron text-xl text-white block mt-1">{filteredInvoices.length}</strong>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
          <strong className="font-orbitron text-xl text-emerald-400 block mt-1">
            {formatRWF(totalBilled, hideFinancials)}
          </strong>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
          <strong className="font-orbitron text-xl text-amber-300 block mt-1">
            {formatRWF(totalOutstanding, hideFinancials)}
          </strong>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-orbitron text-sm font-bold text-white">
            Commercial Invoices Ledger
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {filteredInvoices.length} records
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No invoices found. Click "+ Create Invoice" to issue a new commercial bill.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total (RWF)</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((inv) => {
                  const isUnpaid = inv.outstandingAmount > 0
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onOpenPreviewModal(inv)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#9EDCFF]">
                        {inv.id}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {inv.date}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                        {inv.recipientName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatRWF(inv.amount || 0, hideFinancials)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        {formatRWF(inv.paidAmount || 0, hideFinancials)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {isUnpaid ? (
                          <span className="text-amber-300">{formatRWF(inv.outstandingAmount, hideFinancials)}</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {inv.dueDate || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : inv.status === 'Partial'
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => onOpenPreviewModal(inv)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                            title="Preview Invoice"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenSendModal(inv)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="Send via WhatsApp / Email"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </button>

                          {isUnpaid && onOpenReminderModal && (
                            <button
                              type="button"
                              onClick={() => onOpenReminderModal(inv)}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Send Payment Reminder"
                            >
                              <Bell className="w-3 h-3" />
                              <span>Remind</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDownloadDoc(inv)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

