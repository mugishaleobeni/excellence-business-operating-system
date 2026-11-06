import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Scale, Calendar, Package, Clock, AlertTriangle, Users, Tag } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function LogFeedingModal({
  isOpen,
  onClose,
  feedStockList = [],
  animalsList = [],
  batchesList = [],
  onSaveFeeding
}) {
  const [consumerMode, setConsumerMode] = useState('batch') // 'batch' | 'individual' | 'custom'
  const [selectedBatchId, setSelectedBatchId] = useState(() => batchesList[0]?.id || '')
  const [selectedAnimalId, setSelectedAnimalId] = useState(() => animalsList[0]?.id || '')
  const [customGroup, setCustomGroup] = useState('')
  const [selectedFeedId, setSelectedFeedId] = useState(() => feedStockList[0]?.id || '')
  const [headCount, setHeadCount] = useState(() => {
    if (batchesList[0]) return String(batchesList[0].quantity || 14)
    return '10'
  })
  const [rationPerHeadKg, setRationPerHeadKg] = useState('2.0')
  const [feedDate, setFeedDate] = useState(() => new Date().toISOString().split('T')[0])

  const selectedFeed = feedStockList.find((f) => f.id === selectedFeedId) || feedStockList[0] || {}
  const heads = Math.max(1, parseInt(headCount, 10) || 1)
  const ration = Math.max(0.01, parseFloat(rationPerHeadKg) || 0.1)
  const totalDailyKg = Math.round(heads * ration * 100) / 100
  const costPerKg = selectedFeed.costPerKgRWF || 520
  const totalCost = Math.round(totalDailyKg * costPerKg)

  const currentStock = Number(selectedFeed.currentStockKg) || 0
  const daysLeft = totalDailyKg > 0 ? Math.floor(currentStock / totalDailyKg) : 0
  const depletionDate = daysLeft <= 0
    ? 'Immediate Depletion'
    : (() => {
        const d = new Date()
        d.setDate(d.getDate() + daysLeft)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      })()

  // Get consumer display name
  let consumerName = 'Flock / Pen Batch'
  if (consumerMode === 'batch') {
    const b = batchesList.find((item) => item.id === selectedBatchId)
    consumerName = b ? `${b.name} (${b.quantity} heads)` : 'Flock / Pen Batch'
  } else if (consumerMode === 'individual') {
    const a = animalsList.find((item) => item.id === selectedAnimalId)
    consumerName = a ? `${a.name} (${a.type} · ${a.id})` : 'Individual Animal'
  } else {
    consumerName = customGroup.trim() || 'Custom Group'
  }

  const handleBatchChange = (batchId) => {
    setSelectedBatchId(batchId)
    const b = batchesList.find((item) => item.id === batchId)
    if (b) {
      setHeadCount(String(b.quantity || 10))
      if (b.type === 'Chickens') setRationPerHeadKg('0.125')
      else if (b.type === 'Pigs') setRationPerHeadKg('2.0')
      else if (b.type === 'Cattle') setRationPerHeadKg('12.0')
    }
  }

  const handleAnimalChange = (animalId) => {
    setSelectedAnimalId(animalId)
    setHeadCount('1')
    const a = animalsList.find((item) => item.id === animalId)
    if (a) {
      if (a.type === 'Chickens') setRationPerHeadKg('0.125')
      else if (a.type === 'Pigs') setRationPerHeadKg('2.5')
      else if (a.type === 'Cattle') setRationPerHeadKg('14.0')
      else if (a.type === 'Goats' || a.type === 'Sheep') setRationPerHeadKg('1.5')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSaveFeeding) {
      onSaveFeeding({
        feedId: selectedFeed.id,
        feedName: selectedFeed.name || 'Standard Pellets',
        consumerMode,
        targetId: consumerMode === 'individual' ? selectedAnimalId : selectedBatchId,
        targetGroup: consumerName,
        headCount: heads,
        rationPerHeadKg: ration,
        totalKgUsed: totalDailyKg,
        costPerKgRWF: costPerKg,
        totalCostRWF: totalCost,
        date: feedDate,
        daysLeftAfterToday: Math.max(0, daysLeft - 1)
      })
    }
    onClose()
  }

  if (!isOpen) return null

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-emerald-400/30 bg-[#061814]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/70 via-[#0a2820]/80 to-teal-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Log Daily Feeding Ration</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 04 · Nutrition
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Assign daily ration to pigs, cattle or poultry &amp; forecast stock depletion
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
          {/* Who is eating? Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Livestock Consumer *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConsumerMode('batch')
                  if (batchesList[0]) handleBatchChange(batchesList[0].id)
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  consumerMode === 'batch'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-md font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Group / Batch</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsumerMode('individual')
                  if (animalsList[0]) handleAnimalChange(animalsList[0].id)
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  consumerMode === 'individual'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-md font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>1 Pig / Cow</span>
              </button>
              <button
                type="button"
                onClick={() => setConsumerMode('custom')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  consumerMode === 'custom'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-md font-bold'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                <span>Custom Pen</span>
              </button>
            </div>
          </div>

          {/* Consumer dropdown based on mode */}
          {consumerMode === 'batch' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Flock / Batch / Pen
              </label>
              <CustomSelect
                value={selectedBatchId}
                onChange={handleBatchChange}
                options={batchesList.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.quantity} ${b.type || 'heads'} · ${b.location || 'Barn'})`
                }))}
                placeholder="Choose batch / pen..."
              />
            </div>
          )}

          {consumerMode === 'individual' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Individual Animal
              </label>
              <CustomSelect
                value={selectedAnimalId}
                onChange={handleAnimalChange}
                options={animalsList.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.type} · ${a.breed || 'Breed'} · ${a.currentWeightKg || a.startingWeightKg || 0} kg)`
                }))}
                placeholder="Choose animal..."
              />
            </div>
          )}

          {consumerMode === 'custom' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Pen / Group Description
              </label>
              <input
                type="text"
                required
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="e.g. Piglets Weaner Pen 4, Nursery Flock"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-emerald-400 outline-none"
              />
            </div>
          )}

          {/* Feed Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Select Feed Type from Inventory *
            </label>
            <CustomSelect
              value={selectedFeedId || selectedFeed.id}
              onChange={setSelectedFeedId}
              options={feedStockList.map((f) => ({
                value: f.id,
                label: `${f.name} (${f.currentStockKg || 0} kg left · ${f.costPerKgRWF || 500} RWF/kg)`
              }))}
              placeholder="Select feed from inventory..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Active Animal Heads *
              </label>
              <input
                type="number"
                min="1"
                required
                value={headCount}
                onChange={(e) => setHeadCount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Daily Ration per Head (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={rationPerHeadKg}
                onChange={(e) => setRationPerHeadKg(e.target.value)}
                placeholder="2.0"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:border-emerald-400 outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Pigs: 2.0kg · Hens: 0.125kg · Cattle: 12kg
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Feeding Date</label>
            <CustomDateInput value={feedDate} onChange={setFeedDate} />
          </div>

          {/* Real-time Calculation & Stockout Prediction Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-black border border-emerald-500/30 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Daily Feed Intake:</span>
              <span className="font-bold text-white font-mono text-sm">
                {totalDailyKg} kg / day
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Daily Feeding Cost:</span>
              <span className="font-bold text-emerald-300 font-mono text-sm">
                {totalCost.toLocaleString()} RWF / day
              </span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Store Depletion Forecast:</span>
              </span>
              <span className="font-bold text-amber-300 font-mono">
                {daysLeft} Days Remaining ({depletionDate})
              </span>
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
              <span>Record Feeding Ration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode
}
