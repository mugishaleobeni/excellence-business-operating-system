import React from 'react'
import {
  X,
  Printer,
  CreditCard,
  Calendar,
  User,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { printBusinessDocument } from '../../../utils/printDocument'

export default function ReportDetailDrawer({
  isOpen,
  onClose,
  record,
  reportType = 'Sales',
  onRecordPayment = null,
  onPrint = null
}) {
  if (!isOpen || !record) return null

  const handlePrintRecord = () => {
    if (onPrint) {
      onPrint(record)
    } else {
      printBusinessDocument({
        id: record.id || 'TX-001',
        type: `${reportType} Voucher`,
        recipientName: counterparty || 'Customer / Partner',
        amount: amountTotal,
        paidAmount: amountPaid,
        outstandingAmount: amountBalance,
        date: dateStr,
        status: status,
        items: [{
          name: title,
          quantity: record.quantity || 1,
          unit: record.unit || 'pcs',
          unitPrice: amountTotal,
          total: amountTotal
        }],
        notes: record.notes || `Audited ${reportType} transaction recorded in ExBOS.`
      })
    }
  }

  // Derive relevant attributes safely
  const title =
    record.title ||
    record.productTitle ||
    record.product ||
    record.name ||
    record.item ||
    'Record Details'
  const counterparty =
    record.customerName ||
    record.customer ||
    record.supplierName ||
    record.supplier ||
    record.client ||
    null
  const dateStr = record.date || record.createdAt || record.timestamp || '—'
  const amountTotal =
    Number(record.amountRWF ?? record.total ?? record.purchaseAmount ?? record.priceRWF ?? 0)
  const amountPaid = Number(record.paidRWF ?? record.amountPaid ?? record.paid ?? 0)
  const amountBalance =
    Number(record.balanceOwedRWF ?? record.remainingAmountRWF ?? record.balance ?? 0)
  const status = record.status || (amountBalance > 0 ? 'Partial' : 'Paid')
  const paymentMethod = record.paymentMethod || record.account || record.method || 'Cash'

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-full bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-l border-white/20 shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                  {reportType} Record
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  #{record.id || 'N/A'}
                </span>
              </div>
              <h3 className="font-orbitron text-lg font-bold text-white truncate max-w-[260px]">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Banner */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Record Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  status.toLowerCase() === 'paid' || status.toLowerCase() === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : status.toLowerCase() === 'partial'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                }`}
              >
                {status}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
              <Calendar className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>{dateStr.slice(0, 10)}</span>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-4 rounded-2xl bg-[#040C26]/90 border border-white/10 space-y-3">
            <h4 className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Financial Breakdown
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Total Value / Charge</span>
                <span className="font-orbitron font-bold text-white text-sm">
                  {formatRWF(amountTotal)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Amount Paid / Received</span>
                <span className="font-orbitron font-bold text-emerald-400">
                  {formatRWF(amountPaid)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-amber-300 font-bold">Unpaid / Outstanding</span>
                <span className="font-orbitron font-extrabold text-amber-300 text-sm">
                  {formatRWF(amountBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h4 className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Transaction Details
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {counterparty && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Party / Contact:</span>
                  <strong className="text-white font-medium flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-[#218DFF]" />
                    {counterparty}
                  </strong>
                </div>
              )}

              {record.category && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Category:</span>
                  <span className="text-slate-200 mt-0.5 block">{record.category}</span>
                </div>
              )}

              {paymentMethod && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Payment Channel:</span>
                  <span className="text-slate-200 mt-0.5 block">{paymentMethod}</span>
                </div>
              )}

              {record.quantity && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Quantity:</span>
                  <span className="text-slate-200 font-mono mt-0.5 block">
                    {record.quantity} {record.unit || 'pcs'}
                  </span>
                </div>
              )}

              {record.dueDate && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Due Date:</span>
                  <span className="text-amber-300 font-mono mt-0.5 block">
                    {record.dueDate}
                  </span>
                </div>
              )}

              {record.species && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Species & Breed:</span>
                  <span className="text-[#9EDCFF] mt-0.5 block">
                    {record.species} ({record.breed || 'Standard'})
                  </span>
                </div>
              )}
            </div>

            {record.notes && (
              <div className="pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400 block text-[11px]">Notes:</span>
                <p className="text-slate-300 italic mt-0.5">{record.notes}</p>
              </div>
            )}
          </div>

          {/* Audit Verification Strip */}
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Audited transaction logged in ExBOS permanent ledger.
            </span>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-4 border-t border-white/15 shrink-0 bg-[#040C26]/95 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintRecord}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-[#218DFF]" />
            <span>Print Voucher</span>
          </button>

          <div className="flex items-center gap-2">
            {amountBalance > 0 && onRecordPayment && (
              <button
                type="button"
                onClick={() => {
                  onRecordPayment(record)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

