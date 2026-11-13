import React, { useState } from 'react'
import { GitBranch, Plus, Trash2, ArrowUpRight, MapPin } from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'

export default function BranchSettingsCard({ activeArchId = 'buy-and-sell', currentArch = {} }) {
  const {
    branches = [],
    activeBranchId = 'main',
    createBranch,
    deleteBranch,
    switchBranch,
    addToast
  } = useExbos()

  const [branchName, setBranchName] = useState('')
  const [branchLocation, setBranchLocation] = useState('')
  const [creating, setCreating] = useState(false)

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
      }
    } finally {
      setCreating(false)
    }
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
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#218DFF]/15 border-[#9EDCFF]/50'
                  : 'bg-white/[0.04] border-white/10'
              }`}
            >
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
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => switchBranch && switchBranch(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#218DFF] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-[#9EDCFF]'
                  }`}
                >
                  <span>{isCurrent ? 'Active' : 'Switch'}</span>
                  {!isCurrent && <ArrowUpRight className="w-3.5 h-3.5" />}
                </button>
                {!b.isMain && (
                  <button
                    type="button"
                    onClick={() => deleteBranch && deleteBranch(b.id)}
                    title="Delete Branch"
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

