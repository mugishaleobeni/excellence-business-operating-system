import React, { useMemo } from 'react'
import {
  FileText,
  Send,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  Share2,
  FileSpreadsheet,
  Layers,
  Search
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function DocumentsOverview({
  documents = [],
  sentHistory = [],
  hideFinancials = false,
  onCreateClick,
  onOpenSendModal,
  onOpenPreviewModal,
  onDownloadDoc
}) {
  // Aggregate 4 Overview Summary Metrics
  const metrics = useMemo(() => {
    const totalDocs = documents.length
    const sentDocs = sentHistory.length
    const unpaidInvoices = documents.filter(
      (d) => d.type === 'Invoice' && (d.status === 'Partial' || d.status === 'Unpaid' || (d.outstandingAmount || 0) > 0)
    ).length
    const pendingQuotations = documents.filter(
      (d) => d.type === 'Quotation' && (d.status === 'Draft' || d.status === 'Sent')
    ).length

    return {
      totalDocs,
      sentDocs,
      unpaidInvoices,
      pendingQuotations
    }
  }, [documents, sentHistory])

  const summaryCards = [
    {
      id: 'doc-total',
      title: 'Total Documents',
      value: metrics.totalDocs,
      subtitle: 'Generated business records',
      meaning: 'Cumulative total of invoices, receipts, quotations, and purchase orders on file.',
      icon: FileText,
      colorScheme: 'text-[#9EDCFF]',
      border: 'hover:border-[#218DFF]/50'
    },
    {
      id: 'doc-sent',
      title: 'Sent Documents',
      value: metrics.sentDocs,
      subtitle: 'Dispatched via WhatsApp / Email',
      meaning: 'Total documents shared with customers or suppliers with external handoffs.',
      icon: Send,
      colorScheme: 'text-emerald-400',
      border: 'hover:border-emerald-500/50'
    },
    {
      id: 'doc-unpaid',
      title: 'Unpaid Invoices',
      value: metrics.unpaidInvoices,
      subtitle: 'Pending customer collection',
      meaning: 'Invoices with remaining credit balance awaiting settlement or payment reminder.',
      icon: AlertCircle,
      colorScheme: 'text-amber-400',
      border: 'hover:border-amber-500/50'
    },
    {
      id: 'doc-quotations',
      title: 'Pending Quotations',
      value: metrics.pendingQuotations,
      subtitle: 'Awaiting client approval',
      meaning: 'Active proforma estimates and proposals awaiting conversion to sales invoices.',
      icon: Clock,
      colorScheme: 'text-purple-300',
      border: 'hover:border-purple-500/50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Action Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-blue-900/40 via-[#071644]/70 to-[#040C26] border border-white/15 backdrop-blur-md">
        <div>
          <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
            Document Generation &amp; Communications Hub
          </span>
          <h3 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            Create → Preview → Send → Track
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Issue verified invoices, receipts, quotations, and purchase orders in seconds. Share securely via WhatsApp or Email.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onCreateClick}
            className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4 text-[#9EDCFF]" />
            <span>+ Create Document</span>
          </button>

          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => onOpenSendModal(documents[0])}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Send Document</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              className={`exbos-glass-card p-5 space-y-2 rounded-2xl border border-white/10 ${card.border} transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {card.title}
                </span>
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className={`w-4 h-4 ${card.colorScheme}`} />
                </div>
              </div>
              <strong className={`font-orbitron text-2xl font-extrabold block ${card.colorScheme}`}>
                {card.value}
              </strong>
              <p className="text-[11px] text-slate-400 line-clamp-1">{card.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Recent Documents Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Recent Documents
            </h4>
            <p className="text-[11px] text-slate-400">
              Live document register across all sales, procurements, and quotations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {documents.length} recorded
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No business documents generated yet. Click "+ Create Document" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount (RWF)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.slice(0, 8).map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => onOpenPreviewModal(doc)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#9EDCFF]">
                      {doc.id}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {doc.recipientName || 'Client'}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {doc.type}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(doc.amount || 0, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : doc.status === 'Partial'
                            ? 'bg-amber-500/15 text-amber-300'
                            : doc.status === 'Draft'
                            ? 'bg-purple-500/15 text-purple-300'
                            : 'bg-blue-500/15 text-blue-300'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenPreviewModal(doc)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenSendModal(doc)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Send via WhatsApp / Email"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDownloadDoc(doc)}
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

