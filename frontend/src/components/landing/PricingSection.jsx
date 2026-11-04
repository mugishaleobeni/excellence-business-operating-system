import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExbos } from '../../context/ExbosContext'
import { formatRWF, amountToWords } from '../../utils/currencyWords'
import {
  Check,
  X,
  Crown,
  Sparkles,
  Gift,
  Users,
  ArrowRight,
  ShieldCheck,
  ChevronDown
} from 'lucide-react'

const VISIBLE_BENEFITS = 5

function PlanCard({ plan, language, onSelect }) {
  const [expanded, setExpanded] = useState(false)
  const isFeatured = plan.recommended || plan.tier === 'Gold'
  const firstFeatures = plan.features.slice(0, VISIBLE_BENEFITS)
  const moreFeatures = plan.features.slice(VISIBLE_BENEFITS)

  const renderFeature = (feat) => (
    <li key={feat.name} className="flex items-start gap-3" style={{ opacity: feat.included ? 1 : 0.55 }}>
      <span
        className="shrink-0 flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          marginTop: 1,
          background: feat.included ? '#ffffff' : 'rgba(255,255,255,0.18)',
          color: feat.included ? '#0A2786' : '#ffffff'
        }}
      >
        {feat.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      </span>
      <span style={{ fontSize: 13, lineHeight: 1.4, textDecoration: feat.included ? 'none' : 'line-through' }}>
        {feat.name}
      </span>
    </li>
  )

  return (
    <div
      className="pricing-glass-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 32,
        padding: '28px 24px 24px',
        color: '#ffffff',
        background:
          'linear-gradient(160deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.07) 55%, rgba(255,255,255,0.12) 100%)',
        border: isFeatured ? '1px solid rgba(255,255,255,0.65)' : '1px solid rgba(255,255,255,0.28)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)'
      }}
    >
      {isFeatured && (
        <div
          className="font-orbitron"
          style={{
            position: 'absolute',
            top: -13,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 14px',
            borderRadius: 999,
            background: '#ffffff',
            color: '#071544',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          {plan.badge || 'Most Popular'}
        </div>
      )}

      {/* Price + plan name */}
      <div>
        <div className="flex items-baseline flex-wrap" style={{ gap: 6 }}>
          <span className="font-orbitron" style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>
            {plan.priceRWF === 0 ? '0 RWF' : formatRWF(plan.priceRWF)}
          </span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>/ {plan.billingPeriod}</span>
        </div>
        <div className="flex items-center justify-between" style={{ gap: 8, marginTop: 6 }}>
          <span className="font-orbitron" style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9EDCFF' }}>
            {plan.name}
          </span>
          {!isFeatured && plan.badge && (
            <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>
              {plan.badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.85, marginTop: 6 }}>
          {plan.priceRWF === 0
            ? language === 'rw'
              ? 'Ubuntu बुhoraho'
              : 'Zero Rwandan francs forever'
            : amountToWords(plan.priceRWF, language)}
        </div>
        <p style={{ fontSize: 12, lineHeight: 1.55, margin: '12px 0 0', opacity: 0.92 }}>{plan.description}</p>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.28)', margin: '18px 0' }} />

      {/* Limits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 18 }}>
        {[
          ['Users', plan.limits?.users],
          ['Items', plan.limits?.products],
          ['Branches', plan.limits?.branches]
        ].map(([label, value]) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '8px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{label}</div>
            <div className="font-orbitron" style={{ fontSize: 12, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Benefits with animated show more / show less */}
      <div style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {firstFeatures.map(renderFeature)}
        </ul>
        {moreFeatures.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateRows: expanded ? '1fr' : '0fr',
                opacity: expanded ? 1 : 0,
                transition: 'grid-template-rows 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease'
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {moreFeatures.map(renderFeature)}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="cursor-pointer"
              style={{
                marginTop: 14,
                background: 'transparent',
                border: 'none',
                color: '#9EDCFF',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: 0
              }}
            >
              <span>{expanded ? 'Show less benefits' : `Show more benefits (${moreFeatures.length})`}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              />
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="font-orbitron cursor-pointer"
        style={{
          width: '100%',
          marginTop: 22,
          padding: '14px 10px',
          borderRadius: 999,
          background: isFeatured ? '#ffffff' : 'rgba(255,255,255,0.10)',
          color: isFeatured ? '#071544' : '#ffffff',
          border: isFeatured ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.4)',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8
        }}
      >
        <span>{plan.priceRWF === 0 ? 'Start Forever Free' : `Select ${plan.name}`}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function PricingSection() {
  const { pricingPlans, platinumProgram, language } = useExbos()
  const navigate = useNavigate()

  return (
    <section
      id="pricing"
      className="relative w-full overflow-hidden isolate"
      style={{
        background:
          'linear-gradient(180deg, #071544 0%, #0A2786 38%, #0E3AA6 70%, #0A2786 100%)'
      }}
    >
      {/* Coded background: glow orbs, fine dot grid, light sweep */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(33,141,255,0.45) 0%, transparent 65%)',
            filter: 'blur(40px)'
          }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(158,220,255,0.28) 0%, transparent 65%)',
            filter: 'blur(50px)'
          }}
        />
        <div
          className="absolute -bottom-48 left-1/4 w-[620px] h-[620px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16,69,202,0.55) 0%, transparent 65%)',
            filter: 'blur(50px)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(158,220,255,0.38) 1.2px, transparent 1.6px)',
            backgroundSize: '28px 28px',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)',
            maskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(158,220,255,0.07) 48%, transparent 66%)'
          }}
        />
      </div>
      <div className="relative py-20 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-0 py-1.5 bg-transparent text-[#9EDCFF] text-xs font-orbitron uppercase tracking-widest">
          <Crown className="w-3.5 h-3.5 text-[#9EDCFF]" />
          <span>Our Products / Subscription Plans</span>
        </div>
        <h2 className="font-orbitron text-3xl sm:text-4xl font-extrabold text-white">
          Transparent RWF Pricing Controlled Live by Super Admin
        </h2>
        <p className="text-sm sm:text-base text-slate-200">
          Start Forever Free or scale with Bronze, Silver, and Gold. Prices and feature entitlements update automatically from the Super Administrator workspace without redeploying.
        </p>
      </div>

      {/* Glass pricing cards */}
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            language={language}
            onSelect={() => navigate(`/register?plan=${plan.tier}`)}
          />
        ))}
      </div>

      {/* Category 5: Platinum / Diamond Referral & Loyalty Program Card */}
      {platinumProgram?.active && (
        <div
         
          className="mt-12 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#071544] via-[#0A2786] to-[#1045CA] text-white border border-[#9EDCFF]/45 shadow-sapphire-glow relative overflow-hidden"
        >
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-[#9EDCFF]/40 text-xs font-bold text-[#9EDCFF]">
                <Gift className="w-3.5 h-3.5 text-[#9EDCFF]" />
                <span>5. Platinum / Diamond Referral Membership · By <span className="font-pylarix">PYLARIX</span></span>
              </div>
              <h3 className="font-orbitron text-2xl sm:text-3xl font-extrabold">
                {platinumProgram.name}
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                {platinumProgram.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="px-4 py-2 rounded-xl bg-[#03091F]/65 border border-[#9EDCFF]/30 flex items-center gap-2 text-xs">
                  <Users className="w-4 h-4 text-[#218DFF]" />
                  <span>
                    Required Referrals:{' '}
                    <strong className="font-orbitron text-[#9EDCFF]">
                      {platinumProgram.requiredReferrals} Verified Businesses
                    </strong>
                  </span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#03091F]/65 border border-[#9EDCFF]/30 flex items-center gap-2 text-xs">
                  <Sparkles className="w-4 h-4 text-[#9EDCFF]" />
                  <span>
                    Reward Prize:{' '}
                    <strong className="text-white">{platinumProgram.rewardTitle}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/register?plan=Platinum')}
                className="px-6 py-3.5 rounded-2xl bg-white text-[#071544] hover:bg-[#9EDCFF] font-orbitron text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
              >
                <span>Join Referral Program</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] text-[#9EDCFF]/80 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Configured dynamically in Super Admin
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
    </section>
  )
}

