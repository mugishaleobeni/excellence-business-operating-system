import React, { useEffect, useState } from 'react'
import { Sliders, RotateCcw, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react'

export const DEFAULT_WIDGETS = [
  { id: 'kpis', label: 'Financial overview cards' },
  { id: 'analytics', label: 'Sales analytics & live operations' },
  { id: 'survival', label: 'Six-month survival indicator' },
  { id: 'workspace', label: 'Demo data workspace' },
  { id: 'money', label: 'Where is my money?' }
]

const STORAGE_KEY = 'exbos_dashboard_prefs_v1'

const defaultPrefs = () => ({
  order: DEFAULT_WIDGETS.map((w) => w.id),
  hidden: { survival: true },
  hiddenCards: {}
})

/** Persisted dashboard personalization. It only affects layout/visibility, never financial data. */
export function useDashboardPrefs() {
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (!saved) return defaultPrefs()
      const base = defaultPrefs()
      const known = base.order
      const order = [...(saved.order || []).filter((id) => known.includes(id))]
      known.forEach((id) => {
        if (!order.includes(id)) order.push(id)
      })
      return { order, hidden: saved.hidden || base.hidden, hiddenCards: saved.hiddenCards || {} }
    } catch {
      return defaultPrefs()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* ignore storage errors */
    }
  }, [prefs])

  const toggleWidget = (id) =>
    setPrefs((p) => ({ ...p, hidden: { ...p.hidden, [id]: !p.hidden[id] } }))
  const toggleCard = (label) =>
    setPrefs((p) => ({ ...p, hiddenCards: { ...p.hiddenCards, [label]: !p.hiddenCards[label] } }))
  const move = (id, dir) =>
    setPrefs((p) => {
      const order = [...p.order]
      const i = order.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= order.length) return p
      ;[order[i], order[j]] = [order[j], order[i]]
      return { ...p, order }
    })
  const reset = () => setPrefs(defaultPrefs())

  return { prefs, toggleWidget, toggleCard, move, reset }
}

export default function DashboardCustomizer({ prefs, onToggle, onMove, onReset }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-[#071544] dark:text-[#9EDCFF] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
      >
        <Sliders className="w-3.5 h-3.5" />
        <span>Customize</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl p-3 space-y-2 bg-white dark:bg-[#071544] border border-blue-200 dark:border-[#9EDCFF]/30 shadow-lg">
          <div className="text-[11px] font-orbitron uppercase tracking-wider text-[#218DFF] font-bold">
            Dashboard widgets
          </div>
          {prefs.order.map((id, idx) => {
            const w = DEFAULT_WIDGETS.find((x) => x.id === id)
            if (!w) return null
            const hidden = !!prefs.hidden[id]
            return (
              <div
                key={id}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-[#218DFF]/10 text-xs text-[#071544] dark:text-white"
              >
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  aria-label={`${hidden ? 'Show' : 'Hide'} ${w.label}`}
                  className="p-1 rounded-lg bg-transparent border-0 cursor-pointer text-[#218DFF]"
                >
                  {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <span className={`flex-1 ${hidden ? 'opacity-50 line-through' : ''}`}>{w.label}</span>
                <button
                  type="button"
                  onClick={() => onMove(id, -1)}
                  disabled={idx === 0}
                  aria-label={`Move ${w.label} up`}
                  className="p-1 bg-transparent border-0 cursor-pointer text-current disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(id, 1)}
                  disabled={idx === prefs.order.length - 1}
                  aria-label={`Move ${w.label} down`}
                  className="p-1 bg-transparent border-0 cursor-pointer text-current disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )
          })}
          <button
            type="button"
            onClick={onReset}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-[#218DFF] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore default layout</span>
          </button>
        </div>
      )}
    </div>
  )
}

