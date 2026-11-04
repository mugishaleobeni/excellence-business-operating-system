import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Scissors,
  Hammer,
  CupSoda,
  UtensilsCrossed,
  Wrench,
  Sparkles,
  HelpCircle,
  Check,
  ArrowRight,
  Phone,
  MessageSquare,
  Package,
  Layers
} from 'lucide-react'
import { TRADE_LIST, TRADE_PRESETS } from '../data/tradePresets'

const ICON_MAP = {
  Scissors,
  Hammer,
  CupSoda,
  UtensilsCrossed,
  Wrench,
  Sparkles,
  HelpCircle
}

export default function TradeSelectionModal({
  isOpen,
  onClose,
  currentTradeId = 'tailoring',
  onSelectTrade,
  isFirstTimePrompt = false
}) {
  const [selectedId, setSelectedId] = useState(currentTradeId)

  if (!isOpen) return null

  const selectedTrade = TRADE_PRESETS[selectedId] || TRADE_PRESETS.tailoring
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
      <div
        className="relative w-full max-w-4xl my-auto max-h-[92vh] flex flex-col rounded-2xl border border-white/20 bg-slate-900/98 shadow-2xl text-slate-100 overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(14, 165, 233, 0.35)'
        }}
      >
        {/* Header - Always visible with shrink-0 */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-white/10 flex items-start justify-between bg-gradient-to-r from-blue-900/50 via-slate-900/60 to-slate-900/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 mb-2">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Make &amp; Sell · Architecture Setup</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
              {isFirstTimePrompt ? 'What does your workshop produce?' : 'Select Workshop Craft & Preset'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-xl">
              Choose your craft to configure your raw materials, cutting/assembly formulas, and standard units. You can customize everything or start blank.
            </p>
          </div>

          {!isFirstTimePrompt && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body: Left Grid of Trades + Right Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
          {/* Trade Options List */}
          <div className="md:col-span-7 p-4 sm:p-5 overflow-y-auto space-y-2.5 border-r border-white/10 max-h-[52vh] sm:max-h-[58vh]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 mb-2">
              Available Production Trades
            </div>

            {TRADE_LIST.map((trade) => {
              const IconComp = ICON_MAP[trade.iconName] || Package
              const isSelected = selectedId === trade.id

              return (
                <div
                  key={trade.id}
                  onClick={() => setSelectedId(trade.id)}
                  className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-500/15 border-sky-400 shadow-md shadow-sky-500/10'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform ${
                        isSelected
                          ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                          : 'bg-slate-800 text-sky-400 border-white/10 group-hover:scale-105'
                      }`}
                    >
                      <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">
                          {trade.name}
                        </span>
                        {trade.isSupportContact && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            WhatsApp
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {trade.tagline}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    {isSelected ? (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white/20 group-hover:border-white/40" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right Column: Dynamic Preview of Selected Trade */}
          <div className="md:col-span-5 p-4 sm:p-5 bg-white/[0.02] flex flex-col justify-between overflow-y-auto max-h-[52vh] sm:max-h-[58vh]">
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                <SelectedIcon className="w-4 h-4 text-sky-400" />
                <span>Trade Preview &amp; Setup</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                    <SelectedIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">{selectedTrade.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{selectedTrade.businessName}</p>
                  </div>
                </div>

                {selectedTrade.isSupportContact ? (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Need a specialized manufacturing trade not listed above (e.g. cosmetics, block molding, shoes, pottery)?
                    </p>
                    <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        Engineering &amp; Support WhatsApp: <strong>{selectedTrade.whatsappFormatted}</strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] text-slate-400 font-medium">Standard Units</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTrade.units.map((u) => (
                          <span
                            key={u}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-sky-300 border border-white/10"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] text-slate-400 font-medium">Sample Raw Materials</div>
                      <div className="text-xs text-slate-200 mt-1 space-y-1">
                        {selectedTrade.rawMaterials.length > 0 ? (
                          selectedTrade.rawMaterials.slice(0, 3).map((m) => (
                            <div key={m.id} className="flex justify-between items-center text-[10px]">
                              <span className="truncate max-w-[140px] text-slate-300">• {m.name}</span>
                              <span className="text-sky-400 shrink-0 font-mono">
                                {m.purchasePriceRWF?.toLocaleString()} RWF/{m.unit}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">0 records · Completely blank</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] text-slate-400 font-medium">Finished Goods</div>
                      <div className="text-xs text-slate-200 mt-1 space-y-1">
                        {selectedTrade.finishedGoods.length > 0 ? (
                          selectedTrade.finishedGoods.slice(0, 2).map((p) => (
                            <div key={p.id} className="flex justify-between items-center text-[10px]">
                              <span className="truncate max-w-[140px] text-slate-300">• {p.name}</span>
                              <span className="text-emerald-400 shrink-0 font-mono">
                                {p.sellingPriceRWF?.toLocaleString()} RWF
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">0 records · Ready for entry</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action button inside preview panel */}
            <div className="pt-3">
              <button
                onClick={handleApply}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  selectedTrade.isSupportContact
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/30'
                }`}
              >
                {selectedTrade.isSupportContact ? (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp (+250 781 963 981)</span>
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

        {/* Footer info strip - shrink-0 */}
        <div className="shrink-0 px-5 py-2.5 border-t border-white/10 bg-slate-950/70 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>
            {selectedTrade.isSupportContact
              ? 'Official ExBOS Support Line: +250 781 963 981'
              : 'All your customers, suppliers, sales invoices, and purchase records are preserved.'}
          </span>
          <span className="text-slate-500 font-mono">ExBOS Make &amp; Sell v2.0</span>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalNode, document.body)
  }
  return modalNode
}

