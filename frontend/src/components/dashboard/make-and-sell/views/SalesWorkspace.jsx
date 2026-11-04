import React, { useState, useMemo } from 'react'
import {
  ShoppingBag,
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
  Send,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import ExportDrawer from '../ExportDrawer'
import SalesTrendsView from '../../views/SalesTrendsView'
import CustomSelect from '../../../common/CustomSelect'
import { printBusinessDocument } from '../../../../utils/printDocument'

export default function SalesWorkspace({
  activeSubPage = 'All Sales',
  sales = [],
  finishedGoods = [],
  customers = [],
  onUpdateSales = null,
  onUpdateFinishedGoods = null,
  onUpdateCustomers = null,
  isCashier = false,
  hideFinancials = false,
  addToast = null
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [detailSale, setDetailSale] = useState(null)
  const [newSaleDrawerOpen, setNewSaleDrawerOpen] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // New Sale Form State (lists ONLY Finished Goods)
  const [saleCustomerId, setSaleCustomerId] = useState('')
  const [saleCustomerName, setSaleCustomerName] = useState('Walk-in Customer')
  const [saleCustomerPhone, setSaleCustomerPhone] = useState('')
  const [saleProductId, setSaleProductId] = useState(finishedGoods[0]?.id || '')
  const [saleQuantity, setSaleQuantity] = useState(1)
  const [salePrice, setSalePrice] = useState(finishedGoods[0]?.sellingPriceRWF || 300)
  const [saleDiscount, setSaleDiscount] = useState(0)
  const [salePaymentMethod, setSalePaymentMethod] = useState('Cash')
  const [saleAmountPaid, setSaleAmountPaid] = useState('')
  const [saleDueDate, setSaleDueDate] = useState('')
  const [saleNotes, setSaleNotes] = useState('')

  // Sync selling price when product selection changes
  const handleProductChange = (productId) => {
    setSaleProductId(productId)
    const prod = finishedGoods.find((p) => p.id === productId)
    if (prod) {
      setSalePrice(prod.sellingPriceRWF || 300)
    }
  }

  // Selected finished good
  const selectedProduct = useMemo(() => {
    return finishedGoods.find((p) => p.id === saleProductId) || finishedGoods[0] || null
  }, [finishedGoods, saleProductId])

  // Expiry check on the selected product lot (FEFO)
  const isSelectedProductExpired = useMemo(() => {
    if (!selectedProduct?.bestBeforeDate) return false
    return new Date(selectedProduct.bestBeforeDate) < new Date()
  }, [selectedProduct])

  // Calculation of sale totals
  const totalSaleAmount = useMemo(() => {
    const qty = Number(saleQuantity) || 0
    const price = Number(salePrice) || 0
    const disc = Number(saleDiscount) || 0
    return Math.max(0, qty * price - disc)
  }, [saleQuantity, salePrice, saleDiscount])

  // 3-Number Summary Strip
  const summary = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    const thisMonthStr = todayStr.slice(0, 7)

    let todaySales = 0
    let monthSales = 0
    let unpaidBalance = 0

    sales.forEach((s) => {
      const amt = Number(s.totalAmountRWF || s.amountRWF || s.amount || 0)
      const paid = Number(s.amountPaidRWF ?? s.amountRWF ?? amt)
      const balance = Math.max(0, amt - paid)
      unpaidBalance += balance

      const date = (s.date || s.createdAt || '').slice(0, 10)
      if (date === todayStr) {
        todaySales += amt
      }
      if (date.startsWith(thisMonthStr)) {
        monthSales += amt
      }
    })

    return { todaySales, monthSales, unpaidBalance }
  }, [sales])

  // Options for custom selects
  const productOptions = useMemo(() => {
    return finishedGoods.map((p) => ({
      value: p.id,
      label: `${p.name || p.title} (Stock: ${p.currentStock || p.stock || 0} ${p.unit || 'pcs'} · ${formatRWF(p.sellingPriceRWF || 0)})`
    }))
  }, [finishedGoods])

  const paymentOptions = [
    { value: 'Cash', label: 'Cash in Hand' },
    { value: 'MTN MoMo', label: 'MTN MoMo Business' },
    { value: 'Airtel Money', label: 'Airtel Money' },
    { value: 'Bank', label: 'Bank Transfer' },
    { value: 'Credit', label: 'Customer Credit (Unpaid)' }
  ]

  // Filtered sales
  const filteredSales = useMemo(() => {
    if (!searchQuery.trim()) return sales
    const q = searchQuery.toLowerCase().trim()
    return sales.filter(
      (s) =>
        (s.id || '').toLowerCase().includes(q) ||
        (s.customer || s.customerName || '').toLowerCase().includes(q) ||
        (s.productName || s.title || '').toLowerCase().includes(q) ||
        (s.paymentMethod || '').toLowerCase().includes(q)
    )
  }, [sales, searchQuery])

  // Open New Sale Drawer
  const handleOpenNewSale = () => {
    const defaultProd = finishedGoods[0]
    setSaleCustomerId('')
    setSaleCustomerName('Walk-in Customer')
    setSaleCustomerPhone('')
    setSaleProductId(defaultProd?.id || '')
    setSaleQuantity(1)
    setSalePrice(defaultProd?.sellingPriceRWF || 300)
    setSaleDiscount(0)
    setSalePaymentMethod('Cash')
    setSaleAmountPaid(defaultProd?.sellingPriceRWF || 300)
    setSaleDueDate('')
    setSaleNotes('')
    setShowMoreOptions(false)
    setNewSaleDrawerOpen(true)
  }

  // Submit Sale (FEFO Lot Deduction & Balance Tracking)
  const handleSaveSale = (keepOpen = false) => {
    if (!selectedProduct) {
      alert('Please select a finished product.')
      return
    }

    const qty = Number(saleQuantity) || 1
    const price = Number(salePrice) || 0
    const total = totalSaleAmount
    const paid = salePaymentMethod === 'Credit' ? (Number(saleAmountPaid) || 0) : total
    const balance = Math.max(0, total - paid)
    const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid'

    // FEFO: Deduct stock from finished goods
    if (onUpdateFinishedGoods) {
      const updated = finishedGoods.map((p) => {
        if (p.id === selectedProduct.id) {
          const newStock = Math.max(0, (Number(p.currentStock || p.stock || 0)) - qty)
          return { ...p, currentStock: newStock }
        }
        return p
      })
      onUpdateFinishedGoods(updated)
    }

    // New Sale Record
    const newSale = {
      id: `SALE-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      customer: saleCustomerName || 'Walk-in Customer',
      customerId: saleCustomerId || null,
      customerPhone: saleCustomerPhone || '',
      productId: selectedProduct.id,
      productName: selectedProduct.name || selectedProduct.title,
      batchCode: selectedProduct.batchCode || 'LOT-MAIN',
      quantity: qty,
      unit: selectedProduct.unit || 'pcs',
      unitPriceRWF: price,
      discountRWF: Number(saleDiscount) || 0,
      totalAmountRWF: total,
      amountPaidRWF: paid,
      balanceRWF: balance,
      paymentMethod: salePaymentMethod,
      dueDate: balance > 0 ? saleDueDate : null,
      status,
      costOfGoodsRWF: (selectedProduct.costPerUnitRWF || 180) * qty,
      profitRWF: total - (selectedProduct.costPerUnitRWF || 180) * qty
    }

    // Update customer debt if unpaid balance exists
    if (balance > 0 && onUpdateCustomers && saleCustomerName !== 'Walk-in Customer') {
      const existingCust = customers.find((c) => c.name === saleCustomerName || c.id === saleCustomerId)
      if (existingCust) {
        onUpdateCustomers(
          customers.map((c) =>
            c.id === existingCust.id ? { ...c, balanceRWF: (Number(c.balanceRWF || 0)) + balance } : c
          )
        )
      } else {
        onUpdateCustomers([
          ...customers,
          {
            id: `CUST-${Date.now()}`,
            name: saleCustomerName,
            phone: saleCustomerPhone,
            balanceRWF: balance,
            totalBoughtRWF: total
          }
        ])
      }
    }

    if (onUpdateSales) {
      onUpdateSales([newSale, ...sales])
    }

    if (addToast) {
      addToast({
        type: 'success',
        title: 'Sale Recorded',
        message: `Sale ${newSale.id} recorded (${formatRWF(total)}). Stock adjusted.`
      })
    }

    if (keepOpen) {
      handleOpenNewSale()
    } else {
      setNewSaleDrawerOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
              Sales · {activeSubPage}
            </span>
          </div>
          <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {activeSubPage === 'All Sales' ? 'Sales Ledger (Finished Goods)' : 'Sales Trends & Performance'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            {activeSubPage === 'All Sales'
              ? 'Record finished goods sales, apply FEFO lot deduction, and manage customer credit.'
              : 'Analyze sales velocity, top manufactured products, repeat clients, and growth trends.'}
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

          {activeSubPage === 'All Sales' && (
            <button
              type="button"
              onClick={handleOpenNewSale}
              className="btn-sapphire-clean px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4 text-[#9EDCFF]" />
              <span>+ New Sale</span>
            </button>
          )}
        </div>
      </div>

      {/* --- TRENDS SUBPAGE --- */}
      {activeSubPage === 'Sales Trends' ? (
        <SalesTrendsView sales={sales} formatRWF={formatRWF} />
      ) : (
        <>
          {/* 3-Number Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-orbitron uppercase text-[#9EDCFF]/70 tracking-wider">
                Today's Sales
              </span>
              <div className="font-orbitron text-2xl font-bold text-white">
                {formatRWF(summary.todaySales)}
              </div>
              <span className="text-[11px] text-slate-400">Total volume recorded today</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-orbitron uppercase text-[#218DFF] tracking-wider">
                This Month's Sales
              </span>
              <div className="font-orbitron text-2xl font-bold text-[#9EDCFF]">
                {formatRWF(summary.monthSales)}
              </div>
              <span className="text-[11px] text-slate-400">Gross finished goods turnover</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-[10px] font-orbitron uppercase text-amber-300/80 tracking-wider">
                Unpaid Credit Balance
              </span>
              <div className="font-orbitron text-2xl font-bold text-amber-400">
                {formatRWF(summary.unpaidBalance)}
              </div>
              <span className="text-[11px] text-slate-400">Tracked in Outstanding Balances</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sales by ID, customer, finished good, or payment..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#218DFF]"
            />
          </div>

          {/* Sales Table */}
          <div className="exbos-glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                    <th className="p-3.5 pl-5">Sale ID &amp; Date</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Finished Good Sold</th>
                    <th className="p-3.5 text-right">Quantity</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Balance</th>
                    <th className="p-3.5">Method</th>
                    <th className="p-3.5 pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No sales records found. Click "+ New Sale" to record a finished goods sale.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const total = Number(sale.totalAmountRWF || sale.amountRWF || sale.amount || 0)
                      const paid = Number(sale.amountPaidRWF ?? sale.amountRWF ?? total)
                      const balance = Math.max(0, total - paid)
                      const isUnpaid = balance > 0

                      return (
                        <tr
                          key={sale.id}
                          onClick={() => setDetailSale(sale)}
                          className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 pl-5">
                            <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors">
                              {sale.id}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {sale.date || (sale.createdAt ? sale.createdAt.slice(0, 10) : 'Today')}
                            </div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-200">
                            {sale.customer || sale.customerName || 'Walk-in'}
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-white">{sale.productName || sale.title}</span>
                            {sale.batchCode && (
                              <span className="block text-[10px] text-slate-500 font-mono">
                                Lot: {sale.batchCode}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-300">
                            {(sale.quantity || 1).toLocaleString()} {sale.unit || 'pcs'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-white">
                            {formatRWF(total)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-emerald-400">
                            {formatRWF(paid)}
                          </td>
                          <td className="p-3.5 text-right font-mono">
                            <span className={balance > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                              {formatRWF(balance)}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300 text-[11px]">
                            {sale.paymentMethod || 'Cash'}
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                !isUnpaid
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : paid > 0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {sale.status || (isUnpaid ? (paid > 0 ? 'Partial' : 'Unpaid') : 'Paid')}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- NEW SALE DRAWER (Finished Goods Only, FEFO Protection) --- */}
      {newSaleDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setNewSaleDrawerOpen(false)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Sales › New Sale
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">+ New Sale (Finished Goods)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setNewSaleDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Expired Lot Alert */}
              {isSelectedProductExpired && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Warning: Earliest lot for this product is past its best-before date!</span>
                </div>
              )}

              <div className="space-y-3.5 text-xs">
                {/* 1. Finished Product Picker (Finished Goods ONLY) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Finished Good *
                  </label>
                  <CustomSelect
                    value={saleProductId}
                    onChange={(val) => handleProductChange(val)}
                    options={productOptions}
                    placeholder="Select Finished Good"
                  />
                </div>

                {/* 2. Quantity & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={saleQuantity}
                      onChange={(e) => setSaleQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Unit Price (RWF)</label>
                    <input
                      type="number"
                      disabled={isCashier}
                      value={salePrice}
                      onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF] ${
                        isCashier ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                    {isCashier && <span className="text-[9px] text-slate-500">Locked for cashier role</span>}
                  </div>
                </div>

                {/* 3. Customer */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Customer</label>
                  <input
                    type="text"
                    value={saleCustomerName}
                    onChange={(e) => setSaleCustomerName(e.target.value)}
                    placeholder="Walk-in Customer, or enter name"
                    className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white focus:outline-none focus:border-[#218DFF]"
                  />
                </div>

                {/* 4. Payment Method & Amount Paid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                    <CustomSelect
                      value={salePaymentMethod}
                      onChange={(val) => {
                        setSalePaymentMethod(val)
                        if (val !== 'Credit') {
                          setSaleAmountPaid(totalSaleAmount)
                        } else {
                          setSaleAmountPaid('0')
                        }
                      }}
                      options={paymentOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Amount Paid (RWF)</label>
                    <input
                      type="number"
                      value={salePaymentMethod === 'Credit' ? saleAmountPaid : totalSaleAmount}
                      onChange={(e) => setSaleAmountPaid(e.target.value)}
                      disabled={salePaymentMethod !== 'Credit'}
                      className="w-full px-3 py-2 rounded-xl bg-[#040C26] border border-white/15 text-white font-mono focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                {/* Total Summary Box */}
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Total Sale Amount:</span>
                  <strong className="text-emerald-400 font-mono text-base font-bold">
                    {formatRWF(totalSaleAmount)}
                  </strong>
                </div>

                {/* More Options Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-[11px] text-[#9EDCFF] hover:underline font-semibold cursor-pointer"
                  >
                    {showMoreOptions ? '− Hide options' : '+ More options (Discount, Due date, Phone)'}
                  </button>
                </div>

                {showMoreOptions && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Discount (RWF)</label>
                        <input
                          type="number"
                          value={saleDiscount}
                          onChange={(e) => setSaleDiscount(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Customer Phone</label>
                        <input
                          type="tel"
                          value={saleCustomerPhone}
                          onChange={(e) => setSaleCustomerPhone(e.target.value)}
                          placeholder="+250 788 000 000"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#040C26] border border-white/15 text-white text-xs"
                        />
                      </div>
                    </div>

                    {salePaymentMethod === 'Credit' && (
                      <div>
                        <label className="block text-slate-400 text-[11px] mb-1">Credit Due Date</label>
                        <input
                          type="date"
                          value={saleDueDate}
                          onChange={(e) => setSaleDueDate(e.target.value)}
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
                onClick={() => handleSaveSale(false)}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Save Sale
              </button>
              <button
                type="button"
                onClick={() => handleSaveSale(true)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                Save &amp; Add Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SALE DETAIL PANEL (Row Click with Edit, Print, WhatsApp) --- */}
      {detailSale && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => setDetailSale(null)}
          />

          <div className="relative w-full max-w-md bg-[#071330] border-l border-white/15 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider block">
                    Sales Receipt #{detailSale.id}
                  </span>
                  <h3 className="font-orbitron text-xl font-bold text-white">
                    {detailSale.customer || 'Walk-in Customer'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailSale(null)}
                  className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white">{detailSale.date || 'Today'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Product:</span>
                  <strong className="text-white">{detailSale.productName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity Sold:</span>
                  <span className="font-mono text-white">{detailSale.quantity} {detailSale.unit || 'pcs'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount:</span>
                  <strong className="font-mono text-emerald-400 font-bold">
                    {formatRWF(detailSale.totalAmountRWF || detailSale.amountRWF || 0)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-mono text-white">{formatRWF(detailSale.amountPaidRWF || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Balance:</span>
                  <strong className="font-mono text-amber-400">
                    {formatRWF(detailSale.balanceRWF || 0)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method:</span>
                  <span className="text-slate-300">{detailSale.paymentMethod || 'Cash'}</span>
                </div>
              </div>
            </div>

            {/* Actions: Print Receipt, Send on WhatsApp, Close */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  printBusinessDocument({
                    id: detailSale.id,
                    type: 'Sale Receipt',
                    date: detailSale.date,
                    recipientName: detailSale.customer || 'Walk-in Customer',
                    recipientPhone: detailSale.customerPhone,
                    status: detailSale.status,
                    amount: detailSale.totalAmountRWF,
                    paidAmount: detailSale.paidAmountRWF,
                    outstandingAmount: Math.max(0, (detailSale.totalAmountRWF || 0) - (detailSale.paidAmountRWF || 0)),
                    items: [{
                      name: detailSale.productName,
                      quantity: detailSale.quantity,
                      unit: detailSale.unit || 'pcs',
                      unitPrice: detailSale.unitPriceRWF,
                      total: detailSale.totalAmountRWF
                    }],
                    notes: `Payment Method: ${detailSale.paymentMethod || 'Cash'} · Thank you for your business!`
                  }, {
                    businessName: 'Inyange Artisan Bakery',
                    tagline: 'Make & Sell Operations · Production & Bakery Division',
                    address: 'KG 17 Ave, Gasabo, Kigali, Rwanda',
                    phone: '+250 788 450 120',
                    email: 'bakery@inyange.rw',
                    taxId: 'TIN-109823471'
                  })
                }}
                className="flex-1 btn-sapphire-clean py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const phone = detailSale.customerPhone || '250788000000'
                  const text = encodeURIComponent(
                    `Hello ${detailSale.customer}, here is your receipt from Inyange Artisan Bakery: Sale #${detailSale.id} for ${formatRWF(detailSale.totalAmountRWF)}. Thank you!`
                  )
                  window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank')
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EXPORT DRAWER --- */}
      <ExportDrawer
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Sales Ledger Export"
        pageTitle="Sales · All Sales"
        data={filteredSales.map((s) => ({
          SaleID: s.id,
          Date: s.date || 'Today',
          Customer: s.customer || 'Walk-in',
          Product: s.productName,
          Quantity: `${s.quantity || 1} ${s.unit || 'pcs'}`,
          Total: formatRWF(s.totalAmountRWF || s.amountRWF || 0),
          Paid: formatRWF(s.amountPaidRWF || 0),
          Balance: formatRWF(s.balanceRWF || 0),
          Method: s.paymentMethod || 'Cash',
          Status: s.status || 'Paid'
        }))}
        columns={[
          { key: 'SaleID', label: 'Sale ID' },
          { key: 'Date', label: 'Date' },
          { key: 'Customer', label: 'Customer' },
          { key: 'Product', label: 'Finished Good' },
          { key: 'Quantity', label: 'Quantity' },
          { key: 'Total', label: 'Total Amount' },
          { key: 'Paid', label: 'Paid' },
          { key: 'Balance', label: 'Balance' },
          { key: 'Method', label: 'Payment Method' },
          { key: 'Status', label: 'Status' }
        ]}
        businessName="Inyange Artisan Bakery & Roastery"
      />
    </div>
  )
}

