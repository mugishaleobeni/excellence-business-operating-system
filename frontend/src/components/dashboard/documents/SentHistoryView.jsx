import React, { useState, useMemo } from 'react'
import {
  Send,
  Search,
  Eye,
  RefreshCw,
  Copy,
  Download,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Mail,
  Link2
} from 'lucide-react'

export default function SentHistoryView({
  sentHistory = [],
  documents = [],
  onOpenPreviewModal,
  onOpenSendModal,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('All')
  const [copiedId, setCopiedId] = useState(null)

  const filteredHistory = useMemo(() => {
    return sentHistory.filter((sh) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchDoc = (sh.documentId || '').toLowerCase().includes(q)
        const matchTitle = (sh.documentTitle || '').toLowerCase().includes(q)
        const matchRec = (sh.recipient || '').toLowerCase().includes(q)
        if (!matchDoc && !matchTitle && !matchRec) return false
      }
      if (methodFilter !== 'All') {
        if (!sh.method.toLowerCase().includes(methodFilter.toLowerCase())) return false
      }
      return true
    })
  }, [sentHistory, searchQuery, methodFilter])

  const handleCopyLink = (sh) => {
    const link = sh.link || `https://exbos.rw/d/sec-${(sh.documentId || 'doc').toLowerCase()}`
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiedId(sh.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const findDocument = (docId) => {
    return documents.find((d) => d.id === docId) || null
  }

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
            placeholder="Search sent history by recipient, document ID..."
            style={{ backgroundColor: '#071644', color: '#ffffff' }}
            className="w-full pl-9 pr-3 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none"
        >
          <option value="All">All Sending Methods</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Email">Email</option>
          <option value="Share Link">Secure Share Link</option>
        </select>
      </div>

      {/* Sent History Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Sent Documents &amp; Sharing History
            </h4>
            <p className="text-[11px] text-slate-400">
              Audit log of all external document dispatches, client links, and email shares
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredHistory.length} dispatched
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No document sharing activity logged yet. When you send documents via WhatsApp or Email, records will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3 text-center">Method</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Date</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((sh) => {
                  const doc = findDocument(sh.documentId)
                  return (
                    <tr key={sh.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#9EDCFF]">{sh.documentId}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {sh.documentTitle || 'Business Document'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{sh.recipient}</div>
                        {sh.contact && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                            {sh.contact}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10 text-slate-200">
                          {sh.method.includes('WhatsApp') ? (
                            <MessageCircle className="w-3 h-3 text-emerald-400" />
                          ) : sh.method.includes('Email') ? (
                            <Mail className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Link2 className="w-3 h-3 text-[#218DFF]" />
                          )}
                          <span>{sh.method}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sh.status === 'Sent'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/30'
                              : sh.status === 'Opened Externally'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-400/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-400/30'
                          }`}
                        >
                          {sh.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {sh.date || 'Today'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {doc && (
                            <button
                              type="button"
                              onClick={() => onOpenPreviewModal(doc)}
                              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                              title="View Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {doc && (
                            <button
                              type="button"
                              onClick={() => onOpenSendModal(doc)}
                              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 cursor-pointer"
                              title="Resend Document"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyLink(sh)}
                            className={`p-1 rounded-lg cursor-pointer ${
                              copiedId === sh.id
                                ? 'text-emerald-400 bg-emerald-500/20'
                                : 'text-slate-400 hover:text-[#9EDCFF] hover:bg-white/10'
                            }`}
                            title={copiedId === sh.id ? 'Copied' : 'Copy Secure Link'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {doc && (
                            <button
                              type="button"
                              onClick={() => onDownloadDoc(doc)}
                              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
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

