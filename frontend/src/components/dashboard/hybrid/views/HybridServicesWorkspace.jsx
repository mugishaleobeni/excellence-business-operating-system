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
  Briefcase,
  User,
  Check
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import { HYBRID_PRESETS } from '../data/hybridPresets'
import AddHybridItemModal from '../modals/AddHybridItemModal'
import RecordMixedSaleModal from '../modals/RecordMixedSaleModal'
import DeleteConfirmModal from '../../../common/DeleteConfirmModal'

export default function HybridServicesWorkspace({
  activeModule = 'Services & Jobs',
  activePage = 'Service Catalogue',
  onSwitchPage = () => {}
}) {
  const { demoWorkspaces, hybridTrade, addDemoRecord, deleteDemoRecord, updateDemoWorkspace, addToast } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const preset = HYBRID_PRESETS[hybridTrade] || HYBRID_PRESETS.techRepair
  const rawCatalog = hybridWorkspace.records?.HybridItems
  const catalog = Array.isArray(rawCatalog) ? rawCatalog : []
  const isJobScheduleView = activePage === 'Job Schedule'

  const [searchQuery, setSearchQuery] = useState('')
  const [jobFilter, setJobFilter] = useState('All')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const jobsList = useMemo(() => {
    const savedJobs = hybridWorkspace.records?.ServiceJobs
    return Array.isArray(savedJobs) ? savedJobs : []
  }, [hybridWorkspace.records])

  const services = useMemo(() => {
    return catalog.filter((it) => {
      const isService = it.activity === 'service'
      const q = searchQuery.toLowerCase().trim()
      return isService && (!q || it.title?.toLowerCase().includes(q) || it.category?.toLowerCase().includes(q) || it.id?.toLowerCase().includes(q))
    })
  }, [catalog, searchQuery])

  const filteredJobs = useMemo(() => {
    return jobsList.filter((j) => {
      if (jobFilter !== 'All' && j.status !== jobFilter) return false
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return j.ticketNumber?.toLowerCase().includes(q) || j.customerName?.toLowerCase().includes(q) || j.serviceTitle?.toLowerCase().includes(q) || j.technician?.toLowerCase().includes(q)
    })
  }, [jobsList, jobFilter, searchQuery])

  const serviceStats = useMemo(() => {
    const totalServices = services.length
    const totalRev = services.reduce((acc, s) => acc + (Number(s.sellingPriceRWF) || 0), 0)
    const totalCost = services.reduce((acc, s) => acc + (Number(s.unitCostRWF) || 0), 0)
    const avgMargin = totalRev > 0 ? (((totalRev - totalCost) / totalRev) * 100).toFixed(1) : '0.0'
    return { totalServices, avgBillingRate: totalServices > 0 ? Math.round(totalRev / totalServices) : 0, avgMargin }
  }, [services])

  const handleUpdateJobStatus = (jobId, newStatus) => {
    const updated = jobsList.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    updateDemoWorkspace && updateDemoWorkspace('hybrid', { records: { ...(hybridWorkspace.records || {}), ServiceJobs: updated } })
    addToast && addToast({ type: 'success', title: 'Ticket Updated', message: `Job ${jobId} status marked as "${newStatus}".` })
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDemoRecord('hybrid', 'HybridItems', deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
              {isJobScheduleView ? 'Active Workbench Queue' : 'Labor & Service Rates'}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            {isJobScheduleView ? 'Technician Workbench & Job Schedule' : 'Services & Billable Labor Catalogue'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isJobScheduleView
              ? 'Track active customer work orders, technician assignments, turnaround times, and ready pickups.'
              : 'Bill labor, diagnostic time, styling sessions, or repairs with zero inventory restrictions.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {isJobScheduleView ? (
            <button
              onClick={() => onSwitchPage('Services & Jobs', 'Service Catalogue')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
            >
              <Wrench className="w-4 h-4 text-purple-400" /> View Rates
            </button>
          ) : (
            <button
              onClick={() => onSwitchPage('Services & Jobs', 'Job Schedule')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
            >
              <Clock className="w-4 h-4 text-purple-400" /> Job Schedule
            </button>
          )}

          <button
            onClick={() => setIsSaleModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition"
          >
            <ShoppingCart className="w-4 h-4" /> Bill Service
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/30 transition"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {isJobScheduleView ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Active Jobs</span>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{jobsList.length} Tickets</div>
            <div className="text-[11px] text-purple-300 mt-1">Workbench backlog</div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>In Progress</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-300">{jobsList.filter((j) => j.status === 'In Progress').length} Jobs</div>
            <div className="text-[11px] text-slate-400 mt-1">Currently on bench</div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Ready for Pickup</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{jobsList.filter((j) => j.status === 'Ready for Pickup').length} Ready</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">Awaiting client collection</div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Booked Labor Value</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {jobsList.reduce((acc, j) => acc + (Number(j.estimatedAmountRWF) || 0), 0).toLocaleString()} RWF
            </div>
            <div className="text-[11px] text-indigo-300 mt-1">Unbilled labor pipeline</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Service Offerings</span>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{serviceStats.totalServices} Rates</div>
            <div className="text-[11px] text-purple-300 mt-1">Ready for checkout billing</div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Average Service Rate</span>
              <DollarSign className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">{serviceStats.avgBillingRate.toLocaleString()} RWF</div>
            <div className="text-[11px] text-slate-400 mt-1">Per job or session</div>
          </div>

          <div className="bg-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Average Labor Margin</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{serviceStats.avgMargin}%</div>
            <div className="text-[11px] text-emerald-300/80 mt-1">High-profit cash buffer</div>
          </div>
        </div>
      )}

      {/* VIEW 1: JOB SCHEDULE WORKBENCH QUEUE */}
      {isJobScheduleView ? (
        <div className="bg-white/[0.02] rounded-2xl overflow-hidden shadow-xl space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'In Progress', 'Pending Parts', 'Ready for Pickup', 'Completed'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setJobFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                    jobFilter === tab ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, client, tech..."
                className="w-full bg-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400 border-b border-white/5 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Ticket &amp; Client</th>
                  <th className="px-4 py-3">Service Diagnostic</th>
                  <th className="px-4 py-3">Assigned Tech</th>
                  <th className="px-4 py-3">Promised Due</th>
                  <th className="px-4 py-3 text-right">Fee Estimate</th>
                  <th className="px-4 py-3 text-center">Ticket Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                      No jobs matching criteria in workbench.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const statusColor =
                      job.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : job.status === 'Ready for Pickup' ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      : job.status === 'Pending Parts' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'

                    return (
                      <tr key={job.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{job.ticketNumber}</div>
                          <div className="text-[11px] text-slate-300 mt-0.5">{job.customerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{job.customerPhone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{job.serviceTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Parts: {job.partsRequired}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-400" />
                            <span>{job.technician}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">{job.promisedDate}</td>
                        <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">{Number(job.estimatedAmountRWF || 0).toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColor}`}>{job.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            {job.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateJobStatus(job.id, job.status === 'Ready for Pickup' ? 'Completed' : 'Ready for Pickup')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 border border-emerald-500/30"
                              >
                                <Check className="w-3 h-3" />
                                <span>{job.status === 'Ready for Pickup' ? 'Complete' : 'Mark Ready'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setIsSaleModalOpen(true)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 text-[11px] font-semibold flex items-center gap-1"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Bill</span>
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
      ) : (
        /* VIEW 2: SERVICE CATALOGUE TABLE */
        <div className="bg-white/[0.02] rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3.5 border-b border-white/5 flex items-center justify-between gap-3">
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
                className="w-full bg-white/5 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.04] text-slate-400 border-b border-white/5 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Service &amp; Scope</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Unit / Mode</th>
                  <th className="px-4 py-3 text-right">Direct Labor Cost</th>
                  <th className="px-4 py-3 text-right">Standard Billing Rate</th>
                  <th className="px-4 py-3 text-right">Net Margin</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
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
                        <td className="px-4 py-3 whitespace-nowrap text-slate-300">{srv.category}</td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                            <Clock className="w-3 h-3" /> Per {srv.unit || 'job'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 whitespace-nowrap">{cost.toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-right font-bold text-white whitespace-nowrap">{price.toLocaleString()} RWF</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-semibold text-emerald-400">{margin}%</span>
                          <div className="text-[10px] text-slate-500">+{profit.toLocaleString()} RWF</div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button onClick={() => setDeleteTarget(srv)} className="p-1 text-slate-500 hover:text-rose-400 transition rounded" title="Delete Service">
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
      )}

      {/* Add Modal */}
      <AddHybridItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialActivity="service"
        onSaveHybridItem={(item) => addDemoRecord('hybrid', 'HybridItems', item)}
      />

      {/* Quick Sale Checkout Modal */}
      <RecordMixedSaleModal isOpen={isSaleModalOpen} onClose={() => setIsSaleModalOpen(false)} />

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
