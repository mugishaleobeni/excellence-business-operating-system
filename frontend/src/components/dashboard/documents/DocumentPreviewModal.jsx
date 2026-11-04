import React from 'react'
import {
  X,
  Printer,
  Download,
  Share2,
  Mail,
  MessageCircle,
  Copy,
  Calendar,
  Building,
  User,
  CheckCircle2
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { downloadDocumentFile, DEFAULT_DOCUMENT_TEMPLATE } from './documentUtils'
import { printBusinessDocument } from '../../../utils/printDocument'

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  document: doc,
  businessInfo = DEFAULT_DOCUMENT_TEMPLATE,
  onOpenSendModal
}) {
  if (!isOpen || !doc) return null

  const handlePrint = () => {
    printBusinessDocument(doc, businessInfo)
  }

  const handleDownload = () => {
    downloadDocumentFile(doc, businessInfo)
  }

  const items = doc.items && doc.items.length > 0
    ? doc.items
    : [{ name: doc.title || 'General Line Item', quantity: 1, unit: 'pcs', unitPrice: doc.amount, total: doc.amount }]

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[94vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-white/20 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/15 p-4 sm:p-5 shrink-0 bg-white/5 no-print">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Document Preview
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] font-mono border border-[#218DFF]/30">
              {doc.type} #{doc.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#218DFF]" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#218DFF]" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {onOpenSendModal && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSendModal(doc)
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send Document</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Printable Sheet */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1 space-y-6 bg-gradient-to-b from-white/[0.04] to-transparent">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/15">
            <div>
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                {businessInfo.tagline || 'Excellence Business Operating System'}
              </span>
              <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                {businessInfo.businessName || 'ExBOS Enterprise'}
              </h2>
              <div className="text-xs text-slate-300 mt-1 space-y-0.5">
                <p>{businessInfo.address || 'Kigali, Rwanda'}</p>
                <p>Phone: {businessInfo.phone} | Email: {businessInfo.email}</p>
                <p className="font-mono text-[#9EDCFF]">Tax ID / TIN: {businessInfo.taxId || 'N/A'}</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block px-3 py-1 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 text-[#9EDCFF] font-orbitron font-extrabold text-sm uppercase tracking-wide">
                {doc.type || 'OFFICIAL DOCUMENT'}
              </span>
              <div className="text-xs text-slate-300 mt-2 space-y-0.5">
                <p><span className="text-slate-400">Doc Number:</span> <strong className="text-white font-mono">{doc.id}</strong></p>
                <p><span className="text-slate-400">Issue Date:</span> <span className="font-mono">{doc.date || new Date().toISOString().slice(0, 10)}</span></p>
                {doc.dueDate && (
                  <p><span className="text-amber-300">Due Date:</span> <strong className="text-amber-300 font-mono">{doc.dueDate}</strong></p>
                )}
                {doc.validUntil && (
                  <p><span className="text-blue-300">Valid Until:</span> <strong className="text-blue-300 font-mono">{doc.validUntil}</strong></p>
                )}
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Issued To / Recipient:
              </span>
              <strong className="text-white text-sm font-semibold block mt-0.5">
                {doc.recipientName || 'Valued Client'}
              </strong>
              <div className="text-slate-300 text-[11px] mt-0.5">
                {doc.recipientPhone && <span>Phone: {doc.recipientPhone} </span>}
                {doc.recipientEmail && <span>| Email: {doc.recipientEmail}</span>}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Document Status:
              </span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 uppercase ${
                  doc.status === 'Paid'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : doc.status === 'Partial'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                }`}
              >
                {doc.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/15 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Description / Item</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Total (RWF)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((it, idx) => {
                  const lineTotal = it.total || ((Number(it.quantity) || 1) * (Number(it.unitPrice) || 0))
                  return (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-semibold text-white">
                        {it.name || it.product || 'Standard Service / Goods'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {it.quantity} {it.unit || 'pcs'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {formatRWF(it.unitPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatRWF(lineTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end pt-2 border-t border-white/10">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Total Amount</span>
                <strong className="font-orbitron font-extrabold text-white text-sm">
                  {formatRWF(doc.amount || 0)}
                </strong>
              </div>

              {doc.paidAmount !== undefined && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-emerald-400">Amount Paid</span>
                  <strong className="font-orbitron font-bold text-emerald-400">
                    {formatRWF(doc.paidAmount || 0)}
                  </strong>
                </div>
              )}

              {doc.outstandingAmount !== undefined && doc.outstandingAmount > 0 && (
                <div className="flex justify-between py-1.5 bg-amber-500/10 px-2 rounded-lg">
                  <span className="text-amber-300 font-bold">Outstanding Balance</span>
                  <strong className="font-orbitron font-extrabold text-amber-300 text-sm">
                    {formatRWF(doc.outstandingAmount || 0)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Payment Instructions & Notes */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-xs">
            <div className="font-orbitron text-[10px] uppercase font-bold text-[#9EDCFF]">
              Payment Instructions &amp; Bank Channels
            </div>
            <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
              {businessInfo.paymentInstructions || 'Direct Cash / MTN MoMo Business / Bank Transfer'}
            </p>
            {doc.notes && (
              <p className="text-slate-400 italic text-[11px] pt-1 border-t border-white/10">
                Notes: {doc.notes}
              </p>
            )}
          </div>

          {/* Signatory Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-300">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Generated via:</p>
              <p className="font-pylarix font-bold text-[#9EDCFF] mt-0.5">EXCELLENCE BOS</p>
              <p className="text-[10px] text-slate-500">Verified Electronic Audit Ledger</p>
            </div>

            <div className="text-right border-t border-white/20 pt-2 sm:border-0 sm:pt-0">
              <div className="h-8 border-b border-white/30 mb-1 w-44 ml-auto" />
              <strong className="text-white block font-medium">
                {businessInfo.signatoryName || 'Authorized Signatory'}
              </strong>
              <span className="text-[10px] text-slate-400 block">
                {businessInfo.signatoryTitle || 'Management'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar Actions */}
        <div className="p-4 border-t border-white/15 shrink-0 bg-[#040C26]/95 flex items-center justify-between no-print">
          <div className="text-[11px] text-slate-400 font-mono">
            Document ID: #{doc.id}
          </div>

          <div className="flex items-center gap-2">
            {onOpenSendModal && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenSendModal(doc)
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Send Document</span>
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

