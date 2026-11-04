import React from 'react'
import { Menu, Search, Bell, X, ArrowUpRight, CheckCircle2, LogOut } from 'lucide-react'
import ActiveTradeBadge from '../make-and-sell/components/ActiveTradeBadge'

export default function DashboardTopNav({
  workspaceScrolled,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  currentArch = {},
  activeModule,
  activePage,
  searchInputRef,
  searchQuery,
  setSearchQuery,
  notifRef,
  notifOpen,
  setNotifOpen,
  activeBusinessAlerts = [],
  setDismissedAlertIds,
  user,
  logout,
  navigate,
  scrollProgress = 0,
  makeSellTrade,
  applyMakeSellTrade
}) {
  return (
    <header className={`exbos-sticky-workspace-header ${workspaceScrolled ? 'is-scrolled' : ''}`}>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white cursor-pointer border border-white/20"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-white/70 hover:text-white transition-colors">EXCELLENCE BOS</span>
            <span className="text-white/30">/</span>
            <span className="text-[#218DFF] font-semibold">{currentArch.name}</span>
            <span className="text-white/30">/</span>
            <span className="text-[#9EDCFF]">{activeModule === 'Documents' ? 'Documents & Sharing' : activeModule}</span>
          </div>
          <h1 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
            {activePage}
          </h1>
        </div>

        {/* Header Tools Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Manufacturing Trade Badge (Make & Sell) */}
          {currentArch?.id === 'make-and-sell' && (
            <ActiveTradeBadge
              activeTradeId={makeSellTrade}
              onSelectTrade={applyMakeSellTrade}
            />
          )}

          {/* Global Search with Increased Size & Ctrl+S Shortcut Badge */}
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-[#218DFF] transition-colors" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records, items, workflows..."
              className="pl-10 pr-20 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:bg-white/20 focus:border-[#218DFF]/60 focus:ring-2 focus:ring-[#218DFF]/30 focus:outline-none w-56 sm:w-80 md:w-96 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 rounded-md bg-white/15 border border-white/25 text-[10px] font-mono font-bold text-[#9EDCFF] shadow-sm">
                Ctrl
              </kbd>
              <span className="text-white/40 text-[10px]">+</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-white/15 border border-white/25 text-[10px] font-mono font-bold text-[#9EDCFF] shadow-sm">
                S
              </kbd>
            </div>
          </div>

          {/* Notifications Bell (Dynamic Business & Platform Alerts) */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 rounded-xl bg-white/10 border border-white/20 text-[#9EDCFF] hover:bg-white/20 cursor-pointer relative"
              title="Business & Platform Alerts"
            >
              <Bell className="w-4 h-4" />
              {activeBusinessAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#218DFF] absolute top-1.5 right-1.5 animate-pulse" />
              )}
            </button>
            {notifOpen && (
              <div className="spring-dropdown-panel absolute right-0 mt-2 w-84 rounded-2xl bg-[#071544] border border-[#9EDCFF]/40 text-white p-4 shadow-sapphire-dark z-50 space-y-3 text-xs">
                <div className="font-orbitron font-bold text-[#9EDCFF] flex items-center justify-between border-b border-white/10 pb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>Business &amp; Platform Alerts</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {activeBusinessAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = activeBusinessAlerts.map((a) => a.id)
                          setDismissedAlertIds((prev) => {
                            const next = [...prev, ...allIds]
                            try {
                              localStorage.setItem('exbos_dismissed_alert_ids', JSON.stringify(next))
                            } catch (e) {}
                            return next
                          })
                        }}
                        className="text-[10px] text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {activeBusinessAlerts.length > 0 ? (
                  <div className="space-y-2">
                    {activeBusinessAlerts.map((alert, idx) => (
                      <div
                        key={alert.id}
                        style={{ animationDelay: `${(idx + 1) * 70}ms` }}
                        className={`spring-dropdown-item p-3 rounded-xl border flex items-start justify-between gap-2 transition-all ${alert.bg}`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <strong className="text-white text-xs">{alert.title}:</strong>
                          </div>
                          <p className="text-[11px] leading-relaxed opacity-95">
                            {alert.message}
                          </p>
                          {alert.onAction && (
                            <button
                              type="button"
                              onClick={alert.onAction}
                              className="text-[10px] font-bold text-[#9EDCFF] hover:underline cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1 mt-1"
                            >
                              <span>{alert.actionLabel}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDismissedAlertIds((prev) => {
                              const next = [...prev, alert.id]
                              try {
                                localStorage.setItem('exbos_dismissed_alert_ids', JSON.stringify(next))
                              } catch (err) {}
                              return next
                            })
                          }}
                          title="Dismiss alert"
                          className="p-1 rounded-md hover:bg-white/20 text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer shrink-0 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-white">All Reconciled &amp; Clear</p>
                    <p className="text-[11px] text-slate-400">
                      No overdue customer debts or pending alerts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sign Out / Exit to Login (Always visible) */}
          <button
            type="button"
            onClick={() => {
              if (logout) logout()
              navigate('/login')
            }}
            title={user ? `Sign Out (${user.name || user.email})` : 'Sign Out / Switch User'}
            className="p-2 rounded-xl bg-white/10 border border-white/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Glowing Scroll Progress Line */}
      <div
        className="scroll-progress-line"
        style={{ width: `${scrollProgress}%` }}
      />
    </header>
  )
}

