import React, { useState, useEffect } from 'react'
import { Users, X } from 'lucide-react'
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from '../../../utils/currencyWords'

export default function CustomerModal({
  isOpen,
  onClose,
  editRow = null,
  currentArch = { shortName: 'Retail' },
  activePage = 'Customers',
  onSave
}) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAccountType, setCustomerAccountType] = useState('Retail Buyer')
  const [customerMoneyOwed, setCustomerMoneyOwed] = useState('')
  const [customerPreferredProducts, setCustomerPreferredProducts] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  useEffect(() => {
    if (editRow) {
      setCustomerName(editRow.name || editRow.title || '')
      setCustomerPhone(editRow.phone && editRow.phone !== '—' ? editRow.phone : '')
      setCustomerEmail(editRow.email || '')
      setCustomerAccountType(editRow.category || 'Retail Buyer')
      setCustomerMoneyOwed(editRow.balanceOwedRWF !== undefined ? String(editRow.balanceOwedRWF) : '')
      setCustomerPreferredProducts(editRow.preferredProducts || '')
      setCustomerNotes(editRow.notes || '')
    } else {
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setCustomerAccountType('Retail Buyer')
      setCustomerMoneyOwed('')
      setCustomerPreferredProducts('')
      setCustomerNotes('')
    }
  }, [editRow, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!customerName.trim()) return

    const owedAmt = Number(customerMoneyOwed) || 0
    const customerPayload = {
      id: editRow ? editRow.id : `CUS-${Date.now().toString().slice(-4)}`,
      title: customerName.trim(),
      name: customerName.trim(),
      phone: customerPhone.trim() || '—',
      email: customerEmail.trim() || undefined,
      balanceOwedRWF: owedAmt,
      amountRWF: owedAmt,
      preferredProducts: customerPreferredProducts.trim() || 'General Items',
      category: customerAccountType || 'Retail Buyer',
      status: owedAmt > 0 ? `${formatRWF(owedAmt)} Owed` : 'Active · Good Standing',
      subPage: activePage || 'Customer',
      date: editRow?.date || new Date().toISOString().split('T')[0]
    }

    if (onSave) {
      onSave(customerPayload, Boolean(editRow))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 sm:p-6 shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1045CA] to-[#071644] border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF] shadow-lg shadow-[#1045CA]/20">
              <Users className="w-5 h-5 text-[#218DFF]" />
            </div>
            <div>
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                {currentArch.shortName} · Customers
              </span>
              <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                {editRow ? 'Update Customer Profile' : 'Register Customer'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            {/* Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Customer Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Marie Claire Uwase, Trust Logistics Ltd"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +250 788 450 123"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Email & Account Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. marie.uwase@example.rw"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Customer Account Type
                </label>
                <select
                  value={customerAccountType}
                  onChange={(e) => setCustomerAccountType(e.target.value)}
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
                >
                  <option value="Retail Buyer">Retail Buyer</option>
                  <option value="Wholesale Buyer">Wholesale Buyer</option>
                  <option value="Commercial Contractor">Commercial Contractor</option>
                  <option value="VIP Regular">VIP Regular</option>
                  <option value="Distributor">Distributor</option>
                </select>
              </div>
            </div>

            {/* Money Owed / Outstanding Balance (Optional) */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  Initial Money Owed / Debt Balance (RWF) <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                {customerMoneyOwed && Number(customerMoneyOwed) > 0 && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatRWF(customerMoneyOwed)}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={customerMoneyOwed ? formatWithCommas(customerMoneyOwed) : ''}
                  onChange={(e) => setCustomerMoneyOwed(parseNumericInput(e.target.value))}
                  placeholder="0"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9EDCFF]">
                  RWF
                </span>
              </div>
              {customerMoneyOwed && Number(customerMoneyOwed) > 0 && (
                <p className="text-[11px] text-[#9EDCFF] italic pt-1 capitalize">
                  {numberToWordsEnglish(customerMoneyOwed)}
                </p>
              )}
            </div>

            {/* Preferred Products */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Products Liked to Buy <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerPreferredProducts}
                onChange={(e) => setCustomerPreferredProducts(e.target.value)}
                placeholder="e.g. Twyford Tiles, Portland Cement 32.5N, Circuit Breakers"
                style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            {/* Notes / Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Notes / Delivery Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Additional customer details, delivery location, preferred payment method..."
                style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                className="w-full px-3.5 py-2 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-white/15 shrink-0 bg-[#040C26]/90">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold cursor-pointer shadow-lg"
            >
              <span>{editRow ? 'Update Customer' : 'Register Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

