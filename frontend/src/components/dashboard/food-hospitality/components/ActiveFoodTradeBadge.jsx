import React from 'react'
import {
  UtensilsCrossed,
  Hotel,
  BedDouble,
  Flame,
  Receipt,
  Sparkles,
  RefreshCw,
  HelpCircle,
  ChevronDown
} from 'lucide-react'
import { FOOD_HOSPITALITY_PRESETS } from '../data/foodHospitalityPresets'

const ICON_MAP = {
  UtensilsCrossed,
  Hotel,
  BedDouble,
  Flame,
  Receipt,
  Sparkles,
  RefreshCw,
  HelpCircle
}

export default function ActiveFoodTradeBadge({
  currentTradeId = 'combined',
  onClick = () => {}
}) {
  const current = FOOD_HOSPITALITY_PRESETS[currentTradeId] || FOOD_HOSPITALITY_PRESETS.combined
  const IconComponent = ICON_MAP[current.iconName] || Hotel

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-amber-400/30 text-amber-200 hover:text-white transition-all shadow-sm group cursor-pointer"
      title="Click to switch food & hospitality specialization preset"
    >
      <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
        <IconComponent className="w-3 h-3" />
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[10px] font-mono text-amber-300/80 uppercase tracking-wider">
          Specialization
        </span>
        <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors truncate max-w-[170px] sm:max-w-[220px]">
          {current.name}
        </span>
      </div>
      <ChevronDown className="w-3.5 h-3.5 text-amber-300/70 group-hover:text-white transition-colors shrink-0 ml-1" />
    </button>
  )
}

