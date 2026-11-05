import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Scissors,
  Wrench,
  Smartphone,
  Briefcase,
  Sparkles,
  Camera,
  Layers,
  HelpCircle,
  Check,
  ArrowRight,
  Phone,
  MessageSquare,
  Package,
  Clock,
  Percent,
  Users
} from 'lucide-react'
import { SERVICE_TRADE_LIST, SERVICE_PRESETS } from '../data/servicePresets'

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

export default function ServiceTradeSelectionModal({
  isOpen,
  onClose,
  currentTradeId = 'salon',
  onSelectTrade,
  isFirstTimePrompt = false
}) {
  const [selectedId, setSelectedId] = useState(currentTradeId)

  if (!isOpen) return null

  const selectedTrade = SERVICE_PRESETS[selectedId] || SERVICE_PRESETS.salon
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
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-sky-400/30 bg-[#071330]/95 text-white shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-sky-950/60 via-[#0a1a44]/80 to-blue-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/40 flex items-center justify-center shadow-inner">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-orbitron text-lg font-bold tracking-wide text-white flex items-center gap-2">
                <span>Select Service Trade &amp; Craft</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Arch 03
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Switch instant SME catalogues, consumables, job card pipelines &amp; staff commission engine
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
          <div className="md:col-span-6 p-4 sm:p-5 overflow-y-auto space-y-2.5 border-b md:border-b-0 md:border-r border-white/10 bg-[#040c24]/50 custom-scrollbar">
            <div className="text-[11px] font-semibold text-sky-300/80 uppercase tracking-wider mb-1 px-1">
              Select Your Specialization
            </div>

            {SERVICE_TRADE_LIST.map((trade) => {
              const IconComp = ICON_MAP[trade.iconName] || Package
              const isSelected = selectedId === trade.id
              const isCurrent = currentTradeId === trade.id

              return (
                <button
                  key={trade.id}
                  onClick={() => setSelectedId(trade.id)}
                  type="button"
                  className={`w-full text-left p-3.5 rounded-2xl transition-all border flex items-start gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-sky-500/20 border-sky-400/60 shadow-lg shadow-sky-500/10'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-sky-500/30 text-sky-200 border-sky-400/50 scale-105'
                        : 'bg-white/5 text-slate-400 border-white/10 group-hover:text-sky-300 group-hover:border-sky-400/30'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-white group-hover:text-sky-200 truncate">
                        {trade.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                      {trade.description}
                    </p>
                  </div>

                  <div className="shrink-0 pt-1">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500 text-white'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right: Selected Trade Interactive Preview & Specs */}
          <div className="md:col-span-6 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between bg-gradient-to-br from-[#071330] to-[#040c24] custom-scrollbar">
            <div className="space-y-4">
              {/* Selected Trade Header */}
              <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shrink-0 shadow-inner">
                  <SelectedIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-orbitron text-base font-bold text-white truncate">
                    {selectedTrade.name}
                  </h3>
                  <p className="text-xs text-sky-300/90 font-medium">
                    {selectedTrade.businessName}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {selectedTrade.description}
                  </p>
                </div>
              </div>

              {/* Trade Blueprint Badges */}
              {!selectedTrade.isSupportContact && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Clock className="w-3 h-3 text-sky-400" />
                      <span>Duration</span>
                    </div>
                    <div className="text-xs font-semibold text-white">
                      {selectedTrade.standardDuration || '45 mins'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Percent className="w-3 h-3 text-emerald-400" />
                      <span>Commission</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-300">
                      {selectedTrade.defaultCommission || 25}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Users className="w-3 h-3 text-cyan-400" />
                      <span>Staff Roles</span>
                    </div>
                    <div className="text-xs font-semibold text-cyan-300 truncate">
                      {selectedTrade.staffLabel || 'Technicians'}
                    </div>
                  </div>
                </div>
              )}

              {/* Sample Services Preview */}
              {selectedTrade.services && selectedTrade.services.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Included Services ({selectedTrade.services.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Pricing &amp; Duration</span>
                  </div>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
                    {selectedTrade.services.map((srv) => (
                      <div
                        key={srv.id}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-white font-medium truncate">{srv.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {srv.category} · {srv.durationMins} mins · {srv.commissionPct}% comm.
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-semibold text-sky-300">
                            {srv.priceRWF.toLocaleString()} RWF
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consumables Sample */}
              {selectedTrade.consumables && selectedTrade.consumables.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Consumables &amp; Spare Supplies ({selectedTrade.consumables.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTrade.consumables.map((con) => (
                      <span
                        key={con.id}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-sky-950/60 border border-sky-400/20 text-sky-200"
                      >
                        {con.name} ({con.currentStock} {con.unit})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Support Notice if 'other' is selected */}
              {selectedTrade.isSupportContact && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <MessageSquare className="w-4 h-4" />
                    <span>Direct WhatsApp Specialist Support</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Have a unique service setup? We will configure custom service menus, commission tiers, and consumable formulas for you.
                  </p>
                  <div className="flex items-center gap-2 text-white font-mono text-xs font-semibold pt-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedTrade.whatsappNumber}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Button */}
            <div className="pt-5 mt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleApply}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  selectedTrade.isSupportContact
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/25'
                }`}
              >
                {selectedTrade.isSupportContact ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat on WhatsApp (+250 781 963 981)</span>
                  </>
                ) : (
                  <>
                    <span>Apply {selectedTrade.name}</span>
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

