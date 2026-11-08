import React, { useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Package,
  ShoppingCart,
  CreditCard,
  Building2,
  Wallet,
  BarChart3,
  User as UserIcon,
  LogOut,
  X,
  Pause,
  Minus,
  Check
} from 'lucide-react'
import exbosLogo from '../../../../logo/exboslogo.png'
import { formatRWF } from '../../../utils/currencyWords'

export default function MobileFintechDashboardHeader({
  user,
  currentArch = {},
  liveDashboardData = {},
  hideFinancials = false,
  setHideFinancials = () => {},
  navigateToModulePage = () => {},
  handleModuleClick = () => {},
  notifOpen = false,
  setNotifOpen = () => {},
  activeBusinessAlerts = [],
  onOpenCustomize = () => {},
  onLogout = () => {}
}) {
  const [selectedMetric, setSelectedMetric] = useState('netProfit')
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [userStatus, setUserStatus] = useState(() => {
    try {
      return localStorage.getItem('exbos_user_status') || 'Online'
    } catch {
      return 'Online'
    }
  })

  const userName = user?.name || 'Mugisha Leobeni'
  // Get first name for "Hi, Leobeni" greeting
  const firstName = userName.split(' ').filter(Boolean)[1] || userName.split(' ').filter(Boolean)[0] || 'Leobeni'
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'LM'

  const metricsTabs = [
    { id: 'netProfit', label: 'Net Profit', amount: liveDashboardData.netProfit ?? 0 },
    { id: 'revenue', label: 'Revenue', amount: liveDashboardData.totalSales ?? 0 },
    { id: 'expenses', label: 'Expenses', amount: liveDashboardData.totalExpenses ?? 0 },
    { id: 'stock', label: 'Stock Shelf', amount: liveDashboardData.stockValue ?? 0 }
  ]

  const activeMetricObj =
    metricsTabs.find((m) => m.id === selectedMetric) || metricsTabs[0]

  const handleSelectStatus = (status) => {
    setUserStatus(status)
    try {
      localStorage.setItem('exbos_user_status', status)
    } catch (e) {}
  }

  const quickLinks = [
    {
      id: 'sale',
      label: 'New Sale',
      icon: ShoppingCart,
      action: () => navigateToModulePage('Sales', 'All Sales', { action: 'create' })
    },
    {
      id: 'product',
      label: 'New Product',
      icon: Package,
      action: () => navigateToModulePage('Products', 'Stock', { action: 'create' })
    },
    {
      id: 'purchase',
      label: 'New Purchase',
      icon: CreditCard,
      action: () => navigateToModulePage('Purchases', 'All Purchases', { action: 'create' })
    },
    {
      id: 'expense',
      label: 'New Expense',
      icon: Wallet,
      action: () => navigateToModulePage('Expenses', 'All Expenses', { action: 'create' })
    },
    {
      id: 'where-money',
      label: 'Where Is Money',
      icon: Building2,
      action: () => navigateToModulePage('Overview', 'Where Is My Money')
    },
    {
      id: 'reports',
      label: 'Profit & Loss',
      icon: BarChart3,
      action: () => navigateToModulePage('Reports', 'Profit & Loss (P&L)')
    }
  ]

  return (
    <div className="lg:hidden flex flex-col gap-4">
      {/* 1. Mobile Top Header (Matching Image 1 Top Bar) */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Avatar + "Hi, Leobeni" with Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1045CA] to-[#071544] border-2 border-[#218DFF]/40 text-white font-orbitron font-extrabold text-xs flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-white tracking-tight">
                  Hi, {firstName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-300 transition-transform ${
                    userDropdownOpen ? 'rotate-180 text-[#218DFF]' : ''
                  }`}
                />
              </div>
              <span className="text-[10px] text-[#9EDCFF] font-medium block">
                {currentArch?.name || 'Buy & Sell'}
              </span>
            </div>
          </button>

          {/* User Status / Account Dropdown Popover */}
          {userDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-3xl bg-[#071544]/98 border border-[#218DFF]/40 shadow-2xl p-4 text-white z-50 backdrop-blur-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] font-bold">
                  Status &amp; Profile
                </span>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(false)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'Online', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
                  { key: 'Idle', color: 'text-amber-400', bg: 'bg-amber-500/20' },
                  { key: 'Do Not Disturb', color: 'text-rose-400', bg: 'bg-rose-500/20' },
                  { key: 'Invisible', color: 'text-slate-400', bg: 'bg-slate-500/20' }
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => {
                      handleSelectStatus(st.key)
                      setUserDropdownOpen(false)
                    }}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer ${
                      userStatus === st.key
                        ? 'bg-[#163065] border-[#218DFF] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{st.key}</span>
                    {userStatus === st.key && (
                      <Check className="w-3 h-3 text-[#218DFF]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false)
                    if (onLogout) onLogout()
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Notification Bell + ExBOS Brand Logo (Matching Image 1) */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 text-[#9EDCFF] hover:text-white flex items-center justify-center relative cursor-pointer active:scale-95 transition-all shadow-md"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-white" />
            <span
              className={`w-2.5 h-2.5 rounded-full absolute top-2 right-2 ring-2 ring-[#071544] ${
                activeBusinessAlerts.length > 0
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-amber-400/90 shadow-sm'
              }`}
            />
          </button>

          <div className="h-10 px-2.5 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-md">
            <img
              src={exbosLogo}
              alt="ExBOS"
              className="h-6 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* 2. Hero Account Card (Matching Image 1 & 2 in Liquid Sapphire) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-[#0F285D]/95 via-[#0B1E48]/95 to-[#071536] border border-[#218DFF]/35 shadow-2xl relative overflow-hidden space-y-4">
        {/* Glow corner ambient */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#218DFF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header: Business Account Type */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm font-bold text-white block">
              {user?.businessName || currentArch?.name || 'Operating Account'}
            </span>
            {user?.businessName && currentArch?.name && (
              <span className="text-[11px] text-slate-300 block mt-0.5">
                {currentArch.name}
              </span>
            )}
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#132A58] border border-[#234C9A]/60 text-[10px] font-orbitron uppercase text-[#9EDCFF] font-bold shrink-0">
            Active
          </span>
        </div>

        {/* Segmented Control Pill (from Image 2) */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#040C26]/80 border border-white/10">
          {metricsTabs.map((tab) => {
            const isTabActive = tab.id === selectedMetric
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMetric(tab.id)}
                className={`py-1.5 text-[11px] font-bold rounded-xl transition-all cursor-pointer truncate ${
                  isTabActive
                    ? 'bg-[#218DFF] text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Inner Balance Pill with Amber Eye Toggle (from Image 1 & 2) */}
        <div className="rounded-2xl p-4 bg-[#071536]/85 border border-white/15 flex items-center justify-between gap-3 shadow-inner">
          <div className="min-w-0 flex items-baseline gap-2">
            <span className="text-xs font-bold font-orbitron text-[#9EDCFF] uppercase tracking-wider shrink-0">
              RWF
            </span>
            <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight break-words leading-tight">
              {hideFinancials ? '••••••••••••' : Number(activeMetricObj.amount || 0).toLocaleString()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHideFinancials(!hideFinancials)}
            className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all"
            title={hideFinancials ? 'Show financial balances' : 'Hide financial balances'}
          >
            {hideFinancials ? (
              <EyeOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Eye className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>

        {/* Carousel Pagination Dots (Matching Image 2) */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {metricsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedMetric(tab.id)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                tab.id === selectedMetric
                  ? 'w-6 bg-[#218DFF]'
                  : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
              title={tab.label}
            />
          ))}
        </div>
      </div>

      {/* 3. Action Progress Banner (Matching Image 1) */}
      <div className="rounded-2xl p-3.5 bg-white/5 border border-white/10 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-orbitron font-bold shrink-0">
            3/3
          </div>
          <div className="min-w-0">
            <strong className="block text-xs font-bold text-white truncate">
              {currentArch?.name || 'Buy & Sell Enterprise'}
            </strong>
            <p className="text-[11px] text-slate-300 truncate">
              All 27 modular ledger buckets active and verified
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* 4. QUICK LINKS Card (Matching Image 1 Exactly) */}
      <div className="rounded-3xl p-5 bg-[#071536]/90 border border-white/10 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-orbitron uppercase tracking-widest text-[#9EDCFF] font-bold">
            QUICK LINKS
          </span>
          <button
            type="button"
            onClick={onOpenCustomize}
            className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-[#218DFF]/40 text-[#9EDCFF] hover:text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3 h-3 text-[#218DFF]" />
            <span>Customize</span>
          </button>
        </div>

        {/* 3x2 Grid of Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          {quickLinks.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/50 transition-all cursor-pointer group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-[#163065] border border-[#234C9A]/70 text-[#218DFF] group-hover:text-white group-hover:scale-105 flex items-center justify-center shadow-inner transition-all mb-1.5">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white text-center line-clamp-1">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

