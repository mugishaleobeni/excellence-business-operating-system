import React from 'react'
import {
  Home,
  Repeat,
  Wallet,
  ArrowUpRight,
  LayoutGrid
} from 'lucide-react'

export default function MobileFloatingDock({
  currentArch = {},
  activeModule = 'Overview',
  activePage = 'Dashboard',
  navigateToModulePage,
  handleModuleClick,
  mobileSidebarOpen,
  setMobileSidebarOpen
}) {
  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      isActive: activeModule === 'Overview',
      action: () => {
        if (navigateToModulePage) {
          navigateToModulePage('Overview', 'Dashboard')
        } else if (handleModuleClick) {
          handleModuleClick('Overview')
        }
        if (mobileSidebarOpen) setMobileSidebarOpen(false)
      }
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: Repeat,
      isActive: activeModule === 'Sales',
      action: () => {
        if (navigateToModulePage) {
          navigateToModulePage('Sales', 'All Sales')
        } else if (handleModuleClick) {
          handleModuleClick('Sales')
        }
        if (mobileSidebarOpen) setMobileSidebarOpen(false)
      }
    },
    {
      id: 'products',
      label: 'Products',
      icon: Wallet,
      isActive:
        activeModule === 'Products' ||
        activeModule === 'Products & Stock' ||
        activeModule === 'Inventory' ||
        activeModule === 'Livestock',
      action: () => {
        if (navigateToModulePage) {
          navigateToModulePage('Products', 'Stock')
        } else if (handleModuleClick) {
          handleModuleClick('Products')
        }
        if (mobileSidebarOpen) setMobileSidebarOpen(false)
      }
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: ArrowUpRight,
      isActive: activeModule === 'Expenses' || activeModule === 'Purchases',
      action: () => {
        if (navigateToModulePage) {
          navigateToModulePage('Expenses', 'All Expenses')
        } else if (handleModuleClick) {
          handleModuleClick('Expenses')
        }
        if (mobileSidebarOpen) setMobileSidebarOpen(false)
      }
    },
    {
      id: 'more',
      label: 'More',
      icon: LayoutGrid,
      isActive:
        mobileSidebarOpen ||
        (activeModule !== 'Overview' &&
          activeModule !== 'Sales' &&
          activeModule !== 'Products' &&
          activeModule !== 'Products & Stock' &&
          activeModule !== 'Inventory' &&
          activeModule !== 'Livestock' &&
          activeModule !== 'Expenses' &&
          activeModule !== 'Purchases'),
      action: () => {
        setMobileSidebarOpen(!mobileSidebarOpen)
      }
    }
  ]

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-[#071544]/98 border-t border-[#218DFF]/30 backdrop-blur-2xl shadow-2xl px-2 py-1.5 flex items-center justify-around safe-bottom pointer-events-auto"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isCurrent = tab.isActive
        return (
          <button
            key={tab.id}
            type="button"
            onClick={tab.action}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 cursor-pointer group active:scale-95 transition-all text-center min-w-0"
          >
            {/* Icon Pill Container (Matching Image 1 & 2 Active/Inactive state) */}
            <div
              className={`w-11 h-7 rounded-xl flex items-center justify-center transition-all ${
                isCurrent
                  ? 'bg-[#218DFF] text-white shadow-[0_0_12px_rgba(33,141,255,0.45)]'
                  : 'text-slate-400 group-hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            {/* Label below */}
            <span
              className={`text-[11px] tracking-tight mt-1 truncate transition-colors ${
                isCurrent
                  ? 'font-bold text-[#218DFF]'
                  : 'font-medium text-slate-400 group-hover:text-slate-200'
              }`}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
