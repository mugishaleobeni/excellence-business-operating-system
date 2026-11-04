import React, { useState, useMemo } from 'react'
import {
  Share2,
  Download,
  Mail,
  MessageCircle,
  FileText,
  Search,
  CheckCircle2,
  ExternalLink,
  Printer,
  Copy,
  Clock,
  Filter
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { printBusinessDocument } from '../../../utils/printDocument'

export default function ShareAndExportView({
  documents = [],
  sentHistory = [],
  onOpenSendModal,
  onOpenPreviewModal,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState('All')
  const [copiedId, setCopiedId] = useState(null)

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        (doc.title || '').toLowerCase().includes(q) ||
        (doc.recipientName || '').toLowerCase().includes(q) ||
        (doc.id || '').toLowerCase().includes(q)

      const matchesType = docTypeFilter === 'All' || doc.type === docTypeFilter
      return matchesSearch && matchesType
    })
  }, [documents, searchQuery, docTypeFilter])

  const stats = useMemo(() => {
    const totalSent = sentHistory.length
    const whatsappSent = sentHistory.filter((s) => (s.method || '').toLowerCase().includes('whatsapp')).length
    const emailSent = sentHistory.filter((s) => (s.method || '').toLowerCase().includes('email')).length
    return { totalSent, whatsappSent, emailSent }
  }, [sentHistory])

  const handleCopy = (doc) => {
    const link = doc.secureLink || `https://exbos.rw/d/${doc.id.toLowerCase()}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiedId(doc.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Documents · 03 Share &amp; Export
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Share &amp; Export Hub
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            Instant dispatch of verified invoices, receipts, and order documents via WhatsApp, Email, or PDF download.
          </p>
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-sky-400" />
            <span>Total Dispatched</span>
          </div>
          <div className="text-2xl font-bold font-orbitron text-white">
            {stats.totalSent}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Logged sharing transactions</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Shares</span>
          </div>
          <div className="text-2xl font-bold font-orbitron text-emerald-300">
            {stats.whatsappSent}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1">Direct client chat messages</div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
          <div className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400" />
            <span>Email Dispatches</span>
          </div>
          <div className="text-2xl font-bold font-orbitron text-sky-300">
            {stats.emailSent}
          </div>
          <div className="text-[10px] text-sky-400/80 mt-1">Official formal email deliveries</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by ID, client, or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-sky-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Invoice', 'Receipt', 'Quotation', 'Purchase Order'].map((type) => (
            <button
              key={type}
              onClick={() => setDocTypeFilter(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                docTypeFilter === type
                  ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Ready to Share Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                <th className="p-3.5 pl-5">Document</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Recipient</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 pr-5 text-right">One-Click Share Channels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No documents found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-3.5 pl-5">
                      <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                        {doc.title || `${doc.type} #${doc.id}`}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {doc.id}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-300">
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="text-white font-medium">{doc.recipientName || 'Walk-in Client'}</div>
                      <div className="text-[10px] text-slate-400">{doc.recipientPhone || doc.recipientEmail || 'No contact saved'}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      {formatRWF(doc.totalAmountRWF || doc.amount || 0)}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {doc.date || doc.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10)}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* WhatsApp Button */}
                        <button
                          type="button"
                          onClick={() => onOpenSendModal && onOpenSendModal(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                          title="Share directly via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </button>

                        {/* Email Button */}
                        <button
                          type="button"
                          onClick={() => onOpenSendModal && onOpenSendModal(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                          title="Send by Email"
                        >
                          <Mail className="w-3.5 h-3.5 text-sky-400" />
                          <span className="hidden md:inline">Email</span>
                        </button>

                        {/* Download PDF */}
                        <button
                          type="button"
                          onClick={() => onDownloadDoc && onDownloadDoc(doc)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] cursor-pointer transition-all"
                          title="Download PDF Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Print */}
                        <button
                          type="button"
                          onClick={() => printBusinessDocument(doc)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] cursor-pointer transition-all"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Link */}
                        <button
                          type="button"
                          onClick={() => handleCopy(doc)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] cursor-pointer transition-all"
                          title="Copy Link"
                        >
                          {copiedId === doc.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
