import React, { useMemo, useState } from 'react'
import { useExbos } from '../../../context/ExbosContext'
import { FOOD_HOSPITALITY_PRESETS } from './data/foodHospitalityPresets'
import FoodHospitalityKpiCards from './components/FoodHospitalityKpiCards'
import ActiveFoodTradeBadge from './components/ActiveFoodTradeBadge'
import FoodTradeModal from './modals/FoodTradeModal'
import MenuRecipesWorkspace from './views/MenuRecipesWorkspace'
import KitchenQueueWorkspace from './views/KitchenQueueWorkspace'
import DiningTablesWorkspace from './views/DiningTablesWorkspace'
import RoomsLodgingWorkspace from './views/RoomsLodgingWorkspace'
import GuestFoliosWorkspace from './views/GuestFoliosWorkspace'
import IngredientsStockWorkspace from './views/IngredientsStockWorkspace'
import HospitalityProfitWorkspace from './views/HospitalityProfitWorkspace'

export default function FoodHospitalityWorkspace({
  activeModule = 'Restaurant & Bar',
  activePage = 'Menu Items',
  onSwitchPage = () => {}
}) {
  const { demoWorkspaces, foodTrade = 'combined', applyFoodTrade } = useExbos()
  const currentPreset = FOOD_HOSPITALITY_PRESETS[foodTrade] || FOOD_HOSPITALITY_PRESETS.combined
  const workspace = demoWorkspaces?.['food-and-hospitality'] || {}
  const records = workspace.records || {}

  const [tradeModalOpen, setTradeModalOpen] = useState(false)

  const menuItems = useMemo(() => {
    const list = records['MenuItems']
    if (Array.isArray(list) && list.length > 0) return list
    return currentPreset.menuItems || []
  }, [records, currentPreset])

  const kitchenOrders = useMemo(() => {
    const list = records['KitchenOrders']
    if (Array.isArray(list) && list.length > 0) return list
    return currentPreset.kitchenOrders || []
  }, [records, currentPreset])

  const rooms = useMemo(() => {
    const list = records['Rooms']
    if (Array.isArray(list) && list.length > 0) return list
    return currentPreset.rooms || []
  }, [records, currentPreset])

  const guestFolios = useMemo(() => {
    const list = records['GuestFolios']
    if (Array.isArray(list) && list.length > 0) return list
    return currentPreset.guestFolios || []
  }, [records, currentPreset])

  // Routing Logic
  const isKOTView =
    activePage === 'Orders & Kitchen Queue' ||
    activePage === 'Kitchen Queue' ||
    activePage === 'Live Kitchen & Rooms'
  const isTablesView =
    activePage === 'Tables & Bills' ||
    activePage === 'Dining Tables'
  const isFoliosView =
    activePage === 'Guest Folios' ||
    activePage === 'Folios & Billing'
  const isRoomsView =
    activePage === 'Rooms Register' ||
    activePage === 'Reservations & Check-In' ||
    (activeModule === 'Rooms & Lodging' && !isFoliosView)
  const isStockView =
    activePage === 'Kitchen Ingredients' ||
    activePage === 'Ingredients & Stock' ||
    activePage === 'Low Stock & Waste' ||
    activeModule === 'Ingredients & Stock'
  const isProfitView =
    activePage === 'Hospitality Profit' ||
    activePage === 'Food Cost & Margins' ||
    activePage === 'Where Is My Money'
  const isMenuView =
    activePage === 'Menu Items' ||
    activePage === 'Menu & Recipes' ||
    activeModule === 'Restaurant & Bar'

  return (
    <div className="space-y-6">
      {/* Top Specialization Ribbon */}
      <div className="flex items-center justify-between">
        <ActiveFoodTradeBadge
          currentTradeId={foodTrade}
          onClick={() => setTradeModalOpen(true)}
        />
      </div>

      {/* Dynamic KPI Cards */}
      <FoodHospitalityKpiCards
        menuItems={menuItems}
        kitchenOrders={kitchenOrders}
        rooms={rooms}
        guestFolios={guestFolios}
        onNavigateTab={(mod, page) => onSwitchPage(mod, page)}
      />

      {/* Routed Module View */}
      {isKOTView ? (
        <KitchenQueueWorkspace />
      ) : isTablesView ? (
        <DiningTablesWorkspace />
      ) : isFoliosView ? (
        <GuestFoliosWorkspace />
      ) : isRoomsView ? (
        <RoomsLodgingWorkspace activePage={activePage} />
      ) : isStockView ? (
        <IngredientsStockWorkspace activePage={activePage} />
      ) : isProfitView ? (
        <HospitalityProfitWorkspace />
      ) : (
        <MenuRecipesWorkspace />
      )}

      {/* Specialization Trade Preset Modal */}
      <FoodTradeModal
        isOpen={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        currentTradeId={foodTrade}
        onSelectTrade={(tradeKey) => applyFoodTrade(tradeKey)}
      />
    </div>
  )
}

