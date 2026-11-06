import React, { useState } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Clock,
  CheckCircle2,
  Receipt,
  Users,
  DollarSign
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'
import NewKitchenOrderModal from '../modals/NewKitchenOrderModal'

const DEFAULT_TABLES = [
  { id: 'TBL-01', number: '01', zone: 'Main Dining', capacity: 4 },
  { id: 'TBL-02', number: '02', zone: 'Main Dining', capacity: 2 },
  { id: 'TBL-03', number: '03', zone: 'Main Dining', capacity: 4 },
  { id: 'TBL-04', number: '04', zone: 'Garden Terrace', capacity: 6 },
  { id: 'TBL-05', number: '05', zone: 'Garden Terrace', capacity: 4 },
  { id: 'TBL-06', number: '06', zone: 'Garden Terrace', capacity: 4 },
  { id: 'TBL-07', number: '07', zone: 'VIP Lounge', capacity: 8 },
  { id: 'TBL-08', number: '08', zone: 'VIP Lounge', capacity: 6 },
  { id: 'TBL-09', number: '09', zone: 'Bar Counter', capacity: 2 },
  { id: 'TBL-10', number: '10', zone: 'Bar Counter', capacity: 2 }
]

export default function DiningTablesWorkspace() {
  const { demoWorkspaces, updateDemoRecord, addTransaction } = useExbos()
  const archData = demoWorkspaces['food-and-hospitality'] || {}
  const ordersList = archData.records?.KitchenOrders || []
  const menuList = archData.records?.MenuItems || []

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTableNumber, setSelectedTableNumber] = useState('01')

  // Find active orders on each table
  const getTableActiveOrder = (tableNum) => {
    return ordersList.find(
      (o) =>
        (o.destination?.includes(`Table #${tableNum}`) || o.destination?.includes(`Table ${tableNum}`)) &&
        o.status !== 'Billed'
    )
  }

  const handleSettleTable = (order) => {
    updateDemoRecord('food-and-hospitality', 'KitchenOrders', order.id, {
      status: 'Billed'
    })

    addTransaction({
      architectureId: 'food-and-hospitality',
      title: `Table Settlement: ${order.destination}`,
      type: 'in',
      category: 'Restaurant Dining Revenue',
      amountRWF: order.totalAmountRWF,
      account: 'Cash in Hand (Main Till)',
      source: order.destination
    })
  }

  const formatRWF = (val) => `${Number(val || 0).toLocaleString()} RWF`

  const occupiedCount = DEFAULT_TABLES.filter((t) => getTableActiveOrder(t.number)).length

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 rounded-3xl bg-white/[0.03] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
            Pillar 04 · Dining Room Floor Plan &amp; Bills
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-orbitron text-white mt-1">
            Restaurant Tables &amp; Active Tabs
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {occupiedCount} of {DEFAULT_TABLES.length} tables currently seated · 1-click bill settlement
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedTableNumber('01')
            setModalOpen(true)
          }}
          className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Open Table Order</span>
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {DEFAULT_TABLES.map((table) => {
          const activeOrder = getTableActiveOrder(table.number)
          const isOccupied = Boolean(activeOrder)

          return (
            <div
              key={table.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between space-y-3 shadow-lg ${
                isOccupied
                  ? 'bg-gradient-to-b from-[#1f1505] to-[#120c02] border-amber-400/60'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">
                    Table #{table.number}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOccupied
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                  >
                    {isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {table.zone} · {table.capacity} Seats
                </span>
              </div>

              {isOccupied ? (
                <div className="p-2.5 rounded-2xl bg-black/40 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-slate-300 text-[11px]">
                    <span>Status:</span>
                    <span className="font-bold text-amber-300">{activeOrder.status}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 text-[11px]">
                    <span>Items:</span>
                    <span>{activeOrder.items?.length || 1} Dishes</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/10 text-white font-bold">
                    <span>Total:</span>
                    <span className="font-orbitron font-extrabold text-amber-300">
                      {formatRWF(activeOrder.totalAmountRWF)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/10 text-slate-500 text-xs">
                  Clean &amp; Ready
                </div>
              )}

              {isOccupied ? (
                <button
                  type="button"
                  onClick={() => handleSettleTable(activeOrder)}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Settle Bill</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTableNumber(table.number)
                    setModalOpen(true)
                  }}
                  className="w-full py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Seat Guests</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <NewKitchenOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        menuItems={menuList}
        rooms={[]}
        onSaveOrder={(newOrder) => {
          updateDemoRecord('food-and-hospitality', 'KitchenOrders', newOrder.id, newOrder)
        }}
      />
    </div>
  )
}

