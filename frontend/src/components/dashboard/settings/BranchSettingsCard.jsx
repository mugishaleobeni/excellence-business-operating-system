import React, { useState } from 'react'
import { GitBranch, Plus, Trash2, ArrowUpRight, MapPin, Pencil, UserPlus, Copy, Check, X, KeyRound } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'

export default function BranchSettingsCard({ activeArchId = 'buy-and-sell', currentArch = {} }) {
  const {
    branches = [],
    activeBranchId = 'main',
    createBranch,
    updateBranch,
    assignBranchManager,
    deleteBranch,
    switchBranch,
    addToast
  } = useExbos()

  const [branchName, setBranchName] = useState('')
  const [branchLocation, setBranchLocation] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit branch state
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  // Assign manager state
  const [managerBranch, setManagerBranch] = useState(null)
  const [managerName, setManagerName] = useState('')
  const [managerEmail, setManagerEmail] = useState('')
  const [managerPhone, setManagerPhone] = useState('')
  const [managerPassword, setManagerPassword] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!branchName.trim()) return
    setCreating(true)
    try {
      const res = await createBranch({
        name: branchName.trim(),
        location: branchLocation.trim() || 'Rwanda',
        architectureId: activeArchId
      })
      if (res?.ok && res?.branch) {
        setBranchName('')
        setBranchLocation('')
        addToast &&
          addToast({
            type: 'success',
            title: 'Branch Created',
            message: `"${res.branch.name}" added to your navigation (${currentArch.name || activeArchId}).`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Branch Creation Failed',
            message: res?.error || 'Could not create branch.'
          })
      }
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (b) => {
    setEditingBranchId(b.id)
    setEditName(b.name || '')
    setEditLocation(b.location || '')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingBranchId || !editName.trim()) return
    setSavingEdit(true)
    try {
      const res = await updateBranch(editingBranchId, {
        name: editName.trim(),
        location: editLocation.trim() || 'Rwanda'
      })
      if (res?.ok) {
        setEditingBranchId(null)
        addToast &&
          addToast({
            type: 'success',
            title: 'Branch Updated',
            message: `Updated "${res.branch?.name || editName.trim()}".`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: res?.error || 'Could not update branch.'
          })
      }
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (b) => {
    const res = await deleteBranch(b.id)
    if (res?.ok) {
      addToast &&
        addToast({
          type: 'success',
          title: 'Branch Deleted',
          message: `"${b.name}" was removed.`
        })
    } else {
      addToast &&
        addToast({
          type: 'error',
          title: 'Delete Failed',
          message: res?.error || 'Could not delete branch.'
        })
    }
  }

  const openAssignManager = (b) => {
    setManagerBranch(b)
    setManagerName(b.manager?.name || '')
    setManagerEmail(b.manager?.email || '')
    setManagerPhone(b.manager?.phone || '')
    setManagerPassword('')
    setGeneratedLink('')
    setCopiedLink(false)
  }

  const handleAssignManager = async (e) => {
    e.preventDefault()
    if (!managerBranch) return
    setAssigning(true)
    try {
      const res = await assignBranchManager(managerBranch.id, {
        name: managerName.trim(),
        email: managerEmail.trim(),
        phone: managerPhone.trim(),
        password: managerPassword
      })
      if (res?.ok) {
        setGeneratedLink(res.loginLink || '')
        addToast &&
          addToast({
            type: 'success',
            title: 'Branch Manager Assigned',
            message: `${managerName.trim()} can now sign in to ${managerBranch.name}.`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Assignment Failed',
            message: res?.error || 'Could not assign branch manager.'
          })
      }
    } finally {
      setAssigning(false)
    }
  }

  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard?.writeText(generatedLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#218DFF]/30 bg-[#051238]/90 p-6 sm:p-7 space-y-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-orbitron text-sm sm:text-base font-bold text-white">
              Branches &amp; Multi-Location Control
            </h3>
            <p className="text-xs text-slate-300">
              Create branches (defaulting to <strong>{currentArch.name || activeArchId}</strong>). New branches appear automatically in your sidebar navigation.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#218DFF]/20 border border-[#9EDCFF]/30 text-[#9EDCFF]">
          {Math.max(1, branches.length)} Active Branch{branches.length === 1 ? '' : 'es'}
        </span>
      </div>

      {/* Create New Branch Form */}
      <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Branch Name *
          </label>
          <input
            type="text"
            required
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. Musanze Branch"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Location
          </label>
          <input
            type="text"
            value={branchLocation}
            onChange={(e) => setBranchLocation(e.target.value)}
            placeholder="e.g. Musanze, Northern"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !branchName.trim()}
          className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4 text-[#9EDCFF]" />
          <span>{creating ? 'Creating...' : '+ Create Branch'}</span>
        </button>
      </form>

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {branches.map((b) => {
          const isCurrent = b.id === activeBranchId
          const isEditing = editingBranchId === b.id
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex flex-col gap-3 ${
                isCurrent
                  ? 'bg-[#218DFF]/15 border-[#9EDCFF]/50'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Branch name"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                    />
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Location"
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBranchId(null)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="px-3 py-1 rounded-lg bg-[#218DFF] hover:bg-[#1a75d8] text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-white truncate">{b.name}</strong>
                      {b.isMain && (
                        <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          Main HQ
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#218DFF]" />
                      <span>{b.location || 'Rwanda'}</span>
                    </div>
                    {b.manager?.email && (
                      <div className="text-[11px] text-[#9EDCFF] mt-1 truncate">
                        Manager: <strong>{b.manager.name}</strong> ({b.manager.email})
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => switchBranch && switchBranch(b.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#218DFF] text-white'
                          : 'bg-white/10 hover:bg-white/20 text-[#9EDCFF]'
                      }`}
                    >
                      <span>{isCurrent ? 'Active' : 'Switch'}</span>
                      {!isCurrent && <ArrowUpRight className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openAssignManager(b)}
                      title="Assign Branch Manager & Login Link"
                      className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      title="Edit Branch"
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!b.isMain && (
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        title="Delete Branch"
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Assign Branch Manager Panel */}
      {managerBranch && (
        <div className="rounded-2xl border border-emerald-400/30 bg-[#040D29]/95 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-300" />
              <h4 className="font-orbitron text-xs sm:text-sm font-bold text-white">
                Assign Branch Manager — {managerBranch.name}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setManagerBranch(null)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAssignManager} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Manager Full Name *</label>
              <input
                type="text"
                required
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Jean Paul Mugabo"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Manager Email *</label>
              <input
                type="email"
                required
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@business.rw"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone / WhatsApp (Optional)</label>
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+25078..."
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dashboard Password {managerBranch.manager?.email ? '(Leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                required={!managerBranch.manager?.email}
                minLength={6}
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={assigning}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {assigning ? 'Creating Account & Link...' : 'Save Manager & Generate Login Link'}
              </button>
            </div>
          </form>

          {generatedLink && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-2">
              <div className="text-xs font-semibold text-emerald-300">
                Branch Manager Dashboard Login Link Ready:
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#030A1F] border border-white/15 text-xs font-mono text-white"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

