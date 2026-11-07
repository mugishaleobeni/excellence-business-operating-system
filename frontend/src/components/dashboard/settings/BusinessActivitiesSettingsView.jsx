import React, { useState } from 'react'
import {
  Sliders,
  Package,
  Wrench,
  Utensils,
  Factory,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'

export default function BusinessActivitiesSettingsView({ addToast }) {
  const { hybridTrade, updateDemoWorkspace, demoWorkspaces } = useExbos()
  const hybridData = demoWorkspaces?.['hybrid'] || {}

  const [activities, setActivities] = useState({
    retail: true,
    service: true,
    food: false,
    production: false
  })

  const toggleActivity = (key) => {
    const next = { ...activities, [key]: !activities[key] }
    setActivities(next)
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Activity Updated',
        message: `${key.toUpperCase()} module switch is now ${next[key] ? 'ENABLED' : 'DISABLED'}.`
      })
    }
  }

  const list = [
    {
      id: 'retail',
      name: 'Retail Goods & Physical Inventory',
      icon: Package,
      description: 'Barcode checkout, selective stock deduction, supplier purchase orders, and landed cost tracking.',
      active: activities.retail,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
    {
      id: 'service',
      name: 'Services & Billable Labor',
      icon: Wrench,
      description: 'Hourly rates, technician work orders, repairs, consultations, styling sessions, and appointments.',
      active: activities.service,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'food',
      name: 'Food, Dining & Hospitality',
      icon: Utensils,
      description: 'Kitchen orders, table tabs, ingredient deduction, takeaway counter, and guest folios.',
      active: activities.food,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      id: 'production',
      name: 'Production & Manufacturing',
      icon: Factory,
      description: 'Raw material transformation, bill of materials, recipe yield, and batch tracking.',
      active: activities.production,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="exbos-glass-card p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-orbitron font-bold uppercase text-indigo-300">
            Architecture 06 · Modular Activity Switcher
          </span>
        </div>
        <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white">
          Active Business Streams &amp; Branches
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Toggle which commercial operations are enabled in your hybrid workspace. Ledgers for inactive activities remain preserved in background archives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((act) => {
          const Icon = act.icon
          return (
            <div
              key={act.id}
              className={`exbos-glass-card p-5 rounded-2xl flex flex-col justify-between transition-all ${
                act.active ? 'border-l-4 border-l-[#218DFF]' : 'opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${act.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${act.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{act.name}</h3>
                      <span className="text-[10px] text-slate-400 font-mono">Stream ID: {act.id}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleActivity(act.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      act.active ? 'bg-indigo-600' : 'bg-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        act.active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Stream Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    act.active
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {act.active ? 'Active & Billable' : 'Disabled'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

