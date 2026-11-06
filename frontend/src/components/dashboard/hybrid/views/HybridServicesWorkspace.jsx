import React, { useState, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Search,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Trash2,
  ShoppingCart,
  Briefcase
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import AddHybridItemModal from '../modals/AddHybridItemModal'
import RecordMixedSaleModal from '../modals/RecordMixedSaleModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function HybridServicesWorkspace() {
  const { demoWorkspaces, deleteDemoRecord } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const catalog = hybridWorkspace.records?.HybridItems || []

  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Filter only service activity items
  const services = useMemo(() => {
    return catalog.filter((it) => {
      const isService = it.activity === 'service'
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        it.title?.toLowerCase().includes(query) ||
        it.category?.toLowerCase().includes(query) ||
        it.id?.toLowerCase().includes(query)
      return isService && matchesSearch
    })
  }, [catalog, searchQuery])

  // Summary statistics for services
  const serviceStats = useMemo(() => {
    const totalServices = services.length
    const totalRevenuePotential = services.reduce(
      (acc, s) => acc + (Number(s.sellingPriceRWF) || 0),
      0
    )
    const totalDirectCost = services.reduce(
      (acc, s) => acc + (Number(s.unitCostRWF) || 0),
      0
    )
    const avgMargin =
      totalRevenuePotential > 0
        ? (
            ((totalRevenuePotential - totalDirectCost) / totalRevenuePotential) *
            100
          ).toFixed(1)
        : '0.0'

    return {
      totalServices,
      avgBillingRate:
        totalServices > 0 ? Math.round(totalRevenuePotential / totalServices) : 0,
      avgMargin
    }
  }, [services])

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDemoRecord('hybrid', 'HybridItems', deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            Services & Billable Labor Workspace
          </h2>
          <p className="text-xs text-slate-400">
            Bill labor, diagnostic time, styling sessions, or repairs with zero inventory restrictions.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-lg shadow-emerald-900/30 transition"
          >
            <ShoppingCart className="w-4 h-4" /> Bill Service
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-lg shadow-lg shadow-indigo-900/30 transition"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      </div>

      {/* KPI Cards for Services */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Service Offerings</span>
            <Briefcase className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">{serviceStats.totalServices} Rates</div>
          <div className="text-[11px] text-purple-300 mt-1">Ready for checkout billing</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Service Rate</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {serviceStats.avgBillingRate.toLocaleString()} RWF
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Per job or session</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average Labor Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">{serviceStats.avgMargin}%</div>
          <div className="text-[11px] text-emerald-300/80 mt-1">High-profit cash buffer</div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs font-semibold text-white flex items-center gap-2">
            <span>Service Catalog ({services.length})</span>
          </div>
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Service & Scope</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Unit / Mode</th>
                <th className="px-4 py-3 text-right">Direct Labor Cost</th>
                <th className="px-4 py-3 text-right">Standard Billing Rate</th>
                <th className="px-4 py-3 text-right">Net Margin</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {services.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                    No services registered. Click "+ Add Service" to configure billable labor.
                  </td>
                </tr>
              ) : (
                services.map((srv) => {
                  const cost = Number(srv.unitCostRWF) || 0
                  const price = Number(srv.sellingPriceRWF) || 0
                  const profit = price - cost
                  const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : '0.0'

                  return (
                    <tr key={srv.id} className="hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">{srv.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Code: {srv.id}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {srv.category}
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                          <Clock className="w-3 h-3" /> Per {srv.unit || 'job'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">
                        {cost.toLocaleString()} RWF
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">
                        {price.toLocaleString()} RWF
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-emerald-400">{margin}%</span>
                        <div className="text-[10px] text-slate-500">
                          +{profit.toLocaleString()} RWF
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteTarget(srv)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition rounded"
                          title="Delete Service"
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
      <AddHybridItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialActivity="service"
      />

      {/* Quick Sale Checkout Modal */}
      <RecordMixedSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="Delete Service Offering"
          message={`Are you sure you want to remove "${deleteTarget.title}"?`}
        />
      )}
    </div>
  )
}

