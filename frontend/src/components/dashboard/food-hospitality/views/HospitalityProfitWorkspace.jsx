import React, { useState } from 'react'
import {
  DollarSign,
  TrendingUp,
  Scale,
  BedDouble,
  UtensilsCrossed,
  Percent,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'

export default function HospitalityProfitWorkspace() {
  const { demoWorkspaces } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const menuList = archData.records?.MenuItems || []
  const roomsList = archData.records?.Rooms || []
  const foliosList = archData.records?.GuestFolios || []
  const wasteList = archData.records?.WasteLogs || []

  // Simulation Calculator State
  const [diningRevenue, setDiningRevenue] = useState('3200000')
  const [roomRevenue, setRoomRevenue] = useState('2400000')
  const [ingredientCost, setIngredientCost] = useState('1100000')
  const [laborOverhead, setLaborOverhead] = useState('1400000')
  const [utilitiesOverhead, setUtilitiesOverhead] = useState('450000')

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  // Calculations
  const dRev = Number(diningRevenue) || 0
  const rRev = Number(roomRevenue) || 0
  const ingCost = Number(ingredientCost) || 0
  const labCost = Number(laborOverhead) || 0
  const utilCost = Number(utilitiesOverhead) || 0

  const totalGrossRevenue = dRev + rRev
  const totalOperatingCosts = ingCost + labCost + utilCost
  const netOperatingProfit = totalGrossRevenue - totalOperatingCosts
  const overallMarginPercent = totalGrossRevenue > 0
    ? ((netOperatingProfit / totalGrossRevenue) * 100).toFixed(1)
    : 0

  // Food Cost %
  const actualFoodCostPercent = dRev > 0 ? ((ingCost / dRev) * 100).toFixed(1) : '31.8'
  const isHealthyFoodCost = Number(actualFoodCostPercent) <= 35.0

  // RevPAR (Revenue per available room)
  const totalRoomsCount = Math.max(1, roomsList.length)
  const revPAR = rRev > 0 ? Math.round(rRev / (totalRoomsCount * 30)) : 28000

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1a1206]/80 to-yellow-950/60 border border-amber-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Pillar 08 · Hospitality Economics &amp; Margin Simulator
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Real Food &amp; Hospitality Profit Engine
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Compare dining revenue against recipe ingredient costs, staff payroll, and room yields
          </p>
        </div>
      </div>

      {/* KPI Benchmarks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Actual Kitchen Food Cost %
          </span>
          <div className={`text-2xl font-bold font-orbitron mt-1 ${isHealthyFoodCost ? 'text-emerald-400' : 'text-amber-400'}`}>
            {actualFoodCostPercent}%
          </div>
          <span className="text-[10px] text-slate-400">Target benchmark: 28% – 35%</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Monthly RevPAR (Room Yield)
          </span>
          <div className="text-2xl font-bold font-orbitron text-sky-400 mt-1">
            {formatRWF(revPAR)} / night
          </div>
          <span className="text-[10px] text-slate-400">Revenue per available room</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Net Operating Margin
          </span>
          <div className={`text-2xl font-bold font-orbitron mt-1 ${Number(overallMarginPercent) > 25 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {overallMarginPercent}%
          </div>
          <span className="text-[10px] text-slate-400">After food, labor &amp; utilities</span>
        </div>
      </div>

      {/* Interactive Simulator */}
      <div className="p-6 rounded-3xl border border-white/10 bg-[#0f0b04]/80 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Interactive Monthly Profit Simulator</span>
            </h3>
            <p className="text-xs text-slate-400">
              Adjust your monthly numbers to test the financial viability of your dining and rooms
            </p>
          </div>

          <span className="font-orbitron font-extrabold text-lg text-emerald-400">
            +{formatRWF(netOperatingProfit)} Net Profit
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Restaurant / Dining Revenue</label>
            <input
              type="number"
              value={diningRevenue}
              onChange={(e) => setDiningRevenue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Rooms &amp; Accommodation Revenue</label>
            <input
              type="number"
              value={roomRevenue}
              onChange={(e) => setRoomRevenue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Raw Ingredient &amp; Food Costs</label>
            <input
              type="number"
              value={ingredientCost}
              onChange={(e) => setIngredientCost(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Kitchen &amp; Hotel Staff Payroll</label>
            <input
              type="number"
              value={laborOverhead}
              onChange={(e) => setLaborOverhead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Electricity, Gas &amp; Laundry Utilities</label>
            <input
              type="number"
              value={utilitiesOverhead}
              onChange={(e) => setUtilitiesOverhead(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono outline-none"
            />
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 uppercase">Estimated Monthly Profit</span>
            <span className="font-orbitron font-extrabold text-base text-emerald-400 mt-0.5">
              {formatRWF(netOperatingProfit)} ({overallMarginPercent}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

