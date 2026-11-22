import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Crown, X, Lock, CheckCircle2, ArrowRight, Phone } from 'lucide-react'
import { apiClient } from '../../utils/apiClient'

const TIER_PRICES = {
  Bronze: '10,000',
  Silver: '20,000',
  Gold: '35,000'
}

export default function UpgradePromptModal() {
  const [limitInfo, setLimitInfo] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('Silver')
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo Business')
  const [paymentReference, setPaymentReference] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedMsg, setSubmittedMsg] = useState('')
  const [submitErr, setSubmitErr] = useState('')

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {}
      setLimitInfo(detail)
      setSelectedPlan(detail.requiredPlan || 'Silver')
      setSubmittedMsg('')
      setSubmitErr('')
      setPaymentReference('')
    }
    window.addEventListener('exbos:plan-limit', handler)
    return () => window.removeEventListener('exbos:plan-limit', handler)
  }, [])

  if (!limitInfo || typeof document === 'undefined') return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!paymentReference.trim()) return
    setSubmitting(true)
    setSubmitErr('')
    const res = await apiClient.requestSubscriptionUpgrade({
      plan: selectedPlan,
      paymentMethod,
      paymentReference: paymentReference.trim(),
      payerPhone: payerPhone.trim()
    })
    setSubmitting(false)
    if (!res.ok) {
      setSubmitErr(res.error || 'Could not submit upgrade request.')
      return
    }
    setSubmittedMsg(
      res.data?.message ||
        `Upgrade request for ${selectedPlan} submitted! Super Admin will activate it shortly.`
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0A2786] via-[#071544] to-[#03091F] border border-[#9EDCFF]/40 p-6 text-white shadow-2xl space-y-4">
        <button
          type="button"
          onClick={() => setLimitInfo(null)}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[10px] font-orbitron font-bold text-amber-200 uppercase">
            <Lock className="w-3 h-3" /> Plan Limit Reached ({limitInfo.currentPlan || 'Free'})
          </span>
          <h3 className="font-orbitron text-lg font-extrabold text-white flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-300 shrink-0" />
            <span>Upgrade to {selectedPlan} Plan</span>
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed">
            {limitInfo.message ||
              `This feature requires the ${selectedPlan} plan. Upgrade now to unlock higher limits without losing any data.`}
          </p>
        </div>

        {submittedMsg ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/45 text-xs text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4" /> Payment Verification Submitted
            </div>
            <p>{submittedMsg}</p>
            <button
              type="button"
              onClick={() => setLimitInfo(null)}
              className="mt-2 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              {['Bronze', 'Silver', 'Gold'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSelectedPlan(tier)}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition ${
                    selectedPlan === tier
                      ? 'bg-[#218DFF]/30 border-[#9EDCFF] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <div className="font-orbitron font-bold text-xs">{tier}</div>
                  <div className="text-[10px] text-[#9EDCFF] mt-0.5">{TIER_PRICES[tier]} RWF</div>
                </button>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-[11px] text-slate-200">
              Send <strong>{TIER_PRICES[selectedPlan] || '20,000'} RWF</strong> via MTN MoMo Business (
              <code className="text-[#9EDCFF] font-bold">+250 781 963 981</code>) or Bank Transfer, then paste your transaction ID below:
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white outline-none"
              >
                <option value="MTN MoMo Business">MTN MoMo Business (+250 781 963 981)</option>
                <option value="Airtel Money">Airtel Money Rwanda</option>
                <option value="Bank of Kigali Transfer">Bank of Kigali Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                Transaction Reference ID *
              </label>
              <input
                type="text"
                required
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. MP261122.1555.B4421"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white outline-none focus:border-[#218DFF]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#9EDCFF] mb-1">
                Your Phone Number
              </label>
              <input
                type="text"
                value={payerPhone}
                onChange={(e) => setPayerPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white outline-none focus:border-[#218DFF]"
              />
            </div>

            {submitErr && (
              <div className="text-rose-300 text-[11px] font-semibold">{submitErr}</div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <a
                href="https://wa.me/250781963981"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:underline no-underline"
              >
                <Phone className="w-3 h-3" /> Need help?
              </a>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <span>{submitting ? 'Submitting...' : 'Submit & Unlock'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}

