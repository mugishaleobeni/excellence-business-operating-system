import React, { useState } from 'react'
import { Info, X } from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

function SummaryCardItem({
  title,
  value,
  subtitle,
  meaning,
  icon: Icon,
  colorScheme = 'sapphire',
  isCurrency = false,
  hideFinancials = false
}) {
  const [showExplanation, setShowExplanation] = useState(false)

  const colorMap = {
    sapphire: {
      border: 'hover:border-[#218DFF]/50',
      badge: 'bg-[#218DFF]/15 text-[#9EDCFF] border border-[#218DFF]/30',
      accent: 'text-[#9EDCFF]',
      topLine: 'via-[#218DFF]/50'
    },
    emerald: {
      border: 'hover:border-emerald-500/50',
      badge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      accent: 'text-emerald-400',
      topLine: 'via-emerald-500/50'
    },
    amber: {
      border: 'hover:border-amber-500/50',
      badge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      accent: 'text-amber-400',
      topLine: 'via-amber-500/50'
    },
    rose: {
      border: 'hover:border-rose-500/50',
      badge: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      accent: 'text-rose-400',
      topLine: 'via-rose-500/50'
    },
    purple: {
      border: 'hover:border-purple-500/50',
      badge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      accent: 'text-purple-300',
      topLine: 'via-purple-500/50'
    }
  }

  const c = colorMap[colorScheme] || colorMap.sapphire
  const displayValue = isCurrency && hideFinancials ? '••••••••' : value

  return (
    <div
      className={`relative exbos-glass-card p-4 sm:p-5 rounded-2xl border border-white/10 ${c.border} transition-all duration-200 overflow-hidden shadow-lg hover:shadow-2xl flex flex-col justify-between min-h-[128px]`}
    >
      {/* Top micro gradient line */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent ${c.topLine} to-transparent pointer-events-none`}
      />

      {/* Normal Metric Display */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${c.badge}`}>
                <Icon className="w-4 h-4" />
              </div>
            )}
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-slate-300 truncate"
              title={title}
            >
              {title}
            </span>
          </div>

          {/* Info icon to trigger in-card explanation */}
          {meaning && (
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              onMouseEnter={() => setShowExplanation(true)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-[#9EDCFF] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="What does this mean?"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="mt-1 min-w-0">
          <div
            className={`font-orbitron text-lg sm:text-xl xl:text-2xl font-extrabold tracking-tight ${c.accent} break-words leading-tight`}
            title={String(value)}
          >
            {displayValue}
          </div>
          {subtitle && (
            <div className="text-[11px] text-slate-400 mt-1 break-words leading-normal">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* In-Card Explanation Overlay on Hover/Click */}
      {meaning && showExplanation && (
        <div
          onMouseLeave={() => setShowExplanation(false)}
          className="absolute inset-0 bg-[#040C26]/98 backdrop-blur-md p-4 flex flex-col justify-between z-20 animate-in fade-in duration-150 border border-[#218DFF]/40 rounded-2xl"
        >
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                {title} — Explanation
              </span>
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="w-4 h-4 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {meaning}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-white/10 flex justify-between">
            <span>ExBOS Audited Metric</span>
            <button
              type="button"
              onClick={() => setShowExplanation(false)}
              className="text-[#9EDCFF] hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportSummaryCards({ cards = [], hideFinancials = false }) {
  if (!cards || cards.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <SummaryCardItem
          key={card.id || idx}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          meaning={card.meaning}
          icon={card.icon}
          colorScheme={card.colorScheme || 'sapphire'}
          isCurrency={card.isCurrency}
          hideFinancials={hideFinancials}
        />
      ))}
    </div>
  )
}

