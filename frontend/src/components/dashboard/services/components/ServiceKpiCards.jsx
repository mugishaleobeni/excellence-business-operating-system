import React from 'react'
import {
  CalendarCheck,
  CheckCircle2,
  Coins,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Package
} from 'lucide-react'

export default function ServiceKpiCards({
  services = [],
  consumables = [],
  jobs = [],
  staff = [],
  onNavigateTab = () => {}
}) {
  const todayStr = new Date().toISOString().split('T')[0]

  // Compute live metrics
  const todayJobs = jobs.filter((j) => j.appointmentDate === todayStr || !j.appointmentDate)
  const activeBookingsCount = jobs.filter((j) => j.status === 'Booked' || j.status === 'In Progress').length
  const completedJobs = jobs.filter((j) => j.status === 'Completed')
  
  const totalRevenueRWF = jobs.reduce((sum, j) => sum + (Number(j.depositPaidRWF) || 0) + (j.status === 'Completed' ? (Number(j.balanceDueRWF) || 0) : 0), 0)
  
  const totalCommissionRWF = completedJobs.reduce((sum, j) => {
    const s = staff.find((m) => m.id === j.staffId || m.name === j.staffName)
    const commPct = s?.commissionPct || 25
    return sum + Math.round(((Number(j.priceRWF) || 0) * commPct) / 100)
  }, 0)

  const lowStockConsumables = consumables.filter(
    (c) => Number(c.currentStock || 0) <= Number(c.reorderLevel || 5)
  )

  const cards = [
    {
      id: 'active_jobs',
      title: 'Active Bookings & In-Progress',
      value: `${activeBookingsCount} Jobs`,
      subtext: `${todayJobs.length} scheduled for today`,
      icon: CalendarCheck,
      color: 'sky',
      borderColor: 'border-sky-500/30',
      bgGradient: 'from-sky-500/10 to-blue-500/5',
      iconBg: 'bg-sky-500/20 text-sky-300',
      action: () => onNavigateTab('Jobs & Bookings', 'All Jobs')
    },
    {
      id: 'service_revenue',
      title: 'Completed Service Revenue',
      value: `${totalRevenueRWF.toLocaleString()} RWF`,
      subtext: `${completedJobs.length} completed & invoiced`,
      icon: TrendingUp,
      color: 'emerald',
      borderColor: 'border-emerald-500/30',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
      action: () => onNavigateTab('Jobs & Bookings', 'Completed & Invoiced')
    },
    {
      id: 'staff_commissions',
      title: 'Staff Commissions Accrued',
      value: `${totalCommissionRWF.toLocaleString()} RWF`,
      subtext: `Earned across ${staff.length} staff members`,
      icon: Coins,
      color: 'amber',
      borderColor: 'border-amber-500/30',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      iconBg: 'bg-amber-500/20 text-amber-300',
      action: () => onNavigateTab('Settings', 'Staff & Commissions')
    },
    {
      id: 'low_supplies',
      title: 'Consumable Supplies Alert',
      value: lowStockConsumables.length > 0 ? `${lowStockConsumables.length} Low Items` : 'Supplies Healthy',
      subtext: lowStockConsumables.length > 0 ? 'Reorder needed to avoid delays' : 'All critical supplies stocked',
      icon: lowStockConsumables.length > 0 ? AlertTriangle : Package,
      color: lowStockConsumables.length > 0 ? 'rose' : 'cyan',
      borderColor: lowStockConsumables.length > 0 ? 'border-rose-500/30' : 'border-cyan-500/30',
      bgGradient: lowStockConsumables.length > 0 ? 'from-rose-500/10 to-pink-500/5' : 'from-cyan-500/10 to-blue-500/5',
      iconBg: lowStockConsumables.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300',
      action: () => onNavigateTab('Services', 'Consumables & Supplies')
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.id}
            onClick={card.action}
            className={`p-4 rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-all shadow-sm group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-300 tracking-wide">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{card.subtext}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

