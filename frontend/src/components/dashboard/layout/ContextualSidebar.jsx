import React from 'react'
import { PanelLeftOpen, X } from 'lucide-react'

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
  currentArch = {}
}) {
  if (sidebarCollapsed) return null

  return (
    <aside
      aria-label="Secondary Module Sidebar"
      className={`dashboard-sidebar exbos-glass-sidebar ${
        sidebarCompact ? 'dashboard-sidebar-compact' : ''
      } ${
        mobileSidebarOpen ? 'block fixed inset-y-4 left-4 z-40 w-72' : 'hidden lg:flex'
      } flex-col justify-between p-5 overflow-y-auto transition-all`}
    >
      {/* COMPACT ICON MODE (When minimized/compacted like icon bar) */}
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
        <div className="sidebar-expanded-content space-y-6">
          {/* Window Dots & Top Business Profile Header */}
          <div className="pb-4 border-b border-white/15 space-y-4">
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
                  className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1045CA] to-[#071544] border border-white/30 text-white font-orbitron font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                {activeInitials}
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block font-orbitron text-xs sm:text-sm text-white truncate">
                  {activeOwnerName}
                </strong>
                <span className="block text-[11px] text-[#9EDCFF]/80 truncate">
                  {activeBusinessName}
                </span>
              </div>
            </div>

            {/* Active Business Architecture Badge */}
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 flex items-center justify-between">
              <div>
                <span className="block text-[9px] font-orbitron uppercase tracking-wider text-[#9EDCFF]/75">
                  Business Architecture
                </span>
                <strong className="block text-xs font-bold text-white">
                  {currentArch.number} · {currentArch.name}
                </strong>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[9px] font-bold text-[#9EDCFF] uppercase">
                Active
              </span>
            </div>
          </div>

          {/* Navigation Group (Categorized with Frosted Pill Active State) */}
          <div className="space-y-1">
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-between transition-all duration-150 active:scale-[0.99] cursor-pointer border ${
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

          {/* Bottom Sidebar Footer */}
          <div className="pt-4 border-t border-white/15">
            <div className="text-[10px] text-center text-slate-400 font-bold">
              <span className="font-pylarix text-[#9EDCFF]">EXCELLENCE BOS</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

