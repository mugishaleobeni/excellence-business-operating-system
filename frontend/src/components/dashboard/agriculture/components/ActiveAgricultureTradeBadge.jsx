import React, { useState } from 'react'
import {
  Activity,
  Egg,
  Milk,
  ShieldCheck,
  Sprout,
  Sparkles,
  Layers,
  HelpCircle,
  Package,
  ChevronDown
} from 'lucide-react'
import { AGRICULTURE_PRESETS } from '../data/agriculturePresets'
import AgricultureTradeModal from '../modals/AgricultureTradeModal'

const ICON_MAP = {
  Activity,
  Egg,
  Milk,
  ShieldCheck,
  Sprout,
  Sparkles,
  Layers,
  HelpCircle
}

export default function ActiveAgricultureTradeBadge({
  activeTradeId = 'pigs',
  onSelectTrade = null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const trade = AGRICULTURE_PRESETS[activeTradeId] || AGRICULTURE_PRESETS.pigs
  const IconComp = ICON_MAP[trade?.iconName] || Package

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 hover:text-white transition-all shadow-sm"
        title="Change livestock & agriculture specialization or connect with agronomist support"
      >
        <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
          <IconComp className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
          {trade.name}
        </span>
        <span className="text-[10px] text-emerald-300/70 border-l border-white/10 pl-1.5 hidden sm:inline">
          Switch Spec
        </span>
        <ChevronDown className="w-3 h-3 text-emerald-300 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <AgricultureTradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentTradeId={activeTradeId}
        onSelectTrade={(newTradeId) => {
          if (onSelectTrade) onSelectTrade(newTradeId)
          setModalOpen(false)
        }}
      />
    </>
  )
}

