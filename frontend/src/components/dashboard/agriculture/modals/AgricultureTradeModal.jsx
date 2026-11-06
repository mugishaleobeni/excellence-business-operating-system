import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Activity,
  Egg,
  Milk,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle,
  Check,
  ArrowRight,
  Phone,
  MessageSquare,
  Package,
  Calendar,
  HeartPulse,
  TrendingUp,
  Scale
} from 'lucide-react'
import { AGRICULTURE_PRESETS } from '../data/agriculturePresets'

const ICON_MAP = {
  Activity,
  Egg,
  Milk,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle
}

export default function AgricultureTradeModal({
  isOpen,
  onClose,
  currentTradeId = 'pigs',
  onSelectTrade,
  isFirstTimePrompt = false
}) {
  const [selectedId, setSelectedId] = useState(currentTradeId)

  if (!isOpen) return null

  const presetList = Object.values(AGRICULTURE_PRESETS)
  const selectedTrade = AGRICULTURE_PRESETS[selectedId] || AGRICULTURE_PRESETS.pigs
  const SelectedIcon = ICON_MAP[selectedTrade.iconName] || Package

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
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center shadow-inner">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-lg font-bold tracking-wide text-white flex items-center gap-2">
                <span>Select Agriculture &amp; Livestock Specialization</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Arch 04
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Gestation timelines, dual individual/batch registers, feed depletion &amp; real cost per head
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

        {/* Modal Body: Two-panel selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Left: Trade Option Cards List */}
          <div className="md:col-span-6 p-4 sm:p-5 overflow-y-auto space-y-2.5 border-b md:border-b-0 md:border-r border-white/10 bg-[#03110d]/50 custom-scrollbar">
            <div className="text-[11px] font-semibold text-emerald-300/80 uppercase tracking-wider mb-1 px-1">
              Select Your Farming Sector
            </div>

            {presetList.map((preset) => {
              const Icon = ICON_MAP[preset.iconName] || Package
              const isSelected = preset.id === selectedId
              const isCurrent = preset.id === currentTradeId

              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedId(preset.id)}
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-start gap-3.5 relative ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400/60 shadow-lg shadow-emerald-950/40'
                      : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-white/5 text-slate-300 border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">
                        {preset.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {preset.category}
                    </p>
                    <p className="text-[11px] text-slate-300/80 line-clamp-2 mt-1">
                      {preset.headline}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute right-3.5 top-3.5 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: Selected Trade Details & Preview */}
          <div className="md:col-span-6 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between bg-gradient-to-b from-[#061814] to-[#04110d] custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    {selectedTrade.category}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">
                    {selectedTrade.businessName}
                  </h3>
                  <p className="text-xs text-emerald-300 font-medium">
                    {selectedTrade.headline}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center shrink-0">
                  <SelectedIcon className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
                {selectedTrade.description}
              </p>

              {/* Support Card vs Preset Highlights */}
              {selectedTrade.isSupportContact ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-300 font-medium text-xs">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Specialized Farm Setup Support</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Need aquaculture ponds, beekeeping apiaries, hydroponics, quail, or rabbit tracking?
                    Our agricultural systems team custom-configures your feed schedules and units.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 bg-black/30 px-3 py-2 rounded-xl border border-emerald-500/20">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp: {selectedTrade.whatsappNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                    Included Farm Engine Setup
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Daily Feed Need</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTrade.dailyFeedPerHeadKg
                          ? `${selectedTrade.dailyFeedPerHeadKg} ${selectedTrade.feedUnit || 'kg'} / head`
                          : 'Custom Ration'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lifecycle Register</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {selectedTrade.animalLabel || 'Farm Produce'}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Starter Records</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {(selectedTrade.animals?.length || 0) + (selectedTrade.batches?.length || 0)} Units Loaded
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Depletion Engine</span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {selectedTrade.feeds?.length || 0} Feeds Configured
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 italic">
                    Note: Applying this specialization configures starter livestock, feeds, and gestation cycles. Your financial logs remain safe.
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
              {!isFirstTimePrompt && (
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                onClick={handleApply}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  selectedTrade.isSupportContact
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                }`}
              >
                <span>
                  {selectedTrade.isSupportContact
                    ? 'Open WhatsApp Agronomist Support'
                    : `Apply ${selectedTrade.name}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}

