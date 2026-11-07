import React, { useState } from 'react'
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Phone,
  ArrowRight
} from 'lucide-react'

export default function SubscriptionBillingView({
  user = {},
  currentArch = {},
  addToast
}) {
  const [currentPlan, setCurrentPlan] = useState('Silver')

  const plans = [
    {
      id: 'Free',
      name: 'Forever Free',
      priceRWF: '0',
      period: 'Forever',
      description: 'Single branch core ledgers for small trade owners.',
      features: ['1 Branch Location', 'Unlimited Offline Storage', 'Basic Receipts', 'Standard Reports'],
      badge: 'Starter'
    },
    {
      id: 'Bronze',
      name: 'Bronze Growth',
      priceRWF: '10,000',
      period: '/ month',
      description: 'Ideal for busy single-shop retail and workshop owners.',
      features: ['Up to 2 Staff Logins', 'WhatsApp Receipt Sharing', 'Automated Daily Backups', 'SMS Payment Reminders'],
      badge: 'Popular'
    },
    {
      id: 'Silver',
      name: 'Silver Enterprise',
      priceRWF: '20,000',
      period: '/ month',
      description: 'Full multi-branch control and advanced inventory costing.',
      features: ['Up to 5 Branches', 'Unlimited Staff Permissions', 'True Landed Cost Engine', 'Live Stock Tracking', 'Priority Support'],
      badge: 'Active Plan'
    },
    {
      id: 'Gold',
      name: 'Gold Corporate',
      priceRWF: '35,000',
      period: '/ month',
      description: 'For hospitality chains, farm enterprises, and large teams.',
      features: ['Unlimited Branches', 'Dedicated Account Manager', 'Custom API & Exporting', '24/7 Dedicated Support', 'Custom Domain'],
      badge: 'Full Power'
    }
  ]

  const handleSelectPlan = (planId) => {
    setCurrentPlan(planId)
    if (addToast) {
      addToast({
        type: 'success',
        title: 'Plan Updated',
        message: `Subscription successfully switched to ${planId}.`
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Active Subscription Banner */}
      <div className="exbos-glass-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-orbitron font-bold text-[10px] border border-emerald-500/30 uppercase">
                Active · Valid
              </span>
              <span className="text-xs text-slate-400">Architecture: {currentArch.name}</span>
            </div>
            <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white">
              {currentPlan} Subscription Plan
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Billed via MTN MoMo Business &amp; Bank Transfer. Renews automatically.
            </p>
          </div>

          <div className="text-right sm:text-right shrink-0">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">
              Official Helpline
            </span>
            <a
              href="https://wa.me/250781963981"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-bold hover:underline mt-0.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+250 781 963 981</span>
            </a>
          </div>
        </div>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Billing Cycle</span>
            <span className="font-bold text-white">Monthly</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Payment Method</span>
            <span className="font-bold text-emerald-300">MTN MoMo (Rwanda)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Multi-Branch</span>
            <span className="font-bold text-white">Enabled (5 Locations)</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Support SLA</span>
            <span className="font-bold text-[#9EDCFF]">Priority Same-Day</span>
          </div>
        </div>
      </div>

      {/* Pricing Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id
          return (
            <div
              key={p.id}
              className={`exbos-glass-card p-5 rounded-2xl flex flex-col justify-between transition-all ${
                isCurrent ? 'ring-2 ring-[#218DFF] bg-[#218DFF]/10' : 'hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-orbitron font-bold text-white uppercase">
                    {p.name}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isCurrent
                        ? 'bg-[#218DFF] text-white'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {isCurrent ? 'Current' : p.badge}
                  </span>
                </div>

                <div className="my-3">
                  <span className="font-orbitron font-extrabold text-2xl text-white">
                    {p.priceRWF} RWF
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{p.period}</span>
                </div>

                <p className="text-[11px] text-slate-300 mb-4">{p.description}</p>

                <div className="space-y-2 border-t border-white/10 pt-3">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'btn-sapphire-clean cursor-pointer'
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Current Plan</span>
                    </>
                  ) : (
                    <>
                      <span>Select {p.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

