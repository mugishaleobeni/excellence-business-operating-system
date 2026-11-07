import React, { useMemo } from 'react'
import { useExbos } from '../../../context/ExbosContext'
import { AGRICULTURE_PRESETS } from './data/agriculturePresets'
import AgricultureKpiCards from './components/AgricultureKpiCards'
import AnimalDirectoryWorkspace from './views/AnimalDirectoryWorkspace'
import FeedNutritionWorkspace from './views/FeedNutritionWorkspace'
import BreedingReproductionWorkspace from './views/BreedingReproductionWorkspace'
import FarmHealthWorkspace from './views/FarmHealthWorkspace'
import FarmProductionWorkspace from './views/FarmProductionWorkspace'
import TrueProfitWorkspace from './views/TrueProfitWorkspace'
import OptionalSurvivalWorkspace from './views/OptionalSurvivalWorkspace'
import SalesTrendsView from '../views/SalesTrendsView'
import { formatRWF } from '../../../utils/currencyWords'

export default function AgricultureWorkspace({
  activeModule = 'Livestock',
  activePage = 'Animal Register',
  onSwitchPage = () => {}
}) {
  const { demoWorkspaces, hideFinancials = false } = useExbos()
  const workspace = demoWorkspaces?.['agriculture'] || {}
  const records = workspace.records || {}

  const animals = useMemo(() => {
    const list = records['Animals']
    return Array.isArray(list) ? list : []
  }, [records])

  const batches = useMemo(() => {
    const list = records['Batches']
    return Array.isArray(list) ? list : []
  }, [records])

  const feeds = useMemo(() => {
    const list = records['Feeds']
    return Array.isArray(list) ? list : []
  }, [records])

  const gestations = useMemo(() => {
    const list = records['Gestations']
    return Array.isArray(list) ? list : []
  }, [records])

  const production = useMemo(() => {
    const list = records['Production']
    return Array.isArray(list) ? list : []
  }, [records])

  // Routing Logic
  const isFeedView = activePage === 'Feed Management' || activePage === 'Daily Feed Tracking'
  const isBreedingView = activePage === 'Breeding & Births' || activePage === 'Breeding Cycles'
  const isHealthView = activePage === 'Health & Vet Care' || activePage === 'Vaccination Schedule'
  const isProductionView =
    activePage === 'Daily Production' ||
    activePage === 'Harvest Records' ||
    activePage === 'Daily Collection' ||
    activeModule === 'Farm Inventory'
  const isSalesTrendsView = activePage === 'Sales Trends'
  const isProfitView =
    activePage === 'Trade vs Breed Profit' ||
    activePage === 'Farm Sales' ||
    activePage === 'Farm Sales & Profit' ||
    activePage === 'Livestock Sales & Profit' ||
    activePage === 'Livestock Sales' ||
    (activeModule === 'Sales' && !isSalesTrendsView)
  const isSurvivalView =
    activePage === 'Survival Runway & AI Advice' ||
    activePage === 'Survival Period Settings' ||
    activeModule === 'Survival Runway'

  return (
    <div className="space-y-6">
      {/* Dynamic Top Stat Cards */}
      <AgricultureKpiCards
        animals={animals}
        batches={batches}
        feeds={feeds}
        gestations={gestations}
        production={production}
        onNavigateTab={(mod, page) => onSwitchPage(mod, page)}
      />

      {/* Main Routed View */}
      {isFeedView ? (
        <FeedNutritionWorkspace />
      ) : isBreedingView ? (
        <BreedingReproductionWorkspace />
      ) : isHealthView ? (
        <FarmHealthWorkspace />
      ) : isProductionView ? (
        <FarmProductionWorkspace />
      ) : isSalesTrendsView ? (
        <SalesTrendsView
          records={records['Sales'] || []}
          hideFinancials={hideFinancials}
          formatRWF={formatRWF}
        />
      ) : isProfitView ? (
        <TrueProfitWorkspace />
      ) : isSurvivalView ? (
        <OptionalSurvivalWorkspace />
      ) : (
        <AnimalDirectoryWorkspace activeSubPage={activePage} />
      )}
    </div>
  )
}

