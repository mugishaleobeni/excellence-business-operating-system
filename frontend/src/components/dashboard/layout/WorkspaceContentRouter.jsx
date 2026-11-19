import React, { lazy, Suspense } from 'react'
import OverviewDashboardView from '../overview/OverviewDashboardView'

const WhereIsMyMoneyPanel = lazy(() => import('../WhereIsMyMoneyPanel'))
const FarmingEnhancementsPanel = lazy(() => import('../FarmingEnhancementsPanel'))
const DocumentsAndIntegrationsPanel = lazy(() => import('../DocumentsAndIntegrationsPanel'))
const DocumentsAndSharingPanel = lazy(() => import('../documents/DocumentsAndSharingPanel'))
const UniversalReportPanel = lazy(() => import('../UniversalReportPanel'))
const InteractiveModulePanel = lazy(() => import('../InteractiveModulePanel'))

function PanelFallback() {
  return (
    <div className="exbos-glass-card p-10 rounded-2xl flex items-center justify-center gap-3 text-xs text-[#9EDCFF]">
      <div className="w-5 h-5 rounded-full border-2 border-[#218DFF] border-t-transparent animate-spin" />
      <span>Loading module...</span>
    </div>
  )
}

export default function WorkspaceContentRouter({
  searchQuery = '',
  activeArchId = 'buy-and-sell',
  currentArch = {},
  activeModule = 'Overview',
  activePage = 'Dashboard',
  handleArchSwitch = () => {},
  handleModuleClick = () => {},
  navigateToModulePage = () => {},
  setActiveModule = () => {},
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
  if (activePage === 'Where Is My Money' || activeModule === 'Finance') {
    return (
      <Suspense fallback={<PanelFallback />}>
        <WhereIsMyMoneyPanel activeArchId={activeArchId} />
      </Suspense>
    )
  }

  if (activeModule === 'Reports') {
    return (
      <Suspense fallback={<PanelFallback />}>
        <UniversalReportPanel
          activePage={activePage}
          activeArchId={activeArchId}
          currentArch={currentArch}
        />
      </Suspense>
    )
  }

  if (activeModule === 'Documents') {
    return (
      <Suspense fallback={<PanelFallback />}>
        <DocumentsAndSharingPanel
          activePage={activePage}
          activeArchId={activeArchId}
        />
      </Suspense>
    )
  }

  if (activeModule === 'Integrations') {
    return (
      <Suspense fallback={<PanelFallback />}>
        <DocumentsAndIntegrationsPanel
          mode="integrations"
          activePage={activePage}
          activeArchId={activeArchId}
        />
      </Suspense>
    )
  }

  if (
    activeArchId === 'agriculture' &&
    activePage === 'Survival Runway & AI Advice'
  ) {
    return (
      <Suspense fallback={<PanelFallback />}>
        <FarmingEnhancementsPanel activeSubPage={activePage} />
      </Suspense>
    )
  }

  if (activeModule !== 'Overview' || activePage !== 'Dashboard') {
    return (
      <Suspense fallback={<PanelFallback />}>
        <InteractiveModulePanel
          searchQuery={searchQuery}
          activeArchId={activeArchId}
          currentArch={currentArch}
          activeModule={activeModule}
          activePage={activePage}
          onSwitchArch={handleArchSwitch}
          onSwitchPage={(mod, page) => {
            setActiveModule(mod)
            setActivePage(page)
          }}
        />
      </Suspense>
    )
  }

  return (
    <OverviewDashboardView
      currentArch={currentArch}
      activeArchId={activeArchId}
      handleModuleClick={handleModuleClick}
      navigateToModulePage={navigateToModulePage}
      setActivePage={setActivePage}
      availableWidgets={availableWidgets}
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
      onLogout={onLogout}
      addDemoRecord={addDemoRecord}
      widgetSearch={widgetSearch}
      setWidgetSearch={setWidgetSearch}
    />
  )
}

