import React, { useState } from 'react'
import {
  Users,
  Percent,
  Coins,
  CheckCircle2,
  Plus,
  Phone,
  Briefcase,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  X,
  Check
} from 'lucide-react'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function StaffCommissionsWorkspace({
  staff = [],
  jobs = [],
  onAddStaff = () => {},
  onUpdateStaff = () => {},
  onDeleteStaff = () => {},
  onSettlePayout = () => {},
  staffLabel = 'Stylists & Technicians'
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('+250 ')
  const [commissionPct, setCommissionPct] = useState(30)

  const [settledStaffIds, setSettledStaffIds] = useState(new Set())
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, staffMember: null })

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingStaff(member)
      setName(member.name || '')
      setRole(member.role || '')
      setPhone(member.phone || '+250 ')
      setCommissionPct(member.commissionPct ?? 30)
    } else {
      setEditingStaff(null)
      setName('')
      setRole('')
      setPhone('+250 ')
      setCommissionPct(30)
    }
    setModalOpen(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      id: editingStaff?.id || `STF-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      role: role.trim() || 'Service Specialist',
      phone: phone.trim(),
      commissionPct: Number(commissionPct) || 0,
      active: true
    }

    if (editingStaff) {
      onUpdateStaff(editingStaff.id, payload)
    } else {
      onAddStaff(payload)
    }
    setModalOpen(false)
  }

  const handleSettle = (member, earnedCommission) => {
    onSettlePayout(member, earnedCommission)
    setSettledStaffIds((prev) => new Set([...prev, member.id]))
  }

  const handleDeleteConfirm = () => {
    if (deleteModalState.staffMember) {
      onDeleteStaff(deleteModalState.staffMember.id)
    }
    setDeleteModalState({ isOpen: false, staffMember: null })
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="font-orbitron text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Staff Roster &amp; Daily Commission Engine</span>
          </h2>
          <p className="text-xs text-slate-300">
            Automate staff earnings per service completed and settle daily cash payouts
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Members Table */}
      <div className="rounded-2xl border border-white/10 bg-[#071330]/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs text-slate-300 min-w-[760px]">
            <thead className="bg-white/5 border-b border-white/10 text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Role / Station</th>
                <th className="py-3 px-3">Commission Rate</th>
                <th className="py-3 px-3">Jobs Completed</th>
                <th className="py-3 px-3">Revenue Delivered</th>
                <th className="py-3 px-3">Commission Accrued</th>
                <th className="py-3 px-4 text-right">Daily Payout Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                    No staff members registered. Click "Add Staff Member" to build your roster.
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const memberJobs = jobs.filter(
                    (j) => j.staffId === member.id || j.staffName === member.name
                  )
                  const completedJobs = memberJobs.filter((j) => j.status === 'Completed')
                  const deliveredRevenue = completedJobs.reduce(
                    (sum, j) => sum + (Number(j.priceRWF) || 0),
                    0
                  )
                  const earnedCommission = Math.round(
                    (deliveredRevenue * (Number(member.commissionPct) || 0)) / 100
                  )
                  const isSettled = settledStaffIds.has(member.id)

                  return (
                    <tr key={member.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/20 text-[10px]">
                          {member.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {member.commissionPct}%
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {completedJobs.length} completed
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {deliveredRevenue.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        {earnedCommission.toLocaleString()} RWF
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSettled ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Paid Today</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSettle(member, earnedCommission)}
                              disabled={earnedCommission === 0}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                earnedCommission > 0
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 cursor-pointer'
                                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
                              }`}
                            >
                              <Coins className="w-3.5 h-3.5" />
                              <span>Settle Payout</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenModal(member)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalState({ isOpen: true, staffMember: member })}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-sky-400/30 bg-[#071330]/98 text-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-orbitron text-base font-bold text-white">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Staff Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jean-Pierre Habimana"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Role / Specialization</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Stylist, Lead Mechanic, Tech"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Phone / MoMo Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Base Commission Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, staffMember: null })}
        onConfirm={handleDeleteConfirm}
        title="Remove Staff Member"
        itemName={deleteModalState.staffMember?.name || ''}
        description="Are you sure you want to remove this staff member from your roster? Their historical completed jobs will remain logged."
      />
    </div>
  )
}

