import React from 'react'
import {
  Package,
  Wrench,
  UtensilsCrossed,
  Layers,
  Check,
  ShieldAlert,
  Sparkles
} from 'lucide-react'

const ACTIVITY_DEFINITIONS = [
  {
    key: 'retail',
    title: 'Physical Products (Buy & Sell)',
    icon: Package,
    badge: 'Stocked Goods',
    color: 'emerald',
    description: 'Track retail items, unit costs, reorder alerts, and physical warehouse inventory.'
  },
  {
    key: 'service',
    title: 'Technical Services & Labor (Service-Based)',
    icon: Wrench,
    badge: 'Billable Labor',
    color: 'sky',
    description: 'Bill installation hours, consultations, diagnostics, and repairs with zero stock constraints.'
  },
  {
    key: 'food',
    title: 'Food & Dining (Hospitality / Cafe)',
    icon: UtensilsCrossed,
    badge: 'Prepared Food',
    color: 'amber',
    description: 'Fresh coffee barista bar, bakery loaves, meals, and recipe ingredient auto-deduction.'
  },
  {
    key: 'production',
    title: 'Workshops & Assembly (Make & Sell)',
    icon: Layers,
    badge: 'Manufacturing',
    color: 'purple',
    description: 'Transform raw materials into finished batch goods with recipe costing.'
  }
]

export default function ActivityToggleSettings({
  activeActivities = {},
  onToggleActivity = () => {}
}) {
  return (
    <div className="p-5 sm:p-6 rounded-3xl border border-white/10 bg-[#061019]/80 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block">
            Pillar 01 · Modular Business Architecture
          </span>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Modular Activity Activator</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Toggle on the exact business activities you operate. Only active modules will appear in your catalog and checkout till.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {ACTIVITY_DEFINITIONS.map((act) => {
          const Icon = act.icon
          const isEnabled = Boolean(activeActivities[act.key])

          return (
            <div
              key={act.key}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                isEnabled
                  ? 'bg-cyan-950/20 border-cyan-400/50 shadow-md'
                  : 'bg-white/[0.02] border-white/10 opacity-70'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      {act.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80 block mt-0.5">
                    {act.badge}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleActivity(act.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                  isEnabled
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {isEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

