import React, { useState, useMemo } from 'react'
import { Sliders, Plus, Rocket, Package, ShoppingBag, Users, X, ArrowRight } from 'lucide-react'
import { DASHBOARD_QUICK_ACTIONS } from '../data/dashboardConstants'
import IndustryStatusBanner from './IndustryStatusBanner'
import OverviewMetricsGrid from './OverviewMetricsGrid'
import CashFlowCurveChart from './CashFlowCurveChart'
import BranchPerformanceCenterPanel from './BranchPerformanceCenterPanel'
import RecentActivityTable from './RecentActivityTable'
import { useExbos } from '../../../context/ExbosContext'
import WidgetCustomizerModal from '../layout/WidgetCustomizerModal'
import LiveWorkflowModal from '../modals/LiveWorkflowModal'
import MobileFintechDashboardHeader from '../layout/MobileFintechDashboardHeader'

export default function OverviewDashboardView({
  currentArch = {},
  activeArchId = 'buy-and-sell',
  handleModuleClick = () => {},
  navigateToModulePage = null,
  setActivePage = () => {},
  availableWidgets = [],
  isCardVisible = () => true,
  handleRemoveCard = () => {},
  widgetStyle = () => ({}),
  filteredWidgets = [],
  handleToggleWidget = () => {},
  setVisibleMetricCards = () => {},
  archTransactions = [],
  hideFinancials = false,
  setHideFinancials = () => {},
  user = null,
  liveDashboardData = {},
  notifOpen = false,
  setNotifOpen = () => {},
  activeBusinessAlerts = [],
  onLogout = () => {},
  addDemoRecord = () => {},
  widgetSearch = '',
  setWidgetSearch = () => {}
}) {
  const [addCardModalOpen, setAddCardModalOpen] = useState(false)
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [quickStartDismissed, setQuickStartDismissed] = useState(false)
  const { activeBranch, demoWorkspaces } = useExbos()

  const showQuickStart = useMemo(() => {
    if (quickStartDismissed) return false
    const ws = demoWorkspaces?.[activeArchId] || {}
    const recs = ws.records || {}
    const hasSales =
      (Array.isArray(recs.Sales) && recs.Sales.length > 0) ||
      (Array.isArray(archTransactions) && archTransactions.length > 0) ||
      Number(ws.todaySalesRWF || 0) > 0
    const hasCatalog =
      (Array.isArray(recs.Products) && recs.Products.length > 0) ||
      (Array.isArray(recs.FinishedGoods) && recs.FinishedGoods.length > 0) ||
      (Array.isArray(recs.MenuItems) && recs.MenuItems.length > 0) ||
      (Array.isArray(recs.Services) && recs.Services.length > 0) ||
      (Array.isArray(recs.Crops) && recs.Crops.length > 0) ||
      (Array.isArray(recs.Livestock) && recs.Livestock.length > 0)
    return !hasSales && !hasCatalog
  }, [quickStartDismissed, demoWorkspaces, activeArchId, archTransactions])

  const quickActions =
    DASHBOARD_QUICK_ACTIONS[activeArchId] ||
    DASHBOARD_QUICK_ACTIONS['buy-and-sell']

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Mobile Fintech Dashboard Header & Quick Links (Matching Image 1 & 2) */}
      <MobileFintechDashboardHeader
        user={user}
        currentArch={currentArch}
        liveDashboardData={liveDashboardData}
        hideFinancials={hideFinancials}
        setHideFinancials={setHideFinancials}
        navigateToModulePage={navigateToModulePage}
        handleModuleClick={handleModuleClick}
        notifOpen={notifOpen}
        setNotifOpen={setNotifOpen}
        activeBusinessAlerts={activeBusinessAlerts}
        onOpenCustomize={() => setAddCardModalOpen(true)}
        onLogout={onLogout}
      />

      {/* Desktop Reference Header: Dashboard / All Your Workflows And Performance */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeBranch && !activeBranch.isMain ? `${activeBranch.name} · Overview` : 'Dashboard Overview'}
          </h2>
          <p className="text-xs sm:text-sm text-[#9EDCFF]/80 mt-1">
            Real-time financial status &amp; operational workflows · {currentArch?.name || 'Enterprise'}
            {activeBranch?.name ? ` · ${activeBranch.name}` : ''}
          </p>
        </div>

        {/* Header Controls: Customize Widgets + Architecture Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddCardModalOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white cursor-pointer flex items-center gap-2 transition-all shadow-sm"
            title="Add or remove dashboard widgets"
          >
            <Sliders className="w-3.5 h-3.5 text-[#218DFF]" />
            <span>Customize Widgets</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] text-white">
              {availableWidgets.filter(isCardVisible).length}
            </span>
          </button>

          {quickActions.map((act, i) => (
            <button
              key={act.label}
              type="button"
              onClick={() => {
                if (navigateToModulePage) {
                  navigateToModulePage(act.module, act.page, { action: 'create' })
                } else {
                  handleModuleClick(act.module)
                  setActivePage(act.page)
                }
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-2 transition-all shadow-md ${
                i === 0
                  ? 'exbos-glass-pill-active border border-white/30 text-white hover:bg-white/30'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20 text-[#9EDCFF] hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>{act.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* First-Time 3-Step Quick Start Card (only shown when workspace has 0 sales & 0 products/services) */}
      {showQuickStart && (
        <div className="exbos-glass-card p-5 rounded-2xl border border-[#218DFF]/40 bg-gradient-to-r from-[#0A2786]/70 via-[#071544]/80 to-[#0A2786]/50 relative">
          <button
            type="button"
            onClick={() => setQuickStartDismissed(true)}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss Quick Start"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs font-orbitron font-bold uppercase tracking-wider text-[#9EDCFF] mb-1">
            <Rocket className="w-4 h-4 text-[#218DFF]" />
            <span>Quick Start · Launch Your Workspace in 3 Steps</span>
          </div>
          <p className="text-xs text-slate-300 mb-4 pr-8">
            Your workspace starts clean at 0 RWF. Complete these three steps to see live profit, stock, and cash-flow analytics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                const target = quickActions[1] || quickActions[0]
                if (navigateToModulePage && target) {
                  navigateToModulePage(target.module, target.page, { action: 'create' })
                } else {
                  handleModuleClick('Inventory')
                }
              }}
              className="text-left p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#9EDCFF]">
                  <Package className="w-3.5 h-3.5" /> Step 1
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
              </div>
              <div className="text-xs font-bold text-white">Add Your First Product / Item</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Set cost, selling price, and opening stock.</div>
            </button>

            <button
              type="button"
              onClick={() => {
                const target = quickActions[0]
                if (navigateToModulePage && target) {
                  navigateToModulePage(target.module, target.page, { action: 'create' })
                } else {
                  handleModuleClick('Sales')
                }
              }}
              className="text-left p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                  <ShoppingBag className="w-3.5 h-3.5" /> Step 2
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
              </div>
              <div className="text-xs font-bold text-white">Record Your First Sale</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Stock deducts and cash-flow updates live.</div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigateToModulePage) {
                  navigateToModulePage('Settings', 'Team & Permissions')
                } else {
                  handleModuleClick('Settings')
                  setActivePage('Team & Permissions')
                }
              }}
              className="text-left p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/50 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                  <Users className="w-3.5 h-3.5" /> Step 3
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
              </div>
              <div className="text-xs font-bold text-white">Invite Staff or Connect WhatsApp</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Give cashiers &amp; managers their own logins.</div>
            </button>
          </div>
        </div>
      )}

      {/* Agriculture & Livestock Real-Time Status Bar */}
      <IndustryStatusBanner
        activeArchId={activeArchId}
        handleModuleClick={handleModuleClick}
        setActivePage={setActivePage}
      />

      {/* Dynamic Neo-Glass Metric Cards Grid */}
      <OverviewMetricsGrid
        availableWidgets={availableWidgets}
        isCardVisible={isCardVisible}
        widgetStyle={widgetStyle}
        handleRemoveCard={handleRemoveCard}
      />

      {/* Main HQ Center: GitHub Contribution Heatmap & Best Performing Branch Graph */}
      <BranchPerformanceCenterPanel
        activeArchId={activeArchId}
        hideFinancials={hideFinancials}
      />

      {/* Manage / Customize Widgets Modal Dialog */}
      <WidgetCustomizerModal
        isOpen={addCardModalOpen}
        onClose={() => setAddCardModalOpen(false)}
        widgetSearch={widgetSearch}
        setWidgetSearch={setWidgetSearch}
        filteredWidgets={filteredWidgets}
        isCardVisible={isCardVisible}
        handleToggleWidget={handleToggleWidget}
        setVisibleMetricCards={setVisibleMetricCards}
      />

      {/* Live Workflow & Data Entry Modal */}
      <LiveWorkflowModal
        isOpen={workflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        activeArchId={activeArchId}
        addDemoRecord={addDemoRecord}
      />

      {/* Cash Performance Curve Chart */}
      <CashFlowCurveChart
        activeArchId={activeArchId}
        currentArch={currentArch}
        archTransactions={archTransactions}
        hideFinancials={hideFinancials}
        onOpenWorkflowModal={() => setWorkflowModalOpen(true)}
      />

      {/* Executions / Recent Activity Feed */}
      <RecentActivityTable
        archTransactions={archTransactions}
        hideFinancials={hideFinancials}
        onOpenWorkflowModal={() => setWorkflowModalOpen(true)}
      />
    </div>
  )
}

