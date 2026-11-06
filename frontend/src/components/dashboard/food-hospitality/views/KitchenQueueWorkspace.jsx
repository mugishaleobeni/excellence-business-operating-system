import React, { useState } from 'react'
import {
  Clock,
  Plus,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  BedDouble,
  DollarSign,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import NewKitchenOrderModal from '../modals/NewKitchenOrderModal'

const STAGES = ['New', 'Cooking', 'Ready', 'Served']

export default function KitchenQueueWorkspace() {
  const { demoWorkspaces, addDemoRecord, updateDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const ordersList = archData.records?.KitchenOrders || []
  const menuList = archData.records?.MenuItems || []
  const roomsList = archData.records?.Rooms || []
  const ingredientsList = archData.records?.Ingredients || []

  const [modalOpen, setModalOpen] = useState(false)
  const [activeStageFilter, setActiveStageFilter] = useState('All')

  const handleSaveOrder = (newOrder) => {
    addDemoRecord('food-and-hospitality', 'KitchenOrders', newOrder)

    // Deduct ingredient stock automatically based on dish recipe BOMs
    (newOrder.items || []).forEach((item) => {
      const dish = menuList.find((m) => m.id === item.menuItemId)
      if (dish && Array.isArray(dish.ingredients)) {
        dish.ingredients.forEach((ing) => {
          const matchedStock = ingredientsList.find((s) => s.name?.toLowerCase() === ing.name?.toLowerCase())
          if (matchedStock) {
            const deductQty = (Number(ing.quantity) || 1) * (Number(item.quantity) || 1)
            const remaining = Math.max(0, (Number(matchedStock.currentStock) || 0) - deductQty)
            updateDemoRecord('food-and-hospitality', 'Ingredients', matchedStock.id, {
              currentStock: remaining
            })
          }
        })
      }
    })
  }

  const handleAdvanceStatus = (order, nextStatus) => {
    updateDemoRecord('food-and-hospitality', 'KitchenOrders', order.id, {
      status: nextStatus
    })

    // If order was served and settled as a sale, add cash transaction
    if (nextStatus === 'Billed' || nextStatus === 'Served') {
      addTransaction({
        architectureId: 'food-and-hospitality',
        title: `Kitchen Order: ${order.destination} (${order.orderType})`,
        type: 'in',
        category: 'Food & Beverage Revenue',
        amountRWF: order.totalAmountRWF,
        account: 'MTN MoMo Business',
        source: order.destination
      })
    }
  }

  const filteredOrders = ordersList.filter((ord) => {
    if (activeStageFilter === 'All') return ord.status !== 'Billed'
    return ord.status === activeStageFilter
  })

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/60 via-[#1a1206]/80 to-yellow-950/60 border border-amber-400/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
            Pillar 02 · Live Kitchen Order Queue (KOT)
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Kitchen Display System &amp; Orders Queue
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Real-time ticket board for chefs and runners with automatic ingredient stock deduction
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Kitchen Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {['All', ...STAGES].map((stage) => {
          const count = stage === 'All'
            ? ordersList.filter((o) => o.status !== 'Billed').length
            : ordersList.filter((o) => o.status === stage).length
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setActiveStageFilter(stage)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                activeStageFilter === stage
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{stage}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeStageFilter === stage ? 'bg-black/20 text-slate-950' : 'bg-white/10 text-white'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Orders Board */}
      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.01] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">Kitchen Queue Clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Zero pending kitchen orders. Click '+ New Kitchen Order' to dispatch a ticket to the kitchen.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Dispatch Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isCooking = order.status === 'Cooking'
            const isReady = order.status === 'Ready'
            const isServed = order.status === 'Served'

            return (
              <div
                key={order.id}
                className={`p-5 rounded-3xl border transition-all space-y-3 relative overflow-hidden shadow-xl ${
                  isCooking
                    ? 'bg-gradient-to-b from-[#1c1305] to-[#0e0a03] border-amber-500/50 shadow-amber-500/10'
                    : isReady
                    ? 'bg-gradient-to-b from-[#061a12] to-[#030e09] border-emerald-400/50 shadow-emerald-500/10'
                    : 'bg-[#0f0b04]/80 border-white/10'
                }`}
              >
                {/* Ticket Top Ribbon */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div>
                    <span className="font-mono font-bold text-xs text-amber-300">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Placed at {order.placedAt || '12:00 PM'}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      isCooking
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                        : isReady
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : isServed
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                        : 'bg-white/10 text-slate-300 border-white/10'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Destination & Order Type */}
                <div className="flex items-center gap-2 text-xs">
                  {order.orderType === 'Room Service' ? (
                    <BedDouble className="w-4 h-4 text-sky-400 shrink-0" />
                  ) : (
                    <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-bold text-white truncate">
                    {order.destination}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({order.orderType})
                  </span>
                </div>

                {/* Items List */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  {(order.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-200">
                      <span className="truncate max-w-[190px]">
                        <strong className="text-amber-300 font-mono">{it.quantity}×</strong> {it.name}
                      </span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {formatRWF((Number(it.priceRWF) || 0) * (Number(it.quantity) || 1))}
                      </span>
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <p className="text-[11px] text-amber-200/90 italic bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-400/20">
                    "{order.notes}"
                  </p>
                )}

                {/* Actions & Bill Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Ticket Total</span>
                    <span className="font-orbitron font-extrabold text-sm text-white">
                      {formatRWF(order.totalAmountRWF)}
                    </span>
                  </div>

                  {/* Stage Advance Buttons */}
                  {order.status === 'New' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order, 'Cooking')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md"
                    >
                      <span>Start Cooking</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {order.status === 'Cooking' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order, 'Ready')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark Ready</span>
                    </button>
                  )}

                  {order.status === 'Ready' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order, 'Served')}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-sky-500/20"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mark Served</span>
                    </button>
                  )}

                  {order.status === 'Served' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(order, 'Billed')}
                      className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <span>Settle Bill</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Order Modal */}
      <NewKitchenOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        menuItems={menuList}
        rooms={roomsList}
        onSaveOrder={handleSaveOrder}
      />
    </div>
  )
}

