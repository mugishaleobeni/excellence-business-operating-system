import React from 'react'
import WhereIsMyMoneyPanel from '../WhereIsMyMoneyPanel'
import FarmingEnhancementsPanel from '../FarmingEnhancementsPanel'
import DocumentsAndIntegrationsPanel from '../DocumentsAndIntegrationsPanel'
import DocumentsAndSharingPanel from '../documents/DocumentsAndSharingPanel'
import UniversalReportPanel from '../UniversalReportPanel'
import InteractiveModulePanel from '../InteractiveModulePanel'
import OverviewDashboardView from '../overview/OverviewDashboardView'

export default function WorkspaceContentRouter({
  activeArchId = 'buy-and-sell',
  currentArch = {},
  activeModule = 'Overview',
  activePage = 'Dashboard',
  handleArchSwitch = () => {},
  handleModuleClick = () => {},
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
  addDemoRecord = () => {},
  widgetSearch = '',
  setWidgetSearch = () => {}
}) {
  if (activePage === 'Where Is My Money' || activeModule === 'Finance') {
    return <WhereIsMyMoneyPanel activeArchId={activeArchId} />
  }

  if (activeModule === 'Reports') {
    return (
      <UniversalReportPanel
        activePage={activePage}
        activeArchId={activeArchId}
        currentArch={currentArch}
      />
    )
  }

  if (activeModule === 'Documents') {
    return (
      <DocumentsAndSharingPanel
        activePage={activePage}
        activeArchId={activeArchId}
      />
    )
  }

  if (activeModule === 'Integrations') {
    return (
      <DocumentsAndIntegrationsPanel
        mode="integrations"
        activePage={activePage}
        activeArchId={activeArchId}
      />
    )
  }

  if (
    activeArchId === 'agriculture' &&
    activePage === 'Survival Runway & AI Advice'
  ) {
    return <FarmingEnhancementsPanel activeSubPage={activePage} />
  }

  if (activeModule !== 'Overview' || activePage !== 'Dashboard') {
    return (
      <InteractiveModulePanel
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
    )
  }

  return (
    <OverviewDashboardView
      currentArch={currentArch}
      activeArchId={activeArchId}
      handleModuleClick={handleModuleClick}
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
      addDemoRecord={addDemoRecord}
      widgetSearch={widgetSearch}
      setWidgetSearch={setWidgetSearch}
    />
  )
}

