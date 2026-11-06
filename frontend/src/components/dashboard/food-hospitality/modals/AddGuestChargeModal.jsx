import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Receipt, DollarSign, UtensilsCrossed } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import MoneyInput from '../../../common/MoneyInput'

const CHARGE_CATEGORIES = [
  { value: 'Restaurant & Bar', label: 'Restaurant & Dining Tab' },
  { value: 'Room Service', label: 'Room Service Order' },
  { value: 'Laundry Service', label: 'Laundry & Dry Cleaning' },
  { value: 'Minibar & Snacks', label: 'Minibar Consumption' },
  { value: 'Conference / Meeting Room', label: 'Meeting Room Hire' },
  { value: 'Airport Transfer', label: 'Transport / Shuttle' }
]

export default function AddGuestChargeModal({
  isOpen,
  onClose,
  activeFolios = [],
  onPostCharge
}) {
  const [folioId, setFolioId] = useState(activeFolios[0]?.id || '')
  const [chargeCategory, setChargeCategory] = useState('Restaurant & Bar')
  const [description, setDescription] = useState('')
  const [amountRWF, setAmountRWF] = useState('')

  if (!isOpen) return null

  const targetFolio = activeFolios.find((f) => f.id === folioId) || activeFolios[0] || {}
  const amountNum = Number(amountRWF) || 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!targetFolio.id || amountNum <= 0) return

    if (onPostCharge) {
      onPostCharge({
        folioId: targetFolio.id,
        roomNumber: targetFolio.roomNumber,
        guestName: targetFolio.guestName,
        chargeCategory,
        description: description.trim() || chargeCategory,
        amountRWF: amountNum,
        postedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-400/30 bg-[#120e06]/95 text-white shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/70 via-[#221808]/80 to-yellow-950/70">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Post Charge to Room Folio</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Pillar 07
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Charge dining, room service, or laundry directly to active guest bill
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Guest Room Folio *</label>
            {activeFolios.length > 0 ? (
              <CustomSelect
                value={folioId}
                onChange={setFolioId}
                options={activeFolios.map((f) => ({
                  value: f.id,
                  label: `Room ${f.roomNumber} · ${f.guestName} (${Number(f.balanceDueRWF || 0).toLocaleString()} RWF Due)`
                }))}
              />
            ) : (
              <p className="text-xs text-amber-400 p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/20">
                No active checked-in guest folios available. Check in a guest first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Charge Department *</label>
            <CustomSelect
              value={chargeCategory}
              onChange={setChargeCategory}
              options={CHARGE_CATEGORIES}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Charge Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2x Tilapia Platters &amp; Beverages"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Charge Amount (RWF) *</label>
            <MoneyInput
              value={amountRWF}
              onChange={setAmountRWF}
              placeholder="e.g. 24,500 RWF"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={activeFolios.length === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Post to Guest Folio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

