import React, { useState, useMemo } from 'react'
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  DollarSign,
  User,
  Phone,
  CreditCard,
  Layers,
  AlertCircle,
  CheckCircle2,
  Package
} from 'lucide-react'
import { useExbos } from '../../../../context/ExbosContext'

export default function RecordMixedSaleModal({ isOpen, onClose }) {
  const { demoWorkspaces, addDemoRecord, updateDemoRecord } = useExbos()
  const hybridWorkspace = demoWorkspaces?.['hybrid'] || {}
  const catalog = hybridWorkspace.records?.HybridItems || []

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo Business')
  const [cartItems, setCartItems] = useState([])

  // Line item selector state
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedQty, setSelectedQty] = useState(1)
  const [customPrice, setCustomPrice] = useState('')

  if (!isOpen) return null

  const selectedCatalogItem = catalog.find((c) => c.id === selectedItemId)

  const handleAddToCart = () => {
    if (!selectedCatalogItem) return
    const qty = Math.max(1, Number(selectedQty) || 1)
    const unitPrice = customPrice !== '' ? Number(customPrice) : Number(selectedCatalogItem.sellingPriceRWF) || 0
    const unitCost = Number(selectedCatalogItem.unitCostRWF) || 0

    // Check if already in cart
    const existingIndex = cartItems.findIndex((it) => it.itemId === selectedCatalogItem.id)
    if (existingIndex >= 0) {
      const updated = [...cartItems]
      const newQty = updated[existingIndex].quantity + qty
      updated[existingIndex].quantity = newQty
      updated[existingIndex].lineTotal = newQty * updated[existingIndex].unitPriceRWF
      updated[existingIndex].lineCost = newQty * updated[existingIndex].unitCostRWF
      setCartItems(updated)
    } else {
      setCartItems([
        ...cartItems,
        {
          itemId: selectedCatalogItem.id,
          title: selectedCatalogItem.title,
          activity: selectedCatalogItem.activity || 'retail',
          trackStock: selectedCatalogItem.trackStock === true,
          unit: selectedCatalogItem.unit || 'pcs',
          currentStock: selectedCatalogItem.currentStock,
          quantity: qty,
          unitPriceRWF: unitPrice,
          unitCostRWF: unitCost,
          lineTotal: qty * unitPrice,
          lineCost: qty * unitCost
        }
      ])
    }

    // Reset selector
    setSelectedItemId('')
    setSelectedQty(1)
    setCustomPrice('')
  }

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleUpdateQty = (index, newQty) => {
    const qty = Math.max(1, Number(newQty) || 1)
    const updated = [...cartItems]
    updated[index].quantity = qty
    updated[index].lineTotal = qty * updated[index].unitPriceRWF
    updated[index].lineCost = qty * updated[index].unitCostRWF
    setCartItems(updated)
  }

  const totals = useMemo(() => {
    const totalAmount = cartItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0)
    const totalCost = cartItems.reduce((acc, it) => acc + (it.lineCost || 0), 0)
    const netProfit = totalAmount - totalCost
    const marginPercent = totalAmount > 0 ? ((netProfit / totalAmount) * 100).toFixed(1) : '0.0'
    return { totalAmount, totalCost, netProfit, marginPercent }
  }, [cartItems])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (cartItems.length === 0) return

    const invoiceNumber = `INV-MIX-${Date.now().toString().slice(-4)}`
    const todayStr = new Date().toISOString().split('T')[0]

    const newSale = {
      id: `MSAL-${Date.now().toString().slice(-6)}`,
      invoiceNumber,
      date: todayStr,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: cartItems.map((it) => ({
        itemId: it.itemId,
        title: it.title,
        activity: it.activity,
        trackStock: it.trackStock,
        quantity: it.quantity,
        unit: it.unit,
        unitPriceRWF: it.unitPriceRWF,
        unitCostRWF: it.unitCostRWF,
        lineTotal: it.lineTotal,
        lineCost: it.lineCost
      })),
      totalAmountRWF: totals.totalAmount,
      totalCostRWF: totals.totalCost,
      netProfitRWF: totals.netProfit,
      marginPercent: totals.marginPercent,
      paymentMethod,
      status: paymentMethod === 'Unpaid / Customer Debt' ? 'Unpaid Debt' : 'Paid in Full'
    }

    // 1. Add Mixed Sale record
    addDemoRecord('hybrid', 'MixedSales', newSale)

    // 2. Decrement physical stock for items with trackStock === true
    cartItems.forEach((it) => {
      if (it.trackStock && typeof it.currentStock === 'number') {
        const remainingStock = Math.max(0, it.currentStock - it.quantity)
        updateDemoRecord('hybrid', 'HybridItems', it.itemId, {
          currentStock: remainingStock
        })
      }
    })

    onClose()
  }

  const getActivityBadgeColor = (act) => {
    switch (act) {
      case 'retail':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      case 'service':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      case 'food':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'production':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#071644] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Record Mixed Sale Checkout</h2>
              <p className="text-xs text-slate-400">
                Single bill combining retail products, service labor &amp; dining items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jean Damascene"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+250 788 123 456"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MTN MoMo Business">MTN MoMo Business</option>
                <option value="Airtel Money">Airtel Money</option>
                <option value="Cash at Counter">Cash at Counter</option>
                <option value="Bank Card / POS">Bank Card / POS</option>
                <option value="Unpaid / Customer Debt">Unpaid / Customer Debt</option>
              </select>
            </div>
          </div>

          {/* Add Item to Cart Line */}
          <div className="bg-white/[0.03] rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Add Item / Service to Bill
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Selective stock auto-deducts only physical goods
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-6">
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value)
                    const it = catalog.find((c) => c.id === e.target.value)
                    if (it) setCustomPrice(it.sellingPriceRWF || '')
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select item, service, or food...</option>
                  {catalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.activity?.toUpperCase()}] {item.title} — {Number(item.sellingPriceRWF || 0).toLocaleString()} RWF (
                      {item.trackStock ? `Stock: ${item.currentStock}` : 'Unlimited'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  min="1"
                  value={selectedQty}
                  onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="Qty"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Price RWF"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white text-right focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedItemId}
                  className="w-full h-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Cart Table */}
          <div className="rounded-2xl overflow-hidden bg-white/[0.02]">
            <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Cart Items ({cartItems.length})
              </span>
              <span className="text-xs text-slate-400">Consolidated Mixed Receipt</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-slate-600" />
                No items added to this bill yet. Select an item or service above.
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-56 overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getActivityBadgeColor(
                            item.activity
                          )}`}
                        >
                          {item.activity}
                        </span>
                        <span className="font-semibold text-white truncate">{item.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>
                          {Number(item.unitPriceRWF).toLocaleString()} RWF / {item.unit}
                        </span>
                        <span>·</span>
                        <span>Cost: {Number(item.unitCostRWF).toLocaleString()} RWF</span>
                        {item.trackStock && (
                          <span className="text-cyan-400">
                            (Stock: {item.currentStock})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQty(idx, e.target.value)}
                        className="w-14 bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-center text-white focus:outline-none focus:border-indigo-500"
                      />
                      <span className="font-bold text-white min-w-[70px] text-right">
                        {Number(item.lineTotal).toLocaleString()} RWF
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          {cartItems.length > 0 && (
            <div className="bg-white/[0.04] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Total Bill Amount</div>
                <div className="text-xl font-bold text-white">
                  {Number(totals.totalAmount).toLocaleString()} RWF
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-emerald-400">
                  Est. Net Profit: +{Number(totals.netProfit).toLocaleString()} RWF
                </div>
                <div className="text-xs font-semibold text-slate-300">
                  Combined Margin: {totals.marginPercent}%
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={cartItems.length === 0}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Mixed Checkout
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

