import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FileText, Sun, Moon, PanelLeftOpen, PanelLeftClose, LogOut } from 'lucide-react'

export default function RailNavigation({
  exbosLogo,
  mainModules = [],
  pinnedModules = [],
  MODULE_ICONS = {},
  MODULE_SHORT_LABELS = {},
  activeModule,
  handleModuleClick,
  toggleTheme,
  theme,
  sidebarCollapsed,
  setSidebarCollapsed,
  onLogout
}) {
  return (
    <nav
      aria-label="Primary Navigation Rail"
      className="dashboard-rail exbos-glass-rail px-2.5 py-3 lg:py-4 flex lg:flex-col items-center justify-between lg:justify-start gap-2 overflow-x-auto z-30"
    >
      <Link
        to="/"
        title="EXCELLENCE BOS Home"
        className="w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20 shrink-0 no-underline mb-0 lg:mb-3 p-2 transition-all"
      >
        <img src={exbosLogo} alt="EXCELLENCE BOS" className="w-full h-full object-contain" />
      </Link>

      <div className="flex lg:flex-col items-center gap-1.5">
        {mainModules.map((mod) => {
          const Icon = MODULE_ICONS[mod] || LayoutDashboard
          const isActive = activeModule === mod
          const label = MODULE_SHORT_LABELS[mod] || mod.slice(0, 5)
          return (
            <button
              key={mod}
              type="button"
              onClick={() => handleModuleClick(mod)}
              title={mod === 'Documents' ? 'Documents & Sharing' : `${mod} Module`}
              aria-label={mod}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border shrink-0 ${
                isActive
                  ? 'exbos-glass-pill-active border-white/40'
                  : 'bg-transparent border-transparent text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-tight">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="hidden lg:block flex-1" />

      {/* Pinned Bottom Modules: Documents & Integrations */}
      <div className="flex lg:flex-col items-center gap-1.5 pb-2 border-b lg:border-b-0 lg:border-t border-white/15 lg:pt-2 shrink-0">
        {pinnedModules.map((mod) => {
          const Icon = MODULE_ICONS[mod] || FileText
          const isActive = activeModule === mod
          const label = MODULE_SHORT_LABELS[mod] || mod.slice(0, 5)
          return (
            <button
              key={mod}
              type="button"
              onClick={() => handleModuleClick(mod)}
              title={mod === 'Documents' ? 'Documents & Sharing' : `${mod} Module`}
              aria-label={mod}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border shrink-0 ${
                isActive
                  ? 'exbos-glass-pill-active border-white/40'
                  : 'bg-transparent border-transparent text-slate-300 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold tracking-tight">{label}</span>
            </button>
          )
        })}
      </div>

      <div className="flex lg:flex-col items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          title="Switch Light / Dark Mode"
          className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] flex items-center justify-center cursor-pointer border border-[#9EDCFF]/20"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand Secondary Sidebar' : 'Collapse Secondary Sidebar'}
          className="hidden lg:flex w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] items-center justify-center cursor-pointer border border-[#9EDCFF]/20"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out / Exit"
            className="w-11 h-11 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white flex items-center justify-center cursor-pointer border border-rose-500/30 transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  )
}

