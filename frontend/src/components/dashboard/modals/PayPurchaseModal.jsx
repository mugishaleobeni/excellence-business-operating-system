import React, { useState, useEffect } from 'react'
import { CreditCard, X } from 'lucide-react'
import { formatRWF, formatWithCommas } from '../../../utils/currencyWords'
import CustomSelect from '../../common/CustomSelect'

export default function PayPurchaseModal({
  isOpen,
  onClose,
  purchaseItem,
  onConfirmPayment
}) {
  const [payAmountInput, setPayAmountInput] = useState('')
  const [payMethodInput, setPayMethodInput] = useState('MTN MoMo Business')

  useEffect(() => {
    if (purchaseItem) {
      const remaining = Number(purchaseItem.remainingAmountRWF) || Number(purchaseItem.amountRWF) || 0
      setPayAmountInput(remaining > 0 ? remaining : '')
    } else {
      setPayAmountInput('')
    }
  }, [purchaseItem, isOpen])

  if (!isOpen || !purchaseItem) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const amountNum = Number(payAmountInput) || 0
    if (amountNum <= 0) return

    if (onConfirmPayment) {
      onConfirmPayment({
        purchaseItem,
        amount: amountNum,
        method: payMethodInput
      })
    }
  }

  const remainingDue = Number(purchaseItem.remainingAmountRWF) || Number(purchaseItem.amountRWF) || 0

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-emerald-500/50 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between border-b border-white/15 p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white">
                Record Supplier Payment
              </h3>
              <p className="text-[11px] text-slate-300">
                Disburse payment and reduce supplier debt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto p-5 space-y-4 flex-1">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Supplier:</span>
                <strong className="text-white">{purchaseItem.supplierName || purchaseItem.supplier}</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Item:</span>
                <span className="text-slate-200">{purchaseItem.productTitle || purchaseItem.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                <span className="text-amber-300 font-bold">Remaining Balance Due:</span>
                <span className="font-orbitron font-extrabold text-amber-300">
                  {formatRWF(remainingDue)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Payment Amount to Disburse (RWF) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={payAmountInput === '' ? '' : formatWithCommas(payAmountInput)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setPayAmountInput(raw === '' ? '' : Number(raw))
                  }}
                  placeholder="0"
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full pl-3.5 pr-14 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white font-orbitron font-bold focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  RWF
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Payment Account / Channel
              </label>
              <CustomSelect
                value={payMethodInput}
                onChange={setPayMethodInput}
                options={[
                  "MTN MoMo Business",
                  "Cash",
                  "Bank Transfer (BK / BPR)",
                  "Airtel Money"
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-white/15 shrink-0 bg-[#040C26]/90">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold cursor-pointer shadow-lg"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

