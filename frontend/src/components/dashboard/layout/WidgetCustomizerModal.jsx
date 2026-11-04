import React from 'react'
import { Sliders, X, Search, Check } from 'lucide-react'

export default function WidgetCustomizerModal({
  isOpen,
  onClose,
  widgetSearch,
  setWidgetSearch,
  AVAILABLE_WIDGETS = [],
  filteredWidgets = [],
  isCardVisible,
  handleToggleWidget,
  setVisibleMetricCards
}) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_30px_rgba(33,141,255,0.25)] p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1045CA]/40 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF] shadow-inner">
              <Sliders className="w-5 h-5 text-[#218DFF]" />
            </div>
            <div>
              <h3 className="font-orbitron text-base sm:text-lg font-extrabold text-white tracking-tight">
                Customize Dashboard Overview Widgets
              </h3>
              <p className="text-xs text-[#9EDCFF]/80 mt-0.5">
                Select which navigation metrics &amp; cards to display on your Overview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer border border-white/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={widgetSearch}
              onChange={(e) => setWidgetSearch(e.target.value)}
              placeholder="Search widgets (e.g. Sales, Customers, Stock, Farm...)"
              className="w-full bg-[#040C26]/70 border border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
            />
            {widgetSearch && (
              <button
                type="button"
                onClick={() => setWidgetSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const allIds = AVAILABLE_WIDGETS.map((w) => w.id)
              setVisibleMetricCards(allIds)
              try {
                localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(allIds))
              } catch (e) {}
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-[#9EDCFF] cursor-pointer transition-colors whitespace-nowrap"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => {
              const defaults = ['owed_to_me', 'i_owe', 'expenses', 'sales']
              setVisibleMetricCards(defaults)
              try {
                localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(defaults))
              } catch (e) {}
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-bold text-slate-300 hover:text-white cursor-pointer transition-colors whitespace-nowrap"
          >
            Defaults (4)
          </button>
        </div>

        {/* Widgets Checklist Grid */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredWidgets.map((w) => {
            const isSelected = isCardVisible(w)
            const ItemIcon = w.icon
            return (
              <div
                key={w.id}
                onClick={() => handleToggleWidget(w)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1045CA]/35 to-[#218DFF]/20 border-[#218DFF]/60 text-white shadow-[0_4px_16px_rgba(33,141,255,0.18)]'
                    : 'bg-[#040C26]/60 border-white/10 text-slate-400 hover:bg-white/5 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isSelected ? 'bg-[#218DFF]/20 border-[#218DFF]/50' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <ItemIcon className={`w-4 h-4 ${w.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm text-white font-bold block truncate">
                        {w.name}
                      </strong>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[9px] font-semibold text-slate-300">
                        {w.navModule}
                      </span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${w.badgeBg}`}>
                        {w.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      {w.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-orbitron font-bold text-white">
                      {w.getValue()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Live Value
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#218DFF] border-[#9EDCFF] text-white shadow-sm'
                        : 'bg-white/5 border-white/20 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            )
          })}
          {filteredWidgets.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No widgets matching &ldquo;{widgetSearch}&rdquo;
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15">
          <div className="text-xs text-slate-300">
            Showing{' '}
            <strong className="text-white">
              {AVAILABLE_WIDGETS.filter(isCardVisible).length}
            </strong>{' '}
            of {AVAILABLE_WIDGETS.length} widgets active
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] border border-white/40 text-xs font-bold text-white cursor-pointer shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

