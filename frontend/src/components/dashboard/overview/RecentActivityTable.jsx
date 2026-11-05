import React, { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function RecentActivityTable({
  archTransactions = [],
  hideFinancials = false,
  onOpenWorkflowModal = () => {}
}) {
  const [activeTab, setActiveTab] = useState('workflows')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTransactions = archTransactions.filter((tx) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      (tx.title && tx.title.toLowerCase().includes(q)) ||
      (tx.category && tx.category.toLowerCase().includes(q)) ||
      (tx.account && tx.account.toLowerCase().includes(q))
    )
  })

  return (
    <div className="exbos-glass-card p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-6">
          <h3 className="font-orbitron text-lg font-bold text-white">
            Executions
          </h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('workflows')}
              className={`pb-1 cursor-pointer bg-transparent border-0 transition-colors ${
                activeTab === 'workflows'
                  ? 'text-white border-b-2 border-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Workflows
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('permissions')}
              className={`pb-1 cursor-pointer bg-transparent border-0 transition-colors ${
                activeTab === 'permissions'
                  ? 'text-white border-b-2 border-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Permissions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`pb-1 cursor-pointer bg-transparent border-0 transition-colors ${
                activeTab === 'logs'
                  ? 'text-white border-b-2 border-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Logs
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search executions..."
            className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none w-48 transition-all"
          />
        </div>
      </div>

      {/* Clean Frosted List / Live Workflow Canvas */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
            <button
              type="button"
              onClick={onOpenWorkflowModal}
              className="w-12 h-12 mx-auto rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#9EDCFF] cursor-pointer border border-white/15 transition-all"
            >
              <Plus className="w-6 h-6" />
            </button>
            <h4 className="text-sm font-bold text-white font-orbitron">
              No Workflows Executed Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your production workspace is clean and ready. Click &quot;New Workflow / Transaction&quot; above to record your first sale, expense, or stock movement.
            </p>
          </div>
        ) : (
          filteredTransactions.slice(0, 6).map((row, idx) => (
            <div
              key={row.id || idx}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                    row.type === 'in'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  0{idx + 1}
                </div>
                <div>
                  <strong className="block text-sm font-semibold text-white">
                    {row.title}
                  </strong>
                  <span className="text-xs text-slate-400">
                    {row.createdAt || 'Just now'} · {row.category} · via{' '}
                    {row.account}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`font-orbitron text-sm font-bold ${
                    row.type === 'in' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {row.type === 'in' ? '+' : '-'}
                  {formatRWF(row.amountRWF, hideFinancials)}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#9EDCFF] font-medium">
                  {row.status || 'Posted'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

