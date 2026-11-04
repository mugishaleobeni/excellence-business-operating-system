import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  X,
  Check,
  Plus,
  Trash2,
  FileCheck,
  Receipt,
  FileSpreadsheet,
  Building,
  User,
  ShoppingBag,
  ArrowRight,
  ChevronLeft
} from 'lucide-react'
import { formatRWF, formatWithCommas } from '../../../utils/currencyWords'
import CustomSelect from '../../common/CustomSelect'

const DOCUMENT_TYPES = [
  {
    type: 'Invoice',
    title: 'Tax & Sales Invoice',
    desc: 'Bill customers for goods or services rendered with credit terms',
    prefix: 'INV',
    badge: 'bg-blue-500/15 text-[#9EDCFF] border-[#218DFF]/40'
  },
  {
    type: 'Receipt',
    title: 'Payment Receipt',
    desc: 'Official proof of payment for settled transactions and debt collections',
    prefix: 'REC',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
  },
  {
    type: 'Quotation',
    title: 'Sales Quotation (Proforma)',
    desc: 'Price estimate for prospective clients (does not create sales or stock movements)',
    prefix: 'QT',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-400/40'
  },
  {
    type: 'Purchase Order',
    title: 'Supplier Purchase Order',
    desc: 'Formal procurement order sent to suppliers (does not modify inventory until fulfilled)',
    prefix: 'PO',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/40'
  },
  {
    type: 'Customer Statement',
    title: 'Customer Account Statement',
    desc: 'Summary of all invoices, payments, and open balances for a client',
    prefix: 'CS',
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/40'
  },
  {
    type: 'Supplier Statement',
    title: 'Supplier Account Statement',
    desc: 'Summary of supplier bills, payments made, and amounts owed',
    prefix: 'SS',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-400/40'
  }
]

