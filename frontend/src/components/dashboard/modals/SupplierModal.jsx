import React, { useState, useEffect } from 'react'
import { Truck, X } from 'lucide-react'
import { formatRWF, formatWithCommas, parseNumericInput, numberToWordsEnglish } from '../../../utils/currencyWords'

export default function SupplierModal({
  isOpen,
  onClose,
  editRow = null,
  currentArch = { shortName: 'Retail' },
  activePage = 'Suppliers',
  onSave
}) {
  const [supplierFullName, setSupplierFullName] = useState('')
  const [supplierLocation, setSupplierLocation] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierAmountOwed, setSupplierAmountOwed] = useState('')
  const [supplierCategory, setSupplierCategory] = useState('Building Materials')
  const [supplierNotes, setSupplierNotes] = useState('')

  useEffect(() => {
    if (editRow) {
      setSupplierFullName(editRow.supplierName || editRow.name || editRow.title || '')
      setSupplierLocation(editRow.location || '')
      setSupplierPhone(editRow.phone && editRow.phone !== '—' ? editRow.phone : '')
      setSupplierEmail(editRow.email || '')
      setSupplierAmountOwed(editRow.balanceOwedRWF !== undefined ? String(editRow.balanceOwedRWF) : '')
      setSupplierCategory(editRow.category || 'Building Materials')
      setSupplierNotes(editRow.notes || '')
    } else {
      setSupplierFullName('')
      setSupplierLocation('')
      setSupplierPhone('')
      setSupplierEmail('')
      setSupplierAmountOwed('')
      setSupplierCategory('Building Materials')
      setSupplierNotes('')
    }
  }, [editRow, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!supplierFullName.trim()) return

    const amt = Number(supplierAmountOwed) || 0
    const supplierPayload = {
      id: editRow ? editRow.id : `SUP-${Date.now().toString().slice(-4)}`,
      title: supplierFullName.trim(),
      name: supplierFullName.trim(),
      supplierName: supplierFullName.trim(),
      phone: supplierPhone.trim() || '—',
      email: supplierEmail.trim() || undefined,
      location: supplierLocation.trim() || 'Kigali, Rwanda',
      amountRWF: amt,
      balanceOwedRWF: amt,
      category: supplierCategory || 'General Supplies',
      status: amt > 0 ? `${formatRWF(amt)} Owed` : 'Active · Zero Debt',
      subPage: activePage || 'All Suppliers',
      date: editRow?.date || new Date().toISOString().split('T')[0]
    }

    if (onSave) {
      onSave(supplierPayload, Boolean(editRow))
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
              <Truck className="w-5 h-5 text-[#218DFF]" />
            </div>
            <div>
              <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                {currentArch.shortName} · Suppliers
              </span>
              <h3 className="font-orbitron text-base sm:text-lg font-bold text-white">
                {editRow ? 'Update Supplier Profile' : 'Register New Supplier'}
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
            {/* Full Name & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Supplier Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierFullName}
                  onChange={(e) => setSupplierFullName(e.target.value)}
                  placeholder="e.g. Cimerwa Depot Kigali, Inyange Industries"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Location / Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supplierLocation}
                  onChange={(e) => setSupplierLocation(e.target.value)}
                  placeholder="e.g. Nyabugogo Market, Kigali, Rwanda"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="e.g. +250 788 321 654"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="e.g. sales@cimerwa.rw"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Amount Owed / Debt to Supplier */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  Current Money Owed to Supplier (Debt/Balance) <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                {supplierAmountOwed && Number(supplierAmountOwed) > 0 && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatRWF(supplierAmountOwed)}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={supplierAmountOwed ? formatWithCommas(supplierAmountOwed) : ''}
                  onChange={(e) => setSupplierAmountOwed(parseNumericInput(e.target.value))}
                  placeholder="0"
                  style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9EDCFF]">
                  RWF
                </span>
              </div>
              {supplierAmountOwed && Number(supplierAmountOwed) > 0 && (
                <p className="text-[11px] text-[#9EDCFF] italic pt-1 capitalize">
                  {numberToWordsEnglish(supplierAmountOwed)}
                </p>
              )}
            </div>

            {/* Supplier Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Supplier Category / Specialization
              </label>
              <select
                value={supplierCategory}
                onChange={(e) => setSupplierCategory(e.target.value)}
                style={{ backgroundColor: '#071644', borderColor: '#218DFF', color: '#ffffff' }}
                className="w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="Building Materials">Building Materials</option>
                <option value="Tiles & Ceramics">Tiles & Ceramics</option>
                <option value="Paints & Coatings">Paints & Coatings</option>
                <option value="Electrical Supplies">Electrical Supplies</option>
                <option value="Plumbing & Pipes">Plumbing & Pipes</option>
                <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                <option value="Agricultural Inputs">Agricultural Inputs</option>
                <option value="General Wholesaler">General Wholesaler</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-200">
                Notes & Terms <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={supplierNotes}
                onChange={(e) => setSupplierNotes(e.target.value)}
                placeholder="Credit terms (e.g. Net 30 days), bank account details, sales rep contact..."
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
              <span>{editRow ? 'Update Supplier' : 'Register New Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

