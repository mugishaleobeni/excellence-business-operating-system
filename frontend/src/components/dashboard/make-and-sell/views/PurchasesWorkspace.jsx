import React, { useState, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Clock,
  Printer,
  X,
  CreditCard,
  Wallet,
  Building2,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  RotateCcw,
  Camera,
  Layers,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import CustomSelect from '../../../common/CustomSelect'

export default function PurchasesWorkspace({
  activeSubPage = 'All Purchases',
  purchases = [],
  rawMaterials = [],
  suppliers = [],
  onUpdatePurchases = null,
  onUpdateRawMaterials = null,
  onUpdateSuppliers = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [detailPurchase, setDetailPurchase] = useState(null)
  const [newPurchaseDrawerOpen, setNewPurchaseDrawerOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedPurchaseToPay, setSelectedPurchaseToPay] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('MTN MoMo Business')

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [selectedPurchaseToReturn, setSelectedPurchaseToReturn] = useState(null)
  const [returnQty, setReturnQty] = useState(1)
  const [returnReason, setReturnReason] = useState('Damaged packaging / quality issue')
  const [returnOutcome, setReturnOutcome] = useState('Credit Note')

  // New Purchase Form State (lists ONLY Raw Materials)
  const [purchSupplierName, setPurchSupplierName] = useState(suppliers[0]?.name || 'Bakhresa Grain Milling')
  const [purchMaterialId, setPurchMaterialId] = useState(rawMaterials[0]?.id || '')
  const [purchQuantity, setPurchQuantity] = useState(50)
  const [purchUnitPrice, setPurchUnitPrice] = useState(rawMaterials[0]?.purchasePriceRWF || 1200)
  const [purchExpiryDate, setPurchExpiryDate] = useState('')
  const [purchAmountPaid, setPurchAmountPaid] = useState('')
  const [purchPaymentMethod, setPurchPaymentMethod] = useState('MTN MoMo Business')
  const [purchDueDate, setPurchDueDate] = useState('')
  const [purchInvoicePhoto, setPurchInvoicePhoto] = useState(null)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Sync unit price when raw material selection changes
  const handleMaterialChange = (matId) => {
    setPurchMaterialId(matId)
    const mat = rawMaterials.find((m) => m.id === matId)
    if (mat) {
      setPurchUnitPrice(mat.purchasePriceRWF || 1200)
      if (mat.hasExpiry) {
        setPurchExpiryDate(mat.expiryDate || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10))
      } else {
        setPurchExpiryDate('')
      }
    }
  }

  // Selected raw material
  const selectedMaterial = useMemo(() => {
    return rawMaterials.find((m) => m.id === purchMaterialId) || rawMaterials[0] || null
  }, [rawMaterials, purchMaterialId])

  // Calculation of purchase totals
  const totalPurchaseCost = useMemo(() => {
    const qty = Number(purchQuantity) || 0
    const price = Number(purchUnitPrice) || 0
    return qty * price
  }, [purchQuantity, purchUnitPrice])

  // 3-Number Summary Strip
  const summary = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const thisMonthStr = todayStr.slice(0, 7)

    let totalVal = 0
    let unpaidTotal = 0
    let returnsCount = 0

    purchases.forEach((p) => {
      const amt = Number(p.totalAmountRWF || p.amountRWF || p.amount || 0)
      const paid = Number(p.amountPaidRWF ?? p.amountRWF ?? amt)
      const balance = Math.max(0, amt - paid)
      totalVal += amt
      unpaidTotal += balance
      if (p.isReturn) returnsCount++
    })

    return { totalVal, unpaidTotal, returnsCount }
  }, [purchases])

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    let list = [...purchases]
    if (activeSubPage === 'Unpaid Purchases') {
      list = list.filter((p) => {
        const total = Number(p.totalAmountRWF || p.amountRWF || 0)
        const paid = Number(p.amountPaidRWF ?? p.amountRWF ?? total)
        return total - paid > 0
      })
    } else if (activeSubPage === 'Purchase Returns') {
      list = list.filter((p) => p.isReturn)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (p) =>
          (p.id || '').toLowerCase().includes(q) ||
          (p.supplier || p.supplierName || '').toLowerCase().includes(q) ||
          (p.materialName || p.title || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [purchases, activeSubPage, searchQuery])

  // Open New Purchase Drawer
  const handleOpenNewPurchase = () => {
    const defMat = rawMaterials[0]
    setPurchSupplierName(suppliers[0]?.name || 'Bakhresa Grain Milling')
    setPurchMaterialId(defMat?.id || '')
    setPurchQuantity(50)
    setPurchUnitPrice(defMat?.purchasePriceRWF || 1200)
    setPurchExpiryDate(new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10))
    setPurchAmountPaid(defMat ? (defMat.purchasePriceRWF || 1200) * 50 : 60000)
    setPurchPaymentMethod('MTN MoMo Business')
    setPurchDueDate('')
    setPurchInvoicePhoto(null)
    setShowMoreOptions(false)
    setNewPurchaseDrawerOpen(true)
  }

  // Submit Purchase (Increases Raw Materials stock & updates Amounts Owed)
  const handleSavePurchase = (keepOpen = false) => {
    if (!selectedMaterial) {
      alert('Please select a raw material.')
      return
    }

    const qty = Number(purchQuantity) || 1
    const price = Number(purchUnitPrice) || 0
    const total = totalPurchaseCost
    const paid = Number(purchAmountPaid) !== undefined ? Number(purchAmountPaid) : total
    const balance = Math.max(0, total - paid)
    const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'
    const newLotCode = `LOT-${Math.floor(1000 + Math.random() * 9000)}`

    // Increase Raw Materials stock
    if (onUpdateRawMaterials) {
      const updated = rawMaterials.map((m) => {
        if (m.id === selectedMaterial.id) {
          return {
            ...m,
            currentStock: (Number(m.currentStock || m.stock || 0)) + qty,
            purchasePriceRWF: price, // updates recipe cost foundation!
            batchCode: newLotCode,
            expiryDate: purchExpiryDate || m.expiryDate
          }
        }
        return m
      })
      onUpdateRawMaterials(updated)
    }

    // Update Supplier debt if unpaid
    if (balance > 0 && onUpdateSuppliers) {
      const existingSup = suppliers.find((s) => s.name === purchSupplierName)
      if (existingSup) {
        onUpdateSuppliers(
          suppliers.map((s) =>
            s.id === existingSup.id ? { ...s, balanceOwedRWF: (Number(s.balanceOwedRWF || 0)) + balance } : s
          )
        )
      } else {
        onUpdateSuppliers([
          ...suppliers,
          {
            id: `SUP-${Date.now()}`,
            name: purchSupplierName,
            materialsSupplied: selectedMaterial.name,
            balanceOwedRWF: balance,
            totalPurchasedRWF: total
          }
        ])
      }
    }

    // New Purchase Record
    const newPurchase = {
      id: `PURCH-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      supplier: purchSupplierName,
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      lotCode: newLotCode,
      quantity: qty,
      unit: selectedMaterial.unit || 'kg',
      unitPriceRWF: price,
      totalAmountRWF: total,
      amountPaidRWF: paid,
      balanceRWF: balance,
      paymentMethod: purchPaymentMethod,
      dueDate: balance > 0 ? purchDueDate : null,
      status,
      hasPhoto: !!purchInvoicePhoto
    }

    if (onUpdatePurchases) {
      onUpdatePurchases([newPurchase, ...purchases])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Purchase Recorded',
        message: `Purchased ${qty} ${selectedMaterial.unit} of ${selectedMaterial.name}. Raw stock updated.`
      })
    }

    if (keepOpen) {
      handleOpenNewPurchase()
    } else {
      setNewPurchaseDrawerOpen(false)
    }
  }

  // Record Payment on Unpaid Purchase
  const handleConfirmPayment = () => {
    if (!selectedPurchaseToPay) return
    const amt = Number(payAmount) || 0
    if (amt <= 0) return

    const currPaid = Number(selectedPurchaseToPay.amountPaidRWF || 0)
    const newPaid = currPaid + amt
    const total = Number(selectedPurchaseToPay.totalAmountRWF || selectedPurchaseToPay.amountRWF || 0)
    const newBalance = Math.max(0, total - newPaid)
    const newStatus = newBalance === 0 ? 'Paid' : 'Partial'

    // Update purchase record
    if (onUpdatePurchases) {
      onUpdatePurchases(
        purchases.map((p) =>
          p.id === selectedPurchaseToPay.id
            ? { ...p, amountPaidRWF: newPaid, balanceRWF: newBalance, status: newStatus }
            : p
        )
      )
    }

    // Update supplier balance
    if (onUpdateSuppliers) {
      onUpdateSuppliers(
        suppliers.map((s) => {
          if (s.name === selectedPurchaseToPay.supplier) {
            return { ...s, balanceOwedRWF: Math.max(0, (Number(s.balanceOwedRWF || 0)) - amt) }
          }
          return s
        })
      )
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Paid ${formatRWF(amt)} towards purchase ${selectedPurchaseToPay.id}. Remaining balance: ${formatRWF(newBalance)}.`
      })
    }

    setPayModalOpen(false)
    setSelectedPurchaseToPay(null)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Purchases · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'All Purchases' && 'Raw Material Purchases'}
            {activeSubPage === 'Unpaid Purchases' && 'Unpaid Supplier Purchases'}
            {activeSubPage === 'Purchase Returns' && 'Purchase Returns & Credit Notes'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'All Purchases' && 'Record raw ingredient receipts with batch lots, supplier costs, and expiry tracking.'}
            {activeSubPage === 'Unpaid Purchases' && 'Track outstanding payables owed to suppliers and clear balances.'}
            {activeSubPage === 'Purchase Returns' && 'Manage defective material returns, vendor refunds, and credit notes.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
          >
            Export
          </button>

          {activeSubPage === 'All Purchases' && (
            <button
              type="button"
              onClick={handleOpenNewPurchase}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Total Material Purchases
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">
            {formatRWF(summary.totalVal)}
          </div>
          <span className="text-[11px] text-slate-400">Recorded inputs for manufacturing</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-rose-300/80 tracking-wider">
            Unpaid Supplier Debt
          </span>
          <div className="font-orbitron text-2xl font-bold text-rose-400">
            {formatRWF(summary.unpaidTotal)}
          </div>
          <span className="text-[11px] text-slate-400">Due to raw material suppliers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
            Returns Recorded
          </span>
          <div className="font-orbitron text-2xl font-bold text-amber-400">{summary.returnsCount}</div>
          <span className="text-[11px] text-slate-400">Defective material claims</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search purchases by ID, supplier, or material..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
        />
      </div>

      {/* Purchases Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                <th className="p-3.5 pl-5">Purchase ID &amp; Date</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5">Raw Material &amp; Lot</th>
                <th className="p-3.5 text-right">Quantity</th>
                <th className="p-3.5 text-right">Total Amount</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Balance</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No purchases found. Click "+ New Purchase" to record incoming raw materials.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purch) => {
                  const total = Number(purch.totalAmountRWF || purch.amountRWF || 0)
                  const paid = Number(purch.amountPaidRWF ?? purch.amountRWF ?? total)
                  const balance = Math.max(0, total - paid)
                  const isUnpaid = balance > 0

                  return (
                    <tr
                      key={purch.id}
                      onClick={() => setDetailPurchase(purch)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                          {purch.id}
                        </div>
                        <div className="text-[10px] text-slate-500">{purch.date || 'Today'}</div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">{purch.supplier}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-white">{purch.materialName}</span>
                        {purch.lotCode && (
                          <span className="block text-[10px] text-slate-500 font-mono">
                            Lot: {purch.lotCode}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-300">
                        {(purch.quantity || 1).toLocaleString()} {purch.unit || 'kg'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {formatRWF(total)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-emerald-400">
                        {formatRWF(paid)}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className={balance > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                          {formatRWF(balance)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            !isUnpaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : paid > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {purch.status || (isUnpaid ? 'Unpaid' : 'Paid')}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        {isUnpaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPurchaseToPay(purch)
                              setPayAmount(balance)
                              setPayModalOpen(true)
                            }}
                            className="btn-sapphire-clean px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- NEW PURCHASE DRAWER (Raw Materials Only) --- */}
      {newPurchaseDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewPurchaseDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Purchases › New Purchase
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Purchase (Raw Materials)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPurchaseDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* 1. Supplier */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier *</label>
                  <input
                    type="text"
                    value={purchSupplierName}
                    onChange={(e) => setPurchSupplierName(e.target.value)}
                    placeholder="e.g. Bakhresa Grain Milling"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                {/* 2. Raw Material Picker (Raw Materials ONLY) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Raw Material Ingredient *
                  </label>
                  <CustomSelect
                    value={purchMaterialId}
                    onChange={handleMaterialChange}
                    options={rawMaterials.map((m) => ({
                      value: m.id,
                      label: `${m.name} (Stock: ${m.currentStock || m.stock || 0} ${m.unit || 'kg'} · ${formatRWF(m.purchasePriceRWF || 0)}/${m.unit || 'kg'})`
                    }))}
                  />
                </div>

                {/* 3. Quantity & Purchase Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Quantity ({selectedMaterial?.unit})</label>
                    <input
                      type="number"
                      min="1"
                      value={purchQuantity}
                      onChange={(e) => setPurchQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purchase Price (RWF)</label>
                    <input
                      type="number"
                      value={purchUnitPrice}
                      onChange={(e) => setPurchUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                {/* 4. Total Cost Box */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Total Purchase Cost:</span>
                  <strong className="text-white font-mono text-base font-bold">
                    {formatRWF(totalPurchaseCost)}
                  </strong>
                </div>

                {/* 5. Payment Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                    <CustomSelect
                      value={purchPaymentMethod}
                      onChange={(val) => {
                        setPurchPaymentMethod(val)
                        if (val !== 'Supplier Credit') {
                          setPurchAmountPaid(totalPurchaseCost)
                        } else {
                          setPurchAmountPaid('0')
                        }
                      }}
                      options={[
                        { value: 'MTN MoMo Business', label: 'MTN MoMo Business' },
                        { value: 'Cash', label: 'Cash in Hand' },
                        { value: 'Bank', label: 'Bank Transfer' },
                        { value: 'Supplier Credit', label: 'Supplier Credit (Pay Later)' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Amount Paid (RWF)</label>
                    <input
                      type="number"
                      value={purchPaymentMethod === 'Supplier Credit' ? purchAmountPaid : totalPurchaseCost}
                      onChange={(e) => setPurchAmountPaid(e.target.value)}
                      disabled={purchPaymentMethod !== 'Supplier Credit'}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                {/* More Options Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-[11px] text-[#9EDCFF] hover:underline font-semibold cursor-pointer"
                  >
                    {showMoreOptions ? '− Hide options' : '+ More options (Expiry date, Due date, Invoice photo)'}
                  </button>
                </div>

                {showMoreOptions && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">Lot Expiry Date</label>
                      <input
                        type="date"
                        value={purchExpiryDate}
                        onChange={(e) => setPurchExpiryDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs"
                      />
                    </div>

                    {purchPaymentMethod === 'Supplier Credit' && (
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Payment Due Date</label>
                        <input
                          type="date"
                          value={purchDueDate}
                          onChange={(e) => setPurchDueDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSavePurchase(false)}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save Purchase
              </button>
              <button
                type="button"
                onClick={() => handleSavePurchase(true)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                Save &amp; Add Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT MODAL --- */}
      {payModalOpen && selectedPurchaseToPay && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#071330] border border-white/15 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                  Purchases · Pay Supplier
                </span>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Pay {selectedPurchaseToPay.supplier}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between">
                <span className="text-slate-400">Total Purchase Balance Owed:</span>
                <strong className="text-rose-400 font-mono text-sm">
                  {formatRWF(selectedPurchaseToPay.balanceRWF || 0)}
                </strong>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Amount (RWF) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                <CustomSelect
                  value={payMethod}
                  onChange={setPayMethod}
                  options={[
                    { value: 'MTN MoMo Business', label: 'MTN MoMo Business' },
                    { value: 'Bank', label: 'Bank Transfer' },
                    { value: 'Cash', label: 'Cash in Hand' }
                  ]}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Confirm Payment
              </button>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DRAWER --- */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Purchases Ledger Export"
        pageTitle="Purchases · All Purchases"
        data={filteredPurchases.map((p) => ({
          PurchaseID: p.id,
          Date: p.date || 'Today',
          Supplier: p.supplier,
          Material: p.materialName,
          Quantity: `${p.quantity || 1} ${p.unit || 'kg'}`,
          Total: formatRWF(p.totalAmountRWF || p.amountRWF || 0),
          Paid: formatRWF(p.amountPaidRWF || 0),
          Balance: formatRWF(p.balanceRWF || 0),
          Status: p.status || 'Paid'
        }))}
        columns={[
          { key: 'PurchaseID', label: 'Purchase ID' },
          { key: 'Date', label: 'Date' },
          { key: 'Supplier', label: 'Supplier' },
          { key: 'Material', label: 'Raw Material' },
          { key: 'Quantity', label: 'Quantity' },
          { key: 'Total', label: 'Total Amount' },
          { key: 'Paid', label: 'Paid' },
          { key: 'Balance', label: 'Balance' },
          { key: 'Status', label: 'Status' }
        ]}
        businessName="Inyange Artisan Bakery & Roastery"
      />
    </div>
  )
}

