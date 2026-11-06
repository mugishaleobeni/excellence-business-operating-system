import React, { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  Coffee,
  ShoppingBag,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import AddHybridItemModal from '../modals/AddHybridItemModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function HybridCatalogWorkspace() {
  const { demoWorkspaces, updateDemoRecord, deleteDemoRecord } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const catalog = hybridWorkspace.records?.HybridItems || []

  const [searchQuery, setSearchQuery] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Filter items
  const filteredItems = useMemo(() => {
    return catalog.filter((item) => {
      const matchesActivity = activityFilter === 'all' || item.activity === activityFilter
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.id?.toLowerCase().includes(query)
      return matchesActivity && matchesSearch
    })
  }, [catalog, activityFilter, searchQuery])

  // Toggle stock tracking on/off
  const handleToggleStock = (item) => {
    const nextTrackStock = !item.trackStock
    updateDemoRecord('hybrid', 'HybridItems', item.id, {
      trackStock: nextTrackStock,
      currentStock: nextTrackStock ? (typeof item.currentStock === 'number' ? item.currentStock : 10) : 'Unlimited'
    })
  }

  // Adjust stock count for physical items
  const handleQuickStockAdjust = (item, delta) => {
    if (!item.trackStock) return
    const current = typeof item.currentStock === 'number' ? item.currentStock : 0
    const nextStock = Math.max(0, current + delta)
    updateDemoRecord('hybrid', 'HybridItems', item.id, {
      currentStock: nextStock
    })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDemoRecord('hybrid', 'HybridItems', deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const getActivityBadge = (act) => {
    switch (act) {
      case 'retail':
        return { label: 'Retail Product', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', icon: ShoppingBag }
      case 'service':
        return { label: 'Service / Labor', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', icon: Wrench }
      case 'food':
        return { label: 'Food & Dining', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', icon: Coffee }
      case 'production':
        return { label: 'Production Output', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: Layers }
      default:
        return { label: 'Item', color: 'bg-slate-500/15 text-slate-300 border-slate-500/30', icon: Package }
    }
  }

  return (
    <div className="space-y-5">
      {/* Workspace Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Unified Catalog & Selective Stock Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Configure stock tracking independently: track physical inventory while keeping billable services barrier-free.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-900/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Item or Service
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'retail', label: 'Retail Goods' },
            { id: 'service', label: 'Services & Labor' },
            { id: 'food', label: 'Food & Dining' },
            { id: 'production', label: 'Production' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivityFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                activityFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, services, codes..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Item / Service Details</th>
                <th className="px-4 py-3">Activity Stream</th>
                <th className="px-4 py-3 text-center">Stock Tracking Switch</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Selling Price</th>
                <th className="px-4 py-3 text-right">Gross Margin</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-slate-500">
                    No items found matching the selected filter or search query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const badge = getActivityBadge(item.activity)
                  const BadgeIcon = badge.icon
                  const cost = Number(item.unitCostRWF) || 0
                  const price = Number(item.sellingPriceRWF) || 0
                  const profit = price - cost
                  const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0.0'
                  const isLowStock =
                    item.trackStock &&
                    typeof item.currentStock === 'number' &&
                    item.currentStock <= (Number(item.reorderLevel) || 3)

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition">
                      {/* Title & Category */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-slate-500">{item.id}</span>
                          <span>·</span>
                          <span>{item.category}</span>
                          <span>·</span>
                          <span>Unit: {item.unit}</span>
                        </div>
                      </td>

                      {/* Activity Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </td>

                      {/* Selective Stock Switch */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStock(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                            item.trackStock
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25'
                          }`}
                          title={
                            item.trackStock
                              ? 'Stock is tracked & decrements upon sales'
                              : 'Stock is unlimited (labor / service mode)'
                          }
                        >
                          {item.trackStock ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>Tracked (ON)</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-purple-400" />
                              <span>Untracked (OFF)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {item.trackStock ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleQuickStockAdjust(item, -1)}
                              className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
                            >
                              -
                            </button>
                            <span
                              className={`font-bold px-2 py-0.5 rounded text-xs ${
                                isLowStock
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'text-white'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            <button
                              onClick={() => handleQuickStockAdjust(item, 1)}
                              className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium bg-slate-800/60 px-2 py-0.5 rounded">
                            Unlimited Labor
                          </span>
                        )}
                        {isLowStock && (
                          <div className="text-[10px] text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Reorder Alert
                          </div>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="px-4 py-3 text-right font-medium text-slate-400 whitespace-nowrap">
                        {cost.toLocaleString()} RWF
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                        {price.toLocaleString()} RWF
                      </td>

                      {/* Gross Margin */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            Number(margin) >= 50
                              ? 'text-emerald-400'
                              : Number(margin) >= 30
                              ? 'text-indigo-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {margin}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          +{profit.toLocaleString()} RWF
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AddHybridItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Catalog Item"
          message={`Are you sure you want to remove "${deleteTarget.title}" from your hybrid catalog?`}
        />
      )}
    </div>
  )
}

