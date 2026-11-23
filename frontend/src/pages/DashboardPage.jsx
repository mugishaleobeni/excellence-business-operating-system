import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useExbos } from '../context/ExbosContext'
import { useDashboardPrefs } from '../components/dashboard/DashboardCustomizer'
import { OPTIMIZED_IMAGES } from '../assets/optimized/imageManifest'
const exbosLogo = OPTIMIZED_IMAGES.exbosLogo.small
import RailNavigation from '../components/dashboard/layout/RailNavigation'
import ContextualSidebar from '../components/dashboard/layout/ContextualSidebar'
import DashboardTopNav from '../components/dashboard/layout/DashboardTopNav'
import WorkspaceContentRouter from '../components/dashboard/layout/WorkspaceContentRouter'
import MobileFloatingDock from '../components/dashboard/layout/MobileFloatingDock'
import TradeSelectionModal from '../components/dashboard/make-and-sell/modals/TradeSelectionModal'
import {
  MODULE_ICONS,
  MODULE_SHORT_LABELS
} from '../components/dashboard/data/dashboardConstants'
import { Bell, X, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { getAvailableWidgets } from '../components/dashboard/data/availableWidgets'
import { useBusinessAlerts } from '../components/dashboard/hooks/useBusinessAlerts'
import { useDashboardNavigation } from '../components/dashboard/hooks/useDashboardNavigation'
import { useLiveDashboardData } from '../components/dashboard/hooks/useLiveDashboardData'

export default function DashboardPage() {
  const {
    theme,
    toggleTheme,
    hideFinancials,
    setHideFinancials,
    user,
    updateUserProfile,
    logout,
    architectures = [],
    transactions = [],
    workspaces = {},
    demoWorkspaces = {},
    addDemoRecord,
    makeSellTrade,
    applyMakeSellTrade,
    serviceTrade,
    applyServiceTrade,
    agricultureTrade,
    applyAgricultureTrade
  } = useExbos()

  const {
    navigate,
    activeArchId,
    setActiveArchId,
    activeModule,
    setActiveModule,
    activePage,
    setActivePage,
    handleArchSwitch,
    handleModuleClick: rawHandleModuleClick,
    navigateToModulePage
  } = useDashboardNavigation({ architectures, user })

  // First-time trade onboarding modal for Make & Sell
  const [firstTimeTradeModalOpen, setFirstTimeTradeModalOpen] = useState(false)

  // Trigger trade onboarding prompt when entering Make & Sell without an established trade
  useEffect(() => {
    if (activeArchId === 'make-and-sell') {
      try {
        const chosen = localStorage.getItem('exbos_make_sell_trade_chosen')
        if (!chosen) {
          setFirstTimeTradeModalOpen(true)
        }
      } catch (e) {
        // ignore
      }
    }
  }, [activeArchId])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarCompact, setSidebarCompact] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const [dismissedAlertIds, setDismissedAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_dismissed_alert_ids')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      return []
    }
  })

  // Close notification panel on Escape key
  useEffect(() => {
    if (!notifOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setNotifOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [notifOpen])

  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef(null)
  const [workspaceScrolled, setWorkspaceScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // User-configurable active overview cards (4 default cards per request)
  const [visibleMetricCards, setVisibleMetricCards] = useState(() => {
    try {
      const saved = localStorage.getItem('exbos_visible_metric_cards')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      // ignore
    }
    return ['owed_to_me', 'i_owe', 'expenses', 'income']
  })

  const handleWorkspaceScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    setWorkspaceScrolled(scrollTop > 16)
    const maxScroll = scrollHeight - clientHeight
    const pct = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0
    setScrollProgress(Math.min(100, Math.max(0, pct)))
  }

  const { prefs: dashPrefs } = useDashboardPrefs()
  const widgetStyle = (id) => ({
    order: dashPrefs.order.indexOf(id),
    display: dashPrefs.hidden[id] ? 'none' : 'block'
  })

  // Global Keyboard Shortcut: Ctrl+S / Cmd+S / Ctrl+K / Cmd+K focuses Search
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey
      const key = e.key?.toLowerCase()
      if (isCtrlOrMeta && (key === 's' || key === 'k')) {
        e.preventDefault()
        if (searchInputRef.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentArch =
    architectures.find((a) => a.id === activeArchId) || architectures[1] || {}
  const navMap = currentArch.navigation || {}
  const moduleKeys = Object.keys(navMap)
  const subPages = navMap[activeModule] || ['Dashboard']

  const pinnedList = useMemo(
    () =>
      activeArchId === 'make-and-sell'
        ? ['Documents', 'Integrations', 'Settings']
        : ['Documents', 'Integrations'],
    [activeArchId]
  )

  const mainModules = useMemo(
    () => moduleKeys.filter((mod) => !pinnedList.includes(mod)),
    [moduleKeys, pinnedList]
  )
  const pinnedModules = useMemo(
    () => pinnedList.filter((mod) => navMap[mod] || moduleKeys.includes(mod)),
    [navMap, moduleKeys, pinnedList]
  )

  // Active Live Workspace & User Identity from Database / Context
  const activeWorkspace = workspaces?.[activeArchId] || demoWorkspaces?.[activeArchId] || {}
  const activeOwnerName =
    user?.name || activeWorkspace.ownerName || `${user?.email?.split('@')[0] || currentArch.shortName || 'ExBOS'} Owner`
  const activeBusinessName =
    user?.businessName || activeWorkspace.businessName || `${currentArch.shortName || 'ExBOS'} Enterprise`
  const activeInitials =
    activeBusinessName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'EB'

  // Filter transactions by active architecture
  const archTransactions = useMemo(() => {
    return (transactions || []).filter(
      (tx) => (tx.architectureId || 'buy-and-sell') === activeArchId
    )
  }, [transactions, activeArchId])

  const handleModuleClick = (mod) => {
    rawHandleModuleClick(mod)
    setMobileSidebarOpen(false)
  }

  const [widgetSearch, setWidgetSearch] = useState('')

  // Live aggregated financial and operational data across all navigation modules
  const liveDashboardData = useLiveDashboardData({
    activeWorkspace,
    archTransactions
  })

  const activeMetrics = activeWorkspace.metrics || {}

  // Catalog of customizable widgets
  const AVAILABLE_WIDGETS = useMemo(
    () =>
      getAvailableWidgets({
        liveDashboardData,
        hideFinancials,
        navMap,
        demoMetrics: activeMetrics,
        handleModuleClick,
        setActivePage
      }),
    [liveDashboardData, hideFinancials, navMap, activeMetrics]
  )

  const isCardVisible = (widget) => {
    return widget.aliases.some((alias) => visibleMetricCards.includes(alias))
  }

  const handleToggleWidget = (widget) => {
    const isCurrentlyVisible = isCardVisible(widget)
    if (isCurrentlyVisible) {
      const next = visibleMetricCards.filter((id) => !widget.aliases.includes(id))
      setVisibleMetricCards(next)
      try {
        localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
      } catch (e) {}
    } else {
      const next = [...visibleMetricCards, widget.id]
      setVisibleMetricCards(next)
      try {
        localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
      } catch (e) {}
    }
  }

  const handleRemoveCard = (e, widget) => {
    e.stopPropagation()
    const next = visibleMetricCards.filter((id) => !widget.aliases.includes(id))
    setVisibleMetricCards(next)
    try {
      localStorage.setItem('exbos_visible_metric_cards', JSON.stringify(next))
    } catch (e) {}
  }

  const filteredWidgets = useMemo(() => {
    if (!widgetSearch.trim()) return AVAILABLE_WIDGETS
    const q = widgetSearch.toLowerCase()
    return AVAILABLE_WIDGETS.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.navModule.toLowerCase().includes(q) ||
        w.desc.toLowerCase().includes(q) ||
        w.badge.toLowerCase().includes(q)
    )
  }, [AVAILABLE_WIDGETS, widgetSearch])

  // Dynamic business & platform alerts
  const activeBusinessAlerts = useBusinessAlerts({
    activeDemoWorkspace: activeWorkspace,
    activeWorkspace,
    archTransactions,
    activeArchId,
    hideFinancials,
    dismissedAlertIds,
    navMap,
    handleModuleClick,
    setActivePage,
    setNotifOpen
  })

  return (
    <div className="exbos-dashboard-bg">
      {/* THREE-PANEL SHELL (Section 6.3) */}
      <div
        className={`w-full dashboard-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${sidebarCompact && !sidebarCollapsed ? 'is-sidebar-compact' : ''}`}
      >
        {/* PANEL A: PRIMARY NAVIGATION RAIL */}
        <RailNavigation
          exbosLogo={exbosLogo}
          mainModules={mainModules}
          pinnedModules={pinnedModules}
          MODULE_ICONS={MODULE_ICONS}
          MODULE_SHORT_LABELS={MODULE_SHORT_LABELS}
          activeModule={activeModule}
          handleModuleClick={handleModuleClick}
          toggleTheme={toggleTheme}
          theme={theme}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onLogout={() => {
            if (logout) logout()
            navigate('/login')
          }}
        />

        {/* PANEL B: SECONDARY NAVIGATION SIDEBAR */}
        <ContextualSidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          sidebarCompact={sidebarCompact}
          setSidebarCompact={setSidebarCompact}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
          activeOwnerName={activeOwnerName}
          activeBusinessName={activeBusinessName}
          activeInitials={activeInitials}
          subPages={subPages}
          activePage={activePage}
          setActivePage={setActivePage}
          activeModule={activeModule}
          currentArch={currentArch}
          architectures={architectures}
          mainModules={mainModules}
          pinnedModules={pinnedModules}
          MODULE_ICONS={MODULE_ICONS}
          MODULE_SHORT_LABELS={MODULE_SHORT_LABELS}
          handleModuleClick={handleModuleClick}
          theme={theme}
          toggleTheme={toggleTheme}
          onLogout={() => {
            if (logout) logout()
            navigate('/login')
          }}
          onSwitchArch={(newArchId) => {
            handleArchSwitch(newArchId)
            if (updateUserProfile) {
              updateUserProfile({ architectureId: newArchId })
            }
          }}
        />

        {/* PANEL C: MAIN CONTENT WORKSPACE */}
        <main className="exbos-glass-workspace min-w-0">
          {/* Top Sticky Header Bar with Scroll Blur & Indicator */}
          <DashboardTopNav
            workspaceScrolled={workspaceScrolled}
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
            currentArch={currentArch}
            activeModule={activeModule}
            activePage={activePage}
            setActivePage={setActivePage}
            subPages={subPages}
            searchInputRef={searchInputRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            notifRef={notifRef}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            activeBusinessAlerts={activeBusinessAlerts}
            setDismissedAlertIds={setDismissedAlertIds}
            user={user}
            logout={logout}
            navigate={navigate}
            scrollProgress={scrollProgress}
            makeSellTrade={makeSellTrade}
            applyMakeSellTrade={applyMakeSellTrade}
            serviceTrade={serviceTrade}
            applyServiceTrade={applyServiceTrade}
            agricultureTrade={agricultureTrade}
            applyAgricultureTrade={applyAgricultureTrade}
            navigateToModulePage={navigateToModulePage}
            handleModuleClick={handleModuleClick}
          />

          {/* SCROLLABLE INNER WORKSPACE BODY */}
          <div
            className="exbos-workspace-scrollable-body space-y-6 pb-28 lg:pb-8"
            onScroll={handleWorkspaceScroll}
          >
            {/* DYNAMIC CONTENT ROUTING INSIDE MAIN WORKSPACE */}
            <WorkspaceContentRouter
              searchQuery={searchQuery}
              activeArchId={activeArchId}
              currentArch={currentArch}
              activeModule={activeModule}
              activePage={activePage}
              handleArchSwitch={handleArchSwitch}
              handleModuleClick={handleModuleClick}
              navigateToModulePage={navigateToModulePage}
              setActiveModule={setActiveModule}
              setActivePage={setActivePage}
              availableWidgets={AVAILABLE_WIDGETS}
              isCardVisible={isCardVisible}
              handleRemoveCard={handleRemoveCard}
              widgetStyle={widgetStyle}
              filteredWidgets={filteredWidgets}
              handleToggleWidget={handleToggleWidget}
              setVisibleMetricCards={setVisibleMetricCards}
              archTransactions={archTransactions}
              hideFinancials={hideFinancials}
              setHideFinancials={setHideFinancials}
              user={user}
              liveDashboardData={liveDashboardData}
              notifOpen={notifOpen}
              setNotifOpen={setNotifOpen}
              activeBusinessAlerts={activeBusinessAlerts}
              onLogout={() => {
                if (logout) logout()
                navigate('/login')
              }}
              addDemoRecord={addDemoRecord}
              widgetSearch={widgetSearch}
              setWidgetSearch={setWidgetSearch}
            />
          </div>
        </main>
      </div>

      {/* First-Time Trade Selection Prompt for Make & Sell */}
      <TradeSelectionModal
        isOpen={firstTimeTradeModalOpen && activeArchId === 'make-and-sell'}
        onClose={() => {
          try {
            localStorage.setItem('exbos_make_sell_trade_chosen', '1')
          } catch {}
          setFirstTimeTradeModalOpen(false)
        }}
        currentTradeId={makeSellTrade}
        onSelectTrade={(newTradeId) => {
          applyMakeSellTrade(newTradeId)
          try {
            localStorage.setItem('exbos_make_sell_trade_chosen', '1')
          } catch {}
          setFirstTimeTradeModalOpen(false)
        }}
        isFirstTimePrompt={true}
      />

      {/* Unified Responsive Notifications Drawer / Popover (Works on Mobile Overview, Mobile Modules & Desktop) */}
      {notifOpen && (
        <div className="fixed inset-0 z-[200]" onClick={() => setNotifOpen(false)}>
          <div className="absolute inset-0 bg-black/40 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="spring-dropdown-panel fixed top-14 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 max-h-[78dvh] flex flex-col rounded-2xl bg-[#071544]/98 border border-[#9EDCFF]/45 text-white p-4 shadow-2xl backdrop-blur-2xl z-[201] space-y-3 text-xs"
          >
            <div className="font-orbitron font-bold text-[#9EDCFF] flex items-center justify-between border-b border-white/15 pb-2.5 shrink-0">
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#218DFF]" />
                <span>Business Alerts</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#218DFF]/25 text-white border border-[#218DFF]/40">
                  {activeBusinessAlerts.length}
                </span>
              </span>
              <div className="flex items-center gap-2.5">
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
                    className="text-[11px] font-semibold text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer p-0"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border-0 cursor-pointer transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto space-y-2.5 pr-0.5">
              {activeBusinessAlerts.length > 0 ? (
                activeBusinessAlerts.map((alert, idx) => (
                  <div
                    key={alert.id}
                    style={{ animationDelay: `${(idx + 1) * 50}ms` }}
                    className={`spring-dropdown-item p-3 rounded-xl border flex items-start justify-between gap-2.5 transition-all ${alert.bg}`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <strong className="text-white text-xs block">{alert.title}</strong>
                      <p className="text-[11px] text-slate-200 leading-relaxed">{alert.message}</p>
                      {alert.onAction && (
                        <button
                          type="button"
                          onClick={() => {
                            alert.onAction()
                            setNotifOpen(false)
                          }}
                          className="text-[11px] font-bold text-[#9EDCFF] hover:underline cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1 mt-1.5"
                        >
                          <span>{alert.actionLabel || 'Open'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
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
                      className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer shrink-0 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-xs font-bold text-white">All Reconciled &amp; Clear</p>
                  <p className="text-[11px] text-slate-300">
                    No overdue customer debts, low-stock warnings, or pending alerts right now.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Dock Navigation (Matching Video Style) */}
      <MobileFloatingDock
        user={user}
        currentArch={currentArch}
        activeModule={activeModule}
        activePage={activePage}
        navigateToModulePage={navigateToModulePage}
        handleModuleClick={handleModuleClick}
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        notifOpen={notifOpen}
        setNotifOpen={setNotifOpen}
        activeBusinessAlerts={activeBusinessAlerts}
        onLogout={() => {
          if (logout) logout()
          navigate('/login')
        }}
      />
    </div>
  )
}
