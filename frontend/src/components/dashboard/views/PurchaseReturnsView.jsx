import React, { useState, useMemo } from 'react'
import { RotateCcw, Package, TrendingUp, Plus, Check } from 'lucide-react'
import { formatRWF } from '../../../utils/currencyWords'

export default function PurchaseReturnsView({
  currentArch,
  purchases,
  formatRWF: formatRWFProp,
  onProcessReturn,
  onRecordPurchase
}) {
  const [selectedIds, setSelectedIds] = useState({})
  const [returnReasons, setReturnReasons] = useState({})
  const [returnQtys, setReturnQtys] = useState({})
  const [refundMethod, setRefundMethod] = useState('Cash')
  const [returnProcessing, setReturnProcessing] = useState(false)
  const [submittedMessage, setSubmittedMessage] = useState(null)

  const activeFormatRWF = formatRWFProp || formatRWF

  // Flatten line items from purchases to allow granular product returns
  const eligibleReturnItems = useMemo(() => {
    const list = []
    ;(purchases || []).forEach((purchase) => {
      const items = Array.isArray(purchase.items) && purchase.items.length > 0
        ? purchase.items
        : [
            {
              id: `${purchase.id}-item-1`,
              name: purchase.item || purchase.title || 'Purchase Batch',
              qty: Number(purchase.qty) || 1,
              unitPriceRWF: Number(purchase.unitPriceRWF) || (Number(purchase.amountRWF) || 0),
              sku: purchase.sku || 'SKU-001'
            }
          ]

      items.forEach((item, idx) => {
        const uniqueKey = `${purchase.id}__${item.id || idx}`
        list.push({
          uniqueKey,
          purchaseId: purchase.id,
          date: purchase.date,
          supplierName: purchase.supplierName || purchase.supplier || 'Main Supplier',
          itemName: item.name,
          sku: item.sku || 'SKU-AUTO',
          purchasedQty: Number(item.qty) || 1,
          unitPriceRWF: Number(item.unitPriceRWF) || 0,
          totalCostRWF: (Number(item.qty) || 1) * (Number(item.unitPriceRWF) || 0)
        })
      })
    })
    return list
  }, [purchases])

  const toggleSelect = (key) => {
    setSelectedIds((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleQtyChange = (key, maxQty, val) => {
    const parsed = Math.max(1, Math.min(Number(val) || 1, maxQty))
    setReturnQtys((prev) => ({
      ...prev,
      [key]: parsed
    }))
  }

  const handleReasonChange = (key, reason) => {
    setReturnReasons((prev) => ({
      ...prev,
      [key]: reason
    }))
  }

  // Calculate return totals
  const totalReturnRefund = useMemo(() => {
    return eligibleReturnItems.reduce((acc, item) => {
      if (!selectedIds[item.uniqueKey]) return acc
      const qty = returnQtys[item.uniqueKey] !== undefined ? returnQtys[item.uniqueKey] : item.purchasedQty
      return acc + qty * item.unitPriceRWF
    }, 0)
  }, [eligibleReturnItems, selectedIds, returnQtys])

  const selectedCount = Object.values(selectedIds).filter(Boolean).length

  const handleSubmitReturn = () => {
    if (selectedCount === 0) return
    setReturnProcessing(true)

    setTimeout(() => {
      const returnedPayload = eligibleReturnItems
        .filter((item) => selectedIds[item.uniqueKey])
        .map((item) => ({
          ...item,
          returnQty: returnQtys[item.uniqueKey] !== undefined ? returnQtys[item.uniqueKey] : item.purchasedQty,
          reason: returnReasons[item.uniqueKey] || 'Damaged / Defective',
          refundMethod,
          refundAmountRWF: (returnQtys[item.uniqueKey] !== undefined ? returnQtys[item.uniqueKey] : item.purchasedQty) * item.unitPriceRWF
        }))

      if (onProcessReturn) {
        onProcessReturn(returnedPayload, totalReturnRefund, refundMethod)
      }

      setReturnProcessing(false)
      setSubmittedMessage(`Debit note & return of ${activeFormatRWF(totalReturnRefund)} processed successfully!`)
      setSelectedIds({})
      setReturnQtys({})
      setReturnReasons({})

      setTimeout(() => setSubmittedMessage(null), 4500)
    }, 400)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Guidance */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-[#071644] to-[#0A2786] border border-[#218DFF]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-5 h-5 text-[#9EDCFF]" />
            <h2 className="text-base sm:text-lg font-orbitron font-bold text-white">
              Purchase Returns & Supplier Debit Notes
            </h2>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Select specific received items to return to suppliers for damaged stock, wrong specifications, or expired batches. Generates automated debit notes and adjusts inventory automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRecordPurchase}
            className="btn-sapphire-clean px-4 py-2 text-xs font-semibold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {submittedMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Return Selection Table */}
      <div className="rounded-2xl border border-white/10 bg-[#071644]/40 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-orbitron font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-[#218DFF]" />
            Eligible Purchased Batches ({eligibleReturnItems.length})
          </h3>
          <span className="text-xs text-slate-400">
            {selectedCount} item{selectedCount === 1 ? '' : 's'} selected for return
          </span>
        </div>

        {eligibleReturnItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs sm:text-sm text-slate-400">
              No recent purchases found eligible for returns. Record a purchase first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-10 text-center">Select</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Item / SKU</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-center">Purchased Qty</th>
                  <th className="p-3 text-center w-28">Return Qty</th>
                  <th className="p-3">Return Reason</th>
                  <th className="p-3 text-right">Debit / Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {eligibleReturnItems.map((item) => {
                  const isSelected = Boolean(selectedIds[item.uniqueKey])
                  const currentReturnQty = returnQtys[item.uniqueKey] !== undefined ? returnQtys[item.uniqueKey] : item.purchasedQty
                  const refund = currentReturnQty * item.unitPriceRWF

                  return (
                    <tr
                      key={item.uniqueKey}
                      className={`hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-sky-500/10' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.uniqueKey)}
                          className="rounded border-white/20 text-[#218DFF] focus:ring-[#218DFF] bg-white/10 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-slate-400 font-mono">{item.date}</td>
                      <td className="p-3 font-semibold text-white">{item.supplierName}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-100">{item.itemName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="p-3 text-right font-mono">{activeFormatRWF(item.unitPriceRWF)}</td>
                      <td className="p-3 text-center font-bold">{item.purchasedQty}</td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.purchasedQty}
                          disabled={!isSelected}
                          value={currentReturnQty}
                          onChange={(e) => handleQtyChange(item.uniqueKey, item.purchasedQty, e.target.value)}
                          className="w-16 px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-center text-xs font-mono disabled:opacity-40 focus:outline-none focus:border-[#218DFF]"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          disabled={!isSelected}
                          value={returnReasons[item.uniqueKey] || 'Damaged / Defective'}
                          onChange={(e) => handleReasonChange(item.uniqueKey, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-xs disabled:opacity-40 text-slate-200 focus:outline-none focus:border-[#218DFF] cursor-pointer"
                        >
                          <option value="Damaged / Defective" className="bg-[#071644]">Damaged / Defective</option>
                          <option value="Wrong Item Delivered" className="bg-[#071644]">Wrong Item Delivered</option>
                          <option value="Near Expiration Date" className="bg-[#071644]">Near Expiration Date</option>
                          <option value="Quality Below Standard" className="bg-[#071644]">Quality Below Standard</option>
                          <option value="Over-shipment / Excess" className="bg-[#071644]">Over-shipment / Excess</option>
                        </select>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#9EDCFF]">
                        {activeFormatRWF(refund)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Action Panel Footer */}
        {eligibleReturnItems.length > 0 && (
          <div className="p-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-300">Refund Settlement Method:</span>
              <div className="flex items-center gap-2">
                {['Cash', 'Mobile Money', 'Supplier Credit (Offset Next Bill)'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setRefundMethod(method)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      refundMethod === method
                        ? 'bg-[#218DFF] text-white shadow-md'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Total Debit / Refund Amount</span>
                <span className="text-base sm:text-lg font-bold font-mono text-[#9EDCFF]">
                  {activeFormatRWF(totalReturnRefund)}
                </span>
              </div>
              <button
                type="button"
                disabled={selectedCount === 0 || returnProcessing}
                onClick={handleSubmitReturn}
                className="btn-sapphire-clean px-5 py-2.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{returnProcessing ? 'Processing...' : `Issue Debit Note (${selectedCount})`}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

