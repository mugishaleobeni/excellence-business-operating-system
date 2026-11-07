import React, { useState, useEffect } from 'react'
import {
  Package,
  Wrench,
  ShoppingCart,
  PieChart,
  Plus,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { HYBRID_PRESETS } from './data/hybridPresets'
import ActiveHybridTradeBadge from './components/ActiveHybridTradeBadge'
import ActivityToggleSettings from './components/ActivityToggleSettings'
import HybridKpiCards from './components/HybridKpiCards'
import HybridTradeModal from './modals/HybridTradeModal'
import AddHybridItemModal from './modals/AddHybridItemModal'
import RecordMixedSaleModal from './modals/RecordMixedSaleModal'
import HybridCatalogWorkspace from './views/HybridCatalogWorkspace'
import HybridServicesWorkspace from './views/HybridServicesWorkspace'
import MixedSalesDrawerWorkspace from './views/MixedSalesDrawerWorkspace'
import CrossActivityProfitWorkspace from './views/CrossActivityProfitWorkspace'

export default function HybridWorkspace({
  activeModule = 'Products & Stock',
  activePage = 'All Products',
  onSwitchPage = () => {}
}) {
  const { hybridTrade, demoWorkspaces } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const preset = HYBRID_PRESETS[hybridTrade] || HYBRID_PRESETS.techRepair

  const rawItems = hybridWorkspace.records?.HybridItems
  const items = Array.isArray(rawItems) && rawItems.length > 0 ? rawItems : (preset.items || [])
  const rawSales = hybridWorkspace.records?.MixedSales
  const mixedSales = Array.isArray(rawSales) && rawSales.length > 0 ? rawSales : (preset.mixedSales || [])

  // Determine initial tab from sidebar navigation
  const getTabFromProps = (mod, pg) => {
    if (mod === 'Services & Jobs' || pg === 'Service Catalogue' || pg === 'Job Schedule') return 'services'
    if (mod === 'Sales' || pg === 'All Sales' || pg === 'Sales Trends') return 'sales'
    if (pg === 'Activity Summary' || pg === 'Where Is My Money' || pg === 'Cross-Activity Profit Matrix') return 'profit'
    return 'catalog'
  }

  const [activeTab, setActiveTab] = useState(() => getTabFromProps(activeModule, activePage))
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isRecordSaleOpen, setIsRecordSaleOpen] = useState(false)
  const [showActivityConfig, setShowActivityConfig] = useState(false)

  // Sync tab when sidebar navigation changes
  useEffect(() => {
    const nextTab = getTabFromProps(activeModule, activePage)
    setActiveTab(nextTab)
  }, [activeModule, activePage])

  const navTabs = [
    { id: 'catalog', label: 'Master Catalog & Stock', icon: Package },
    { id: 'services', label: 'Services & Labor', icon: Wrench },
    { id: 'sales', label: 'Mixed Sales Drawer', icon: ShoppingCart },
    { id: 'profit', label: 'Cross-Activity Profit Matrix', icon: PieChart }
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Preset Selector */}
      <div className="bg-white/[0.03] p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <ActiveHybridTradeBadge />
            <span className="text-[11px] text-slate-400">Architecture 06</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {preset.businessName || 'Hybrid Enterprise Operations'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {preset.description ||
              'Operate combined retail physical goods, billable service labor, and dining counter on a unified ledger.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowActivityConfig(!showActivityConfig)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Activity Switches</span>
            {showActivityConfig ? (
              <ChevronUp className="w-3.5 h-3.5 ml-1 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setIsTradeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/35 text-indigo-200 text-xs font-semibold transition"
          >
            Switch Preset
          </button>

          <button
            onClick={() => setIsRecordSaleOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Record Mixed Sale
          </button>
        </div>
      </div>

      {/* Collapsible Activity Toggles */}
      {showActivityConfig && (
        <div className="transition-all duration-200">
          <ActivityToggleSettings />
        </div>
      )}

      {/* KPI Cards */}
      <HybridKpiCards
        items={items}
        mixedSales={mixedSales}
        activeActivities={preset.activeActivities}
        onNavigateTab={(mod, pg) => {
          if (mod === 'Overview') setActiveTab('profit')
          if (mod === 'Sales') setActiveTab('sales')
        }}
      />

      {/* Subnavigation Bar */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'catalog') onSwitchPage('Products & Stock', 'All Products')
                if (tab.id === 'services') onSwitchPage('Services & Jobs', 'Service Catalogue')
                if (tab.id === 'sales') onSwitchPage('Sales', 'All Sales')
                if (tab.id === 'profit') onSwitchPage('Overview', 'Activity Summary')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Sub-Workspace Views */}
      <div className="pt-1">
        {activeTab === 'catalog' && (
          <HybridCatalogWorkspace
            activeModule={activeModule}
            activePage={activePage}
            onSwitchPage={onSwitchPage}
          />
        )}
        {activeTab === 'services' && (
          <HybridServicesWorkspace
            activeModule={activeModule}
            activePage={activePage}
            onSwitchPage={onSwitchPage}
          />
        )}
        {activeTab === 'sales' && (
          <MixedSalesDrawerWorkspace
            activeModule={activeModule}
            activePage={activePage}
            onSwitchPage={onSwitchPage}
          />
        )}
        {activeTab === 'profit' && (
          <CrossActivityProfitWorkspace
            activeModule={activeModule}
            activePage={activePage}
            onSwitchPage={onSwitchPage}
          />
        )}
      </div>

      {/* Modals */}
      <HybridTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
      />

      <AddHybridItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
      />

      <RecordMixedSaleModal
        isOpen={isRecordSaleOpen}
        onClose={() => setIsRecordSaleOpen(false)}
      />
    </div>
  )
}
