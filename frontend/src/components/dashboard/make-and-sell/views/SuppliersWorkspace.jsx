import React, { useState, useMemo } from 'react'
import {
  Truck,
  Plus,
  Search,
  Filter,
  DollarSign,
  Phone,
  Calendar,
  Clock,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Edit2,
  Trash2,
  ArrowRight
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import CustomSelect from '../../../common/CustomSelect'

export default function SuppliersWorkspace({
  activeSubPage = 'All Suppliers',
  suppliers = [],
  purchases = [],
  onUpdateSuppliers = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [newSupplierDrawerOpen, setNewSupplierDrawerOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedSupToPay, setSelectedSupToPay] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('MTN MoMo Business')

  // Form State
  const [supName, setSupName] = useState('')
  const [supPhone, setSupPhone] = useState('')
  const [supMaterials, setSupMaterials] = useState('')
  const [supTermsDays, setSupTermsDays] = useState(30)
  const [supNotes, setSupNotes] = useState('')

  // 3-Number Summary Strip
  const summary = useMemo(() => {
    let totalOwed = 0
    let overdueCount = 0
    let totalSuppliers = suppliers.length

    suppliers.forEach((s) => {
      const owed = Number(s.balanceOwedRWF || 0)
      totalOwed += owed
      if (owed > 0) overdueCount++
    })

    return { totalOwed, overdueCount, totalSuppliers }
  }, [suppliers])

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    let list = [...suppliers]
    if (activeSubPage === 'Amounts Owed') {
      list = list.filter((s) => Number(s.balanceOwedRWF || 0) > 0)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.materialsSupplied || '').toLowerCase().includes(q) ||
          (s.phone || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [suppliers, activeSubPage, searchQuery])

  // Save Supplier
  const handleSaveSupplier = () => {
    if (!supName.trim()) {
      alert('Please enter a supplier name.')
      return
    }

    const newSup = {
      id: `SUP-${Date.now()}`,
      name: supName.trim(),
      phone: supPhone.trim(),
      materialsSupplied: supMaterials.trim(),
      paymentTermsDays: Number(supTermsDays) || 30,
      notes: supNotes,
      balanceOwedRWF: 0,
      totalPurchasedRWF: 0
    }

    if (onUpdateSuppliers) {
      onUpdateSuppliers([newSup, ...suppliers])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Supplier Added',
        message: `Supplier "${newSup.name}" saved to directory.`
      })
    }

    setNewSupplierDrawerOpen(false)
  }

  // Record Payment
  const handleConfirmPayment = () => {
    if (!selectedSupToPay) return
    const amt = Number(payAmount) || 0
    if (amt <= 0) return

    const currentOwed = Number(selectedSupToPay.balanceOwedRWF || 0)
    const newOwed = Math.max(0, currentOwed - amt)

    if (onUpdateSuppliers) {
      onUpdateSuppliers(
        suppliers.map((s) => (s.id === selectedSupToPay.id ? { ...s, balanceOwedRWF: newOwed } : s))
      )
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Paid ${formatRWF(amt)} to ${selectedSupToPay.name}. Remaining balance: ${formatRWF(newOwed)}.`
      })
    }

    setPayModalOpen(false)
    setSelectedSupToPay(null)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Suppliers · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'All Suppliers' ? 'Raw Material Suppliers' : 'Amounts Owed (Supplier Payables)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'All Suppliers'
              ? 'Directory of flour mills, dairy farms, sugar works, and packaging vendors.'
              : 'Track upcoming and overdue invoices owed for raw material deliveries.'}
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

          {activeSubPage === 'All Suppliers' && (
            <button
              type="button"
              onClick={() => {
                setSupName('')
                setSupPhone('')
                setSupMaterials('')
                setSupTermsDays(30)
                setSupNotes('')
                setNewSupplierDrawerOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Total Suppliers
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">{summary.totalSuppliers}</div>
          <span className="text-[11px] text-slate-400">Registered material partners</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-rose-300/80 tracking-wider">
            Total Amounts Owed
          </span>
          <div className="font-orbitron text-2xl font-bold text-rose-400">
            {formatRWF(summary.totalOwed)}
          </div>
          <span className="text-[11px] text-slate-400">Payables due to suppliers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
            Pending Supplier Invoices
          </span>
          <div className="font-orbitron text-2xl font-bold text-amber-400">{summary.overdueCount}</div>
          <span className="text-[11px] text-slate-400">Awaiting bank or MoMo transfer</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search suppliers by name, material, or phone..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
        />
      </div>

      {/* Supplier Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                <th className="p-3.5 pl-5">Supplier Name &amp; Phone</th>
                <th className="p-3.5">Materials Supplied</th>
                <th className="p-3.5 text-right">Total Purchased</th>
                <th className="p-3.5 text-right">Balance Owed</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No suppliers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const owed = Number(sup.balanceOwedRWF || 0)
                  const hasDebt = owed > 0

                  return (
                    <tr key={sup.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                          {sup.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{sup.phone || 'No phone recorded'}</div>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {sup.materialsSupplied || 'Wheat flour, yeast, packaging'}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-white">
                        {formatRWF(sup.totalPurchasedRWF || 0)}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className={hasDebt ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                          {formatRWF(owed)}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        {hasDebt && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupToPay(sup)
                              setPayAmount(owed)
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

      {/* --- NEW SUPPLIER DRAWER --- */}
      {newSupplierDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewSupplierDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Suppliers · New Record
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Supplier</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewSupplierDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supplier Company Name *</label>
                  <input
                    type="text"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    placeholder="e.g. Bakhresa Grain Milling Ltd"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone / MoMo Number</label>
                  <input
                    type="tel"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="+250 788 123 456"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Raw Materials Supplied</label>
                  <input
                    type="text"
                    value={supMaterials}
                    onChange={(e) => setSupMaterials(e.target.value)}
                    placeholder="e.g. Premium Baker Flour 50kg bags"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    value={supTermsDays}
                    onChange={(e) => setSupTermsDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notes / Bank Account Details</label>
                  <textarea
                    rows={3}
                    value={supNotes}
                    onChange={(e) => setSupNotes(e.target.value)}
                    placeholder="Bank account number, delivery representative contact, discounts..."
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveSupplier}
                className="w-full btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT MODAL --- */}
      {payModalOpen && selectedSupToPay && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#071330] border border-white/15 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                  Suppliers · Pay Debt
                </span>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Pay {selectedSupToPay.name}
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
                <span className="text-slate-400">Total Balance Owed:</span>
                <strong className="text-rose-400 font-mono text-sm">
                  {formatRWF(selectedSupToPay.balanceOwedRWF || 0)}
                </strong>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount to Pay (RWF) *</label>
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
                  onChange={(val) => setPayMethod(val)}
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
        title="Suppliers Directory Export"
        pageTitle="Suppliers · Directory"
        data={filteredSuppliers.map((s) => ({
          Name: s.name,
          Phone: s.phone || 'N/A',
          Materials: s.materialsSupplied || 'Ingredients',
          TotalPurchased: formatRWF(s.totalPurchasedRWF || 0),
          BalanceOwed: formatRWF(s.balanceOwedRWF || 0)
        }))}
        columns={[
          { key: 'Name', label: 'Supplier' },
          { key: 'Phone', label: 'Phone' },
          { key: 'Materials', label: 'Materials' },
          { key: 'TotalPurchased', label: 'Total Purchased' },
          { key: 'BalanceOwed', label: 'Balance Owed' }
        ]}
        businessName="Inyange Artisan Bakery & Roastery"
      />
    </div>
  )
}

