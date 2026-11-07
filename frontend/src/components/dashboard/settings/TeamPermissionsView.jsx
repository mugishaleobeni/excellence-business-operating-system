import React, { useState, useMemo } from 'react'
import { Users, UserPlus, Shield, Check, Lock, Sparkles, Trash2, Mail, Phone } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'

export default function TeamPermissionsView({
  user = {},
  currentArch = {},
  addToast
}) {
  const { demoWorkspaces, updateDemoWorkspace } = useExbos()
  const activeArchId = currentArch?.id || user?.architectureId || 'buy-and-sell'
  const workspace = demoWorkspaces?.[activeArchId] || {}
  const records = workspace.records || {}

  const defaultOwner = useMemo(
    () => ({
      id: 'USR-1',
      name: user.name || 'Business Owner',
      email: user.email || 'owner@exbos.rw',
      phone: user.phone || '+250 788 000 000',
      role: 'Owner (Full Access)',
      status: 'Active',
      permissions: ['Manage Finances', 'Approve Purchases', 'Manage Inventory', 'Add Users']
    }),
    [user.name, user.email, user.phone]
  )

  const teamMembers = useMemo(() => {
    const saved = records['TeamMembers']
    if (Array.isArray(saved) && saved.length > 0) return saved
    return [defaultOwner]
  }, [records, defaultOwner])

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Cashier & POS Operator')

  const handleAddMember = (e) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return

    const newMember = {
      id: `USR-${Date.now().toString().slice(-3)}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      phone: '+250 780 000 000',
      role: inviteRole,
      status: 'Invite Sent',
      permissions:
        inviteRole === 'Manager / Supervisor'
          ? ['Record Sales', 'Manage Inventory', 'View Reports']
          : ['Record Sales', 'Issue Receipts']
    }

    const nextMembers = [...teamMembers, newMember]
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          TeamMembers: nextMembers
        }
      })
    }
    setShowInviteModal(false)
    setInviteName('')
    setInviteEmail('')

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Team Invitation Sent',
        message: `Invitation delivered to ${newMember.email}`
      })
    }
  }

  const handleDeleteMember = (id) => {
    const nextMembers = teamMembers.filter((m) => m.id !== id)
    if (updateDemoWorkspace) {
      updateDemoWorkspace(activeArchId, {
        records: {
          ...records,
          TeamMembers: nextMembers
        }
      })
    }
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Member Removed',
        message: 'User permissions revoked successfully.'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Member */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase font-bold text-[#218DFF]">
            <Shield className="w-3.5 h-3.5" />
            <span>Access Control &amp; Role Delegation</span>
          </span>
          <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
            Team Members &amp; Permissions
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Authorize team staff, assign POS operator limits, and protect business ledgers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Role Delegation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Owner Access</span>
          <div className="text-lg font-bold text-white">Full Super-Privileges</div>
          <p className="text-[11px] text-slate-400">Can view banking, profits, and delete ledgers.</p>
        </div>
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Manager Access</span>
          <div className="text-lg font-bold text-white">Operational Supervisor</div>
          <p className="text-[11px] text-slate-400">Can update stock, record sales, and view reports.</p>
        </div>
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Cashier POS</span>
          <div className="text-lg font-bold text-white">Front Desk Operator</div>
          <p className="text-[11px] text-slate-400">Restricted strictly to billing and printing receipts.</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Role &amp; Title</th>
                <th className="px-4 py-3">Assigned Permissions</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-white text-xs">{member.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{member.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-white">{member.role}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        member.status === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {member.role.includes('Owner') ? (
                      <span className="text-[10px] text-slate-500 font-mono">Immutable</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#071544] border border-white/20 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-orbitron font-bold text-lg">Invite New Team Member</h3>
            <p className="text-xs text-slate-300">
              Enter staff contact details to grant restricted dashboard credentials.
            </p>
            <form onSubmit={handleAddMember} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jean Paul Habumugisha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#218DFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. staff@business.rw"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#218DFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F] border border-white/15 text-white text-xs outline-none"
                >
                  <option value="Manager / Supervisor">Manager / Supervisor</option>
                  <option value="Cashier & POS Operator">Cashier &amp; POS Operator</option>
                  <option value="Stock Keeper / Warehouse">Stock Keeper / Warehouse</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-sapphire-clean px-4 py-2 text-xs font-bold"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

