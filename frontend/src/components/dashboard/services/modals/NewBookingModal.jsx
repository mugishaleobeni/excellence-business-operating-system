import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Calendar, Clock, User, Phone, Check, Scissors, AlertCircle } from 'lucide-react'

export default function NewBookingModal({
  isOpen,
  onClose,
  onSave,
  services = [],
  staff = [],
  initialJob = null,
  clientAssetLabel = 'Client Asset / Notes'
}) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [timeSlot, setTimeSlot] = useState('10:00 - 11:00')
  const [priceRWF, setPriceRWF] = useState('')
  const [depositPaidRWF, setDepositPaidRWF] = useState('0')
  const [notes, setNotes] = useState('')
  const [ticketNumber, setTicketNumber] = useState('')
  const [status, setStatus] = useState('Booked')

  useEffect(() => {
    if (initialJob) {
      setTicketNumber(initialJob.ticketNumber || '')
      setCustomerName(initialJob.customerName || '')
      setCustomerPhone(initialJob.customerPhone || '')
      setServiceId(initialJob.serviceId || '')
      setStaffId(initialJob.staffId || '')
      setAppointmentDate(initialJob.appointmentDate || new Date().toISOString().split('T')[0])
      setTimeSlot(initialJob.timeSlot || '10:00 - 11:00')
      setPriceRWF(String(initialJob.priceRWF ?? ''))
      setDepositPaidRWF(String(initialJob.depositPaidRWF ?? '0'))
      setNotes(initialJob.notes || '')
      setStatus(initialJob.status || 'Booked')
    } else {
      setTicketNumber(`TKT-${Math.floor(100 + Math.random() * 900)}`)
      setCustomerName('')
      setCustomerPhone('+250 ')
      const firstSrv = services[0]
      setServiceId(firstSrv?.id || '')
      setPriceRWF(firstSrv?.priceRWF ? String(firstSrv.priceRWF) : '')
      const firstStaff = staff[0]
      setStaffId(firstStaff?.id || '')
      setAppointmentDate(new Date().toISOString().split('T')[0])
      setTimeSlot('10:00 - 11:00')
      setDepositPaidRWF('0')
      setNotes('')
      setStatus('Booked')
    }
  }, [initialJob, services, staff, isOpen])

  if (!isOpen) return null

  const handleServiceChange = (sId) => {
    setServiceId(sId)
    const found = services.find((s) => s.id === sId)
    if (found && !initialJob) {
      setPriceRWF(String(found.priceRWF || ''))
    }
  }

  const numericPrice = Number(priceRWF) || 0
  const numericDeposit = Number(depositPaidRWF) || 0
  const balanceDue = Math.max(0, numericPrice - numericDeposit)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customerName.trim()) return

    const selectedService = services.find((s) => s.id === serviceId)
    const selectedStaff = staff.find((st) => st.id === staffId)

    const payload = {
      id: initialJob?.id || `JOB-${Date.now().toString().slice(-6)}`,
      ticketNumber: ticketNumber.trim() || `TKT-${Math.floor(100 + Math.random() * 900)}`,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      serviceId,
      serviceName: selectedService?.name || 'Service Work',
      staffId,
      staffName: selectedStaff?.name || 'Assigned Staff',
      appointmentDate,
      timeSlot,
      durationMins: selectedService?.durationMins || 45,
      status,
      priceRWF: numericPrice,
      depositPaidRWF: numericDeposit,
      balanceDueRWF: balanceDue,
      notes: notes.trim()
    }

    onSave(payload)
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-sky-400/30 bg-[#071330]/98 text-white shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-sky-950/60 to-blue-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white">
                {initialJob ? 'Edit Job Card / Booking' : 'New Appointment / Job Card'}
              </h3>
              <p className="text-xs text-slate-300">
                Log intake, assign technician, schedule time &amp; record deposit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Ticket / Job # *
              </label>
              <input
                type="text"
                required
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="e.g. TKT-205 or RAD 420 B"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Current Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
              >
                <option value="Booked">Booked / Intake</option>
                <option value="In Progress">In Progress</option>
                <option value="Ready">Ready for Collection</option>
                <option value="Completed">Completed &amp; Invoiced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Customer Name *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Diane Mukamana"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>Phone / WhatsApp</span>
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Service Requested *
              </label>
              <select
                value={serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({(Number(s.priceRWF) || 0).toLocaleString()} RWF)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Assigned Staff Member
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none"
              >
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.role} - {st.commissionPct}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Time Slot</span>
              </label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 10:00 - 11:30"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {clientAssetLabel}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Boho box braids / Plate RAD 420B / iPhone 13 Screen crack..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Pricing & Deposit Summary */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Total Price (RWF)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={priceRWF}
                onChange={(e) => setPriceRWF(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-semibold uppercase">Deposit Paid</label>
              <input
                type="number"
                min="0"
                step="500"
                value={depositPaidRWF}
                onChange={(e) => setDepositPaidRWF(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Balance Due</span>
              <div className="font-mono text-sm font-bold text-sky-300 pt-1">
                {balanceDue.toLocaleString()} RWF
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialJob ? 'Save Job Card' : 'Create Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

