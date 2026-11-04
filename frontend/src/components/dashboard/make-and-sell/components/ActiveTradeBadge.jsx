import React, { useState } from 'react'
import {
  Scissors,
  Hammer,
  CupSoda,
  UtensilsCrossed,
  Wrench,
  Sparkles,
  HelpCircle,
  Package,
  ChevronDown
} from 'lucide-react'
import { TRADE_PRESETS } from '../data/tradePresets'
import TradeSelectionModal from '../modals/TradeSelectionModal'

const ICON_MAP = {
  Scissors,
  Hammer,
  CupSoda,
  UtensilsCrossed,
  Wrench,
  Sparkles,
  HelpCircle
}

export default function ActiveTradeBadge({
  activeTradeId = 'tailoring',
  onSelectTrade = null
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const trade = TRADE_PRESETS[activeTradeId] || TRADE_PRESETS.tailoring
  const IconComp = ICON_MAP[trade.iconName] || Package

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-sky-400/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 hover:text-white transition-all shadow-sm"
        title="Change production craft / industry preset"
      >
        <span className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-500/30 group-hover:scale-105 transition-transform">
          <IconComp className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-white">{trade.name}</span>
        <span className="text-[10px] text-sky-300/70 border-l border-white/10 pl-1.5 hidden sm:inline">
          Switch Craft
        </span>
        <ChevronDown className="w-3 h-3 text-sky-300 opacity-60 group-hover:opacity-100 transition-opacity" />
      </button>

      <TradeSelectionModal
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
