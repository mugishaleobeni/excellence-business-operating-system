import React, { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  DollarSign,
  Phone,
  Calendar,
  Clock,
  Printer,
  X,
  MessageSquare,
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

export default function CustomersWorkspace({
  activeSubPage = 'Customer Directory',
  customers = [],
  sales = [],
  onUpdateCustomers = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [newCustomerDrawerOpen, setNewCustomerDrawerOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [selectedCustToPay, setSelectedCustToPay] = useState(null)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('MTN MoMo')

  // Form State
  const [custName, setCustName] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custCreditLimit, setCustCreditLimit] = useState(100000)
  const [custNotes, setCustNotes] = useState('')

  // 3-Number Summary Strip
  const summary = useMemo(() => {
    let totalReceivables = 0
    let overdueReceivables = 0
    let activeCount = customers.length

    customers.forEach((c) => {
      const bal = Number(c.balanceRWF || 0)
      totalReceivables += bal
      if (bal > 0) overdueReceivables += bal
    })

    return { totalReceivables, overdueReceivables, activeCount }
  }, [customers])

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let list = [...customers]
    if (activeSubPage === 'Outstanding Balances') {
      list = list.filter((c) => Number(c.balanceRWF || 0) > 0)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.phone || '').toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [customers, activeSubPage, searchQuery])

  // Save Customer
  const handleSaveCustomer = () => {
    if (!custName.trim()) {
      alert('Please enter a customer name.')
      return
    }

    const newCust = {
      id: `CUST-${Date.now()}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim(),
      creditLimitRWF: Number(custCreditLimit) || 100000,
      notes: custNotes,
      balanceRWF: 0,
      totalBoughtRWF: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    }

    if (onUpdateCustomers) {
      onUpdateCustomers([newCust, ...customers])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Customer Added',
        message: `Customer "${newCust.name}" added to directory.`
      })
    }

    setNewCustomerDrawerOpen(false)
  }

  // Record Payment
  const handleConfirmPayment = () => {
    if (!selectedCustToPay) return
    const amt = Number(payAmount) || 0
    if (amt <= 0) return

    const currentBal = Number(selectedCustToPay.balanceRWF || 0)
    const newBal = Math.max(0, currentBal - amt)

    if (onUpdateCustomers) {
      onUpdateCustomers(
        customers.map((c) => (c.id === selectedCustToPay.id ? { ...c, balanceRWF: newBal } : c))
      )
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Payment Received',
        message: `Collected ${formatRWF(amt)} from ${selectedCustToPay.name}. New balance: ${formatRWF(newBal)}.`
      })
    }

    setPayModalOpen(false)
    setSelectedCustToPay(null)
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Customers · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'Customer Directory' ? 'Customer Directory' : 'Outstanding Balances (Receivables)'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'Customer Directory'
              ? 'Manage commercial bakery clients, supermarkets, retail distributors, and walk-ins.'
              : 'Track unpaid finished goods credit by aging bucket (0-30, 31-60, 60+ days) and send reminders.'}
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

          {activeSubPage === 'Customer Directory' && (
            <button
              type="button"
              onClick={() => {
                setCustName('')
                setCustPhone('')
                setCustAddress('')
                setCustCreditLimit(100000)
                setCustNotes('')
                setNewCustomerDrawerOpen(true)
              }}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
            Total Customer Receivables
          </span>
          <div className="font-orbitron text-2xl font-bold text-white">
            {formatRWF(summary.totalReceivables)}
          </div>
          <span className="text-[11px] text-slate-400">Total owed across all clients</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
            Clients With Balance
          </span>
          <div className="font-orbitron text-2xl font-bold text-amber-400">
            {customers.filter((c) => Number(c.balanceRWF || 0) > 0).length}
          </div>
          <span className="text-[11px] text-slate-400">Awaiting payment collection</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
          <span className="text-[10px] font-orbitron uppercase text-[#218DFF] tracking-wider">
            Registered Customers
          </span>
          <div className="font-orbitron text-2xl font-bold text-[#9EDCFF]">{summary.activeCount}</div>
          <span className="text-[11px] text-slate-400">In customer database</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name, phone, or location..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
        />
      </div>

      {/* Customer Table */}
      <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                <th className="p-3.5 pl-5">Customer Name &amp; Phone</th>
                <th className="p-3.5">Location / Category</th>
                <th className="p-3.5 text-right">Total Purchased</th>
                <th className="p-3.5 text-right">Balance Owed</th>
                {activeSubPage === 'Outstanding Balances' && <th className="p-3.5">Aging Category</th>}
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No customers found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const bal = Number(cust.balanceRWF || 0)
                  const hasDebt = bal > 0
                  // Mock age: 0 to 30, 31 to 60, 60+ days
                  const ageBucket = bal > 50000 ? '60+ days' : bal > 20000 ? '31 to 60 days' : '0 to 30 days'

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setDetailCustomer(cust)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 pl-5">
                        <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{cust.phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5 text-slate-300">{cust.address || 'Kigali, Rwanda'}</td>
                      <td className="p-3.5 text-right font-mono font-semibold text-white">
                        {formatRWF(cust.totalBoughtRWF || 0)}
                      </td>
                      <td className="p-3.5 text-right font-mono">
                        <span className={hasDebt ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                          {formatRWF(bal)}
                        </span>
                      </td>
                      {activeSubPage === 'Outstanding Balances' && (
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ageBucket === '60+ days'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : ageBucket === '31 to 60 days'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/40'
                            }`}
                          >
                            {ageBucket}
                          </span>
                        </td>
                      )}
                      <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {hasDebt && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustToPay(cust)
                                  setPayAmount(bal)
                                  setPayModalOpen(true)
                                }}
                                className="btn-sapphire-clean px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer"
                              >
                                Record Payment
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = encodeURIComponent(
                                    `Hello ${cust.name}, this is a polite reminder from Inyange Artisan Bakery regarding your outstanding balance of ${formatRWF(bal)}. Thank you for your continued partnership!`
                                  )
                                  window.open(`https://wa.me/${(cust.phone || '250788000000').replace(/[^0-9]/g, '')}?text=${text}`, '_blank')
                                }}
                                className="p-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                title="Send WhatsApp reminder"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- NEW CUSTOMER DRAWER --- */}
      {newCustomerDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewCustomerDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Customers · New Record
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Customer</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewCustomerDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer / Business Name *</label>
                  <input
                    type="text"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="e.g. Simba Supermarket Kimihurura"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Address / Delivery Location</label>
                  <input
                    type="text"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="e.g. KG 9 Ave, Nyarutarama"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credit Limit (RWF)</label>
                  <input
                    type="number"
                    value={custCreditLimit}
                    onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Notes / Preferences</label>
                  <textarea
                    rows={3}
                    value={custNotes}
                    onChange={(e) => setCustNotes(e.target.value)}
                    placeholder="Delivery schedule, preferred bread varieties, invoice instructions..."
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveCustomer}
                className="w-full btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT MODAL --- */}
      {payModalOpen && selectedCustToPay && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#071330] border border-white/15 p-6 rounded-2xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                  Customers · Collect Payment
                </span>
                <h3 className="font-orbitron text-lg font-bold text-white">
                  Payment from {selectedCustToPay.name}
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
                <span className="text-slate-400">Total Outstanding Balance:</span>
                <strong className="text-amber-400 font-mono text-sm">
                  {formatRWF(selectedCustToPay.balanceRWF || 0)}
                </strong>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Amount Received (RWF) *</label>
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
                    { value: 'Cash', label: 'Cash in Hand' },
                    { value: 'MTN MoMo', label: 'MTN MoMo Business' },
                    { value: 'Airtel Money', label: 'Airtel Money' },
                    { value: 'Bank', label: 'Bank Transfer' }
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
                Record Payment
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
        title="Customers Directory Export"
        pageTitle="Customers · Directory"
        data={filteredCustomers.map((c) => ({
          Name: c.name,
          Phone: c.phone || 'N/A',
          Address: c.address || 'Kigali',
          TotalPurchased: formatRWF(c.totalBoughtRWF || 0),
          BalanceOwed: formatRWF(c.balanceRWF || 0)
        }))}
        columns={[
          { key: 'Name', label: 'Customer' },
          { key: 'Phone', label: 'Phone' },
          { key: 'Address', label: 'Address' },
          { key: 'TotalPurchased', label: 'Total Purchased' },
          { key: 'BalanceOwed', label: 'Balance Owed' }
        ]}
        businessName="Inyange Artisan Bakery & Roastery"
      />
    </div>
  )
}

