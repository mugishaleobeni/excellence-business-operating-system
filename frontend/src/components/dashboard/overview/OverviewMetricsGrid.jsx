import React from 'react'
import { X, ArrowUpRight } from 'lucide-react'

export default function OverviewMetricsGrid({
  availableWidgets = [],
  isCardVisible = () => true,
  widgetStyle = () => ({}),
  handleRemoveCard = () => {}
}) {
  const visibleWidgets = availableWidgets.filter(isCardVisible)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {visibleWidgets.map((w) => {
        const Icon = w.icon
        return (
          <div
            key={w.id}
            style={widgetStyle(w.id)}
            className="exbos-glass-card p-5 relative overflow-hidden group hover:border-[#218DFF]/40 transition-all duration-300"
          >
            {/* Glow ambient accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#218DFF]/5 rounded-full blur-2xl pointer-events-none group-hover:bg-[#218DFF]/15 transition-all" />

            {/* Card Header: Icon + Badge + Remove action */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-inner">
                  <Icon className={`w-4 h-4 ${w.color}`} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {w.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.badgeBg}`}>
                  {w.badge}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveCard(e, w)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove from Overview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metric Value & Subtitle - fully visible, wrapping gracefully without truncation */}
            <div className="space-y-1 my-3 min-w-0">
              <div className="font-orbitron text-xl sm:text-2xl xl:text-3xl font-extrabold text-white tracking-tight break-words leading-tight">
                {w.getValue()}
              </div>
              <p className="text-xs text-slate-300 break-words mt-1 leading-relaxed">{w.getSubtitle()}</p>
            </div>

            {/* Footer Link / Action */}
            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {w.navModule} · {w.navPage}
              </span>
              <button
                type="button"
                onClick={w.onAction}
                className="text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0 transition-colors"
              >
                <span>{w.actionLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

