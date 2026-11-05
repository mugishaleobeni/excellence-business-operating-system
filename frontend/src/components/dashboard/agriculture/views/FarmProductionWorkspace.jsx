import React, { useState } from 'react'
import {
  Plus,
  Egg,
  Milk,
  Sparkles,
  Calendar,
  AlertTriangle,
  Package,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordProductionModal from '../modals/RecordProductionModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function FarmProductionWorkspace() {
  const { demoWorkspaces, addDemoRecord, deleteDemoRecord } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const productionList = archData.records?.Production || []

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleSaveProduction = (rec) => {
    addDemoRecord('agriculture', 'Production', rec)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('agriculture', 'Production', deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 07 · Daily Production &amp; Farm Yield Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Production Records &amp; Storage
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Log eggs, fresh milk, honey harvests: collected vs broken vs available for sale
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Daily Production</span>
        </button>
      </div>

      {/* Production Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Egg className="w-3.5 h-3.5" />
            <span>Recorded Yields in Storage ({productionList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Yield Item</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Collected</th>
                  <th className="py-3 px-3">Broken / Spoilage</th>
                  <th className="py-3 px-3">Net Available</th>
                  <th className="py-3 px-3">Source Flock / Pen</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productionList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No farm production recorded yet. Click "Record Daily Production" to start.
                    </td>
                  </tr>
                ) : (
                  productionList.map((prd) => (
                    <tr key={prd.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{prd.item}</div>
                        <span className="text-[10px] font-mono text-slate-400">{prd.id}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{prd.date}</td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {prd.collected !== undefined ? `${prd.collected} ${prd.unit}` : `${prd.quantity} ${prd.unit}`}
                      </td>
                      <td className="py-3 px-3 text-rose-300 font-mono">
                        {prd.broken ? `${prd.broken} ${prd.unit}` : '0'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-300 text-sm">
                          {prd.quantity} {prd.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{prd.sourceAnimal || 'Farm Flock'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                          {prd.status || 'In Storage'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              id: prd.id,
                              name: `${prd.item} (${prd.quantity} ${prd.unit})`
                            })
                          }
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RecordProductionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveProduction={handleSaveProduction}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Confirm Yield Record Removal"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
      />
    </div>
  )
}
