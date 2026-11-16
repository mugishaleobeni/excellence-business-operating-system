import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, FileText, Sun, Moon, PanelLeftOpen, PanelLeftClose, LogOut } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { translateToKinyarwanda } from '../../../utils/kinyarwandaDict'

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
  const { language } = useExbos()
  const t = (str) => (language === 'rw' ? translateToKinyarwanda(str) : str)

  return (
    <nav
      aria-label="Primary Navigation Rail"
      className="hidden lg:flex dashboard-rail exbos-glass-rail flex-col items-center justify-start overflow-hidden z-30"
    >
      <div className="dashboard-rail-scroll w-full h-full px-2 py-3 lg:py-4 flex flex-col items-center justify-start gap-2 overflow-y-auto overflow-x-hidden">
        <Link
          to="/"
          title="EXCELLENCE BOS Home"
          className="rail-brand-link w-12 h-12 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center border border-white/20 shrink-0 no-underline mb-0 lg:mb-3 p-2 transition-all"
        >
          <img src={exbosLogo} alt="EXCELLENCE BOS" className="w-8 h-8 object-contain shrink-0" />
          <span className="rail-full-label font-orbitron text-xs font-extrabold text-white tracking-wider whitespace-nowrap truncate">
            EXCELLENCE BOS
          </span>
        </Link>

        <div className="rail-nav-group flex lg:flex-col items-center gap-1.5 shrink-0 w-full">
          {mainModules.map((mod) => {
            const Icon = MODULE_ICONS[mod] || LayoutDashboard
            const isActive = activeModule === mod
            const shortLabel = MODULE_SHORT_LABELS[mod] || mod.slice(0, 5)
            return (
              <button
                key={mod}
                type="button"
                onClick={() => handleModuleClick(mod)}
                title={mod === 'Documents' ? t('Documents & Sharing') : t(mod)}
                aria-label={t(mod)}
                className={`rail-nav-btn w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer border shrink-0 ${
                  isActive
                    ? 'exbos-glass-pill-active border-white/40 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="rail-short-label text-[9px] font-semibold tracking-tight">{t(shortLabel)}</span>
                <span className="rail-full-label text-xs font-bold tracking-wide whitespace-nowrap truncate">
                  {t(mod)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="hidden lg:block flex-1" />

        {/* Pinned Bottom Modules: Documents & Integrations */}
        <div className="rail-nav-group flex lg:flex-col items-center gap-1.5 pb-2 border-b lg:border-b-0 lg:border-t border-white/15 lg:pt-2 shrink-0 w-full">
          {pinnedModules.map((mod) => {
            const Icon = MODULE_ICONS[mod] || FileText
            const isActive = activeModule === mod
            const shortLabel = MODULE_SHORT_LABELS[mod] || mod.slice(0, 5)
            return (
              <button
                key={mod}
                type="button"
                onClick={() => handleModuleClick(mod)}
                title={mod === 'Documents' ? t('Documents & Sharing') : t(mod)}
                aria-label={t(mod)}
                className={`rail-nav-btn w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-150 active:scale-95 cursor-pointer border shrink-0 ${
                  isActive
                    ? 'exbos-glass-pill-active border-white/40 shadow-sm'
                    : 'bg-transparent border-transparent text-slate-300 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="rail-short-label text-[9px] font-semibold tracking-tight">{t(shortLabel)}</span>
                <span className="rail-full-label text-xs font-bold tracking-wide whitespace-nowrap truncate">
                  {t(mod)}
                </span>
              </button>
            )
          })}
        </div>

        <div className="rail-nav-group flex lg:flex-col items-center gap-1.5 shrink-0 w-full">
          <button
            type="button"
            onClick={toggleTheme}
            title="Switch Light / Dark Mode"
            className="rail-nav-btn w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-150 text-[#9EDCFF] flex items-center justify-center cursor-pointer border border-[#9EDCFF]/20"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            <span className="rail-full-label text-xs font-semibold whitespace-nowrap truncate">
              {theme === 'dark' ? t('Light Mode') : t('Dark Mode')}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand Secondary Sidebar' : 'Collapse Secondary Sidebar'}
            className="rail-nav-btn hidden lg:flex w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-150 text-[#9EDCFF] items-center justify-center cursor-pointer border border-[#9EDCFF]/20"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <PanelLeftClose className="w-4 h-4 shrink-0" />
            )}
            <span className="rail-full-label text-xs font-semibold whitespace-nowrap truncate">
              {sidebarCollapsed ? t('Expand') : t('Collapse')}
            </span>
          </button>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title={t('Sign Out')}
              className="rail-nav-btn w-11 h-11 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white flex items-center justify-center cursor-pointer border border-rose-500/30 transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="rail-full-label text-xs font-semibold whitespace-nowrap truncate">
                {t('Sign Out')}
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

