import React from 'react'
import {
  Wrench,
  Coffee,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Layers,
  ChevronDown
} from 'lucide-react'
import { HYBRID_PRESETS } from '../data/hybridPresets'

const ICON_MAP = {
  Wrench,
  Coffee,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Layers
}

export default function ActiveHybridTradeBadge({
  currentTradeId = 'techRepair',
  onClick = () => {}
}) {
  const current = HYBRID_PRESETS[currentTradeId] || HYBRID_PRESETS.techRepair
  const IconComponent = ICON_MAP[current.iconName] || Layers

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-cyan-400/30 text-cyan-200 hover:text-white transition-all shadow-sm group cursor-pointer"
      title="Click to switch hybrid business specialization preset"
    >
      <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
        <IconComponent className="w-3 h-3" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-mono text-cyan-300/80 uppercase tracking-wider">
          Hybrid Model
        </span>
        <span className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors truncate max-w-[170px] sm:max-w-[220px]">
          {current.name}
        </span>
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-cyan-300/70 group-hover:text-white transition-colors shrink-0 ml-1" />
    </button>
  )
}

