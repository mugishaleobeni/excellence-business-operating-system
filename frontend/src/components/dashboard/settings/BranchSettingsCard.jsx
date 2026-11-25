import React, { useState, useMemo } from 'react'
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowUpRight,
  MapPin,
  Pencil,
  UserPlus,
  Copy,
  Check,
  X,
  KeyRound,
  Lock,
  Shield,
  Package
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import CustomSelect from '../../common/CustomSelect'

export default function BranchSettingsCard({ activeArchId = 'buy-and-sell', currentArch = {} }) {
  const {
    branches = [],
    activeBranchId = 'main',
    activeBranch,
    isBranchManager,
    allWorkspaces = {},
    createBranch,
    updateBranch,
    assignBranchManager,
    createBranchManagerInvite,
    transferBranchStock,
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

  // Branch Security & Permissions state
  const [securityBranch, setSecurityBranch] = useState(null)
  const [secStatus, setSecStatus] = useState('Active')
  const [secRequirePin, setSecRequirePin] = useState(true)
  const [secOwnerPin, setSecOwnerPin] = useState('')
  const [secPerms, setSecPerms] = useState({
    canDeleteRecords: false,
    canEditPrices: false,
    canViewProfitReports: false,
    canRecordExpenses: true,
    maxExpenseLimitRWF: 0
  })
  const [savingSecurity, setSavingSecurity] = useState(false)

  // Inter-Branch Stock Transfer state (Main HQ -> Sub-Branch)
  const [transferBranch, setTransferBranch] = useState(null)
  const [transferProductId, setTransferProductId] = useState('')
  const [transferQty, setTransferQty] = useState('1')
  const [transferring, setTransferring] = useState(false)

  const mainHqProducts = useMemo(() => {
    const ws = allWorkspaces?.[activeArchId] || {}
    const prods = Array.isArray(ws.records?.Products) ? ws.records.Products : []
    const inv = Array.isArray(ws.records?.Inventory) ? ws.records.Inventory : []
    const combined = [...prods, ...inv]
    const seen = new Set()
    const out = []
    combined.forEach((p) => {
      if ((p.branchId || 'main') !== 'main') return
      const key = p.id || (p.title || p.name || '').toLowerCase()
      if (!key || seen.has(key)) return
      seen.add(key)
      const q = Number(p.quantity ?? p.stock ?? p.currentStock ?? 0)
      if (q > 0) out.push(p)
    })
    return out
  }, [allWorkspaces, activeArchId])

  const openSecurityPanel = (b) => {
    setSecurityBranch(b)
    setSecStatus(b.status || 'Active')
    setSecRequirePin(b.requirePinForMainSwitch !== false)
    setSecOwnerPin('')
    setSecPerms({
      canDeleteRecords: Boolean(b.permissions?.canDeleteRecords),
      canEditPrices: Boolean(b.permissions?.canEditPrices),
      canViewProfitReports: Boolean(b.permissions?.canViewProfitReports),
      canRecordExpenses: b.permissions?.canRecordExpenses !== false,
      maxExpenseLimitRWF: Number(b.permissions?.maxExpenseLimitRWF || 0)
    })
  }

  const handleSaveSecurity = async (e) => {
    e.preventDefault()
    if (!securityBranch) return
    setSavingSecurity(true)
    try {
      const payload = {
        status: secStatus,
        requirePinForMainSwitch: secRequirePin,
        permissions: secPerms
      }
      if (secOwnerPin.trim()) {
        payload.ownerPin = secOwnerPin.trim()
      }
      const res = await updateBranch(securityBranch.id, payload)
      if (res?.ok) {
        setSecurityBranch(null)
        addToast &&
          addToast({
            type: 'success',
            title: 'Branch Security Updated',
            message: `Permissions & Main HQ lock updated for "${securityBranch.name}".`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Update Failed',
            message: res?.error || 'Could not update branch security settings.'
          })
      }
    } finally {
      setSavingSecurity(false)
    }
  }

  const openTransferPanel = (b) => {
    setTransferBranch(b)
    setTransferProductId(mainHqProducts[0]?.id || '')
    setTransferQty('1')
  }

  const handleTransferStock = async (e) => {
    e.preventDefault()
    if (!transferBranch || !transferProductId) return
    setTransferring(true)
    try {
      const res = await transferBranchStock(transferBranch.id, {
        productId: transferProductId,
        quantity: Number(transferQty) || 1,
        architectureId: activeArchId
      })
      if (res?.ok) {
        setTransferBranch(null)
        addToast &&
          addToast({
            type: 'success',
            title: 'Stock Transferred from Main HQ',
            message: res.message || `Stock transferred to ${transferBranch.name}.`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Stock Transfer Failed',
            message: res?.error || 'Could not transfer stock.'
          })
      }
    } finally {
      setTransferring(false)
    }
  }

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
    setManagerName(b.manager?.name && b.manager.name !== 'Pending Branch Manager' ? b.manager.name : '')
    setManagerEmail(b.manager?.email || '')
    setManagerPhone(b.manager?.phone || '')
    setManagerPassword('')
    setGeneratedLink(b.manager?.status === 'Pending Setup' ? b.manager?.inviteLink || '' : '')
    setCopiedLink(false)
  }

  const handleAssignManager = async (e) => {
    e.preventDefault()
    if (!managerBranch) return
    setAssigning(true)
    try {
      const res = await createBranchManagerInvite(managerBranch.id, {
        name: managerName.trim(),
        email: managerEmail.trim(),
        phone: managerPhone.trim()
      })
      if (res?.ok) {
        setGeneratedLink(res.inviteLink || '')
        addToast &&
          addToast({
            type: 'success',
            title: 'Manager Setup Link Generated',
            message: `Share this secure link with your branch manager for ${managerBranch.name}. They will enter their own email and password.`
          })
      } else {
        addToast &&
          addToast({
            type: 'error',
            title: 'Link Generation Failed',
            message: res?.error || 'Could not generate branch manager setup link.'
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

  if (isBranchManager) {
    return (
      <div className="rounded-2xl border border-[#218DFF]/30 bg-[#051238]/90 p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-orbitron text-sm sm:text-base font-bold text-white">
                Assigned Branch Security Profile — {activeBranch?.name || 'Sub-Branch'}
              </h3>
              <p className="text-xs text-slate-300">
                Your session is locked to this branch. Main HQ access and branch management are restricted to the Business Owner.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
            {activeBranch?.status || 'Active'}
          </span>
        </div>
      </div>
    )
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
              Branches, Security &amp; Multi-Location Control
            </h3>
            <p className="text-xs text-slate-300">
              Create isolated branches (defaulting to <strong>{currentArch.name || activeArchId}</strong>), lock Main HQ access, configure permissions, and transfer stock from HQ.
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <strong className="text-sm font-bold text-white truncate">{b.name}</strong>
                      {b.isMain && (
                        <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          Main HQ
                        </span>
                      )}
                      {b.status === 'Frozen' && (
                        <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          Frozen
                        </span>
                      )}
                      {!b.isMain && b.requirePinForMainSwitch !== false && (
                        <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/30 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" />
                          <span>HQ Locked</span>
                        </span>
                      )}
                      {!b.isMain && b.permissions?.canDeleteRecords === false && (
                        <span className="text-[9px] font-orbitron uppercase px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-400/30">
                          No Delete
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#218DFF]" />
                      <span>{b.location || 'Rwanda'}</span>
                    </div>
                    {(b.manager?.email || b.manager?.status === 'Pending Setup') && (
                      <div className="text-[11px] text-[#9EDCFF] mt-1 flex flex-wrap items-center gap-1.5">
                        {b.manager?.status === 'Pending Setup' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-200 text-[10px] font-bold">
                            Pending Manager Setup
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[10px] font-bold">
                            Active Manager
                          </span>
                        )}
                        <span className="truncate">
                          <strong>{b.manager.name || 'Invited Manager'}</strong>
                          {b.manager.email ? ` (${b.manager.email})` : ''}
                        </span>
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
                      {b.isMain && activeBranchId !== 'main' && activeBranch?.requirePinForMainSwitch !== false && (
                        <Lock className="w-3 h-3" />
                      )}
                      <span>{isCurrent ? 'Active' : 'Switch'}</span>
                      {!isCurrent && <ArrowUpRight className="w-3.5 h-3.5" />}
                    </button>
                    {!b.isMain && (
                      <button
                        type="button"
                        onClick={() => openSecurityPanel(b)}
                        title="Branch Security, HQ Lock & Permissions"
                        className="p-1.5 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/35 text-[#9EDCFF] cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!b.isMain && (
                      <button
                        type="button"
                        onClick={() => openTransferPanel(b)}
                        title="Transfer Stock from Main HQ to this Branch"
                        className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" />
                      </button>
                    )}
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

      {/* Branch Security, Main HQ Lock & Permissions Panel */}
      {securityBranch && (
        <div className="rounded-2xl border border-[#218DFF]/40 bg-[#040D29]/95 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#9EDCFF]" />
              <h4 className="font-orbitron text-xs sm:text-sm font-bold text-white">
                Branch Security &amp; Permissions — {securityBranch.name}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setSecurityBranch(null)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Branch Operational Status
                </label>
                <select
                  value={secStatus}
                  onChange={(e) => setSecStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF]"
                >
                  <option value="Active">Active (Normal Operations)</option>
                  <option value="Frozen">Frozen (Read-Only Audit Mode)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Optional Owner Security PIN (4–8 digits)
                </label>
                <input
                  type="password"
                  value={secOwnerPin}
                  onChange={(e) => setSecOwnerPin(e.target.value)}
                  placeholder={securityBranch.hasOwnerPin ? '•••• (Leave blank to keep)' : 'Set PIN or use Owner Password'}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Max Single Expense Limit (RWF, 0 = No Cap)
                </label>
                <input
                  type="number"
                  min={0}
                  value={secPerms.maxExpenseLimitRWF}
                  onChange={(e) =>
                    setSecPerms((p) => ({ ...p, maxExpenseLimitRWF: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={secRequirePin}
                  onChange={(e) => setSecRequirePin(e.target.checked)}
                  className="accent-[#218DFF]"
                />
                <span>
                  <strong>Block Direct Entry to Main HQ</strong> (Require Owner Password / PIN to switch to HQ)
                </span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={secPerms.canDeleteRecords}
                  onChange={(e) => setSecPerms((p) => ({ ...p, canDeleteRecords: e.target.checked }))}
                  className="accent-[#218DFF]"
                />
                <span>
                  <strong>Allow Record Deletions</strong> (Sales, Purchases &amp; Inventory items)
                </span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={secPerms.canEditPrices}
                  onChange={(e) => setSecPerms((p) => ({ ...p, canEditPrices: e.target.checked }))}
                  className="accent-[#218DFF]"
                />
                <span>
                  <strong>Allow Selling Price Edits</strong> in this branch
                </span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  checked={secPerms.canRecordExpenses}
                  onChange={(e) => setSecPerms((p) => ({ ...p, canRecordExpenses: e.target.checked }))}
                  className="accent-[#218DFF]"
                />
                <span>
                  <strong>Allow Recording Branch Expenses</strong>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSecurityBranch(null)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingSecurity}
                className="btn-sapphire-clean px-4 py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingSecurity ? 'Saving Policy...' : 'Save Security & Permissions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inter-Branch Stock Transfer Panel (Main HQ -> Sub-Branch) */}
      {transferBranch && (
        <div className="rounded-2xl border border-indigo-400/40 bg-[#040D29]/95 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-300" />
              <h4 className="font-orbitron text-xs sm:text-sm font-bold text-white">
                Transfer Stock from Main HQ → {transferBranch.name}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setTransferBranch(null)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {mainHqProducts.length === 0 ? (
            <p className="text-xs text-slate-300">
              No in-stock products found in Main HQ inventory. Add stock in Main HQ first to transfer units to {transferBranch.name}.
            </p>
          ) : (
            <form onSubmit={handleTransferStock} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Main HQ Product *
                </label>
                <CustomSelect
                  searchable={true}
                  placeholder="Select Main HQ product..."
                  searchPlaceholder="Search product by name..."
                  value={transferProductId}
                  onChange={(val) => setTransferProductId(val)}
                  options={mainHqProducts.map((p) => {
                    const q = Number(p.quantity ?? p.stock ?? p.currentStock ?? 0)
                    return {
                      value: p.id,
                      label: `${p.title || p.name} (HQ Stock: ${q})`,
                      searchText: `${p.title || ''} ${p.name || ''} ${p.sku || ''} ${p.category || ''}`
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity to Transfer *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
              <button
                type="submit"
                disabled={transferring || !transferProductId}
                className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {transferring ? 'Transferring...' : 'Transfer Stock to Branch'}
              </button>
            </form>
          )}
        </div>
      )}

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

          <p className="text-xs text-slate-300 leading-relaxed">
            Generate a secure, single-use setup link for <strong>{managerBranch.name}</strong>. When the manager opens the link, they will enter their own email address and choose the password they want. You will be notified immediately once their account is activated.
          </p>

          <form onSubmit={handleAssignManager} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Manager Name (Optional)
              </label>
              <input
                type="text"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                placeholder="e.g. Jean Paul Mugabo"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email to Auto-Send Link (Optional)
              </label>
              <input
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@business.rw"
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone / WhatsApp (Optional)
              </label>
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => setManagerPhone(e.target.value)}
                placeholder="+25078..."
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={assigning}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {assigning ? 'Generating Secure Link...' : 'Generate Manager Setup Link'}
              </button>
            </div>
          </form>

          {generatedLink && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 space-y-2.5">
              <div className="text-xs font-semibold text-emerald-300">
                Secure Branch Manager Setup Link Ready (Single-Use · Valid 7 Days):
              </div>
              <div className="text-[11px] text-slate-300">
                Send this link to your manager. They will enter their own email and password, and you will receive an alert as soon as they finish.
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#030A1F] border border-white/15 text-xs font-mono text-white"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <a
                    href={`https://wa.me/${managerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hello ${managerName || 'Branch Manager'}, please open this secure ExBOS link to enter your email and create your password for ${managerBranch.name}:\n${generatedLink}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-[#218DFF]/25 hover:bg-[#218DFF]/40 text-[#9EDCFF] text-xs font-bold no-underline"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

