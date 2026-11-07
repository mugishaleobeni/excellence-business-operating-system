import React, { useState } from 'react'
import {
  Plus,
  HeartPulse,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordVetHealthModal from '../modals/RecordVetHealthModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function FarmHealthWorkspace() {
  const { demoWorkspaces, updateDemoRecord, addDemoRecord, deleteDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const animalsList = archData.records?.Animals || []
  const batchesList = archData.records?.Batches || []
  const healthList = archData.records?.HealthRecords || []

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  const totalVetSpent = healthList.reduce((sum, h) => sum + (Number(h.costRWF) || 0), 0)

  const handleSaveHealthRecord = (record) => {
    addDemoRecord('agriculture', 'HealthRecords', record)
    if (addTransaction && Number(record.costRWF) > 0) {
      addTransaction({
        architectureId: 'agriculture',
        title: `Vet Care: ${record.diagnosis || 'Treatment'} (${record.targetName || record.targetRef || 'Livestock'})`,
        type: 'out',
        category: 'Veterinary & Health',
        amountRWF: Number(record.costRWF),
        account: 'Cash / MoMo'
      })
    }

    // Also link to animal or batch history
    if (record.targetType === 'individual') {
      const animal = animalsList.find((a) => a.id === record.targetRef)
      if (animal) {
        const activities = [
          {
            date: record.date,
            type: 'Health',
            text: `${record.diagnosis} (${record.treatment || 'Done'}) · Cost: ${formatRWF(record.costRWF)}`
          },
          ...(animal.activities || [])
        ]
        const newStatus = record.isMortality ? 'Deceased · Archived' : animal.healthStatus
        updateDemoRecord('agriculture', 'Animals', animal.id, {
          healthStatus: newStatus,
          activities
        })
      }
    } else {
      const batch = batchesList.find((b) => b.id === record.targetRef)
      if (batch && record.isMortality) {
        const remaining = Math.max(0, (batch.quantity || 0) - record.mortalityCount)
        updateDemoRecord('agriculture', 'Batches', batch.id, {
          quantity: remaining
        })
      }
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('agriculture', 'HealthRecords', deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 06 · Veterinary Care &amp; Biosecurity
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Animal Health &amp; Veterinary Care
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Vaccination calendars, disease diagnosis, medicine costs &amp; mortality preservation
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Health / Mortality</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            <span>Total Treatments Recorded</span>
          </div>
          <div className="text-xl font-bold text-white mt-1.5">{healthList.length}</div>
        </div>

        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Cumulative Vet Expenses</span>
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1.5">{formatRWF(totalVetSpent)}</div>
        </div>

        <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Upcoming Boosters</span>
          </div>
          <div className="text-xl font-bold text-sky-300 mt-1.5">
            {healthList.filter((h) => h.nextDate).length} Scheduled
          </div>
        </div>
      </div>

      {/* Health Ledger Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Veterinary Records &amp; Mortality History ({healthList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Animal / Batch</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Diagnosis / Cause</th>
                  <th className="py-3 px-3">Medication Administered</th>
                  <th className="py-3 px-3">Event Date</th>
                  <th className="py-3 px-3">Next Booster</th>
                  <th className="py-3 px-3">Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {healthList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No veterinary records found. Click "Record Health / Mortality" to add one.
                    </td>
                  </tr>
                ) : (
                  healthList.map((h) => (
                    <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{h.targetName || h.targetRef}</div>
                        <span className="text-[10px] font-mono text-slate-400">{h.targetRef}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            h.isMortality
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {h.treatmentType || 'Care'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-medium">{h.diagnosis}</td>
                      <td className="py-3 px-3 text-slate-300">{h.treatment || '—'}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{h.date}</td>
                      <td className="py-3 px-3">
                        {h.nextDate ? (
                          <span className="text-sky-300 font-mono font-medium">{h.nextDate}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        {formatRWF(h.costRWF)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              id: h.id,
                              name: `${h.diagnosis} (${h.targetName})`
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

      <RecordVetHealthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        animalsList={animalsList}
        batchesList={batchesList}
        onSaveHealthRecord={handleSaveHealthRecord}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Confirm Health Record Removal"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? Financial records will remain audited.`}
      />
    </div>
  )
}
