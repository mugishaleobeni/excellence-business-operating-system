import React, { useState, useEffect } from 'react'
import {
  Share2,
  X,
  MessageCircle,
  Mail,
  Link2,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import {
  generateSecureLink,
  formatWhatsAppMessage,
  downloadDocumentFile,
  DEFAULT_DOCUMENT_TEMPLATE
} from './documentUtils'
import { printBusinessDocument } from '../../../utils/printDocument'

export default function SendDocumentModal({
  isOpen,
  onClose,
  document: doc,
  businessInfo = DEFAULT_DOCUMENT_TEMPLATE,
  onSentSuccess
}) {
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [secureLink, setSecureLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [feedbackNotice, setFeedbackNotice] = useState(null)

  useEffect(() => {
    if (doc) {
      setRecipientName(doc.recipientName || doc.customerName || doc.customer || doc.supplier || 'Recipient')
      setRecipientPhone(doc.recipientPhone || doc.phone || '')
      setRecipientEmail(doc.recipientEmail || doc.email || '')
      const link = doc.secureLink || generateSecureLink(doc.id)
      setSecureLink(link)
      const initialMsg = formatWhatsAppMessage(doc, businessInfo, link)
      setCustomMessage(initialMsg)
    }
  }, [doc, businessInfo, isOpen])

  if (!isOpen || !doc) return null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(secureLink).catch(() => {})
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)

    // Log action to sent history
    if (onSentSuccess) {
      onSentSuccess({
        id: `SH-${Date.now().toString().slice(-4)}`,
        documentId: doc.id,
        documentTitle: doc.title || `${doc.type} #${doc.id}`,
        recipient: recipientName,
        contact: secureLink,
        method: 'Share Link',
        status: 'Link Created',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        link: secureLink
      })
    }
    setFeedbackNotice('✓ Secure link copied to clipboard and logged to Sent History.')
  }

  const handleSendWhatsApp = () => {
    // Sanitize phone number (remove spaces, plus, dashes)
    let cleanPhone = recipientPhone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('07')) {
      cleanPhone = '250' + cleanPhone.slice(1)
    }

    const encodedText = encodeURIComponent(customMessage)
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`

    window.open(waUrl, '_blank')

    if (onSentSuccess) {
      onSentSuccess({
        id: `SH-${Date.now().toString().slice(-4)}`,
        documentId: doc.id,
        documentTitle: doc.title || `${doc.type} #${doc.id}`,
        recipient: recipientName,
        contact: recipientPhone || 'WhatsApp Contact',
        method: 'WhatsApp',
        status: 'Opened Externally',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        link: secureLink
      })
    }

    setFeedbackNotice('✓ WhatsApp client opened with prepared document message. Logged as "Opened Externally".')
    setTimeout(() => {
      onClose()
    }, 1800)
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`${doc.type || 'Document'} #${doc.id} from ${businessInfo.businessName || 'ExBOS'}`)
    const body = encodeURIComponent(customMessage)
    const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`

    window.open(mailtoUrl, '_blank')

    if (onSentSuccess) {
      onSentSuccess({
        id: `SH-${Date.now().toString().slice(-4)}`,
        documentId: doc.id,
        documentTitle: doc.title || `${doc.type} #${doc.id}`,
        recipient: recipientName,
        contact: recipientEmail || 'Email Client',
        method: 'Email',
        status: 'Sent',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        link: secureLink
      })
    }

    setFeedbackNotice('✓ Email client opened. Recorded in Sent History.')
    setTimeout(() => {
      onClose()
    }, 1800)
  }

  const handleDownload = () => {
    downloadDocumentFile(doc, businessInfo)
    setFeedbackNotice('✓ Document downloaded.')
  }

  const handlePrint = () => {
    printBusinessDocument(doc, businessInfo)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
                <span>Send {doc.type || 'Document'}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-[#9EDCFF]">
                  #{doc.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Send official document via WhatsApp, Email, or shareable link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Banner */}
        {feedbackNotice && (
          <div className="px-5 py-2.5 bg-emerald-500/20 border-b border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          {/* Document Summary Card Preview */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase">
                {businessInfo.businessName || 'ExBOS Business'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Date: {doc.date || new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-white/10 text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">Recipient:</span>
                <strong className="text-white font-medium">{recipientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Amount:</span>
                <strong className="font-orbitron text-white">{formatRWF(doc.amount || 0)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Outstanding:</span>
                <strong className="font-orbitron text-amber-300">
                  {formatRWF(doc.outstandingAmount || 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Recipient Contact Information (Editable) */}
          <div className="space-y-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <h4 className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase tracking-wider">
              Recipient Contact Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-[#218DFF]" />
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 0788123456 or +250788123456"
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#218DFF]" />
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. client@domain.rw"
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Secure Link Bar */}
          <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Link2 className="w-4 h-4 text-[#218DFF] shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-orbitron uppercase">
                  Secure Access Link (Tokenized)
                </span>
                <span className="text-xs text-[#9EDCFF] font-mono truncate block">
                  {secureLink}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Editable Communication Message */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Message Content (WhatsApp / Email Text)
            </label>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              style={{ backgroundColor: '#071644', color: '#ffffff' }}
              className="w-full p-3 rounded-xl exbos-modal-input text-white font-mono text-[11px] leading-relaxed focus:outline-none"
            />
          </div>

          {/* Disclaimer on External Hand-off */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#218DFF] shrink-0 mt-0.5" />
            <span>
              ExBOS prepares verified document links and dispatches them via standard WhatsApp and Email interfaces. Handoffs are audited as "Opened Externally" in compliance with strict delivery transparency.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/15 shrink-0 bg-[#040C26]/95 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Print</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

