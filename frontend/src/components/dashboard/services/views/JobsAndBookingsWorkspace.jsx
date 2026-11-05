import React, { useState } from 'react'
import {
  Calendar,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  ArrowRight,
  User,
  Phone,
  Edit2,
  Trash2,
  LayoutGrid,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Coins
} from 'lucide-react'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'
import NewBookingModal from '../modals/NewBookingModal'

export default function JobsAndBookingsWorkspace({
  jobs = [],
  services = [],
  staff = [],
  consumables = [],
  onAddJob = () => {},
  onUpdateJob = () => {},
  onDeleteJob = () => {},
  onDeductConsumables = () => {},
  activeSubPage = 'All Jobs',
  clientAssetLabel = 'Client Asset / Notes'
}) {
  const [viewMode, setViewMode] = useState(
    activeSubPage === 'Bookings & Calendar' ? 'calendar' : 'pipeline'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [staffFilter, setStaffFilter] = useState('All')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, job: null })

  const PIPELINE_COLUMNS = [
    { id: 'Booked', title: 'Booked / Intake', color: 'sky', border: 'border-sky-500/30', headerBg: 'bg-sky-500/10 text-sky-300' },
    { id: 'In Progress', title: 'In Progress', color: 'amber', border: 'border-amber-500/30', headerBg: 'bg-amber-500/10 text-amber-300' },
    { id: 'Ready', title: 'Ready for Collection', color: 'cyan', border: 'border-cyan-500/30', headerBg: 'bg-cyan-500/10 text-cyan-300' },
    { id: 'Completed', title: 'Completed & Invoiced', color: 'emerald', border: 'border-emerald-500/30', headerBg: 'bg-emerald-500/10 text-emerald-300' }
  ]

  // Filter jobs
  const filteredJobs = jobs.filter((j) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = j.customerName?.toLowerCase().includes(q) ||
      j.ticketNumber?.toLowerCase().includes(q) ||
      j.serviceName?.toLowerCase().includes(q) ||
      j.notes?.toLowerCase().includes(q)
    const matchesStaff = staffFilter === 'All' || j.staffId === staffFilter || j.staffName === staffFilter
    return matchesQuery && matchesStaff
  })

  // Advance Pipeline Stage
  const handleAdvanceStage = (job) => {
    let nextStatus = 'In Progress'
    if (job.status === 'Booked') nextStatus = 'In Progress'
    else if (job.status === 'In Progress') nextStatus = 'Ready'
    else if (job.status === 'Ready') nextStatus = 'Completed'

    const updates = {
      ...job,
      status: nextStatus
    }

    if (nextStatus === 'Completed') {
      updates.balanceDueRWF = 0
      updates.depositPaidRWF = Number(job.priceRWF) || 0
      // Auto-deduct linked supplies if service has linked consumables
      const srv = services.find((s) => s.id === job.serviceId || s.name === job.serviceName)
      if (srv && srv.linkedConsumables && srv.linkedConsumables.length > 0) {
        onDeductConsumables(srv.linkedConsumables)
      }
    }

    onUpdateJob(job.id, updates)
  }

  const handleDeleteConfirm = () => {
    if (deleteModalState.job) {
      onDeleteJob(deleteModalState.job.id)
    }
    setDeleteModalState({ isOpen: false, job: null })
  }

  // Time slots for Calendar View
  const TIME_SLOTS = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00'
  ]

  const dateJobs = filteredJobs.filter((j) => j.appointmentDate === selectedDate)

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="font-orbitron text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Jobs, Work Orders &amp; Bookings</span>
          </h2>
          <p className="text-xs text-slate-300">
            Intake pipeline, technician assignment, client deposits &amp; completion invoicing
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'pipeline'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar Slots</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setEditingJob(null); setBookingModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, ticket #, service, notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
            />
          </div>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
          >
            <option value="All">All Staff</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
        </div>

        {viewMode === 'calendar' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs focus:outline-none"
            />
            <span className="text-slate-400 text-xs">
              {dateJobs.length} bookings scheduled
            </span>
          </div>
        )}
      </div>

      {/* VIEW 1: KANBAN PIPELINE BOARD */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PIPELINE_COLUMNS.map((col) => {
            const colJobs = filteredJobs.filter((j) => j.status === col.id)
            const colTotalRWF = colJobs.reduce((sum, j) => sum + (Number(j.priceRWF) || 0), 0)

            return (
              <div
                key={col.id}
                className="rounded-2xl border border-white/10 bg-[#071330]/60 p-3 flex flex-col min-h-[500px] shadow-lg backdrop-blur-sm"
              >
                {/* Column Header */}
                <div className={`p-2.5 rounded-xl ${col.headerBg} border border-white/10 flex items-center justify-between mb-3`}>
                  <div className="font-semibold text-xs tracking-wide">{col.title}</div>
                  <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/10">
                    {colJobs.length}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-mono px-1 mb-2">
                  Total: {colTotalRWF.toLocaleString()} RWF
                </div>

                {/* Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px] custom-scrollbar pr-1">
                  {colJobs.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                      No jobs in this stage
                    </div>
                  ) : (
                    colJobs.map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 space-y-2 transition-all shadow-sm group"
                      >
                        {/* Top: Ticket + Time */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-sky-300">
                            {job.ticketNumber}
                          </span>
                          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{job.timeSlot || 'Scheduled'}</span>
                          </span>
                        </div>

                        {/* Customer & Service */}
                        <div>
                          <div className="font-semibold text-sm text-white truncate">
                            {job.customerName}
                          </div>
                          <div className="text-xs text-sky-200/90 font-medium truncate mt-0.5">
                            {job.serviceName}
                          </div>
                        </div>

                        {/* Notes / Asset Info */}
                        {job.notes && (
                          <div className="text-[11px] text-slate-400 line-clamp-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                            {job.notes}
                          </div>
                        )}

                        {/* Staff & Payment Info */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                          <div className="text-slate-400 truncate max-w-[120px]">
                            <span className="text-slate-500">Tech:</span> {job.staffName}
                          </div>
                          <div className="font-mono font-bold text-white text-right">
                            {(Number(job.priceRWF) || 0).toLocaleString()} RWF
                          </div>
                        </div>

                        {/* Balance due badge */}
                        <div className="flex items-center justify-between text-[10px] pt-1">
                          {Number(job.balanceDueRWF || 0) > 0 ? (
                            <span className="text-amber-300 font-medium">
                              Due: {(Number(job.balanceDueRWF) || 0).toLocaleString()} RWF
                            </span>
                          ) : (
                            <span className="text-emerald-300 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid in Full</span>
                            </span>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setEditingJob(job); setBookingModalOpen(true); }}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteModalState({ isOpen: true, job })}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Advance Pipeline Button */}
                        {job.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(job)}
                            className="w-full mt-1 py-1.5 px-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>
                              {job.status === 'Booked' && 'Start Work'}
                              {job.status === 'In Progress' && 'Mark Ready'}
                              {job.status === 'Ready' && 'Complete & Settle'}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW 2: INTERACTIVE CALENDAR TIME SLOTS */}
      {viewMode === 'calendar' && (
        <div className="rounded-2xl border border-white/10 bg-[#071330]/80 p-4 shadow-xl space-y-3">
          <div className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-2">
            Schedule for {selectedDate} ({dateJobs.length} Bookings)
          </div>

          <div className="space-y-2">
            {TIME_SLOTS.map((slot) => {
              const slotBooking = dateJobs.find((j) => j.timeSlot === slot)
              return (
                <div
                  key={slot}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    slotBooking
                      ? 'bg-sky-500/15 border-sky-400/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-24 font-mono font-semibold text-slate-300 shrink-0">
                      {slot}
                    </div>
                    {slotBooking ? (
                      <div className="min-w-0">
                        <span className="font-bold text-white mr-2">{slotBooking.customerName}</span>
                        <span className="text-sky-300 mr-2">({slotBooking.serviceName})</span>
                        <span className="text-[11px] text-slate-400">Assigned: {slotBooking.staffName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Available Time Slot</span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {slotBooking ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        slotBooking.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                      }`}>
                        {slotBooking.status}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingJob(null)
                          setBookingModalOpen(true)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-sky-500/20 text-slate-400 hover:text-sky-300 text-[11px] font-medium"
                      >
                        + Book Slot
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewBookingModal
        isOpen={bookingModalOpen}
        onClose={() => { setBookingModalOpen(false); setEditingJob(null); }}
        onSave={(p) => (editingJob ? onUpdateJob(editingJob.id, p) : onAddJob(p))}
        services={services}
        staff={staff}
        initialJob={editingJob}
        clientAssetLabel={clientAssetLabel}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, job: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Card"
        itemName={deleteModalState.job?.ticketNumber ? `${deleteModalState.job.ticketNumber} (${deleteModalState.job.customerName})` : ''}
        description="Are you sure you want to delete this booking/job card? This action cannot be undone."
      />
    </div>
  )
}

