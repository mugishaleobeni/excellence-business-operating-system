import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  DollarSign,
  TrendingUp,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'

export default function OptionalSurvivalWorkspace() {
  const { demoWorkspaces, transactions } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const animalsList = archData.records?.Animals || []
  const batchesList = archData.records?.Batches || []
  const feedList = archData.records?.Feeds || []

  // User preference: optional tool state (defaults to active, but can be turned off)
  const [toolEnabled, setToolEnabled] = useState(true)

  // Monthly Farm Burn Rate Parameters
  const [monthlyFeedCost, setMonthlyFeedCost] = useState('650000')
  const [monthlyVetLabor, setMonthlyVetLabor] = useState('250000')
  const [liquidReservesRWF, setLiquidReservesRWF] = useState('4200000')

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  const mFeed = Number(monthlyFeedCost) || 0
  const mVetLabor = Number(monthlyVetLabor) || 0
  const mBurn = mFeed + mVetLabor
  const reserves = Number(liquidReservesRWF) || 0

  const sixMonthNeed = mBurn * 6
  const runwayMonths = mBurn > 0 ? (reserves / mBurn).toFixed(1) : '6.0'
  const runwayStatus = Number(runwayMonths) >= 6 ? 'green' : Number(runwayMonths) >= 3 ? 'yellow' : 'red'

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Optional Decision Tool · Six-Month Runway
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Six-Month Survival Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Evaluate whether your farm has sufficient liquid capital to feed and maintain livestock for 6 months without emergency sales
          </p>
        </div>

        {/* Enable / Disable Tool Toggle */}
        <button
          onClick={() => setToolEnabled(!toolEnabled)}
          className={`px-4 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto ${
            toolEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              : 'bg-white/5 text-slate-400 border-white/10'
          }`}
        >
          {toolEnabled ? (
            <>
              <ToggleRight className="w-5 h-5 text-emerald-400" />
              <span>Tool Active</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-slate-500" />
              <span>Tool Paused</span>
            </>
          )}
        </button>
      </div>

      {!toolEnabled ? (
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Survival Intelligence is Currently Paused
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You can use standard livestock, feed, and sales modules without runway checks. Click "Tool Paused" above whenever you want to activate survival simulations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-xl ${
              runwayStatus === 'green'
                ? 'bg-emerald-950/40 border-emerald-400/40 text-emerald-200'
                : runwayStatus === 'yellow'
                ? 'bg-amber-950/40 border-amber-400/40 text-amber-200'
                : 'bg-rose-950/40 border-rose-400/40 text-rose-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    runwayStatus === 'green'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                      : runwayStatus === 'yellow'
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-rose-500 text-slate-950 border-rose-300'
                  }`}
                >
                  {runwayStatus === 'green' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <ShieldAlert className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {runwayStatus === 'green'
                      ? 'Survival Status: Green (Full 6-Month Security)'
                      : runwayStatus === 'yellow'
                      ? 'Survival Status: Yellow (3 to 5 Months Reserve)'
                      : 'Survival Status: Red (Critical Feed Vulnerability)'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    {runwayStatus === 'green'
                      ? 'Your liquid farm capital guarantees all animals can be fed and medically treated for over 6 full months without relying on forced animal discounting.'
                      : runwayStatus === 'yellow'
                      ? 'Your farm has between 3 and 5 months of feed reserves. Avoid purchasing new breeding stock until liquid feed reserves reach the 6-month threshold.'
                      : 'Urgent: Farm liquid reserves are below 3 months. Risk of emergency liquidation. Focus working capital strictly on daily feed rations.'}
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Runway Duration
                </span>
                <span className="text-2xl font-bold font-mono text-white">
                  {runwayMonths} Months
                </span>
              </div>
            </div>
          </div>

          {/* Capital & Burn Rate Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Monthly Feed Need
              </span>
              <input
                type="number"
                value={monthlyFeedCost}
                onChange={(e) => setMonthlyFeedCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400 block">
                Based on current ration consumption
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Monthly Labor &amp; Health
              </span>
              <input
                type="number"
                value={monthlyVetLabor}
                onChange={(e) => setMonthlyVetLabor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-white font-mono text-sm"
              />
              <span className="text-[10px] text-slate-400 block">
                Staff wages, bedding &amp; routine vaccines
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider block">
                Liquid Working Capital
              </span>
              <input
                type="number"
                value={liquidReservesRWF}
                onChange={(e) => setLiquidReservesRWF(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 font-mono text-sm font-bold"
              />
              <span className="text-[10px] text-slate-400 block">
                Required for 6 months: {formatRWF(sixMonthNeed)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
