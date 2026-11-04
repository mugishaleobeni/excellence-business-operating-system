import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Search,
  Plus,
  Send,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function QuotationsView({
  documents = [],
  hideFinancials = false,
  onCreateQuotation,
  onOpenSendModal,
  onOpenPreviewModal,
  onConvertToInvoice,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const quotations = useMemo(() => {
    return documents.filter((d) => d.type === 'Quotation')
  }, [documents])

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchRec = (q.recipientName || '').toLowerCase().includes(query)
        const matchId = (q.id || '').toLowerCase().includes(query)
        if (!matchRec && !matchId) return false
      }
      if (statusFilter !== 'All') {
        if (q.status !== statusFilter) return false
      }
      return true
    })
  }, [quotations, searchQuery, statusFilter])

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
            placeholder="Search quotations by client or #QT..."
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
            <option value="All">All Quotations</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
          </select>

          <button
            type="button"
            onClick={onCreateQuotation}
            className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 text-[#9EDCFF]" />
            <span>+ Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/30 text-[11px] text-purple-200 flex items-center justify-between">
        <span>
          💡 Proforma quotations allow sending formal price estimates without affecting inventory balances or posting sales revenue.
        </span>
      </div>

      {/* Quotations Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-orbitron text-sm font-bold text-white">
            Client Price Estimates &amp; Quotations
          </h4>
          <span className="text-xs font-mono text-slate-400">
            {filteredQuotations.length} quotes on file
          </span>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No quotations recorded. Click "+ Create Quotation" to draft a price proposal.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Quote #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3 text-right">Estimated Amount</th>
                  <th className="py-2.5 px-3 text-center">Valid Until</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredQuotations.map((qt) => (
                  <tr
                    key={qt.id}
                    onClick={() => onOpenPreviewModal(qt)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#9EDCFF]">
                      {qt.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {qt.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {qt.recipientName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(qt.amount || 0, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {qt.dueDate || qt.validUntil || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          qt.status === 'Accepted'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : qt.status === 'Sent'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-purple-500/15 text-purple-300'
                        }`}
                      >
                        {qt.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenPreviewModal(qt)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="Preview Quotation"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenSendModal(qt)}
                          className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Send to Client"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>

                        {onConvertToInvoice && (
                          <button
                            type="button"
                            onClick={() => onConvertToInvoice(qt)}
                            className="px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Convert into Active Invoice"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Invoice</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onDownloadDoc(qt)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

