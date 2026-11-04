import React, { useState } from 'react'
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  Calendar,
  X,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'

export default function ProductionOrders({
  orders = [],
  recipes = [],
  products = [],
  rawMaterials = [],
  onStartOrder = null,
  onCompleteOrder = null,
  onCreateOrder = null,
  onDeleteOrder = null,
  hideFinancials = false,
  addToast = null
}) {
  const [filterStatus, setFilterStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false)
  const [completeOrderModalOpen, setCompleteOrderModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // New Order Form State
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [plannedQty, setPlannedQty] = useState(100)
  const [plannedDate, setPlannedDate] = useState(new Date().toISOString().slice(0, 10))
  const [recipeId, setRecipeId] = useState(recipes[0]?.id || '')
  const [employee, setEmployee] = useState('Jean-Pierre Mugisha')
  const [notes, setNotes] = useState('')

  // Complete Order Form State
  const [actualQty, setActualQty] = useState(100)
  const [wasteQty, setWasteQty] = useState(2)
  const [actualExpenses, setActualExpenses] = useState(0)

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus
    const matchesSearch =
      !searchQuery ||
      (o.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.responsibleEmployee || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const openCompleteModal = (order) => {
    setSelectedOrder(order)
    setActualQty(order.actualQuantity || order.plannedQuantity || 100)
    setWasteQty(order.wasteQuantity || 0)
    setActualExpenses(order.totalProductionCostRWF || 0)
    setCompleteOrderModalOpen(true)
  }

  const handleCreateOrder = (e) => {
    e.preventDefault()
    const product = products.find((p) => p.id === productId)
    const recipe = recipes.find((r) => r.id === recipeId)

    const newOrder = {
      id: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      productId,
      productName: product ? (product.name || product.title) : 'Finished Good',
      recipeId,
      recipeName: recipe?.name || 'Standard Formula',
      plannedQuantity: Math.max(1, Number(plannedQty) || 1),
      actualQuantity: 0,
      status: 'Planned',
      plannedDate,
      responsibleEmployee: employee,
      totalProductionCostRWF: 0,
      unitCostRWF: product?.unitProductionCostRWF || 0,
      wasteQuantity: 0,
      notes
    }

    if (onCreateOrder) {
      onCreateOrder(newOrder)
    }

    setNewOrderModalOpen(false)
    if (addToast) {
      addToast({
        type: 'success',
        title: 'Production Order Created',
        message: `Planned ${newOrder.plannedQuantity} ${newOrder.productName} for ${newOrder.plannedDate}.`
      })
    }
  }

  const handleConfirmCompletion = (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    const goodUnits = Math.max(0, Number(actualQty) || 0)
    const wasted = Math.max(0, Number(wasteQty) || 0)
    const expenses = Math.max(0, Number(actualExpenses) || 0)
    const calculatedUnitCost = goodUnits > 0 ? Math.round(expenses / goodUnits) : 0

    const completionPayload = {
      orderId: selectedOrder.id,
      productId: selectedOrder.productId,
      productName: selectedOrder.productName,
      recipeId: selectedOrder.recipeId,
      actualQuantity: goodUnits,
      wasteQuantity: wasted,
      totalProductionCostRWF: expenses,
      unitCostRWF: calculatedUnitCost,
      completionDate: new Date().toISOString().slice(0, 10),
      status: 'Completed'
    }

    if (onCompleteOrder) {
      onCompleteOrder(completionPayload)
    }

    setCompleteOrderModalOpen(false)
    setSelectedOrder(null)

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Production Completed & Stock Updated',
        message: `Added +${goodUnits} ${selectedOrder.productName} to inventory. Deducted consumed raw materials.`
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-tight">
            Production Orders
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Track planned batches, monitor active manufacturing, and record completed goods into inventory.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewOrderModalOpen(true)}
          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Production</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
          {['All', 'Planned', 'In Progress', 'Completed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#218DFF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Search by product, batch ID, or supervisor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3.5 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none w-64"
        />
      </div>

      {/* Orders Table */}
      <div className="exbos-glass-card p-5 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Factory className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
            <p>No production orders match the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Batch Order ID</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Planned Qty</th>
                  <th className="py-2.5 px-3 text-right">Actual Qty</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Production Cost</th>
                  <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => {
                  let badgeClass = 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  if (order.status === 'Completed') {
                    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  } else if (order.status === 'In Progress') {
                    badgeClass = 'bg-[#218DFF]/20 text-[#9EDCFF] border-[#218DFF]/30'
                  } else if (order.status === 'Planned') {
                    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {order.id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {order.productName}
                        {order.responsibleEmployee && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Sup: {order.responsibleEmployee}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {order.plannedQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {order.actualQuantity || (order.status === 'Completed' ? order.plannedQuantity : '—')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {order.completionDate || order.plannedDate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300 font-bold">
                        {formatRWF(order.totalProductionCostRWF, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#9EDCFF]">
                        {formatRWF(order.unitCostRWF, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {order.status === 'Planned' && onStartOrder && (
                            <button
                              type="button"
                              onClick={() => onStartOrder(order.id)}
                              className="px-2 py-1 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Start Production"
                            >
                              <Play className="w-3 h-3" />
                              <span>Start</span>
                            </button>
                          )}

                          {order.status === 'In Progress' && (
                            <button
                              type="button"
                              onClick={() => openCompleteModal(order)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Record Completion & Update Stock"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Complete</span>
                            </button>
                          )}

                          {onDeleteOrder && (
                            <button
                              type="button"
                              onClick={() => onDeleteOrder(order.id)}
                              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-300 cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW PRODUCTION ORDER MODAL */}
      {newOrderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setNewOrderModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1045CA]/40 border border-[#9EDCFF]/30 flex items-center justify-center text-[#9EDCFF]">
                  <Factory className="w-5 h-5 text-[#218DFF]" />
                </div>
                <div>
                  <h3 className="font-orbitron text-lg font-extrabold text-white">
                    New Production Order
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Schedule a manufacturing batch with target output and formula.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Target Finished Product *</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value)
                    const prod = products.find((p) => p.id === e.target.value)
                    if (prod?.recipeId) setRecipeId(prod.recipeId)
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title} ({p.unit || 'pcs'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Production Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedQty}
                    onChange={(e) => setPlannedQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Planned Date *</label>
                  <input
                    type="date"
                    required
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Recipe / BOM</label>
                <select
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (Yield: {r.yield} {r.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Responsible Supervisor / Baker</label>
                <input
                  type="text"
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  placeholder="e.g. Jean-Pierre Mugisha"
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Batch Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Early morning shift, double proofing required."
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setNewOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white cursor-pointer shadow-md transition-all"
                >
                  Schedule Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE PRODUCTION ORDER MODAL (Part 13 & Test I) */}
      {completeOrderModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setCompleteOrderModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-emerald-500/40 shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-orbitron text-lg font-extrabold text-white">
                    Confirm Production Completion
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Batch: <strong className="text-white">{selectedOrder.id}</strong> · {selectedOrder.productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompleteOrderModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
              <strong>Stock Update Rules (Part 13):</strong>
              <div>1. Adds verified good units into Finished Products stock.</div>
              <div>2. Deducts actual consumed raw materials from inventory.</div>
              <div>3. Logs defective or wasted units separately for yield audit.</div>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-emerald-400">
                    Actual Good Units Produced *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400">Planned: {selectedOrder.plannedQuantity}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-amber-400">
                    Defective / Wasted Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={wasteQty}
                    onChange={(e) => setWasteQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-sm font-mono font-bold text-amber-300 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">Recorded into spoilage audit</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">
                  Actual Production Expenses (Materials + Labor + Energy)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={actualExpenses}
                  onChange={(e) => setActualExpenses(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-sm font-mono font-bold text-white focus:outline-none focus:border-[#218DFF]"
                />
                <span className="text-[11px] text-slate-400">
                  Unit Cost will be recorded as: <strong>{formatRWF(actualQty > 0 ? Math.round(actualExpenses / actualQty) : 0)}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCompleteOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Completion &amp; Update Inventory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

