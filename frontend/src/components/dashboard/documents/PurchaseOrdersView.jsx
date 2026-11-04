import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  Plus,
  Send,
  Eye,
  Download,
  Building,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function PurchaseOrdersView({
  documents = [],
  hideFinancials = false,
  onCreatePO,
  onOpenSendModal,
  onOpenPreviewModal,
  onDownloadDoc
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const purchaseOrders = useMemo(() => {
    return documents.filter((d) => d.type === 'Purchase Order')
  }, [documents])

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchSupp = (po.recipientName || '').toLowerCase().includes(query)
        const matchId = (po.id || '').toLowerCase().includes(query)
        if (!matchSupp && !matchId) return false
      }
      if (statusFilter !== 'All') {
        if (po.status !== statusFilter) return false
      }
      return true
    })
  }, [purchaseOrders, searchQuery, statusFilter])

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
            placeholder="Search POs by supplier or order #..."
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
            <option value="All">All Purchase Orders</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>

          <button
            type="button"
            onClick={onCreatePO}
            className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
          >
            <Plus className="w-4 h-4 text-[#9EDCFF]" />
            <span>+ Create Order</span>
          </button>
        </div>
      </div>

      {/* PO Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-orbitron text-sm font-bold text-white">
              Supplier Purchase Orders Register
            </h4>
            <p className="text-[11px] text-slate-400">
              Procurement orders dispatched to inventory and agricultural suppliers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredPOs.length} orders
          </span>
        </div>

        {filteredPOs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No purchase orders created yet. Click "+ Create Order" to issue an order to a supplier.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-right">Order Value</th>
                  <th className="py-2.5 px-3 text-center">Expected By</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPOs.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => onOpenPreviewModal(po)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-[#9EDCFF]">
                      {po.id}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {po.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {po.recipientName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatRWF(po.amount || 0, hideFinancials)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {po.dueDate || po.deliveryDate || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'Fulfilled'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : po.status === 'Sent'
                            ? 'bg-blue-500/15 text-blue-300'
                            : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {po.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onOpenPreviewModal(po)}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#9EDCFF] cursor-pointer"
                          title="Preview Order"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenSendModal(po)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          title="Send to Supplier"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDownloadDoc(po)}
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

