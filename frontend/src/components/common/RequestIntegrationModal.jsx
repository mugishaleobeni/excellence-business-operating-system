import React, { useState } from 'react'
import { X, Plug, Send, CheckCircle2, MessageSquare, Mail, Sparkles, Server } from 'lucide-react'
import { useExbos } from '../../context/ExbosContext'

export default function RequestIntegrationModal({ isOpen, onClose }) {
  const { user, addToast, language } = useExbos()
  const [systemName, setSystemName] = useState('')
  const [category, setCategory] = useState('Payment Gateway / Mobile Money')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const popularOptions = [
    'MTN MoMo API / Pay',
    'Airtel Money API',
    'QuickBooks Online',
    'Xero Accounting',
    'Shopify Store',
    'Bank of Kigali Direct API',
    'Stripe / Card Terminal',
    'POS Hardware Till'
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!systemName.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please specify the software or API system you wish to integrate.'
      })
      return
    }

    setSubmitted(true)
    addToast({
      type: 'success',
      title: 'Integration Request Received',
      message: `Your request to integrate "${systemName.trim()}" has been queued. Our engineering team will review API requirements.`
    })

    setTimeout(() => {
      setSubmitted(false)
      setSystemName('')
      setNotes('')
      onClose()
    }, 1800)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/80 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0F285D] via-[#0B1E48] to-[#071536] border border-[#218DFF]/40 text-white p-6 sm:p-8 shadow-sapphire-dark space-y-6 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#163065] border border-[#234C9A] flex items-center justify-center text-[#9EDCFF] shrink-0">
              <Plug className="w-5 h-5 text-[#218DFF]" />
            </div>
            <div>
              <span className="text-[10px] font-orbitron uppercase tracking-widest text-[#9EDCFF] font-bold">
                API &amp; System Extensions
              </span>
              <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white mt-0.5">
                Request an Integration
              </h3>
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

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-orbitron text-lg font-bold text-white">
              Request Received!
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              We received your integration request for <strong>{systemName}</strong>. Our engineering team will review webhook and API specifications.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Need EXCELLENCE BOS to communicate with your existing point of sale, accounting software, bank feed, or custom enterprise API? Tell us what you use below.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Software / System Name *
              </label>
              <input
                type="text"
                required
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="e.g. MTN MoMo Pay API, QuickBooks Online, Xero, Stripe"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071536] border border-[#234C9A]/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#218DFF]"
              />

              {/* Quick Pick Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {popularOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSystemName(opt)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    + {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Your Business Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@business.rw"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071536] border border-[#234C9A]/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                  Phone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071536] border border-[#234C9A]/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#218DFF]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-[#9EDCFF]">
                Integration Use Case / Requirements
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain what data should sync (e.g., sync sales automatically, export end of day till report, pull invoice payments)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#071536] border border-[#234C9A]/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#218DFF] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-sapphire px-5 py-2.5 text-xs font-orbitron font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

