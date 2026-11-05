import React, { useState } from 'react'
import { X, Check, DollarSign, Tag, Users, AlertCircle } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'

export default function SellAnimalModal({
  isOpen,
  onClose,
  animalsList = [],
  batchesList = [],
  productionList = [],
  customersList = [],
  onSaveSale
}) {
  const [saleCategory, setSaleCategory] = useState('animal') // 'animal' | 'batch' | 'produce'
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedProduceId, setSelectedProduceId] = useState('')
  const [unitsSold, setUnitsSold] = useState('1')
  const [sellingPriceRWF, setSellingPriceRWF] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [amountPaidRWF, setAmountPaidRWF] = useState('')
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const targetAnimal = animalsList.find((a) => a.id === selectedAnimalId) || animalsList[0] || {}
  const targetBatch = batchesList.find((b) => b.id === selectedBatchId) || batchesList[0] || {}
  const targetProduce = productionList.find((p) => p.id === selectedProduceId) || productionList[0] || {}

  const totalPrice = Number(sellingPriceRWF) || 0
  const paidPrice = Number(amountPaidRWF) || 0
  const customerDebt = Math.max(0, totalPrice - paidPrice)

  const handleSubmit = (e) => {
    e.preventDefault()
    let itemTitle = ''
    let sourceId = ''
    let costBasis = 0

    if (saleCategory === 'animal') {
      itemTitle = `Live Animal: ${targetAnimal.name} (${targetAnimal.breed})`
      sourceId = targetAnimal.id
      costBasis = targetAnimal.totalRaisedCostRWF || targetAnimal.purchasePriceRWF || 0
    } else if (saleCategory === 'batch') {
      itemTitle = `Batch Sale: ${unitsSold} heads from ${targetBatch.name}`
      sourceId = targetBatch.id
      costBasis = (Number(targetBatch.unitCostRWF) || 0) * (Number(unitsSold) || 1)
    } else {
      itemTitle = `Farm Produce: ${unitsSold} ${targetProduce.unit || 'units'} of ${targetProduce.item}`
      sourceId = targetProduce.id
      costBasis = 0
    }

    if (onSaveSale) {
      onSaveSale({
        id: `SAL-${Math.floor(100 + Math.random() * 900)}`,
        saleCategory,
        title: itemTitle,
        sourceId,
        unitsSold: Number(unitsSold) || 1,
        totalPriceRWF: totalPrice,
        costBasisRWF: costBasis,
        realProfitRWF: totalPrice - costBasis,
        amountPaidRWF: paidPrice,
        debtRemainingRWF: customerDebt,
        buyerName: buyerName.trim() || 'Walk-in Farm Customer',
        buyerPhone: buyerPhone.trim(),
        date: saleDate,
        notes: notes.trim()
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
              <span>Record Farm Sale &amp; Customer Debt</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Pillar 09
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Live animal or yield sales with instant customer debt ledger tracking
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
            <label className="block text-xs font-medium text-slate-300 mb-1">What are you selling? *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSaleCategory('animal')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  saleCategory === 'animal'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                Live Animal
              </button>
              <button
                type="button"
                onClick={() => setSaleCategory('batch')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  saleCategory === 'batch'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                Batch / Flock
              </button>
              <button
                type="button"
                onClick={() => setSaleCategory('produce')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  saleCategory === 'produce'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}
              >
                Eggs / Milk / Honey
              </button>
            </div>
          </div>

          {saleCategory === 'animal' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Select Animal *</label>
              <CustomSelect
                value={selectedAnimalId || targetAnimal.id}
                onChange={setSelectedAnimalId}
                options={animalsList.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.id} · ${a.currentWeightKg || a.startingWeightKg || 0} kg)`
                }))}
                placeholder="Select live animal to sell..."
              />
            </div>
          )}

          {saleCategory === 'batch' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Batch *</label>
                <CustomSelect
                  value={selectedBatchId || targetBatch.id}
                  onChange={setSelectedBatchId}
                  options={batchesList.map((b) => ({
                    value: b.id,
                    label: `${b.name} (${b.quantity} heads left)`
                  }))}
                  placeholder="Select batch..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Heads to Sell *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={unitsSold}
                  onChange={(e) => setUnitsSold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>
            </div>
          )}

          {saleCategory === 'produce' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Select Yield in Storage *</label>
                <CustomSelect
                  value={selectedProduceId || targetProduce.id}
                  onChange={setSelectedProduceId}
                  options={productionList.map((p) => ({
                    value: p.id,
                    label: `${p.item} (${p.quantity} ${p.unit} available)`
                  }))}
                  placeholder="Select produce..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Quantity to Sell *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={unitsSold}
                  onChange={(e) => setUnitsSold(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer / Buyer Name *</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Kigali Butchery, Alice"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Buyer Phone</label>
              <input
                type="text"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="e.g. +250 788 000 000"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-emerald-300 mb-1">Agreed Selling Price (RWF) *</label>
              <input
                type="number"
                min="0"
                required
                value={sellingPriceRWF}
                onChange={(e) => setSellingPriceRWF(e.target.value)}
                placeholder="e.g. 380000"
                className="w-full px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-white font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amount Paid Today (RWF) *</label>
              <input
                type="number"
                min="0"
                required
                value={amountPaidRWF}
                onChange={(e) => setAmountPaidRWF(e.target.value)}
                placeholder="e.g. 250000"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Date of Sale</label>
            <CustomDateInput
              value={saleDate}
              onChange={setSaleDate}
            />
          </div>

          {customerDebt > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
              <span className="font-semibold">Unpaid Customer Debt Logged:</span>
              <span className="font-mono font-bold text-white text-sm">
                {customerDebt.toLocaleString()} RWF
              </span>
            </div>
          )}

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
              <span>Record Sale</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

