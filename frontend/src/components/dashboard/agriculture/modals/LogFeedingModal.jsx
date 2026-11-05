import React, { useState } from 'react'
import { X, Check, Scale, Calendar, Package } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function LogFeedingModal({
  isOpen,
  onClose,
  feedStockList = [],
  onSaveFeeding
}) {
  const [selectedFeedId, setSelectedFeedId] = useState('')
  const [targetGroup, setTargetGroup] = useState('All Breeding Sows & Boars')
  const [headCount, setHeadCount] = useState('10')
  const [rationPerHeadKg, setRationPerHeadKg] = useState('2.0')
  const [feedDate, setFeedDate] = useState(() => new Date().toISOString().split('T')[0])

  if (!isOpen) return null

  const selectedFeed = feedStockList.find((f) => f.id === selectedFeedId) || feedStockList[0] || {}
  const heads = Math.max(1, parseInt(headCount, 10) || 1)
  const ration = Math.max(0, parseFloat(rationPerHeadKg) || 0)
  const totalDailyKg = heads * ration
  const costPerKg = selectedFeed.costPerKgRWF || 500
  const totalCost = totalDailyKg * costPerKg

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveFeeding) {
      onSaveFeeding({
        feedId: selectedFeed.id,
        feedName: selectedFeed.name || 'Standard Pellets',
        targetGroup: targetGroup.trim(),
        headCount: heads,
        rationPerHeadKg: ration,
        totalKgUsed: totalDailyKg,
        costPerKgRWF: costPerKg,
        totalCostRWF: totalCost,
        date: feedDate
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Log Daily Feeding Ration</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 04
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Calculate daily kg, cost impact &amp; feed inventory depletion
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Feed Type from Inventory *
            </label>
            <CustomSelect
              value={selectedFeedId || selectedFeed.id}
              onChange={setSelectedFeedId}
              options={feedStockList.map((f) => ({
                value: f.id,
                label: `${f.name} (${f.currentStockKg} kg left · ${f.costPerKgRWF} RWF/kg)`
              }))}
              placeholder="Select feed from inventory..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Animal Group / Pen *
            </label>
            <input
              type="text"
              required
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              placeholder="e.g. Breeding Pen 1, Broilers Shed A"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Number of Heads *
              </label>
              <input
                type="number"
                min="1"
                required
                value={headCount}
                onChange={(e) => setHeadCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ration (kg/head/day) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.05"
                required
                value={rationPerHeadKg}
                onChange={(e) => setRationPerHeadKg(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Feeding Date
            </label>
            <CustomDateInput
              value={feedDate}
              onChange={setFeedDate}
            />
          </div>

          {/* Live Calculation Preview Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Daily Feed Required:</span>
              <span className="font-bold text-white">{totalDailyKg} kg / day</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Weekly Feed (7 Days):</span>
              <span className="font-semibold text-emerald-300">{totalDailyKg * 7} kg</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Monthly Feed (30 Days):</span>
              <span className="font-semibold text-sky-300">{totalDailyKg * 30} kg</span>
            </div>
            <div className="pt-1.5 border-t border-emerald-500/20 flex justify-between font-bold">
              <span className="text-emerald-300">Estimated Daily Feed Cost:</span>
              <span className="text-white">{Number(totalCost).toLocaleString()} RWF</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Record Feeding</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

