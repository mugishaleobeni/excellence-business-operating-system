import React, { useState } from 'react'
import {
  X,
  Download,
  Mail,
  Send,
  FileText,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { exportToCsv, exportToTextPdf } from '../reports/reportUtils'
import { executePrintHtml } from '../../../utils/printDocument'

export default function ExportDrawer({
  isOpen,
  onClose,
  title = 'Export Data',
  summary = 'Export current filtered view',
  data = [],
  columns = [],
  businessName = 'Inyange Artisan Bakery & Roastery',
  userEmail = 'owner@inyangebakery.rw',
  onLogSend = null
}) {
  const [format, setFormat] = useState('PDF') // 'PDF' | 'Excel' | 'Receipt'
  const [method, setMethod] = useState('download') // 'download' | 'email' | 'whatsapp'
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState(`Document from ${businessName}`)
  const [message, setMessage] = useState(
    `Hello, please find attached the requested ${title} from ${businessName}.`
  )
  const [statusMessage, setStatusMessage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleExecute = () => {
    setIsProcessing(true)
    setStatusMessage(null)

    const dateStr = new Date().toISOString().slice(0, 10)
    const fileName = `${businessName.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}_${dateStr}`

    try {
      if (method === 'download') {
        if (format === 'Excel') {
          exportToCsv(fileName, columns, data)
        } else if (format === 'Receipt') {
          // 80mm thermal receipt format
          const receiptHtml = `
            <div style="width: 72mm; margin: 0 auto; font-family: monospace; font-size: 11px;">
              <h3 style="text-align: center; margin: 0;">${businessName}</h3>
              <p style="text-align: center; margin: 4px 0 10px 0;">${title} · ${dateStr}</p>
              <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
              <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                ${data
                  .slice(0, 50)
                  .map(
                    (row) => `
                  <tr>
                    <td style="padding: 2px 0;">${row.title || row.name || row.item || row.productName || 'Item'}</td>
                    <td style="text-align: right; padding: 2px 0;">${row.amountRWF || row.total || row.price || ''}</td>
                  </tr>
                `
                  )
                  .join('')}
              </table>
              <hr style="border: none; border-top: 1px dashed #000; margin: 8px 0;" />
              <p style="text-align: center; font-size: 9px; margin-top: 10px;">ExBOS Official Receipt</p>
            </div>
          `
          executePrintHtml(receiptHtml, fileName)
        } else {
          // Standard PDF
          exportToTextPdf(fileName, title, dateStr, businessName, [], columns, data)
        }

        setStatusMessage({
          type: 'success',
          text: `Downloaded ${fileName}.${format === 'Excel' ? 'csv' : 'pdf'}`
        })
      } else if (method === 'email') {
        if (!recipient.trim()) {
          setStatusMessage({
            type: 'error',
            text: 'Please enter a recipient email address.'
          })
          setIsProcessing(false)
          return
        }

        // Log send to Recent Documents
        if (onLogSend) {
          onLogSend({
            type: 'Email',
            title,
            recipient,
            date: dateStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            format
          })
        }

        setStatusMessage({
          type: 'success',
          text: `Sent ${title} (${format}) to ${recipient} via Gmail.`
        })
      } else if (method === 'whatsapp') {
        const cleanPhone = (phone || '').replace(/[^0-9+]/g, '')
        const encodedText = encodeURIComponent(`${message}\n\n*${title}*\nFrom: ${businessName}`)
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedText}`
          : `https://wa.me/?text=${encodedText}`

        window.open(waUrl, '_blank')

        if (onLogSend) {
          onLogSend({
            type: 'WhatsApp',
            title,
            recipient: phone || 'Client Phone',
            date: dateStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            format
          })
        }

        setStatusMessage({
          type: 'success',
          text: `Opened WhatsApp with document details ready to send.`
        })
      }
    } catch (err) {
      console.error('Export error:', err)
      setStatusMessage({
        type: 'error',
        text: 'We could not create the file. Try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/75 backdrop-blur-md flex justify-end transition-all"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-[#071644] border-l border-white/20 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-250 text-white"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-[#218DFF]">
                ExBOS Export Engine
              </span>
              <h3 className="font-orbitron text-lg font-bold text-white mt-0.5">
                Export &amp; Share
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. What You Are Exporting Summary */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              What You Are Exporting
            </span>
            <strong className="text-white block">{title}</strong>
            <p className="text-[11px] text-slate-300">{summary} · {data.length} records</p>
          </div>

          {/* 2. Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[#9EDCFF]">Choose Format</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  format === 'PDF'
                    ? 'bg-[#218DFF]/20 border-[#218DFF] text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <FileText className="w-4 h-4 text-[#218DFF]" />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('Excel')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  format === 'Excel'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel (.csv)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('Receipt')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  format === 'Receipt'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>80mm Paper</span>
              </button>
            </div>
          </div>

          {/* 3. How to Send (Three Methods) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-[#9EDCFF]">How to Send</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('download')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'download'
                    ? 'bg-[#218DFF] border-white text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('email')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'email'
                    ? 'bg-[#218DFF] border-white text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Send by Email</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('whatsapp')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                  method === 'whatsapp'
                    ? 'bg-emerald-600 border-white text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 4. Extra Fields for Email / WhatsApp */}
          {method === 'email' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">To Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="client@example.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">Message</label>
                <textarea
                  rows="2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {method === 'whatsapp' && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-in fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">WhatsApp Phone Number</label>
                <input
                  type="text"
                  placeholder="+250 788 123 456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/20 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300">WhatsApp Message</label>
                <textarea
                  rows="2"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-rose-500/20 border-rose-400 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* 5. Main Action Button */}
        <div className="pt-4 border-t border-white/10 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300"
          >
            Close
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={handleExecute}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {method === 'download' && <Download className="w-4 h-4" />}
            {method === 'email' && <Mail className="w-4 h-4" />}
            {method === 'whatsapp' && <Send className="w-4 h-4" />}
            <span>
              {method === 'download'
                ? 'Download'
                : method === 'email'
                ? 'Send by Email'
                : 'Send on WhatsApp'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

