import React, { useState } from 'react'
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatRWF } from '../../utils/currencyWords'

/**
 * Optional planning widget: Monthly essential operating expenses × 6 = six-month reserve target.
 * Compares the target with eligible cash reserves only (expected future sales and receivables
 * are NOT counted). It is an estimate, not a guarantee.
 */
export default function SixMonthSurvivalWidget({ defaultExpenses = 0, defaultReserve = 0, hideFinancials }) {
  const [expenses, setExpenses] = useState(String(defaultExpenses || ''))
  const [reserve, setReserve] = useState(String(defaultReserve || ''))

  const monthly = Math.max(0, Number(expenses) || 0)
  const available = Math.max(0, Number(reserve) || 0)
  const required = monthly * 6
  const runway = monthly > 0 ? available / monthly : 0
  const diff = available - required
  const healthy = monthly > 0 && diff >= 0

  return (
    <div className="sapphire-analytics-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-[#218DFF]" />
        <span className="font-orbitron text-xs uppercase tracking-widest text-[#218DFF] font-bold">
          Six-Month Business Survival Indicator
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="space-y-1 block">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9EDCFF]/80">
            Monthly essential operating expenses (RWF)
          </span>
          <input
            type="number"
            min="0"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
          />
        </label>
        <label className="space-y-1 block">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#9EDCFF]/80">
            Available eligible cash reserve (RWF)
          </span>
          <input
            type="number"
            min="0"
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-2xl bg-[#218DFF]/10">
          <div className="text-[10px] uppercase text-slate-500 dark:text-[#9EDCFF]/80">Required reserve</div>
          <div className="font-orbitron text-sm font-bold text-[#071544] dark:text-white">
            {formatRWF(required, hideFinancials)}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#218DFF]/10">
          <div className="text-[10px] uppercase text-slate-500 dark:text-[#9EDCFF]/80">Available reserve</div>
          <div className="font-orbitron text-sm font-bold text-[#071544] dark:text-white">
            {formatRWF(available, hideFinancials)}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-[#218DFF]/10">
          <div className="text-[10px] uppercase text-slate-500 dark:text-[#9EDCFF]/80">Estimated runway</div>
          <div className="font-orbitron text-sm font-bold text-[#071544] dark:text-white">
            {monthly > 0 ? `${runway.toFixed(1)} months` : '—'}
          </div>
        </div>
        <div className={`p-3 rounded-2xl ${healthy ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          <div className="text-[10px] uppercase text-slate-500 dark:text-[#9EDCFF]/80">
            {healthy ? 'Reserve surplus' : 'Reserve shortfall'}
          </div>
          <div className="font-orbitron text-sm font-bold text-[#071544] dark:text-white">
            {monthly > 0 ? formatRWF(Math.abs(diff), hideFinancials) : '—'}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-300 flex items-start gap-1.5">
        {healthy ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        )}
        <span>
          Formula: monthly essential expenses × 6 = six-month reserve target. Expected future sales and
          receivables are not counted as cash. This is a planning estimate, not a guarantee that the business
          will survive.
        </span>
      </p>
    </div>
  )
}

