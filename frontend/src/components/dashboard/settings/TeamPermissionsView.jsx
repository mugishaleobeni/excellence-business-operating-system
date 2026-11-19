import React, { useState, useEffect, useCallback } from 'react'
import {
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Copy,
  Check,
  KeyRound,
  Building2,
  RefreshCw
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { apiClient } from '../../../utils/apiClient'

function formatPermissionTags(perms) {
  if (Array.isArray(perms)) return perms
  if (!perms || typeof perms !== 'object') return ['Standard Access']
  const labels = {
    canRecordSales: 'Record Sales',
    canManageStock: 'Manage Stock',
    canViewProfits: 'View Profits',
    canApproveExpenses: 'Approve Expenses',
    canDeleteRecords: 'Delete Records',
    canManageTeam: 'Manage Team'
  }
  const active = Object.entries(perms)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => labels[key] || key)
  return active.length > 0 ? active : ['View Only']
}

export default function TeamPermissionsView({ user = {}, addToast }) {
  const { branches = [] } = useExbos()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState('Cashier & POS Operator')
  const [inviteBranchId, setInviteBranchId] = useState('')

  const [lastCreatedAccess, setLastCreatedAccess] = useState(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const isOwner = !user?.ownerScopeKey

  const loadTeam = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.getTeamMembers()
    if (res.ok && Array.isArray(res.data?.data?.members)) {
      setTeamMembers(res.data.data.members)
    } else {
      setTeamMembers([
        {
          id: 'owner-local',
          fullName: user?.fullName || user?.name || 'Business Owner',
          email: user?.email || 'owner@exbos.rw',
          role: 'Owner',
          isOwner: true,
          status: 'Active',
          permissions: ['Full Owner Access']
        }
      ])
    }
    setLoading(false)
  }, [user?.fullName, user?.name, user?.email])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteEmail.trim()) return
    setSubmitting(true)

    const res = await apiClient.inviteTeamMember({
      fullName: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      password: invitePassword.trim(),
      role: inviteRole,
      assignedBranchId: inviteBranchId
    })
    setSubmitting(false)

    if (!res.ok) {
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Could Not Create Staff Account',
          message: res.error || 'Please verify the email and password.'
        })
      }
      return
    }

    const payload = res.data?.data || {}
    setLastCreatedAccess({
      email: payload.member?.email || inviteEmail.trim().toLowerCase(),
      fullName: payload.member?.fullName || inviteName.trim(),
      role: payload.member?.role || inviteRole,
      loginLink: payload.loginLink,
      password: payload.generatedPassword || invitePassword.trim(),
      emailSent: Boolean(payload.emailSent)
    })

    setShowInviteModal(false)
    setInviteName('')
    setInviteEmail('')
    setInvitePassword('')
    setInviteBranchId('')
    await loadTeam()

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Staff Login Created',
        message:
          res.data?.message ||
          `Real ExBOS login created for ${inviteEmail.trim().toLowerCase()}.`
      })
    }
  }

  const handleDeleteMember = async (email) => {
    const res = await apiClient.removeTeamMember(email)
    if (!res.ok) {
      if (addToast) {
        addToast({
          type: 'error',
          title: 'Revoke Failed',
          message: res.error || 'Could not remove team member.'
        })
      }
      return
    }
    setTeamMembers((prev) => prev.filter((m) => m.email !== email))
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Access Revoked',
        message: `Login account for ${email} has been permanently removed.`
      })
    }
  }

  const handleCopyLink = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      /* ignore clipboard restrictions */
    }
  }

  const getBranchName = (branchId) => {
    if (!branchId) return 'All Branches (HQ)'
    const found = branches.find((b) => String(b.id) === String(branchId))
    return found ? found.name : branchId
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Member */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-orbitron uppercase font-bold text-[#218DFF]">
            <Shield className="w-3.5 h-3.5" />
            <span>Real Staff Logins &amp; Role Delegation</span>
          </span>
          <h2 className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
            Team Members &amp; Permissions
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Create real staff ExBOS accounts linked to your business, assign roles or branches, and revoke access anytime.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadTeam}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh team list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Recently Created Staff Login Banner (Share Link / Temp Password) */}
      {lastCreatedAccess && (
        <div className="exbos-glass-card p-4 border border-emerald-400/35 bg-emerald-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 text-xs">
            <div className="font-bold text-emerald-300">
              ✓ Staff account active for {lastCreatedAccess.fullName} ({lastCreatedAccess.email})
            </div>
            <div className="text-slate-200 flex flex-wrap items-center gap-3">
              <span>Role: <strong>{lastCreatedAccess.role}</strong></span>
              {lastCreatedAccess.password && (
                <span>
                  Password:{' '}
                  <code className="px-2 py-0.5 rounded bg-black/40 text-[#9EDCFF] font-mono">
                    {lastCreatedAccess.password}
                  </code>
                </span>
              )}
              <span className="text-slate-300">
                {lastCreatedAccess.emailSent ? 'Invitation email delivered.' : 'Share this login link directly:'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              handleCopyLink(
                `ExBOS Login: ${lastCreatedAccess.loginLink}\nEmail: ${lastCreatedAccess.email}${
                  lastCreatedAccess.password ? `\nPassword: ${lastCreatedAccess.password}` : ''
                }`
              )
            }
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied Credentials' : 'Copy Login Details'}</span>
          </button>
        </div>
      )}

      {/* Role Delegation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Owner Access</span>
          <div className="text-lg font-bold text-white">Full Super-Privileges</div>
          <p className="text-[11px] text-slate-400">Full control over profits, branches, staff, and ledgers.</p>
        </div>
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Manager Access</span>
          <div className="text-lg font-bold text-white">Operational Supervisor</div>
          <p className="text-[11px] text-slate-400">Can manage stock, record sales, approve expenses, and view reports.</p>
        </div>
        <div className="exbos-glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Cashier POS</span>
          <div className="text-lg font-bold text-white">Front Desk Operator</div>
          <p className="text-[11px] text-slate-400">Restricted to recording sales and issuing customer receipts.</p>
        </div>
      </div>

      {/* Team Members Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-400 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3">Role &amp; Branch</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamMembers.map((member) => {
                const tags = formatPermissionTags(member.permissions)
                return (
                  <tr key={member.id || member.email} className="hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-xs">{member.fullName || member.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{member.role}</div>
                      {!member.isOwner && (
                        <div className="text-[10px] text-[#9EDCFF] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{getBranchName(member.assignedBranchId)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {tags.map((perm) => (
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
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {member.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {member.isOwner || !isOwner ? (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {member.isOwner ? 'Owner' : 'Protected'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member.email)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition cursor-pointer"
                          title="Revoke Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#071544] border border-white/20 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-orbitron font-bold text-lg">Create Staff ExBOS Login</h3>
            <p className="text-xs text-slate-300">
              This creates a real login linked to your business workspace and emails them a direct sign-in link.
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
                  Staff Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. cashier@business.rw"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs outline-none focus:border-[#218DFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-[#9EDCFF]" />
                  <span>Temporary Password (Optional — auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  minLength={6}
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Min 6 characters or leave blank"
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
                  <option value="Accountant / Finance">Accountant / Finance</option>
                  <option value="Stock Keeper / Warehouse">Stock Keeper / Warehouse</option>
                </select>
              </div>

              {branches.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Assign to Branch (Optional)
                  </label>
                  <select
                    value={inviteBranchId}
                    onChange={(e) => setInviteBranchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03091F] border border-white/15 text-white text-xs outline-none"
                  >
                    <option value="">All Branches / Main HQ</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-sapphire-clean px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Creating Account...' : 'Create Staff Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
