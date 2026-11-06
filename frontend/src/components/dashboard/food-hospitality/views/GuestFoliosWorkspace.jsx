import React, { useState } from 'react'
import {
  Receipt,
  Plus,
  BedDouble,
  UtensilsCrossed,
  DollarSign,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Phone
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import AddGuestChargeModal from '../modals/AddGuestChargeModal'

export default function GuestFoliosWorkspace() {
  const { demoWorkspaces, updateDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const foliosList = archData.records?.GuestFolios || []
  const roomsList = archData.records?.Rooms || []

  const [chargeModalOpen, setChargeModalOpen] = useState(false)

  const activeFolios = foliosList.filter((f) => f.status === 'Active Stay')
  const totalOutstandingFolios = activeFolios.reduce((sum, f) => sum + (Number(f.balanceDueRWF) || 0), 0)

  const handlePostCharge = (chargeData) => {
    const folio = foliosList.find((f) => f.id === chargeData.folioId)
    if (!folio) return

    const newDiningCharges = (Number(folio.diningChargesRWF) || 0) + chargeData.amountRWF
    const newTotalFolio = (Number(folio.roomChargesRWF) || 0) + newDiningCharges + (Number(folio.laundryExtrasRWF) || 0)
    const newBalanceDue = Math.max(0, newTotalFolio - (Number(folio.paidDepositRWF) || 0))

    updateDemoRecord('food-and-hospitality', 'GuestFolios', folio.id, {
      diningChargesRWF: newDiningCharges,
      totalFolioRWF: newTotalFolio,
      balanceDueRWF: newBalanceDue
    })
  }

  const handleSettleFolio = (folio) => {
    // 1. Settle balance
    const settledAmount = Number(folio.balanceDueRWF) || 0
    updateDemoRecord('food-and-hospitality', 'GuestFolios', folio.id, {
      balanceDueRWF: 0,
      status: 'Settled & Checked-Out'
    })

    // 2. Mark Room as 'Cleaning'
    const room = roomsList.find((r) => r.roomNumber === folio.roomNumber || r.id === folio.roomId)
    if (room) {
      updateDemoRecord('food-and-hospitality', 'Rooms', room.id, {
        status: 'Cleaning',
        guestName: null
      })
    }

    // 3. Add transaction for settled balance
    if (settledAmount > 0) {
      addTransaction({
        architectureId: 'food-and-hospitality',
        title: `Folio Settlement: Room ${folio.roomNumber} (${folio.guestName})`,
        type: 'in',
        category: 'Hospitality Folio Revenue',
        amountRWF: settledAmount,
        account: 'MTN MoMo Business',
        source: `Room ${folio.roomNumber}`
      })
    }
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-white/[0.03] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            Pillar 07 · Consolidated Guest Invoicing
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Guest Folios (Room &amp; Dining Unified)
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Single invoice combining room night charges, restaurant dining tabs, and laundry extras
          </p>
        </div>

        <button
          onClick={() => setChargeModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Post Charge to Room</span>
        </button>
      </div>

      {/* Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Active Stay Folios
          </span>
          <div className="text-2xl font-bold font-orbitron text-white mt-1">
            {activeFolios.length} Active
          </div>
          <span className="text-[10px] text-sky-400">Guests checked in</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Outstanding Folio Balance
          </span>
          <div className="text-2xl font-bold font-orbitron text-amber-300 mt-1">
            {formatRWF(totalOutstandingFolios)}
          </div>
          <span className="text-[10px] text-amber-400">To be settled at check-out</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            Unified Billing Status
          </span>
          <div className="text-2xl font-bold font-orbitron text-emerald-400 mt-1">
            100% Synced
          </div>
          <span className="text-[10px] text-slate-400">Zero lost restaurant charges</span>
        </div>
      </div>

      {/* Folios List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
          All Guest Folios ({foliosList.length})
        </h3>

        {foliosList.length === 0 ? (
          <div className="p-8 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] space-y-2">
            <Receipt className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No Guest Folios Recorded</h4>
            <p className="text-xs text-slate-400">Check in a guest to open their first folio.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foliosList.map((folio) => {
              const isActive = folio.status === 'Active Stay'
              const roomTotal = Number(folio.roomChargesRWF) || 0
              const diningTotal = Number(folio.diningChargesRWF) || 0
              const totalAmount = Number(folio.totalFolioRWF) || roomTotal + diningTotal
              const balanceDue = Number(folio.balanceDueRWF) || 0

              return (
                <div
                  key={folio.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 shadow-xl ${
                    isActive
                      ? 'bg-gradient-to-b from-[#181105] to-[#0c0903] border-amber-400/40'
                      : 'bg-white/[0.02] border-white/10'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron font-extrabold text-base text-white">
                          Room {folio.roomNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                          {folio.id}
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 font-medium block mt-0.5">
                        {folio.guestName} {folio.phone ? `(${folio.phone})` : ''}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      }`}
                    >
                      {folio.status}
                    </span>
                  </div>

                  {/* Charges Breakdown */}
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-sky-400" />
                        <span>Room Accommodation Charge:</span>
                      </span>
                      <span className="font-mono text-white">{formatRWF(roomTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                        <span>Restaurant &amp; Bar Tab:</span>
                      </span>
                      <span className="font-mono text-amber-300">+{formatRWF(diningTotal)}</span>
                    </div>
                    {Number(folio.laundryExtrasRWF) > 0 && (
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Laundry / Minibar Extras:</span>
                        <span className="font-mono text-white">+{formatRWF(folio.laundryExtrasRWF)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1.5 border-t border-white/10">
                      <span>Advance Deposit Paid:</span>
                      <span className="font-mono text-emerald-400">-{formatRWF(folio.paidDepositRWF)}</span>
                    </div>
                  </div>

                  {/* Total & Settlement */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Balance Due</span>
                      <span className="font-orbitron font-extrabold text-base text-amber-300">
                        {formatRWF(balanceDue)}
                      </span>
                    </div>

                    {isActive && (
                      <button
                        type="button"
                        onClick={() => handleSettleFolio(folio)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Settle &amp; Check-Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <AddGuestChargeModal
        isOpen={chargeModalOpen}
        onClose={() => setChargeModalOpen(false)}
        activeFolios={activeFolios}
        onPostCharge={handlePostCharge}
      />
    </div>
  )
}

