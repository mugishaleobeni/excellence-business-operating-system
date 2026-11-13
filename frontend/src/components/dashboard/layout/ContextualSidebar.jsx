import React, { useMemo } from 'react'
import {
  PanelLeftOpen,
  X,
  LayoutDashboard,
  Sun,
  Moon,
  LogOut,
  GitBranch
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'

export default function ContextualSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarCompact,
  setSidebarCompact,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  activeOwnerName,
  activeBusinessName,
  activeInitials,
  subPages = [],
  activePage,
  setActivePage,
  activeModule,
  currentArch = {},
  architectures = [],
  onSwitchArch = null,
  mainModules = [],
  pinnedModules = [],
  MODULE_ICONS = {},
  MODULE_SHORT_LABELS = {},
  handleModuleClick = () => {},
  theme,
  toggleTheme,
  onLogout
}) {
  const { branches = [], activeBranchId = 'main', switchBranch } = useExbos()
  const allModules = useMemo(() => {
    const combined = [...(mainModules || []), ...(pinnedModules || [])]
    if (combined.length > 0) return combined
    return [
      'Overview',
      'Products',
      'Sales',
      'Purchases',
      'Customers',
      'Suppliers',
      'Expenses',
      'Reports',
      'Documents',
      'Integrations',
      'Settings'
    ]
  }, [mainModules, pinnedModules])

  if (sidebarCollapsed) return null

  return (
    <>
      {/* Mobile Backdrop Overlay: Tapping outside closes the drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Secondary Module Sidebar"
        className={`dashboard-sidebar exbos-glass-sidebar ${
          sidebarCompact ? 'dashboard-sidebar-compact' : ''
        } ${
          mobileSidebarOpen
            ? 'flex fixed inset-y-0 left-0 z-50 w-72 sm:w-80 shadow-2xl rounded-r-3xl rounded-l-none pb-28'
            : 'hidden lg:flex'
        } flex-col justify-between p-4 sm:p-5 overflow-y-auto transition-all`}
      >
        {/* COMPACT ICON MODE (When minimized/compacted like icon bar on desktop) */}
        {sidebarCompact ? (
          <div className="sidebar-compact-content flex flex-col items-center justify-between h-full w-full py-1">
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Top Window Dot to Expand Back */}
              <div className="flex items-center justify-center gap-1.5 pb-2 border-b border-white/10 w-full">
                <button
                  type="button"
                  onClick={() => setSidebarCollapsed(true)}
                  title="Fully Close Sidebar"
                  aria-label="Close Sidebar"
                  className="exbos-mac-dot bg-rose-500/90 hover:bg-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setSidebarCompact(false)}
                  title="Maximize / Restore Sidebar"
                  aria-label="Maximize Sidebar"
                  className="exbos-mac-dot bg-emerald-500/90 hover:bg-emerald-400"
                />
              </div>

              {/* Profile Avatar Badge */}
              <div
                title={`${activeOwnerName} · ${activeBusinessName}`}
                className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1045CA] to-[#071544] border border-white/30 text-white font-orbitron font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm"
              >
                {activeInitials}
              </div>

              {/* Numbered Subpage Icon Pills */}
              <div className="flex flex-col items-center gap-2 w-full pt-2">
                {subPages.map((p, idx) => {
                  const isCurrent = activePage === p
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePage(p)}
                      title={p}
                      aria-label={p}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
                        isCurrent
                          ? 'exbos-glass-pill-active border-white/40 text-white'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                      }`}
                    >
                      0{idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom Restore / Expand Button */}
            <div className="pt-3 border-t border-white/10 w-full flex justify-center">
              <button
                type="button"
                onClick={() => setSidebarCompact(false)}
                title="Maximize / Expand Sidebar"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] flex items-center justify-center cursor-pointer border border-white/15"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* FULLY EXPANDED SIDEBAR CONTENT */
          <div className="sidebar-expanded-content space-y-5">
            {/* Window Dots & Top Business Profile Header */}
            <div className="pb-3 border-b border-white/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="exbos-mac-dots">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed(true)}
                    title="Close Sidebar Fully"
                    aria-label="Close Sidebar"
                    className="exbos-mac-dot bg-rose-500/90 hover:bg-rose-400"
                  />
                  <button
                    type="button"
                    onClick={() => setSidebarCompact(true)}
                    title="Minimize to Compact Icons"
                    aria-label="Minimize to Icons"
                    className="exbos-mac-dot bg-amber-500/90 hover:bg-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarCollapsed(false)
                      setSidebarCompact(false)
                    }}
                    title="Maximize"
                    aria-label="Maximize Sidebar"
                    className="exbos-mac-dot bg-emerald-500/90 hover:bg-emerald-400"
                  />
                </div>
                {mobileSidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label="Close navigation drawer"
                    className="lg:hidden p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer border border-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1045CA] to-[#071544] border border-white/30 text-white font-orbitron font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {activeInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <strong className="block font-orbitron text-xs font-bold text-white truncate">
                    {activeOwnerName}
                  </strong>
                  <span className="block text-[11px] text-[#9EDCFF]/80 truncate">
                    {activeBusinessName}
                  </span>
                </div>
              </div>

              {/* Active Business Architecture Badge */}
              <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="block text-[9px] font-orbitron uppercase tracking-wider text-[#9EDCFF]/75">
                    Business Architecture
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[9px] font-bold text-[#9EDCFF] uppercase">
                    Active
                  </span>
                </div>
                <strong className="block text-xs font-bold text-white truncate">
                  {currentArch.number} · {currentArch.name}
                </strong>
              </div>

              {/* Branch Navigation Switcher (Main HQ + Branches created in Settings) */}
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/15 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-orbitron uppercase tracking-wider text-[#9EDCFF]/75 flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-[#218DFF]" />
                    <span>Branch</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-300">
                    {Math.max(1, branches.length)}
                  </span>
                </div>
                {branches.length > 0 ? (
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                    {branches.map((b) => {
                      const isSel = b.id === activeBranchId
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => switchBranch && switchBranch(b.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between gap-1.5 cursor-pointer transition-all ${
                            isSel
                              ? 'bg-[#218DFF]/25 border border-[#9EDCFF]/50 text-white'
                              : 'bg-transparent border border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {b.isMain && (
                            <span className="text-[8px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
                              HQ
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-[11px] font-semibold text-white truncate">
                    {activeBusinessName} (Main HQ)
                  </div>
                )}
              </div>
            </div>

            {/* ALL BUSINESS NAVIGATION MODULES (MOBILE-ONLY: For mobile users opening drawer via "More") */}
            <div className="space-y-1 lg:hidden">
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-[#9EDCFF]/75 px-2 pb-1 font-bold flex items-center justify-between">
                <span>Business Modules</span>
                <span className="text-[9px] text-slate-400 font-sans normal-case font-normal">
                  {allModules.length} Modules
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {allModules.map((mod) => {
                  const Icon = MODULE_ICONS[mod] || LayoutDashboard
                  const isCurrentMod = activeModule === mod
                  const displayName =
                    mod === 'Documents'
                      ? 'Document Sharing'
                      : mod === 'Purchases'
                      ? 'Purchases'
                      : mod === 'Customers'
                      ? 'Customers'
                      : mod === 'Suppliers'
                      ? 'Suppliers'
                      : mod === 'Expenses'
                      ? 'Expenses'
                      : mod === 'Reports'
                      ? 'Reports'
                      : mod === 'Settings'
                      ? 'Settings'
                      : mod === 'Integrations'
                      ? 'Integrations'
                      : mod
                  return (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => {
                        if (handleModuleClick) {
                          handleModuleClick(mod)
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer border ${
                        isCurrentMod
                          ? 'exbos-glass-pill-active border-white/30 text-white font-bold shadow-sm'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isCurrentMod ? 'text-[#9EDCFF]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{displayName}</span>
                      </div>
                      {isCurrentMod && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#218DFF] shadow-[0_0_8px_#218DFF] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* SUBPAGES NAVIGATION GROUP */}
            <div className="space-y-1 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
              <div className="text-[10px] font-orbitron uppercase tracking-widest text-[#9EDCFF]/75 px-2 pb-1.5 font-bold">
                {activeModule === 'Documents' ? 'Documents & Sharing' : activeModule} Modules
              </div>
              {subPages.map((p, idx) => {
                const isCurrent = activePage === p
                const itemNumber = String(idx + 1).padStart(2, '0')
                const isAlert =
                  p.includes('Alert') ||
                  p.includes('Low Stock') ||
                  p.includes('Unpaid') ||
                  p.includes('Outstanding') ||
                  p.includes('Amounts Owed') ||
                  p.includes('Waste') ||
                  p.includes('Survival') ||
                  p.includes('Dead Stock') ||
                  p.includes('Upcoming')
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setActivePage(p)
                      setMobileSidebarOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 active:scale-[0.99] cursor-pointer border ${
                      isCurrent
                        ? 'exbos-glass-pill-active border-white/30 text-white font-semibold'
                        : 'bg-transparent border-transparent text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate flex items-center gap-2">
                      <span className="truncate">{p}</span>
                      {isAlert && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      )}
                    </span>
                    <span
                      className={`text-[10px] font-mono tabular-nums font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isCurrent
                          ? 'bg-white/25 text-white'
                          : isAlert
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-white/10 text-[#9EDCFF]'
                      }`}
                    >
                      {itemNumber}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Bottom Sidebar Footer with Mobile Theme Switch & Logout */}
            <div className="pt-3 border-t border-white/15 space-y-3">
              <div className="flex items-center justify-between lg:hidden">
                {toggleTheme && (
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-xs text-[#9EDCFF] flex items-center gap-1.5 border border-white/10 cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}
                    <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                  </button>
                )}
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-xs text-rose-300 flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
              <div className="text-[10px] text-center text-slate-400 font-bold">
                <span className="font-pylarix text-[#9EDCFF]">EXCELLENCE BOS</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
