import React, { useState } from 'react'
import {
  Plus,
  Activity,
  Calendar,
  Clock,
  HeartPulse,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import RecordBreedingModal from '../modals/RecordBreedingModal'
import RecordBirthOffspringModal from '../modals/RecordBirthOffspringModal'

export default function BreedingReproductionWorkspace() {
  const { demoWorkspaces, updateDemoRecord, addDemoRecord } = useExbos()
  const archData = demoWorkspaces['agriculture'] || {}
  const animalsList = archData.records?.Animals || []
  const gestationsList = archData.records?.Gestations || []
  const productionList = archData.records?.Production || []

  const [breedingModalOpen, setBreedingModalOpen] = useState(false)
  const [birthModalTarget, setBirthModalTarget] = useState(null)

  const handleSaveBreeding = (gestation) => {
    addDemoRecord('agriculture', 'Gestations', gestation)

    // Also append activity to dam
    const dam = animalsList.find((a) => a.id === gestation.damId)
    if (dam) {
      const activities = [
        {
          date: gestation.matingDate,
          type: 'Mating',
          text: `Mated with Sire ${gestation.sireName} · Expected ${gestation.expectedDate}`
        },
        ...(dam.activities || [])
      ]
      updateDemoRecord('agriculture', 'Animals', dam.id, {
        healthStatus: 'Healthy · Gestating',
        activities
      })
    }
  }

  const handleSaveBirth = (birthData) => {
    // 1. Mark gestation as completed
    if (birthData.gestationId) {
      updateDemoRecord('agriculture', 'Gestations', birthData.gestationId, {
        status: `Completed · ${birthData.survivedCount} Offspring Born`,
        birthDate: birthData.birthDate
      })
    }

    // 2. Add production record
    addDemoRecord('agriculture', 'Production', {
      id: `PRD-${Math.floor(100 + Math.random() * 900)}`,
      date: birthData.birthDate,
      item: 'Offspring Born',
      quantity: birthData.survivedCount,
      unit: 'heads',
      sourceAnimal: birthData.damName,
      status: 'Active Weaners'
    })

    // 3. Auto-register surviving batch if checked
    if (birthData.autoRegisterBatch && birthData.survivedCount > 0) {
      addDemoRecord('agriculture', 'Batches', {
        id: `BAT-NEW-${Math.floor(100 + Math.random() * 900)}`,
        name: `Litter of ${birthData.damName}`,
        type: 'Offspring',
        breed: 'Farm Cross',
        quantity: birthData.survivedCount,
        initialQuantity: birthData.survivedCount,
        avgWeightKg: birthData.avgBirthWeightKg,
        unitCostRWF: 0,
        totalCostRWF: 0,
        acquisitionDate: birthData.birthDate,
        location: 'Nursery / Weaner Pen',
        notes: `Born from ${birthData.damName} on ${birthData.birthDate}`,
        age: '0 weeks'
      })
    }

    // 4. Update dam activity
    const dam = animalsList.find((a) => a.id === birthData.damId)
    if (dam) {
      const activities = [
        {
          date: birthData.birthDate,
          type: 'Birth',
          text: `Gave birth to ${birthData.totalBorn} (${birthData.survivedCount} survived healthy)`
        },
        ...(dam.activities || [])
      ]
      updateDemoRecord('agriculture', 'Animals', dam.id, {
        healthStatus: 'Healthy · Lactating',
        activities
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#071d18]/80 to-teal-950/60 border border-emerald-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Pillar 05 · Breeding, Gestation &amp; Offspring Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Breeding &amp; Reproduction Cycles
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitor mating pairs, count gestation days, and auto-register surviving litters
          </p>
        </div>

        <button
          onClick={() => setBreedingModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Record Breeding Pair</span>
        </button>
      </div>

      {/* Active Gestations Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Active Gestations &amp; Mating Records ({gestationsList.length})</span>
          </h3>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061814]/70 overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar min-w-[760px]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[11px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Dam Female</th>
                  <th className="py-3 px-3">Sire Male</th>
                  <th className="py-3 px-3">Mating Date</th>
                  <th className="py-3 px-3">Expected Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Cycle Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {gestationsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No breeding cycles recorded yet. Click "Record Breeding Pair" to track a gestation.
                    </td>
                  </tr>
                ) : (
                  gestationsList.map((ges) => {
                    const isCompleted = ges.status?.includes('Completed')
                    return (
                      <tr key={ges.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{ges.damName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{ges.damId}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-white font-medium">{ges.sireName}</div>
                          <span className="text-[10px] font-mono text-slate-400">{ges.sireId}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{ges.matingDate}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-300">{ges.expectedDate}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              isCompleted
                                ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 animate-pulse'
                            }`}
                          >
                            {ges.status || 'Active Gestation'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                          {ges.notes || 'Routine breeding service'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isCompleted && (
                            <button
                              onClick={() => setBirthModalTarget(ges)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-400/30 flex items-center gap-1.5 ml-auto transition-colors"
                            >
                              <HeartPulse className="w-3.5 h-3.5" />
                              <span>Record Birth</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RecordBreedingModal
        isOpen={breedingModalOpen}
        onClose={() => setBreedingModalOpen(false)}
        animalsList={animalsList}
        onSaveBreeding={handleSaveBreeding}
      />

      {birthModalTarget && (
        <RecordBirthOffspringModal
          isOpen={Boolean(birthModalTarget)}
          onClose={() => setBirthModalTarget(null)}
          gestationRecord={birthModalTarget}
          onSaveBirth={handleSaveBirth}
        />
      )}
    </div>
  )
}
