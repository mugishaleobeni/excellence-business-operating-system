import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Hotel,
  UtensilsCrossed,
  BedDouble,
  Flame,
  Receipt,
  RefreshCw,
  HelpCircle,
  Check,
  ArrowRight,
  Phone,
  MessageSquare
} from 'lucide-react'
import { FOOD_HOSPITALITY_PRESETS } from '../data/foodHospitalityPresets'

const ICON_MAP = {
  Hotel,
  UtensilsCrossed,
  BedDouble,
  Flame,
  Receipt,
  RefreshCw,
  HelpCircle
}

export default function FoodTradeModal({
  isOpen,
  onClose,
  currentTradeId = 'combined',
  onSelectTrade,
  isFirstTimePrompt = false
}) {
  const [selectedId, setSelectedId] = useState(currentTradeId)

  if (!isOpen) return null

  const presetList = Object.values(FOOD_HOSPITALITY_PRESETS)
  const selectedTrade = FOOD_HOSPITALITY_PRESETS[selectedId] || FOOD_HOSPITALITY_PRESETS.combined
  const SelectedIcon = ICON_MAP[selectedTrade.iconName] || Hotel

  const handleApply = () => {
    if (selectedTrade.isSupportContact) {
      const url = `https://wa.me/${selectedTrade.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        selectedTrade.whatsappMessage
      )}`
      window.open(url, '_blank')
      return
    }
    if (onSelectTrade) {
      onSelectTrade(selectedId)
    }
    if (onClose) onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-amber-400/30 bg-[#120e06]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/70 via-[#221808]/80 to-yellow-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shadow-inner">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-lg font-bold tracking-wide text-white flex items-center gap-2">
                <span>Select Food &amp; Hospitality Specialization</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Arch 05
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Menu recipes, live kitchen queue, room folios, ingredient deduction &amp; portion margins
              </p>
            </div>
          </div>
          {!isFirstTimePrompt && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Presets List */}
          <div className="md:col-span-6 p-4 sm:p-5 overflow-y-auto space-y-2.5 border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0903]/50 custom-scrollbar">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-1">
              Choose Hospitality Model
            </span>
            {presetList.map((preset) => {
              const Icon = ICON_MAP[preset.iconName] || Hotel
              const isSelected = preset.id === selectedId
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedId(preset.id)}
                  className={`w-full p-3.5 rounded-2xl text-left transition-all border flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg'
                      : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-amber-300 font-mono block truncate mt-0.5">
                      {preset.category}
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {preset.headline}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Details Preview */}
          <div className="md:col-span-6 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between bg-gradient-to-b from-[#181206]/40 to-[#0e0a03]/80 custom-scrollbar">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-wider block">
                  Configuration Details
                </span>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  {selectedTrade.businessName}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedTrade.description}
                </p>
              </div>

              {selectedTrade.isSupportContact ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Phone className="w-4 h-4" />
                    <span>Dedicated Hospitality Support</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Need a custom multi-branch hotel, event venue, or franchise setup? Our engineers configure custom workflows directly for your business.
                  </p>
                  <div className="font-mono text-xs text-white font-bold bg-black/40 p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
                    <span>WhatsApp:</span>
                    <span className="text-amber-300">+250 781 963 981</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Operational Modules Configured:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-slate-300">
                      <span className="text-amber-300 font-bold block">
                        {selectedTrade.menuItems?.length || 0} Dishes
                      </span>
                      <span className="text-[10px] text-slate-400">Recipe BOMs</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-slate-300">
                      <span className="text-sky-300 font-bold block">
                        {selectedTrade.rooms?.length || 0} Rooms
                      </span>
                      <span className="text-[10px] text-slate-400">Live Status Grid</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-slate-300">
                      <span className="text-emerald-300 font-bold block">
                        {selectedTrade.ingredients?.length || 0} Ingredients
                      </span>
                      <span className="text-[10px] text-slate-400">Auto-Deductions</span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-slate-300">
                      <span className="text-amber-300 font-bold block">
                        {selectedTrade.kitchenOrders?.length || 0} KOT Orders
                      </span>
                      <span className="text-[10px] text-slate-400">Queue &amp; Tables</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-white/10 flex items-center justify-end gap-3 mt-4">
              {!isFirstTimePrompt && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all"
              >
                {selectedTrade.isSupportContact ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Open WhatsApp Support</span>
                  </>
                ) : (
                  <>
                    <span>Load {selectedTrade.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

