import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  Package,
  Plus,
  Search,
  Clock,
  Percent,
  Coins,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  TrendingUp,
  Layers
} from 'lucide-react'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'
import NewServiceModal from '../modals/NewServiceModal'
import NewConsumableModal from '../modals/NewConsumableModal'

export default function ServiceCatalogueWorkspace({
  services = [],
  consumables = [],
  categories = [],
  onAddService = () => {},
  onUpdateService = () => {},
  onDeleteService = () => {},
  onAddConsumable = () => {},
  onUpdateConsumable = () => {},
  onDeleteConsumable = () => {},
  onAddCategory = () => {},
  activeSubPage = 'Service Catalogue',
  setActiveSubPage = () => {}
}) {
  const activeTab = useMemo(() => {
    if (activeSubPage === 'Consumables & Supplies' || activeSubPage === 'Consumables') return 'consumables'
    if (activeSubPage === 'Service Categories' || activeSubPage === 'Categories') return 'categories'
    return 'services'
  }, [activeSubPage])

  const handleTabClick = (tabKey) => {
    if (tabKey === 'consumables') setActiveSubPage('Consumables & Supplies')
    else if (tabKey === 'categories') setActiveSubPage('Service Categories')
    else setActiveSubPage('Service Catalogue')
  }

  const headerMeta = useMemo(() => {
    if (activeTab === 'consumables') {
      return { title: 'Consumables & Spare Supplies', subtitle: 'Monitor stock levels, purchase prices, and automatic supplies deduction per job' }
    }
    if (activeTab === 'categories') {
      return { title: 'Service Categories & Stations', subtitle: 'Group catalogue offerings and supplies into operational categories' }
    }
    return { title: 'Service Catalogue & Menu Offerings', subtitle: 'Define client prices, service duration, staff commission & linked supplies' }
  }, [activeTab])

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Modals state
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const [consumableModalOpen, setConsumableModalOpen] = useState(false)
  const [editingConsumable, setEditingConsumable] = useState(null)

  // Reusable Delete Modal state
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    itemType: '',
    item: null
  })

  // New Category input
  const [newCatInput, setNewCatInput] = useState('')

  // Filtered Services
  const filteredServices = services.filter((srv) => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = srv.name?.toLowerCase().includes(q) || srv.category?.toLowerCase().includes(q)
    return matchesQuery && (categoryFilter === 'All' || srv.category === categoryFilter)
  })

  // Filtered Consumables
  const filteredConsumables = consumables.filter((con) => {
    const q = searchQuery.toLowerCase()
    return con.name?.toLowerCase().includes(q) || con.category?.toLowerCase().includes(q)
  })

  const handleDeleteConfirm = () => {
    if (!deleteModalState.item) return
    if (deleteModalState.itemType === 'service') {
      onDeleteService(deleteModalState.item.id)
    } else if (deleteModalState.itemType === 'consumable') {
      onDeleteConsumable(deleteModalState.item.id)
    }
    setDeleteModalState({ isOpen: false, itemType: '', item: null })
  }

  const handleCreateCategory = (e) => {
    e.preventDefault()
    if (!newCatInput.trim()) return
    onAddCategory(newCatInput.trim())
    setNewCatInput('')
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Workspace Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="font-orbitron text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{headerMeta.title}</span>
          </h2>
          <p className="text-xs text-slate-300">
            {headerMeta.subtitle}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleTabClick('services')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Service Menu ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('consumables')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'consumables'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Consumables ({consumables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabClick('categories')}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'categories'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVICE MENU */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services or categories..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => { setEditingService(null); setServiceModalOpen(true); }}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Service</span>
            </button>
          </div>

          {/* Services Table */}
          <div className="rounded-2xl border border-white/10 bg-[#071330]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 border-b border-white/10 text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Service Offering</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Client Price</th>
                    <th className="py-3 px-3">Supplies Cost</th>
                    <th className="py-3 px-3">Staff Comm.</th>
                    <th className="py-3 px-3">Net Margin</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">
                        No services found. Click "New Service" to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((srv) => {
                      const suppliesCost = (srv.linkedConsumables || []).reduce(
                        (sum, c) => sum + (Number(c.qty) || 0) * (Number(c.unitCostRWF) || 0),
                        0
                      )
                      const commRWF = Math.round(((Number(srv.priceRWF) || 0) * (Number(srv.commissionPct) || 0)) / 100)
                      const netMargin = (Number(srv.priceRWF) || 0) - suppliesCost - commRWF
                      const marginPct = (Number(srv.priceRWF) || 0) > 0 ? Math.round((netMargin / Number(srv.priceRWF)) * 100) : 0

                      return (
                        <tr key={srv.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{srv.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{srv.id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-400/20 text-[10px]">
                              {srv.category}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 text-slate-300 font-medium">
                              <Clock className="w-3.5 h-3.5 text-sky-400" />
                              <span>{srv.durationMins} mins</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {(Number(srv.priceRWF) || 0).toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-300">
                              {suppliesCost.toLocaleString()} RWF
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {(srv.linkedConsumables || []).length} items
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-amber-300">
                              {commRWF.toLocaleString()} RWF
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {srv.commissionPct}% rate
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-emerald-300">
                              {netMargin.toLocaleString()} RWF
                            </div>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {marginPct}% margin
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => { setEditingService(srv); setServiceModalOpen(true); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white" title="Edit Service">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => setDeleteModalState({ isOpen: true, itemType: 'service', item: srv })} className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400" title="Delete Service">
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
        </div>
      )}

      {/* TAB 2: CONSUMABLES & SUPPLIES */}
      {activeTab === 'consumables' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search consumables, lubricants, parts..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              type="button"
              onClick={() => { setEditingConsumable(null); setConsumableModalOpen(true); }}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supply Item</span>
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#071330]/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/5 border-b border-white/10 text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Supply Material</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Stock Level</th>
                    <th className="py-3 px-3">Unit Purchase Cost</th>
                    <th className="py-3 px-3">Total Value</th>
                    <th className="py-3 px-3">Reorder Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredConsumables.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                        No consumables registered. Click "Add Supply Item" to stock materials.
                      </td>
                    </tr>
                  ) : (
                    filteredConsumables.map((con) => {
                      const isLow = Number(con.currentStock || 0) <= Number(con.reorderLevel || 5)
                      const totalVal = (Number(con.currentStock) || 0) * (Number(con.unitCostRWF) || 0)

                      return (
                        <tr key={con.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{con.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{con.id}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10 text-[10px]">
                              {con.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {con.currentStock} {con.unit}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">
                            {(Number(con.unitCostRWF) || 0).toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-sky-300">
                            {totalVal.toLocaleString()} RWF
                          </td>
                          <td className="py-3 px-3">
                            {isLow ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Low (Reorder &le; {con.reorderLevel})</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                                Optimal Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button type="button" onClick={() => { setEditingConsumable(con); setConsumableModalOpen(true); }} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white" title="Edit Consumable">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => setDeleteModalState({ isOpen: true, itemType: 'consumable', item: con })} className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400" title="Delete Consumable">
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
        </div>
      )}

      {/* TAB 3: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateCategory} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="New service category name..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((cat, idx) => {
              const count = services.filter((s) => s.category === cat).length
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white text-xs">{cat}</div>
                    <div className="text-[10px] text-slate-400">{count} services listed</div>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-300 flex items-center justify-center font-bold text-xs">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <NewServiceModal
        isOpen={serviceModalOpen}
        onClose={() => { setServiceModalOpen(false); setEditingService(null); }}
        onSave={(p) => (editingService ? onUpdateService(editingService.id, p) : onAddService(p))}
        categories={categories}
        availableConsumables={consumables}
        initialService={editingService}
      />

      <NewConsumableModal
        isOpen={consumableModalOpen}
        onClose={() => { setConsumableModalOpen(false); setEditingConsumable(null); }}
        onSave={(p) => (editingConsumable ? onUpdateConsumable(editingConsumable.id, p) : onAddConsumable(p))}
        initialConsumable={editingConsumable}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, itemType: '', item: null })}
        onConfirm={handleDeleteConfirm}
        title={deleteModalState.itemType === 'service' ? 'Delete Service' : 'Delete Consumable'}
        itemName={deleteModalState.item?.name || ''}
        description={`Are you sure you want to permanently delete "${deleteModalState.item?.name}"? This action cannot be undone.`}
      />
    </div>
  )
}
