import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Printer, CheckCircle2, AlertCircle, FileText, ArrowLeft, ShieldCheck } from 'lucide-react'
import { apiClient } from '../utils/apiClient'
import { formatRWF } from '../utils/currencyWords'

export default function PublicDocumentPage() {
  const { docId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [doc, setDoc] = useState(null)
  const [business, setBusiness] = useState(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const res = await apiClient.getPublicDocument(docId)
      if (!active) return
      if (res.ok && res.data?.data?.document) {
        setDoc(res.data.data.document)
        setBusiness(res.data.data.business || {})
      } else {
        setError(res.error || 'Document not found or link has expired.')
      }
      setLoading(false)
    }
    if (docId) load()
    return () => {
      active = false
    }
  }, [docId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#03091F] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#218DFF] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9EDCFF] font-semibold">Loading verified ExBOS document...</p>
        </div>
      </div>
    )
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-[#03091F] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0A2786]/60 border border-white/15 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h1 className="text-xl font-extrabold">Document Unavailable</h1>
          <p className="text-sm text-slate-300">{error || 'We could not locate this document.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#218DFF] text-white text-sm font-bold hover:bg-[#197be6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to ExBOS
          </Link>
        </div>
      </div>
    )
  }

  const items =
    Array.isArray(doc.items) && doc.items.length > 0
      ? doc.items
      : [
          {
            name: doc.title || doc.description || 'Commercial Order',
            quantity: 1,
            unitPrice: Number(doc.amount || 0),
            total: Number(doc.amount || 0)
          }
        ]
  const totalAmount = Number(doc.amount || 0)
  const paidAmount = Number(doc.paidAmount || 0)
  const outstandingAmount =
    doc.outstandingAmount !== undefined
      ? Number(doc.outstandingAmount)
      : Math.max(0, totalAmount - paidAmount)
  const isPaid =
    String(doc.status || '').toLowerCase() === 'paid' || outstandingAmount <= 0

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified ExBOS Digital Document</span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2786] text-white text-xs font-bold hover:bg-[#071544] shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>

        {/* Document Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-0">
          {/* Header */}
          <div className="bg-[#0A2786] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#9EDCFF]">
                <FileText className="w-3.5 h-3.5" />
                {doc.type || 'Official Document'}
              </div>
              <h1 className="text-2xl font-black mt-1">
                {business?.businessName || 'ExBOS Verified Business'}
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                {[business?.address, business?.phone, business?.email].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-xs text-[#9EDCFF] font-semibold">Document #</div>
              <div className="text-lg font-extrabold">{doc.id}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-200">Paid</span>
                  </>
                ) : (
                  <span className="text-amber-200">{doc.status || 'Unpaid'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Recipient & Dates */}
          <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billed To
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {doc.recipientName || 'Valued Customer'}
              </div>
              {doc.recipientPhone && (
                <div className="text-xs text-slate-600 mt-0.5">{doc.recipientPhone}</div>
              )}
              {doc.recipientEmail && (
                <div className="text-xs text-slate-600 mt-0.5">{doc.recipientEmail}</div>
              )}
            </div>
            <div className="sm:text-right space-y-1 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Issue Date: </span>
                <span className="font-bold text-slate-800">{doc.date || '—'}</span>
              </div>
              {doc.dueDate && (
                <div>
                  <span className="text-slate-400 font-semibold">Due Date: </span>
                  <span className="font-bold text-slate-800">{doc.dueDate}</span>
                </div>
              )}
              {doc.paymentMethod && (
                <div>
                  <span className="text-slate-400 font-semibold">Payment Method: </span>
                  <span className="font-bold text-slate-800">{doc.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 sm:p-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="pb-3 font-bold">Description</th>
                  <th className="pb-3 font-bold text-right">Qty</th>
                  <th className="pb-3 font-bold text-right">Unit Price</th>
                  <th className="pb-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((it, i) => {
                  const qty = Number(it.quantity || 1)
                  const unit = Number(it.unitPrice || 0)
                  const lineTotal = Number(it.total ?? qty * unit)
                  return (
                    <tr key={i}>
                      <td className="py-3 font-semibold text-slate-800">
                        {it.name || it.product || 'Item'}
                      </td>
                      <td className="py-3 text-right text-slate-600">{qty}</td>
                      <td className="py-3 text-right text-slate-600">{formatRWF(unit)}</td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {formatRWF(lineTotal)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col items-end space-y-1.5 text-sm">
              <div className="flex justify-between w-full max-w-xs">
                <span className="text-slate-500 font-semibold">Total Amount</span>
                <span className="font-extrabold text-slate-900">{formatRWF(totalAmount)}</span>
              </div>
              {paidAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs">
                  <span className="text-slate-500 font-semibold">Amount Paid</span>
                  <span className="font-bold text-emerald-600">{formatRWF(paidAmount)}</span>
                </div>
              )}
              {outstandingAmount > 0 && (
                <div className="flex justify-between w-full max-w-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-700 font-bold">Balance Due</span>
                  <span className="font-black text-rose-600">{formatRWF(outstandingAmount)}</span>
                </div>
              )}
            </div>

            {doc.notes && (
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Notes: </span>
                {doc.notes}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
            Generated &amp; verified by <strong>EXCELLENCE BOS (ExBOS)</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

