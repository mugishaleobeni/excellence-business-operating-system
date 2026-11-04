import React, { useState } from 'react'
import {
  X,
  Calendar,
  Heart,
  DollarSign,
  Scale,
  Activity,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { getCategoryByAnimalType } from './animalConstants'

export default function AnimalProfileModal({
  isOpen,
  onClose,
  animal,
  onEdit,
  onRecordWeight,
  onRecordBreeding,
  onDelete,
  hideFinancials = false
}) {
  if (!isOpen || !animal) return null

  const [activeTab, setActiveTab] = useState('overview')
  const categoryInfo = getCategoryByAnimalType(animal.animalType)

  // Calculate days remaining to expected birth date if pregnant
  let daysToBirth = null
  if (animal.expectedBirthDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const birthDate = new Date(animal.expectedBirthDate)
    if (!isNaN(birthDate.getTime())) {
      const diffTime = birthDate.getTime() - today.getTime()
      daysToBirth = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#03091F]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        
        {/* Header Hero */}
        <div className="p-6 bg-gradient-to-r from-white/10 via-white/5 to-transparent border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#218DFF]/25 border border-[#218DFF]/50 flex items-center justify-center text-3xl shadow-lg shrink-0">
              {categoryInfo.icon || '🐾'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-[#9EDCFF] border border-white/20">
                  {animal.animalId || animal.id}
                </span>
                <span
                  className={`text-[10px] font-orbitron font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    animal.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : animal.status === 'Sold'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {animal.status || 'Active'}
                </span>
                {animal.registrationMode === 'group' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Group · {animal.quantity} Head
                  </span>
                )}
              </div>

              <h2 className="font-orbitron text-lg sm:text-2xl font-extrabold text-white mt-1">
                {animal.title || animal.name || `${animal.breed} ${animal.animalType}`}
              </h2>
              <p className="text-xs text-slate-300">
                {animal.breed} {animal.animalType} · Purpose: <strong>{animal.purpose || 'Breeding'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-black/25 border-b border-white/10 shrink-0">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">Sex</span>
            <span className="font-bold text-sm text-white">{animal.sex || 'Unknown'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">Age</span>
            <span className="font-bold text-sm text-white">{animal.age || '—'}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">Weight</span>
            <span className="font-bold text-sm text-emerald-400">
              {animal.weightKg ? `${animal.weightKg} kg` : 'Not recorded'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF] block">Origin</span>
            <span className="font-bold text-sm text-white">{animal.origin || 'Purchased'}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/10 px-6 bg-black/20 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview &amp; Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purchase')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'purchase'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Purchase &amp; Financials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('breeding')}
            className={`py-3 px-3.5 border-b-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'breeding'
                ? 'border-[#218DFF] text-[#9EDCFF]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Breeding &amp; Offspring
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-orbitron font-bold text-[#9EDCFF] block">
                    Physical Characteristics
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Species:</span>
                      <span className="font-semibold">{animal.animalType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Breed:</span>
                      <span className="font-semibold">{animal.breed}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Color / Coat:</span>
                      <span className="font-semibold">{animal.color || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Current Weight:</span>
                      <span className="font-semibold text-emerald-400">
                        {animal.weightKg ? `${animal.weightKg} kg` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="text-xs font-orbitron font-bold text-[#9EDCFF] block">
                    Housing &amp; Farm Status
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Registration Date:</span>
                      <span className="font-semibold">{animal.date}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Location / Pen:</span>
                      <span className="font-semibold">{animal.housing || 'Main Pen / Shed'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Head Count:</span>
                      <span className="font-semibold">{animal.quantity || 1}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Life Status:</span>
                      <span className="font-semibold text-emerald-400">{animal.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {animal.notes && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-xs font-orbitron font-bold text-[#9EDCFF] block">
                    Notes &amp; Observations
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{animal.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-orbitron font-bold text-emerald-400">
                    Acquisition &amp; Valuation
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Origin: {animal.origin || 'Purchased'}
                  </span>
                </div>

                {animal.origin === 'Purchased' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Purchase Price:</span>
                        <span className="font-orbitron font-bold text-sm text-white">
                          {formatRWF(animal.purchasePriceRWF || animal.amountRWF, hideFinancials)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Amount Paid:</span>
                        <span className="font-bold text-emerald-400">
                          {formatRWF(animal.amountPaidRWF, hideFinancials)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Remaining Balance:</span>
                        <span className={`font-bold ${Number(animal.remainingBalanceRWF) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {formatRWF(animal.remainingBalanceRWF, hideFinancials)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Payment Status:</span>
                        <span className="font-semibold">{animal.paymentStatus || 'Paid'}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Seller / Vendor:</span>
                        <span className="font-bold text-white">{animal.sellerName || 'Direct Vendor'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Seller Phone:</span>
                        <span className="font-semibold">{animal.sellerPhone || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Seller Location:</span>
                        <span className="font-semibold">{animal.sellerLocation || '—'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Purchase Date:</span>
                        <span className="font-semibold">{animal.purchaseDate || animal.date}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
                    <p>
                      This animal was <strong>{animal.origin}</strong> on the farm. No purchase invoice or supplier debt was registered.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'breeding' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-orbitron font-bold text-[#9EDCFF]">
                    Reproductive Status &amp; Offspring
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF]">
                    {animal.breedingStatus || 'Ready for Breeding'}
                  </span>
                </div>

                {/* Pregnant countdown alert banner if pregnant */}
                {animal.expectedBirthDate && daysToBirth !== null && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-400/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-orbitron uppercase text-emerald-400 block font-bold">
                        Expected {categoryInfo.gestationTerm || 'Birth'} Date
                      </span>
                      <strong className="text-base text-white font-orbitron">
                        {animal.expectedBirthDate}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-orbitron text-emerald-300">
                        {daysToBirth > 0 ? `${daysToBirth} Days` : 'Due / Passed'}
                      </span>
                      <span className="block text-[10px] text-slate-300">Countdown</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Last Service / Mating:</span>
                      <span className="font-semibold">{animal.lastMatingDate || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Sire / Mating Partner:</span>
                      <span className="font-semibold">{animal.matingPartner || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Mating Method:</span>
                      <span className="font-semibold">{animal.matingMethod || 'Natural'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Previous Litters / Calvings:</span>
                      <span className="font-bold text-white">{animal.previousLitters || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Total Offspring Born:</span>
                      <span className="font-bold text-emerald-400">{animal.totalOffspring || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Born Alive:</span>
                      <span className="font-bold text-emerald-400">{animal.bornAlive || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Stillborn:</span>
                      <span className="font-bold text-rose-400">{animal.stillborn || 0}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-slate-400">Weaned:</span>
                      <span className="font-bold text-[#9EDCFF]">{animal.weaned || 0}</span>
                    </div>
                  </div>
                </div>

                {animal.breedingNotes && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300">
                    <strong className="block text-[10px] uppercase font-bold text-[#9EDCFF] mb-1">
                      Breeding Observations
                    </strong>
                    {animal.breedingNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/15 p-4 sm:p-5 bg-white/5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onDelete && onDelete(animal)
                onClose()
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Animal</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onRecordWeight && onRecordWeight(animal)
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#9EDCFF] flex items-center gap-1.5 cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Record Weight</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRecordBreeding && onRecordBreeding(animal)
              }}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-[#9EDCFF] flex items-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Record Breeding</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEdit && onEdit(animal)
                onClose()
              }}
              className="btn-sapphire-clean px-5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Animal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

