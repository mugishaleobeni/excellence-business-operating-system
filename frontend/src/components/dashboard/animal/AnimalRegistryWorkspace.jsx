import React, { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Scale,
  Heart,
  Calendar,
  Sparkles,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  Users,
  User,
  Info
} from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'
import { ANIMAL_CATEGORIES, getCategoryByAnimalType } from './animalConstants'
import RegisterAnimalModal from './RegisterAnimalModal'
import AnimalProfileModal from './AnimalProfileModal'
import RecordWeightModal from './RecordWeightModal'
import RecordBreedingModal from './RecordBreedingModal'

export default function AnimalRegistryWorkspace({
  activeArchId = 'agriculture',
  activePage = 'Animal Register',
  workspace = {},
  records = [],
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  addToast,
  hideFinancials = false
}) {
  // Modal states
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState(null)
  const [viewingAnimal, setViewingAnimal] = useState(null)
  const [weightModalAnimal, setWeightModalAnimal] = useState(null)
  const [breedingModalAnimal, setBreedingModalAnimal] = useState(null)
  const [confirmDeleteAnimal, setConfirmDeleteAnimal] = useState(null)

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [filterSex, setFilterSex] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterBreedingStatus, setFilterBreedingStatus] = useState('ALL')
  const [sortKey, setSortKey] = useState('date')
  const [sortAsc, setSortAsc] = useState(false)

  // Existing suppliers for autofill
  const existingSuppliers = useMemo(() => {
    return workspace.records?.['Suppliers'] || []
  }, [workspace])

  // Filtered Animals list
  const filteredAnimals = useMemo(() => {
    return records.filter((item) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchTitle = String(item.title || item.name || '').toLowerCase().includes(query)
        const matchId = String(item.animalId || item.id || '').toLowerCase().includes(query)
        const matchBreed = String(item.breed || '').toLowerCase().includes(query)
        const matchType = String(item.animalType || '').toLowerCase().includes(query)
        const matchSeller = String(item.sellerName || item.supplier || '').toLowerCase().includes(query)
        if (!matchTitle && !matchId && !matchBreed && !matchType && !matchSeller) {
          return false
        }
      }

      // 2. Category / Species filter
      if (filterCategory !== 'ALL') {
        const catInfo = getCategoryByAnimalType(item.animalType)
        if (catInfo.category.toLowerCase() !== filterCategory.toLowerCase()) {
          return false
        }
      }

      // 3. Sex filter
      if (filterSex !== 'ALL') {
        if (String(item.sex || '').toLowerCase() !== filterSex.toLowerCase()) {
          return false
        }
      }

      // 4. Status filter
      if (filterStatus !== 'ALL') {
        if (String(item.status || 'Active').toLowerCase() !== filterStatus.toLowerCase()) {
          return false
        }
      }

      // 5. Breeding status filter
      if (filterBreedingStatus !== 'ALL') {
        const bs = String(item.breedingStatus || '').toLowerCase()
        if (filterBreedingStatus === 'PREGNANT' && !bs.includes('pregnant') && !bs.includes('pig') && !bs.includes('calf')) {
          return false
        }
        if (filterBreedingStatus === 'READY' && !bs.includes('ready')) {
          return false
        }
        if (filterBreedingStatus === 'NOT_BREEDING' && !bs.includes('not')) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      const aVal = a[sortKey] || ''
      const bVal = b[sortKey] || ''
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal))
    })
  }, [records, searchTerm, filterCategory, filterSex, filterStatus, filterBreedingStatus, sortKey, sortAsc])

  // Summary Metrics for Animals
  const animalMetrics = useMemo(() => {
    let totalHeads = 0
    let totalValuation = 0
    let breedingReadyCount = 0
    let expectingCount = 0

    records.forEach((a) => {
      const q = Number(a.quantity) || 1
      totalHeads += q
      const val = Number(a.purchasePriceRWF || a.amountRWF) || 0
      totalValuation += val

      const bs = String(a.breedingStatus || '').toLowerCase()
      if (bs.includes('ready')) breedingReadyCount += q
      if (bs.includes('pregnant') || bs.includes('in pig') || bs.includes('calf') || bs.includes('broody')) {
        expectingCount += q
      }
    })

    return {
      totalRecords: records.length,
      totalHeads,
      totalValuation,
      breedingReadyCount,
      expectingCount
    }
  }, [records])

  // Save new animal or update existing
  const handleSaveAnimal = (animalData, isEdit) => {
    if (isEdit) {
      onUpdateRecord && onUpdateRecord(activeArchId, 'Production', animalData.id, animalData)
      addToast && addToast({
        type: 'success',
        title: 'Animal Record Updated',
        message: `Updated details for ${animalData.title || animalData.id} successfully.`
      })
    } else {
      onAddRecord && onAddRecord(activeArchId, 'Production', animalData)
      addToast && addToast({
        type: 'success',
        title: 'Animal Registered',
        message: `Registered ${animalData.title || animalData.id} into the Animal Registry.`
      })
    }
    setEditingAnimal(null)
  }

  // Update specific fields (weight or breeding)
  const handleQuickUpdate = (animalId, updates) => {
    onUpdateRecord && onUpdateRecord(activeArchId, 'Production', animalId, updates)
    addToast && addToast({
      type: 'success',
      title: 'Record Updated',
      message: 'Animal entry updated successfully.'
    })
  }

  // Delete animal
  const handleDeleteAnimal = () => {
    if (!confirmDeleteAnimal) return
    onDeleteRecord && onDeleteRecord(activeArchId, 'Production', confirmDeleteAnimal.id)
    addToast && addToast({
      type: 'info',
      title: 'Animal Removed',
      message: `Animal ${confirmDeleteAnimal.title || confirmDeleteAnimal.id} was deleted.`
    })
    setConfirmDeleteAnimal(null)
    setViewingAnimal(null)
  }

  return (
    <div className="space-y-6">
      {/* 4 Summary Strip KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-orbitron uppercase text-[#9EDCFF] block font-bold">
              Total Animals Listed
            </span>
            <div className="font-orbitron text-xl sm:text-2xl font-extrabold text-white mt-1">
              {animalMetrics.totalHeads} <span className="text-xs text-slate-400 font-normal">Head</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Across {animalMetrics.totalRecords} registered records
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-xl">
            🐾
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-orbitron uppercase text-emerald-400 block font-bold">
              Ready for Breeding
            </span>
            <div className="font-orbitron text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1">
              {animalMetrics.breedingReadyCount} <span className="text-xs text-slate-400 font-normal">Active</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Reproductively mature stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-orbitron uppercase text-[#9EDCFF] block font-bold">
              Pregnant / Expecting
            </span>
            <div className="font-orbitron text-xl sm:text-2xl font-extrabold text-[#9EDCFF] mt-1">
              {animalMetrics.expectingCount} <span className="text-xs text-slate-400 font-normal">Due</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Gestation countdown tracked
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF]">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-orbitron uppercase text-amber-400 block font-bold">
              Total Livestock Value
            </span>
            <div className="font-orbitron text-lg sm:text-xl font-extrabold text-amber-300 mt-1">
              {formatRWF(animalMetrics.totalValuation, hideFinancials)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Estimated herd &amp; flock asset
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <Scale className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-3xl bg-[#040C26]/90 border border-white/10 shadow-2xl p-5 sm:p-6 space-y-5">
        
        {/* Header Actions & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
              Livestock Workspace · {activePage}
            </span>
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white">
              Animal Register
            </h3>
            <p className="text-xs text-slate-400">
              Individual tag records, species breeding data, origins, and weight history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tag, breed, ID, seller..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
              />
            </div>

            {/* Primary Action Button: + Register Animal */}
            <button
              type="button"
              onClick={() => {
                setEditingAnimal(null)
                setRegisterModalOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ Register Animal</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#218DFF]" />
            <span>Category:</span>
          </span>

          {['ALL', 'Pigs', 'Cattle', 'Goats', 'Sheep', 'Chickens', 'Rabbits', 'Fish', 'Other Animals'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-[#218DFF] text-white shadow-sm'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat === 'ALL' ? 'All Species' : cat}
            </button>
          ))}

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Sex Filter */}
            <select
              value={filterSex}
              onChange={(e) => setFilterSex(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
            >
              <option value="ALL">All Sex</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#071644] border border-white/20 text-xs text-white"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Sold">Sold</option>
              <option value="Deceased">Deceased</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
        </div>

        {/* Animal Registry Table (Section 6) */}
        <div className="w-full min-h-[220px] rounded-2xl bg-[#03091F]/80 border border-white/10 shadow-lg overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/15 bg-white/5 text-[10px] sm:text-[11px] font-orbitron uppercase tracking-wider text-slate-300">
                <th className="py-3 px-3 font-bold whitespace-nowrap">ANIMAL ID</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">TYPE &amp; BREED</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">TAG / NAME</th>
                <th className="py-3 px-2 font-bold text-center whitespace-nowrap">SEX</th>
                <th className="py-3 px-2 font-bold text-center whitespace-nowrap">AGE</th>
                <th className="py-3 px-2 font-bold text-center whitespace-nowrap">WEIGHT</th>
                <th className="py-3 px-2 font-bold text-center whitespace-nowrap">QTY</th>
                <th className="py-3 px-3 font-bold text-right whitespace-nowrap">PURCHASE PRICE</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">SELLER / ORIGIN</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">BREEDING STATUS</th>
                <th className="py-3 px-3 font-bold whitespace-nowrap">STATUS</th>
                <th className="py-3 px-3 text-center font-bold text-slate-300 whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {filteredAnimals.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 px-4 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                        🐾
                      </div>
                      <strong className="text-white text-sm font-orbitron">No Animals Found</strong>
                      <p className="text-xs text-slate-400">
                        {searchTerm || filterCategory !== 'ALL'
                          ? 'No animals match your active filters. Try clearing your search.'
                          : 'You have not registered any animals yet. Click "+ Register Animal" above to add your first pig, cattle, poultry, or flock.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnimal(null)
                          setRegisterModalOpen(true)
                        }}
                        className="btn-sapphire-clean px-4 py-2 text-xs font-bold mt-2"
                      >
                        + Register Animal Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnimals.map((row) => {
                  const catInfo = getCategoryByAnimalType(row.animalType)
                  const price = Number(row.purchasePriceRWF || row.amountRWF) || 0

                  return (
                    <tr
                      key={row.id || row.animalId}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => setViewingAnimal(row)}
                    >
                      {/* 1. Animal ID */}
                      <td className="py-3 px-3 font-mono font-bold text-xs text-[#9EDCFF] whitespace-nowrap">
                        {row.animalId || row.id}
                      </td>

                      {/* 2. Photo / Type & Breed */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg shrink-0">{catInfo.icon || '🐾'}</span>
                          <div>
                            <strong className="block text-xs text-white">
                              {row.animalType || 'Livestock'}
                            </strong>
                            <span className="text-[10px] text-slate-400">
                              {row.breed || 'Standard'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Tag / Name */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-semibold text-xs text-slate-100">
                          {row.title || row.name || '—'}
                        </span>
                        {row.registrationMode === 'group' && (
                          <span className="block text-[10px] text-purple-300">
                            Group Batch
                          </span>
                        )}
                      </td>

                      {/* 4. Sex */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span className="text-xs">
                          {row.sex === 'Female' ? '♀ Female' : row.sex === 'Male' ? '♂ Male' : row.sex || '—'}
                        </span>
                      </td>

                      {/* 5. Age */}
                      <td className="py-3 px-2 text-center text-xs text-slate-300 whitespace-nowrap">
                        {row.age || '—'}
                      </td>

                      {/* 6. Weight */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        {row.weightKg ? (
                          <span className="font-bold text-emerald-400 text-xs">
                            {row.weightKg} kg
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* 7. Quantity */}
                      <td className="py-3 px-2 text-center whitespace-nowrap font-bold text-xs">
                        {row.quantity || 1}
                      </td>

                      {/* 8. Purchase Price */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-orbitron font-bold text-xs">
                        {row.origin === 'Purchased' && price > 0 ? (
                          <span className="text-emerald-400">
                            {formatRWF(price, hideFinancials)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal italic">
                            {row.origin || 'Born on Farm'}
                          </span>
                        )}
                      </td>

                      {/* 9. Seller / Origin */}
                      <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-300">
                        {row.sellerName || row.supplier || row.origin || 'Born on Farm'}
                      </td>

                      {/* 10. Breeding Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-[#9EDCFF]">
                          {row.breedingStatus || 'Not Breeding'}
                        </span>
                      </td>

                      {/* 11. Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-orbitron font-bold uppercase px-2 py-0.5 rounded-full ${
                            row.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : row.status === 'Sold'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {row.status || 'Active'}
                        </span>
                      </td>

                      {/* 12. Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="View Profile"
                            onClick={() => setViewingAnimal(row)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#9EDCFF] transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Edit Animal"
                            onClick={() => {
                              setEditingAnimal(row)
                              setRegisterModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Record Weight"
                            onClick={() => setWeightModalAnimal(row)}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition-all cursor-pointer"
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Record Breeding"
                            onClick={() => setBreedingModalAnimal(row)}
                            className="p-1.5 rounded-lg bg-[#218DFF]/15 hover:bg-[#218DFF]/25 text-[#9EDCFF] transition-all cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Delete Animal"
                            onClick={() => setConfirmDeleteAnimal(row)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER / EDIT MODAL */}
      <RegisterAnimalModal
        isOpen={registerModalOpen}
        onClose={() => {
          setRegisterModalOpen(false)
          setEditingAnimal(null)
        }}
        onSave={handleSaveAnimal}
        existingSuppliers={existingSuppliers}
        existingAnimals={records}
        initialData={editingAnimal}
      />

      {/* DETAIL PROFILE MODAL */}
      <AnimalProfileModal
        isOpen={Boolean(viewingAnimal)}
        onClose={() => setViewingAnimal(null)}
        animal={viewingAnimal}
        onEdit={(a) => {
          setEditingAnimal(a)
          setRegisterModalOpen(true)
        }}
        onRecordWeight={(a) => setWeightModalAnimal(a)}
        onRecordBreeding={(a) => setBreedingModalAnimal(a)}
        onDelete={(a) => setConfirmDeleteAnimal(a)}
        hideFinancials={hideFinancials}
      />

      {/* QUICK WEIGHT MODAL */}
      <RecordWeightModal
        isOpen={Boolean(weightModalAnimal)}
        onClose={() => setWeightModalAnimal(null)}
        animal={weightModalAnimal}
        onSave={handleQuickUpdate}
      />

      {/* QUICK BREEDING MODAL */}
      <RecordBreedingModal
        isOpen={Boolean(breedingModalAnimal)}
        onClose={() => setBreedingModalAnimal(null)}
        animal={breedingModalAnimal}
        onSave={handleQuickUpdate}
      />

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#071644] border-2 border-rose-500/40 shadow-2xl text-white p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-orbitron text-base font-bold text-white">
              Delete Animal Record?
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <strong>{confirmDeleteAnimal.title || confirmDeleteAnimal.animalId}</strong> ({confirmDeleteAnimal.breed} {confirmDeleteAnimal.animalType})? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteAnimal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAnimal}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-lg"
              >
                Yes, Delete Animal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

