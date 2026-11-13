import React, { useState } from 'react'
import { Sliders, Plus } from 'lucide-react'
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
  const { activeBranch } = useExbos()

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

