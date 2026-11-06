import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Plus, Trash2, Clock, UtensilsCrossed, BedDouble, DollarSign } from 'lucide-react'
import CustomSelect from '../../../common/CustomSelect'

const ORDER_TYPES = [
  { value: 'Dine-In', label: 'Dine-In (Table Service)' },
  { value: 'Room Service', label: 'Room Service (Guest Suite)' },
  { value: 'Takeaway', label: 'Takeaway (Counter Pickup)' },
  { value: 'Delivery', label: 'Delivery Order' }
]

export default function NewKitchenOrderModal({
  isOpen,
  onClose,
  menuItems = [],
  rooms = [],
  onSaveOrder
}) {
  const [orderType, setOrderType] = useState('Dine-In')
  const [destination, setDestination] = useState('Table #01')
  const [roomNumber, setRoomNumber] = useState(rooms[0]?.roomNumber || '101')
  const [notes, setNotes] = useState('')
  const [selectedItems, setSelectedItems] = useState([
    { menuItemId: menuItems[0]?.id || '', quantity: 1 }
  ])

  if (!isOpen) return null

  const handleAddItem = () => {
    setSelectedItems((prev) => [
      ...prev,
      { menuItemId: menuItems[0]?.id || '', quantity: 1 }
    ])
  }

  const handleRemoveItem = (idx) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleItemChange = (idx, field, value) => {
    setSelectedItems((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  // Calculate order totals
  const detailedItems = selectedItems.map((item) => {
    const dish = menuItems.find((m) => m.id === item.menuItemId) || menuItems[0] || {}
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1)
    const price = Number(dish.sellingPriceRWF) || 0
    return {
      menuItemId: dish.id,
      name: dish.name || 'Dish',
      quantity: qty,
      priceRWF: price,
      subtotalRWF: qty * price,
      ingredients: dish.ingredients || []
    }
  })

  const totalAmountRWF = detailedItems.reduce((sum, item) => sum + item.subtotalRWF, 0)
  const orderDest = orderType === 'Room Service' ? `Room ${roomNumber}` : destination

  const handleSubmit = (e) => {
    e.preventDefault()
    if (detailedItems.length === 0 || totalAmountRWF <= 0) return

    if (onSaveOrder) {
      onSaveOrder({
        id: `KOT-${Math.floor(100 + Math.random() * 900)}`,
        orderNumber: `ORD-${Math.floor(100 + Math.random() * 900)}`,
        orderType,
        destination: orderDest,
        roomNumber: orderType === 'Room Service' ? roomNumber : null,
        items: detailedItems,
        totalAmountRWF,
        status: 'New', // 'New' -> 'Cooking' -> 'Ready' -> 'Served' -> 'Billed'
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        notes: notes.trim()
      })
    }
    onClose()
  }

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-400/30 bg-[#120e06]/95 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-950/70 via-[#221808]/80 to-yellow-950/70 shrink-0">
          <div>
            <h2 className="font-orbitron text-base font-bold text-white flex items-center gap-2">
              <span>Send Kitchen Order (KOT)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                Pillar 03
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Dispatches order ticket to kitchen and automatically queues ingredient stock deduction
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Order Type *</label>
              <CustomSelect
                value={orderType}
                onChange={setOrderType}
                options={ORDER_TYPES}
              />
            </div>
            <div>
              {orderType === 'Room Service' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Guest Room Number *</label>
                  <CustomSelect
                    value={roomNumber}
                    onChange={setRoomNumber}
                    options={rooms.map((r) => ({
                      value: r.roomNumber,
                      label: `Room ${r.roomNumber} (${r.roomType || 'Suite'})`
                    }))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {orderType === 'Dine-In' ? 'Table Number *' : 'Pickup / Order Label *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Table #04 or Takeaway Counter"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dish Selection */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Dishes Ordered
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Dish</span>
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((sel, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-black/30 p-2.5 rounded-xl border border-white/5">
                  <div className="col-span-7">
                    <CustomSelect
                      value={sel.menuItemId}
                      onChange={(val) => handleItemChange(idx, 'menuItemId', val)}
                      options={menuItems.map((m) => ({
                        value: m.id,
                        label: `${m.name} (${Number(m.sellingPriceRWF || 0).toLocaleString()} RWF)`
                      }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="1"
                      value={sel.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none text-center"
                    />
                  </div>
                  <div className="col-span-2 text-center">
                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Kitchen Preparation Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra spicy, no onions, rush order"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none"
            />
          </div>

          {/* Total Summary */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-400/20 flex items-center justify-between text-xs">
            <span className="text-slate-300">Total Kitchen Ticket Amount:</span>
            <span className="font-orbitron font-extrabold text-base text-amber-300">
              {totalAmountRWF.toLocaleString()} RWF
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Dispatch Order to Kitchen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalNode, document.body)
}