export default function CreateDocumentModal({
  isOpen,
  onClose,
  initialType = null,
  customers = [],
  suppliers = [],
  inventory = [],
  onDocumentCreated
}) {
  const [selectedType, setSelectedType] = useState(initialType || 'Invoice')
  const [step, setStep] = useState(initialType ? 2 : 1) // 1: Select Type, 2: Fill Form

  // Form states
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [docDueDate, setDocDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [lineItems, setLineItems] = useState([
    { name: '', quantity: 1, unit: 'pcs', unitPrice: '', total: 0 }
  ])
  const [amountPaid, setAmountPaid] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (initialType) {
      setSelectedType(initialType)
      setStep(2)
    } else {
      setStep(1)
    }
  }, [initialType, isOpen])

  if (!isOpen) return null

  const isSupplierType = selectedType === 'Purchase Order' || selectedType === 'Supplier Statement'

  // Pre-fill when choosing an existing customer or supplier
  const handleSelectExistingParty = (name) => {
    setRecipientName(name)
    if (isSupplierType) {
      const supp = suppliers.find((s) => (s.name || s.supplierName) === name)
      if (supp) {
        setRecipientPhone(supp.phone || '')
        setRecipientEmail(supp.email || '')
      }
    } else {
      const cust = customers.find((c) => (c.name || c.customerName) === name)
      if (cust) {
        setRecipientPhone(cust.phone || '')
        setRecipientEmail(cust.email || '')
      }
    }
  }

  // Pre-fill item from inventory
  const handleSelectInventoryItem = (index, productTitle) => {
    const match = inventory.find((i) => (i.title || i.productTitle || i.name) === productTitle)
    const next = [...lineItems]
    if (match) {
      const price = isSupplierType
        ? (Number(match.purchasePriceRWF ?? match.unitCostRWF) || 0)
        : (Number(match.sellingPriceRWF ?? match.amountRWF) || 0)
      next[index] = {
        ...next[index],
        name: match.title || match.name,
        unit: match.unit || 'pcs',
        unitPrice: price,
        total: (Number(next[index].quantity) || 1) * price
      }
    } else {
      next[index].name = productTitle
    }
    setLineItems(next)
  }

  const handleLineItemChange = (index, field, value) => {
    const next = [...lineItems]
    next[index][field] = value
    const qty = Number(next[index].quantity) || 1
    const price = Number(next[index].unitPrice) || 0
    next[index].total = qty * price
    setLineItems(next)
  }

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: '', quantity: 1, unit: 'pcs', unitPrice: '', total: 0 }])
  }

  const handleRemoveLineItem = (index) => {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const totalAmount = lineItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0)
  const paidNum = selectedType === 'Receipt' ? totalAmount : (Number(amountPaid) || 0)
  const outstandingAmount = Math.max(0, totalAmount - paidNum)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!recipientName.trim()) return

    const typeConfig = DOCUMENT_TYPES.find((d) => d.type === selectedType) || DOCUMENT_TYPES[0]
    const docId = `${typeConfig.prefix}-${Math.floor(100 + Math.random() * 900)}`

    let status = 'Active'
    if (selectedType === 'Quotation' || selectedType === 'Purchase Order') {
      status = 'Draft'
    } else if (selectedType === 'Receipt' || outstandingAmount === 0) {
      status = 'Paid'
    } else if (paidNum > 0) {
      status = 'Partial'
    } else {
      status = 'Unpaid'
    }

    const newDoc = {
      id: docId,
      type: selectedType,
      title: `${selectedType} #${docId}`,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientEmail: recipientEmail.trim(),
      date: docDate,
      dueDate: docDueDate,
      amount: totalAmount,
      paidAmount: paidNum,
      outstandingAmount,
      status,
      items: lineItems.filter((it) => it.name.trim()),
      notes: notes.trim()
    }

    if (onDocumentCreated) {
      onDocumentCreated(newDoc)
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
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl text-white animate-in zoom-in-95 duration-150 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 p-5 shrink-0 bg-white/5">
          <div className="flex items-center gap-2.5">
            {step === 2 && !initialType && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#9EDCFF] mr-1 cursor-pointer"
                title="Change Document Type"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/20 border border-[#218DFF]/40 flex items-center justify-center text-[#9EDCFF]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-orbitron text-base font-bold text-white">
                {step === 1 ? 'Create Business Document' : `New ${selectedType}`}
              </h3>
              <p className="text-[11px] text-slate-300">
                {step === 1 ? 'Step 1: Choose document type' : 'Step 2: Enter details & line items'}
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

        {/* STEP 1: SELECT DOCUMENT TYPE CARDS */}
        {step === 1 ? (
          <div className="overflow-y-auto p-5 space-y-3 flex-1 text-xs">
            <span className="text-[11px] font-orbitron uppercase text-[#9EDCFF] font-bold block mb-2">
              Select Document Classification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOCUMENT_TYPES.map((dt) => (
                <button
                  key={dt.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(dt.type)
                    setStep(2)
                  }}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#218DFF]/50 text-left cursor-pointer transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="flex items-start justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dt.badge}`}>
                      {dt.prefix}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#9EDCFF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h4 className="font-orbitron text-sm font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                      {dt.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      {dt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* STEP 2: DOCUMENT DETAILS & LINE ITEMS FORM */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0 text-xs">
            <div className="overflow-y-auto p-5 space-y-4 flex-1">
              {/* Recipient Party Info */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase">
                    {isSupplierType ? 'Supplier Information' : 'Customer Information'}
                  </span>
                  {/* Quick autofill from existing records */}
                  {(isSupplierType ? suppliers : customers).length > 0 && (
                    <select
                      onChange={(e) => handleSelectExistingParty(e.target.value)}
                      defaultValue=""
                      className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/15 text-[11px] text-[#9EDCFF] focus:outline-none"
                    >
                      <option value="" disabled>
                        -- Autofill from existing {isSupplierType ? 'Suppliers' : 'Customers'} --
                      </option>
                      {(isSupplierType ? suppliers : customers).map((p) => {
                        const name = p.name || p.customerName || p.supplierName
                        return (
                          <option key={p.id || name} value={name}>
                            {name}
                          </option>
                        )
                      })}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Party Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={isSupplierType ? 'e.g. Cimerwa Ltd' : 'e.g. Jean Nsengiyumva'}
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="0788123456"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="client@mail.rw"
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Document Date
                    </label>
                    <input
                      type="date"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3 py-1.5 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {selectedType === 'Quotation' ? 'Valid Until' : 'Payment Due Date'}
                    </label>
                    <input
                      type="date"
                      value={docDueDate}
                      onChange={(e) => setDocDueDate(e.target.value)}
                      style={{ backgroundColor: '#071644', color: '#ffffff' }}
                      className="w-full px-3 py-1.5 rounded-xl exbos-modal-input text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron text-xs font-bold text-[#9EDCFF] uppercase">
                    Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-black/40 border border-white/10 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5 space-y-1">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleLineItemChange(idx, 'name', e.target.value)}
                          placeholder="Item name / description"
                          style={{ backgroundColor: '#071644', color: '#ffffff' }}
                          className="w-full px-2.5 py-1.5 rounded-lg exbos-modal-input text-white focus:outline-none"
                        />
                        {inventory.length > 0 && !item.name && (
                          <select
                            onChange={(e) => handleSelectInventoryItem(idx, e.target.value)}
                            defaultValue=""
                            className="w-full px-2 py-1 rounded bg-black/50 text-[10px] text-slate-300 border border-white/10"
                          >
                            <option value="" disabled>-- Pick from Stock --</option>
                            {inventory.map((inv) => (
                              <option key={inv.id || inv.title} value={inv.title || inv.name}>
                                {inv.title || inv.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                          placeholder="Qty"
                          style={{ backgroundColor: '#071644', color: '#ffffff' }}
                          className="w-full px-2 py-1.5 rounded-lg exbos-modal-input text-white text-center font-mono focus:outline-none"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={item.unitPrice === '' ? '' : formatWithCommas(item.unitPrice)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            handleLineItemChange(idx, 'unitPrice', raw === '' ? '' : Number(raw))
                          }}
                          placeholder="Price (RWF)"
                          style={{ backgroundColor: '#071644', color: '#ffffff' }}
                          className="w-full px-2 py-1.5 rounded-lg exbos-modal-input text-white text-right font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-between pl-1">
                        <span className="font-orbitron font-bold text-white text-[11px] truncate">
                          {formatRWF(item.total || 0)}
                        </span>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Summary */}
                <div className="pt-2 border-t border-white/10 flex justify-end">
                  <div className="w-64 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Document Value:</span>
                      <strong className="font-orbitron font-extrabold text-white text-sm">
                        {formatRWF(totalAmount)}
                      </strong>
                    </div>

                    {selectedType !== 'Receipt' && selectedType !== 'Quotation' && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-300">Amount Paid Now:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={amountPaid === '' ? '' : formatWithCommas(amountPaid)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            setAmountPaid(raw === '' ? '' : Number(raw))
                          }}
                          placeholder="0"
                          style={{ backgroundColor: '#071644', color: '#ffffff' }}
                          className="w-28 px-2 py-1 rounded-lg exbos-modal-input text-emerald-400 text-right font-mono font-bold focus:outline-none"
                        />
                      </div>
                    )}

                    {outstandingAmount > 0 && selectedType !== 'Quotation' && (
                      <div className="flex justify-between items-center pt-1 text-amber-300">
                        <span className="font-bold">Outstanding Balance:</span>
                        <strong className="font-orbitron font-bold">
                          {formatRWF(outstandingAmount)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Notes &amp; Special Terms
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivery terms, payment deadline, or warranty remarks"
                  style={{ backgroundColor: '#071644', color: '#ffffff' }}
                  className="w-full px-3 py-2 rounded-xl exbos-modal-input text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/15 shrink-0 bg-[#040C26]/95 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-sapphire-clean px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Check className="w-4 h-4 text-[#9EDCFF]" />
                <span>Save {selectedType}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

