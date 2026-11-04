import React, { useState, useEffect } from 'react'
import { CreditCard, X, CheckCircle2 } from 'lucide-react'
import { formatRWF, formatWithCommas } from '../../../utils/currencyWords'
import CustomSelect from '../../common/CustomSelect'

export default function RecordDebtPaymentModal({
  isOpen,
  onClose,
  record,
  type = 'customer', // 'customer' | 'supplier'
  onConfirm
}) {
  const [amountInput, setAmountInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo Business')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (record) {
      const remaining =
        Number(record.balanceOwedRWF ?? record.remainingAmountRWF ?? record.amountRWF ?? record.balance ?? 0)
      setAmountInput(remaining > 0 ? remaining : '')
      setNotes(`Debt repayment for ${record.customerName || record.customer || record.supplierName || record.supplier || record.title || 'account'}`)
    } else {
      setAmountInput('')
      setNotes('')
    }
  }, [record, isOpen])

  if (!isOpen || !record) return null

  const isCustomer = type === 'customer'
  const title = isCustomer ? 'Record Customer Debt Repayment' : 'Record Supplier Payment'
  const partyName =
    record.customerName ||
    record.customer ||
    record.supplierName ||
    record.supplier ||
    record.name ||
    'Account'
  const remainingDue =
    Number(record.balanceOwedRWF ?? record.remainingAmountRWF ?? record.amountRWF ?? record.balance ?? 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    const amt = Number(amountInput) || 0
    if (amt <= 0) return

    if (onConfirm) {
      onConfirm({
        record,
        amount: amt,
        method: paymentMethod,
        notes,
        type
      })
    }
    onClose()
  }

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
              <h3 className="font-orbitron text-base font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-300">
                {isCustomer ? 'Money collected into business account' : 'Money disbursed from business account'}
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
                <span className="text-slate-400">{isCustomer ? 'Customer:' : 'Supplier:'}</span>
                <strong className="text-white">{partyName}</strong>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                <span className="text-amber-300 font-bold">Outstanding Debt:</span>
                <span className="font-orbitron font-extrabold text-amber-300">
                  {formatRWF(remainingDue)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Payment Amount (RWF) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amountInput === '' ? '' : formatWithCommas(amountInput)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setAmountInput(raw === '' ? '' : Number(raw))
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
                {isCustomer ? 'Account Where Money Was Received' : 'Disbursement Account'}
              </label>
              <CustomSelect
                value={paymentMethod}
                onChange={setPaymentMethod}
                options={[
                  'Cash in Hand (Main Till)',
                  'MTN MoMo Business',
                  'Bank Transfer (BK / BPR)',
                  'Airtel Money'
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Reference / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Receipt #1042 / MoMo TX Ref"
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="w-full px-3.5 py-2 rounded-xl exbos-modal-input text-xs text-white focus:outline-none"
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
              Confirm &amp; Post Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

