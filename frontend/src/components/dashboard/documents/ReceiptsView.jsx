import React, { useState, useMemo } from 'react'
import {
  Receipt,
  Search,
  Plus,
  Send,
  Eye,
  Download,
  Printer,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function ReceiptsView({
  documents = [],
  hideFinancials = false,
  onCreateReceipt,
  onOpenSendModal,
  onOpenPreviewModal,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')

  const receipts = useMemo(() => {
    return documents.filter((d) => d.type === 'Receipt')
  }, [documents])

  const filteredReceipts = useMemo(() => {
    return receipts.filter((rec) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchRec = (rec.recipientName || '').toLowerCase().includes(q)
        const matchId = (rec.id || '').toLowerCase().includes(q)
        if (!matchRec && !matchId) return false
      }
      return true
    })
  }, [receipts, searchQuery])

  const totalCollected = filteredReceipts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

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
            placeholder="Search receipts by recipient or receipt #..."
            style={{ backgroundColor: '#071644', color: '#ffffff' }}
            className="w-full pl-9 pr-3 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onCreateReceipt}
          className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
        >
          <Plus className="w-4 h-4 text-[#9EDCFF]" />
          <span>+ Generate Receipt</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Official Payment Receipts Register
            </h4>
            <p className="text-[11px] text-slate-400">
              Verified payment receipts issued for settled transactions
            </p>
          </div>
          <span className="text-xs font-mono text-[#9EDCFF]">
            Total Collected: {formatRWF(totalCollected, hideFinancials)}
          </span>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payment receipts issued yet. Generate a receipt or record a settled sale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Received From</th>
                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredReceipts.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onOpenPreviewModal(rec)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#9EDCFF]">
                      {rec.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {rec.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {rec.recipientName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatRWF(rec.amount || 0, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-400/30">
                        Paid in Full
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenPreviewModal(rec)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="Preview Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenSendModal(rec)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Send via WhatsApp / Email"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDownloadDoc(rec)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          title="Download Receipt"
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

