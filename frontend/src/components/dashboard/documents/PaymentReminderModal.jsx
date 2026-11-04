import React, { useState, useEffect } from 'react'
import {
  Bell,
  X,
  MessageCircle,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import {
  formatPaymentReminderMessage,
  generateSecureLink,
  DEFAULT_DOCUMENT_TEMPLATE
} from './documentUtils'

export default function PaymentReminderModal({
  isOpen,
  onClose,
  invoice,
  businessInfo = DEFAULT_DOCUMENT_TEMPLATE,
  onReminderSent
}) {
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [alreadySentToday, setAlreadySentToday] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (invoice) {
      setRecipientPhone(invoice.recipientPhone || invoice.phone || '')
      setRecipientEmail(invoice.recipientEmail || invoice.email || '')
      const link = invoice.secureLink || generateSecureLink(invoice.id)
      const msg = formatPaymentReminderMessage(invoice, businessInfo, link)
      setReminderMessage(msg)

      // Check if reminder was already sent recently (within 24 hours)
      const lastReminder = invoice.lastReminderSentAt
      if (lastReminder) {
        const diffHours = (Date.now() - new Date(lastReminder).getTime()) / (1000 * 60 * 60)
        setAlreadySentToday(diffHours < 24)
      } else {
        setAlreadySentToday(false)
      }
    }
  }, [invoice, businessInfo, isOpen])

  if (!isOpen || !invoice) return null

  const handleSendWhatsApp = () => {
    let cleanPhone = recipientPhone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('07')) {
      cleanPhone = '250' + cleanPhone.slice(1)
    }

    const encoded = encodeURIComponent(reminderMessage)
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`

    window.open(url, '_blank')

    if (onReminderSent) {
      onReminderSent({
        invoiceId: invoice.id,
        recipient: invoice.recipientName || 'Customer',
        method: 'WhatsApp Reminder',
        timestamp: new Date().toISOString()
      })
    }

    setFeedback('✓ Payment reminder opened in WhatsApp. Recorded in reminder audit log.')
    setTimeout(() => onClose(), 1800)
  }

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Friendly Payment Reminder: Invoice #${invoice.id} (${businessInfo.businessName || 'ExBOS'})`)
    const body = encodeURIComponent(reminderMessage)
    const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`

    window.open(mailtoUrl, '_blank')

    if (onReminderSent) {
      onReminderSent({
        invoiceId: invoice.id,
        recipient: invoice.recipientName || 'Customer',
        method: 'Email Reminder',
        timestamp: new Date().toISOString()
      })
    }

    setFeedback('✓ Email client launched with reminder message.')
    setTimeout(() => onClose(), 1800)
  }

  const outstanding = Number(invoice.outstandingAmount ?? invoice.amount ?? 0)

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-amber-500/50 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
                <span>Send Payment Reminder</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono">
                  #{invoice.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Remind customer about pending balance before or after due date
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Duplicate Warning */}
        {alreadySentToday && (
          <div className="p-3 bg-amber-500/20 border-b border-amber-400/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Notice: A reminder was already sent for this invoice within the last 24 hours. Duplicate reminders may disturb the customer.
            </span>
          </div>
        )}

        {/* Form Body */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1 text-xs">
          {/* Invoice Summary Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Customer:</span>
              <strong className="text-white text-sm font-semibold">{invoice.recipientName || 'Customer'}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Invoice Total:</span>
              <span className="text-slate-200 font-mono">{formatRWF(invoice.amount || 0)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-amber-300 font-bold">Outstanding Balance:</span>
              <span className="font-orbitron font-extrabold text-amber-300 text-sm">
                {formatRWF(outstanding)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Agreed Due Date:</span>
              <span className="font-mono text-slate-300">{invoice.dueDate || 'Nov 10, 2026'}</span>
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                WhatsApp Phone
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="0788123456"
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#218DFF]" />
                Email Address
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="customer@domain.rw"
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Reminder Message Editor */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Reminder Message
            </label>
            <textarea
              rows={6}
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              style={{ backgroundColor: '#071644', color: '#ffffff' }}
              className="w-full p-3 rounded-xl exbos-modal-input text-white font-mono text-[11px] leading-relaxed focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/15 shrink-0 bg-[#040C26]/95 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmail}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-400/40 text-blue-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Reminder</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
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

