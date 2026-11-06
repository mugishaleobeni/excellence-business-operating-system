import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, BedDouble, Calendar, User, Phone, DollarSign } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'
import CustomDateInput from '../../../common/CustomDateInput'
import MoneyInput from '../../../common/MoneyInput'

export default function CheckInGuestModal({
  isOpen,
  onClose,
  rooms = [],
  onCheckInGuest
}) {
  const availableRooms = rooms.filter((r) => r.status === 'Available' || r.status === 'Cleaning')
  const defaultRoom = availableRooms[0] || rooms[0] || {}

  const [roomId, setRoomId] = useState(defaultRoom.id || '')
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [nationalIdOrPassport, setNationalIdOrPassport] = useState('')
  const [checkInDate, setCheckInDate] = useState(() => new Date().toISOString().split('T')[0])
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [nightlyRateRWF, setNightlyRateRWF] = useState(String(defaultRoom.ratePerNightRWF || 45000))
  const [depositPaidRWF, setDepositPaidRWF] = useState('')
  const [notes, setNotes] = useState('')

  if (!isOpen) return null

  const selectedRoom = rooms.find((r) => r.id === roomId) || defaultRoom

  // Calculate nights
  const start = new Date(checkInDate)
  const end = new Date(checkOutDate)
  const diffTime = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const rateNum = Number(nightlyRateRWF) || Number(selectedRoom.ratePerNightRWF) || 45000
  const totalRoomChargeRWF = diffTime * rateNum
  const depositNum = Number(depositPaidRWF) || 0
  const balanceDueRWF = Math.max(0, totalRoomChargeRWF - depositNum)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!guestName.trim() || !selectedRoom.id) return

    if (onCheckInGuest) {
      onCheckInGuest({
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        roomType: selectedRoom.roomType,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        nationalIdOrPassport: nationalIdOrPassport.trim(),
        checkInDate,
        checkOutDate,
        nights: diffTime,
        nightlyRateRWF: rateNum,
        totalRoomChargeRWF,
        depositPaidRWF: depositNum,
        balanceDueRWF,
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-sky-400/30 bg-[#07131d]/95 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-sky-950/70 via-[#0a2030]/80 to-blue-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Guest Check-In &amp; Folio Setup</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Pillar 06
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Assign room key, capture identification, and open active stay guest folio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Room Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Room to Assign *</label>
            <CustomSelect
              value={roomId}
              onChange={(val) => {
                setRoomId(val)
                const r = rooms.find((item) => item.id === val)
                if (r?.ratePerNightRWF) {
                  setNightlyRateRWF(String(r.ratePerNightRWF))
                }
              }}
              options={rooms.map((r) => ({
                value: r.id,
                label: `Room ${r.roomNumber} · ${r.roomType} (${r.status} · ${Number(r.ratePerNightRWF || 0).toLocaleString()} RWF/night)`
              }))}
            />
          </div>

          {/* Guest Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Guest Full Name *</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Dr. Samuel Karenzi"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">National ID / Passport Number</label>
            <input
              type="text"
              value={nationalIdOrPassport}
              onChange={(e) => setNationalIdOrPassport(e.target.value)}
              placeholder="e.g. 1 1990 8 0012345 0 12 or Passport #"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
            />
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Check-In Date *</label>
              <CustomDateInput value={checkInDate} onChange={setCheckInDate} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Expected Check-Out *</label>
              <CustomDateInput value={checkOutDate} onChange={setCheckOutDate} />
            </div>
          </div>

          {/* Rates & Deposits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Rate per Night (RWF)</label>
              <MoneyInput
                value={nightlyRateRWF}
                onChange={setNightlyRateRWF}
                placeholder="Nightly rate"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Advance Deposit Paid</label>
              <MoneyInput
                value={depositPaidRWF}
                onChange={setDepositPaidRWF}
                placeholder="Optional deposit"
              />
            </div>
          </div>

          {/* Folio Calculation Summary */}
          <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-400/20 text-xs space-y-1.5">
            <div className="flex justify-between items-center text-slate-300">
              <span>Duration:</span>
              <span className="font-bold text-white">{diffTime} Night{diffTime > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Total Room Charge:</span>
              <span className="font-bold text-white">{totalRoomChargeRWF.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between items-center text-sky-300 font-bold border-t border-white/10 pt-1.5">
              <span>Initial Balance Due on Folio:</span>
              <span className="font-orbitron">{balanceDueRWF.toLocaleString()} RWF</span>
            </div>
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
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Complete Check-In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

