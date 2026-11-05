import React, { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Activity,
  Trash2,
  Scale,
  Layers,
  Tag,
  MapPin,
  HeartPulse,
  DollarSign
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RegisterAnimalModal from '../modals/RegisterAnimalModal'
import AnimalActivityTimeline from '../components/AnimalActivityTimeline'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function AnimalDirectoryWorkspace({ activeSubPage = 'Animal Register' }) {
  const { demoWorkspaces, addDemoRecord, updateDemoRecord, deleteDemoRecord } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const animalsList = archData.records?.Animals || []
  const batchesList = archData.records?.Batches || []

  const [activeTab, setActiveTab] = useState('all') // 'all' | 'individual' | 'batch'
  const [searchQuery, setSearchQuery] = useState('')
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [timelineAnimal, setTimelineAnimal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'Animals'|'Batches', id, name }

  // Format currency
  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  // Filtered lists
  const filteredAnimals = useMemo(() => {
    return animalsList.filter((a) => {
      const q = searchQuery.toLowerCase()
      return (
        a.name?.toLowerCase().includes(q) ||
        a.id?.toLowerCase().includes(q) ||
        a.breed?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q)
      )
    })
  }, [animalsList, searchQuery])

  const filteredBatches = useMemo(() => {
    return batchesList.filter((b) => {
      const q = searchQuery.toLowerCase()
      return (
        b.name?.toLowerCase().includes(q) ||
        b.breed?.toLowerCase().includes(q) ||
        b.location?.toLowerCase().includes(q)
      )
    })
  }, [batchesList, searchQuery])

  const handleSaveIndividual = (rec) => {
    addDemoRecord('agriculture', 'Animals', rec)
  }

  const handleSaveBatch = (rec) => {
    addDemoRecord('agriculture', 'Batches', rec)
  }

  const handleUpdateWeight = (animalId, newWeight) => {
    updateDemoRecord('agriculture', 'Animals', animalId, {
      currentWeightKg: newWeight
    })
  }

  const handleAddActivity = (animalId, act) => {
    const animal = animalsList.find((a) => a.id === animalId)
    if (!animal) return
    const updatedActivities = [act, ...(animal.activities || [])]
    updateDemoRecord('agriculture', 'Animals', animalId, {
      activities: updatedActivities
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteDemoRecord('agriculture', deleteTarget.type, deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillars 01 – 03 · Dual Registration &amp; Growth Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Animal Register &amp; Lifecycle
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Individual breeding stock tracking &amp; flock/batch management with full weight gain history
          </p>
        </div>

        <button
          onClick={() => setRegisterModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Register Animals</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Registered ({animalsList.length + batchesList.length})
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'individual'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Individual Breeders ({animalsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'batch'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batches &amp; Flocks ({batchesList.length})</span>
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, breed, pen..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Section 1: Individual Animals Table */}
      {(activeTab === 'all' || activeTab === 'individual') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Individual Animals ({filteredAnimals.length})</span>
            </h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Identifier / Name</th>
                    <th className="py-3 px-3">Breed &amp; Sex</th>
                    <th className="py-3 px-3">Weight History</th>
                    <th className="py-3 px-3">Pen / Location</th>
                    <th className="py-3 px-3">Health Status</th>
                    <th className="py-3 px-3">Total Invested</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredAnimals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No individual animals registered. Click "Register Animals" to start.
                      </td>
                    </tr>
                  ) : (
                    filteredAnimals.map((animal) => (
                      <tr key={animal.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{animal.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              {animal.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Age: {animal.ageMonths || 1} mo · Acquired: {animal.acquiredDate || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white font-medium">{animal.breed}</div>
                          <span className="text-[11px] text-slate-400">{animal.sex}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-300">
                              {animal.currentWeightKg || animal.startingWeightKg || 0} kg
                            </span>
                            {animal.startingWeightKg && (
                              <span className="text-[10px] text-slate-400">
                                (Start: {animal.startingWeightKg} kg)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{animal.location || 'Barn Pen'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
                            {animal.healthStatus || 'Healthy'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-white">
                          {formatRWF(animal.totalRaisedCostRWF || animal.purchasePriceRWF)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setTimelineAnimal(animal)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-medium flex items-center gap-1 border border-emerald-400/20"
                              title="View Growth & Lifecycle Timeline"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Timeline</span>
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'Animals',
                                  id: animal.id,
                                  name: `${animal.name} (${animal.id})`
                                })
                              }
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                              title="Delete Animal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Group / Batch Flocks Table */}
      {(activeTab === 'all' || activeTab === 'batch') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Flock &amp; Herd Batches ({filteredBatches.length})</span>
            </h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Batch Name &amp; ID</th>
                    <th className="py-3 px-3">Type &amp; Breed</th>
                    <th className="py-3 px-3">Active Heads</th>
                    <th className="py-3 px-3">Avg Weight</th>
                    <th className="py-3 px-3">Location / Pen</th>
                    <th className="py-3 px-3">Total Investment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No animal batches registered. Click "Register Animals" to create a batch.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{batch.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {batch.id} · Acquired: {batch.acquisitionDate || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white font-medium">{batch.type}</div>
                          <span className="text-[11px] text-slate-400">{batch.breed}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-teal-300 text-sm">
                            {batch.quantity} heads
                          </span>
                          {batch.initialQuantity && batch.initialQuantity !== batch.quantity && (
                            <span className="text-[10px] text-slate-400 block">
                              Started: {batch.initialQuantity}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-200">
                          {batch.avgWeightKg ? `${batch.avgWeightKg} kg/head` : '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {batch.location || 'Flock House'}
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-white">
                          {formatRWF(batch.totalCostRWF || batch.quantity * (batch.unitCostRWF || 0))}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'Batches',
                                id: batch.id,
                                name: `${batch.name} (${batch.quantity} heads)`
                              })
                            }
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                            title="Delete Batch"
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
      )}

      {/* Modals */}
      <RegisterAnimalModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSaveIndividual={handleSaveIndividual}
        onSaveBatch={handleSaveBatch}
      />

      {timelineAnimal && (
        <AnimalActivityTimeline
          animal={timelineAnimal}
          onClose={() => setTimelineAnimal(null)}
          onAddActivity={handleAddActivity}
          onUpdateWeight={handleUpdateWeight}
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Confirm Animal Record Deletion"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? Complete historical logs will be retained in audit ledgers.`}
      />
    </div>
  )
}
