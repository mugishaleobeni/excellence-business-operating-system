import React, { useState } from 'react'
import {
  Scissors,
  Wrench,
  Smartphone,
  Briefcase,
  Sparkles,
  Camera,
  Layers,
  HelpCircle,
  Package,
  ChevronDown
} from 'lucide-react'
import { SERVICE_PRESETS } from '../data/servicePresets'
import ServiceTradeSelectionModal from '../modals/ServiceTradeSelectionModal'

const ICON_MAP = {
  Scissors,
  Wrench,
  Smartphone,
  Briefcase,
  Sparkles,
  Camera,
  Layers,
  HelpCircle
}

export default function ActiveServiceTradeBadge({
  activeTradeId = 'salon',
  onSelectTrade = null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const trade = SERVICE_PRESETS[activeTradeId] || SERVICE_PRESETS.salon
  const IconComp = ICON_MAP[trade?.iconName] || Package

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 hover:text-white transition-all shadow-sm"
        title="Change service trade preset or launch WhatsApp custom trade builder"
      >
        <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30 group-hover:scale-105 transition-transform">
          <IconComp className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-white truncate max-w-[150px] sm:max-w-[200px]">
          {trade.name}
        </span>
        <span className="text-[10px] text-sky-300/70 border-l border-white/10 pl-1.5 hidden sm:inline">
          Switch Craft
        </span>
        <ChevronDown className="w-3 h-3 text-sky-300 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <ServiceTradeSelectionModal
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

