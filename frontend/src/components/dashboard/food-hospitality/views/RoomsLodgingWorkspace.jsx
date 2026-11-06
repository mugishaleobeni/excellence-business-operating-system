import React, { useState } from 'react'
import {
  BedDouble,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Phone,
  DollarSign,
  Search
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import CheckInGuestModal from '../modals/CheckInGuestModal'

export default function RoomsLodgingWorkspace({ activePage = 'Rooms Register' }) {
  const { demoWorkspaces, addDemoRecord, updateDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const roomsList = archData.records?.Rooms || []
  const foliosList = archData.records?.GuestFolios || []

  const isReservationsView = activePage === 'Reservations & Check-In'

  const [modalOpen, setModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState(() => (isReservationsView ? 'Reserved' : 'All'))

  // Keep filter in sync if activePage switches
  React.useEffect(() => {
    if (isReservationsView) {
      setStatusFilter('Reserved')
    } else {
      setStatusFilter('All')
    }
  }, [isReservationsView])

  const totalRooms = roomsList.length
  const occupiedCount = roomsList.filter((r) => r.status === 'Occupied').length
  const availableCount = roomsList.filter((r) => r.status === 'Available').length
  const cleaningCount = roomsList.filter((r) => r.status === 'Cleaning').length
  const reservedCount = roomsList.filter((r) => r.status === 'Reserved').length

  const handleCheckInGuest = (checkInData) => {
    // 1. Update Room status to 'Occupied'
    updateDemoRecord('food-and-hospitality', 'Rooms', checkInData.roomId, {
      status: 'Occupied',
      guestName: checkInData.guestName,
      checkInDate: checkInData.checkInDate,
      checkOutDate: checkInData.checkOutDate
    })

    // 2. Create Guest Folio
    const newFolio = {
      id: `FOL-${checkInData.roomNumber}-${Math.floor(10 + Math.random() * 90)}`,
      roomNumber: checkInData.roomNumber,
      roomId: checkInData.roomId,
      guestName: checkInData.guestName,
      phone: checkInData.guestPhone,
      nationalIdOrPassport: checkInData.nationalIdOrPassport,
      checkInDate: checkInData.checkInDate,
      checkOutDate: checkInData.checkOutDate,
      nights: checkInData.nights,
      nightlyRateRWF: checkInData.nightlyRateRWF,
      roomChargesRWF: checkInData.totalRoomChargeRWF,
      diningChargesRWF: 0,
      laundryExtrasRWF: 0,
      totalFolioRWF: checkInData.totalRoomChargeRWF,
      paidDepositRWF: checkInData.depositPaidRWF,
      balanceDueRWF: checkInData.balanceDueRWF,
      status: 'Active Stay'
    }
    addDemoRecord('food-and-hospitality', 'GuestFolios', newFolio)

    // 3. If advance deposit paid, record cash transaction
    if (checkInData.depositPaidRWF > 0) {
      addTransaction({
        architectureId: 'food-and-hospitality',
        title: `Room Deposit: ${checkInData.guestName} (Room ${checkInData.roomNumber})`,
        type: 'in',
        category: 'Lodging Accommodation Revenue',
        amountRWF: checkInData.depositPaidRWF,
        account: 'MTN MoMo Business',
        source: `Room ${checkInData.roomNumber}`
      })
    }
  }

  const handleMarkCleaned = (room) => {
    updateDemoRecord('food-and-hospitality', 'Rooms', room.id, {
      status: 'Available',
      guestName: null,
      checkInDate: null,
      checkOutDate: null
    })
  }

  const filteredRooms = roomsList.filter((r) => {
    if (statusFilter === 'All') return true
    return r.status === statusFilter
  })

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-white/[0.03] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
            {isReservationsView ? 'Reservations & Check-In' : 'Pillar 05 · Accommodation & Housekeeping'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            {isReservationsView ? 'Reservations, Arrivals & Check-In' : 'Guest Rooms Directory & Occupancy'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {isReservationsView
              ? `${reservedCount} Reserved · ${occupiedCount} Currently Staying · Direct check-in & key issuance`
              : `${occupiedCount} Occupied · ${availableCount} Clean & Ready · ${cleaningCount} Cleaning Turnaround`}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Check-In Guest</span>
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {['All', 'Available', 'Occupied', 'Cleaning', 'Reserved'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              statusFilter === st
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center">
            <BedDouble className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Rooms Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Switch preset to Hotel/Lodge or click below to check in your first guest.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
          >
            Check In Guest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isOccupied = room.status === 'Occupied'
            const isCleaning = room.status === 'Cleaning'
            const isReserved = room.status === 'Reserved'
            const isAvailable = room.status === 'Available'

            return (
              <div
                key={room.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3.5 shadow-lg ${
                  isOccupied
                    ? 'bg-gradient-to-b from-[#091b29] to-[#040d14] border-sky-400/50'
                    : isCleaning
                    ? 'bg-gradient-to-b from-[#1f1705] to-[#0f0b03] border-amber-400/50'
                    : 'bg-[#061019]/70 border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-extrabold text-lg text-white">
                      Room {room.roomNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isOccupied
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                          : isCleaning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : isReserved
                          ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {room.roomType} · {room.floor || 'Floor 1'}
                  </span>
                </div>

                {/* Guest / Occupancy Info */}
                {isOccupied ? (
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate">{room.guestName || 'Registered Guest'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Stay Duration:</span>
                      <span className="font-mono text-slate-300">{room.checkInDate} → {room.checkOutDate}</span>
                    </div>
                  </div>
                ) : isCleaning ? (
                  <div className="p-3 text-center rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-300 text-xs flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Housekeeping in Progress</span>
                  </div>
                ) : isReserved ? (
                  <div className="p-3 text-center rounded-2xl bg-purple-500/10 border border-purple-400/20 text-purple-300 text-xs">
                    Reserved for {room.guestName || 'Upcoming Arrival'}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 text-emerald-400 text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Ready for Next Guest</span>
                  </div>
                )}

                {/* Nightly Rate & Action */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Nightly Rate</span>
                    <span className="font-mono font-bold text-white text-xs">
                      {formatRWF(room.ratePerNightRWF)}
                    </span>
                  </div>

                  {isCleaning && (
                    <button
                      type="button"
                      onClick={() => handleMarkCleaned(room)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </button>
                  )}

                  {isAvailable && (
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] flex items-center gap-1"
                    >
                      <span>Check In</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Check In Modal */}
      <CheckInGuestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        rooms={roomsList}
        onCheckInGuest={handleCheckInGuest}
      />
    </div>
  )
}

