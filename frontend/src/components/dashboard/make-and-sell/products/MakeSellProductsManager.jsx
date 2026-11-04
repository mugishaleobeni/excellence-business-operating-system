import React, { useState, useMemo } from 'react'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Search,
  Filter,
  Layers,
  X,
  History,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import { formatRWF } from '../../../../utils/currencyWords'
import {
  DEFAULT_RAW_MATERIALS,
  DEFAULT_FINISHED_PRODUCTS
} from '../data/makeSellDefaults'

export default function MakeSellProductsManager({
  activePage = 'All Products',
  onSubpageChange = null,
  activeArchId = 'make-and-sell',
  hideFinancials = false,
  addToast = null
}) {
  // Raw materials & Finished products state
  const [rawMaterials, setRawMaterials] = useState(DEFAULT_RAW_MATERIALS)
  const [finishedProducts, setFinishedProducts] = useState(DEFAULT_FINISHED_PRODUCTS)
  const [stockMovements, setStockMovements] = useState([
    {
      id: 'SM-101',
      date: '2026-10-30',
      item: 'Azania Premium Wheat Flour',
      type: 'Consumption',
      quantity: -40,
      unit: 'kg',
      reason: 'Batch #408 Brioche Loaves Production',
      balanceAfter: 180
    },
    {
      id: 'SM-102',
      date: '2026-10-30',
      item: 'Golden Sliced Bread (Standard 800g)',
      type: 'Production In',
      quantity: +100,
      unit: 'pcs',
      reason: 'Completed Batch #408',
      balanceAfter: 85
    },
    {
      id: 'SM-103',
      date: '2026-10-29',
      item: 'Unsalted Dairy Butter Blocks',
      type: 'Purchase Receipt',
      quantity: +25,
      unit: 'kg',
      reason: 'Supplier Delivery from Blessed Dairies',
      balanceAfter: 12
    }
  ])

  // Modals state
  const [rawModalOpen, setRawModalOpen] = useState(false)
  const [editingRaw, setEditingRaw] = useState(null)
  const [finishedModalOpen, setFinishedModalOpen] = useState(false)
  const [editingFinished, setEditingFinished] = useState(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustItem, setAdjustItem] = useState(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [adjustReason, setAdjustReason] = useState('Stock Count Audit')

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Raw Material Form State (Part 4)
  const [rawName, setRawName] = useState('')
  const [rawCategory, setRawCategory] = useState('Grains & Flours')
  const [rawPrice, setRawPrice] = useState(880)
  const [rawUnit, setRawUnit] = useState('kg')
  const [rawOpeningQty, setRawOpeningQty] = useState(100)
  const [rawSupplier, setRawSupplier] = useState('')
  const [rawMinStock, setRawMinStock] = useState(20)
  const [rawExpiry, setRawExpiry] = useState('')
  const [rawDesc, setRawDesc] = useState('')

  // Finished Product Form State (Part 5)
  const [fpName, setFpName] = useState('')
  const [fpCategory, setFpCategory] = useState('Daily Bread')
  const [fpSku, setFpSku] = useState('')
  const [fpUnit, setFpUnit] = useState('pcs')
  const [fpSellingPrice, setFpSellingPrice] = useState(1400)
  const [fpCost, setFpCost] = useState(980)
  const [fpMinStock, setFpMinStock] = useState(20)
  const [fpDesc, setFpDesc] = useState('')

  // Calculate live margin preview in Finished Product form
  const fpProfit = Math.max(0, fpSellingPrice - fpCost)
  const fpMargin = fpSellingPrice > 0 ? Number(((fpProfit / fpSellingPrice) * 100).toFixed(1)) : 0

  // Open Raw Material Form
  const openRawModal = (raw = null) => {
    setEditingRaw(raw)
    if (raw) {
      setRawName(raw.name || '')
      setRawCategory(raw.category || 'Grains & Flours')
      setRawPrice(raw.purchasePriceRWF || 0)
      setRawUnit(raw.unit || 'kg')
      setRawOpeningQty(raw.currentStock || 0)
      setRawSupplier(raw.supplier || '')
      setRawMinStock(raw.minimumStockLevel || 10)
      setRawExpiry(raw.expiryDate || '')
      setRawDesc(raw.description || '')
    } else {
      setRawName('')
      setRawCategory('Grains & Flours')
      setRawPrice(1000)
      setRawUnit('kg')
      setRawOpeningQty(50)
      setRawSupplier('')
      setRawMinStock(10)
      setRawExpiry('')
      setRawDesc('')
    }
    setRawModalOpen(true)
  }

  // Open Finished Product Form
  const openFinishedModal = (fp = null) => {
    setEditingFinished(fp)
    if (fp) {
      setFpName(fp.name || '')
      setFpCategory(fp.category || 'Daily Bread')
      setFpSku(fp.sku || '')
      setFpUnit(fp.unit || 'pcs')
      setFpSellingPrice(fp.sellingPriceRWF || 1400)
      setFpCost(fp.unitProductionCostRWF || 980)
      setFpMinStock(fp.minimumStock || 20)
      setFpDesc(fp.description || '')
    } else {
      setFpName('')
      setFpCategory('Daily Bread')
      setFpSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)
      setFpUnit('pcs')
      setFpSellingPrice(1500)
      setFpCost(1000)
      setFpMinStock(20)
      setFpDesc('')
    }
    setFinishedModalOpen(true)
  }

  // Handle Save Raw Material
  const handleSaveRaw = (e) => {
    e.preventDefault()
    if (!rawName.trim()) return

    const newRaw = {
      id: editingRaw?.id || `MAT-${Date.now().toString().slice(-4)}`,
      name: rawName.trim(),
      category: rawCategory,
      purchasePriceRWF: Number(rawPrice) || 0,
      unit: rawUnit,
      currentStock: Number(rawOpeningQty) || 0,
      minimumStockLevel: Number(rawMinStock) || 0,
      supplier: rawSupplier || 'Default Supplier',
      expiryDate: rawExpiry,
      description: rawDesc
    }

    setRawMaterials((prev) => {
      const idx = prev.findIndex((m) => m.id === newRaw.id)
      if (idx >= 0) {
        const u = [...prev]
        u[idx] = newRaw
        return u
      }
      return [newRaw, ...prev]
    })

    setRawModalOpen(false)
    if (addToast) {
      addToast({
        type: 'success',
        title: editingRaw ? 'Raw Material Updated' : 'Raw Material Registered',
        message: `Saved "${newRaw.name}" with initial stock ${newRaw.currentStock} ${newRaw.unit}.`
      })
    }
  }

  // Handle Save Finished Product
  const handleSaveFinished = (e) => {
    e.preventDefault()
    if (!fpName.trim()) return

    const newFp = {
      id: editingFinished?.id || `FP-${Date.now().toString().slice(-4)}`,
      name: fpName.trim(),
      category: fpCategory,
      sku: fpSku,
      unit: fpUnit,
      sellingPriceRWF: Number(fpSellingPrice) || 0,
      unitProductionCostRWF: Number(fpCost) || 0,
      minimumStock: Number(fpMinStock) || 0,
      currentStock: editingFinished ? editingFinished.currentStock : 0,
      description: fpDesc
    }

    setFinishedProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === newFp.id)
      if (idx >= 0) {
        const u = [...prev]
        u[idx] = newFp
        return u
      }
      return [newFp, ...prev]
    })

    setFinishedModalOpen(false)
    if (addToast) {
      addToast({
        type: 'success',
        title: editingFinished ? 'Product Updated' : 'Finished Product Created',
        message: `Registered "${newFp.name}" with selling price ${formatRWF(newFp.sellingPriceRWF)} (${fpMargin}% margin).`
      })
    }
  }

  // Handle Stock Adjustment
  const handleConfirmAdjustment = (e) => {
    e.preventDefault()
    if (!adjustItem) return

    const diff = Number(adjustQty) || 0
    if (adjustItem.isRaw) {
      setRawMaterials((prev) =>
        prev.map((m) =>
          m.id === adjustItem.id
            ? { ...m, currentStock: Math.max(0, m.currentStock + diff) }
            : m
        )
      )
    } else {
      setFinishedProducts((prev) =>
        prev.map((p) =>
          p.id === adjustItem.id
            ? { ...p, currentStock: Math.max(0, (p.currentStock || 0) + diff) }
            : p
        )
      )
    }

    setStockMovements((prev) => [
      {
        id: `SM-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().slice(0, 10),
        item: adjustItem.name,
        type: diff >= 0 ? 'Adjustment (+)' : 'Adjustment (-)',
        quantity: diff,
        unit: adjustItem.unit,
        reason: adjustReason,
        balanceAfter: Math.max(0, (adjustItem.currentStock || 0) + diff)
      },
      ...prev
    ])

    setAdjustModalOpen(false)
    setAdjustItem(null)
    if (addToast) {
      addToast({
        type: 'info',
        title: 'Stock Adjusted',
        message: `Recorded ${diff >= 0 ? `+${diff}` : diff} ${adjustItem.unit} for ${adjustItem.name}.`
      })
    }
  }

  // Filter raw materials
  const filteredRaw = rawMaterials.filter((m) => {
    const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'All' || m.category === categoryFilter
    return matchSearch && matchCat
  })

  // Filter finished products
  const filteredFinished = finishedProducts.filter((p) => {
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter
    return matchSearch && matchCat
  })

  // Low stock list
  const lowStockItems = [
    ...rawMaterials.filter((m) => m.currentStock <= (m.minimumStockLevel || 10)).map((m) => ({ ...m, isRaw: true })),
    ...finishedProducts.filter((p) => (p.currentStock || 0) <= (p.minimumStock || 10)).map((p) => ({ ...p, isRaw: false }))
  ]

  // Decide what view to show based on subpage
  const showRawOnly = activePage === 'Raw Materials'
  const showFinishedOnly = activePage === 'Finished Products'
  const showMovementsOnly = activePage === 'Stock Movements'
  const showAdjustmentsOnly = activePage === 'Stock Adjustments'
  const showLowStockOnly = activePage === 'Low Stock Alerts'

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-tight">
            Products &amp; Stock Management
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Separates raw manufacturing materials from sellable finished goods, with inventory valuation and stock movement audit.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openRawModal()}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 text-[#218DFF]" />
            <span>Add Raw Material</span>
          </button>

          <button
            type="button"
            onClick={() => openFinishedModal()}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Finished Product</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search materials or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white placeholder-slate-400 focus:outline-none w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="Grains & Flours">Grains &amp; Flours</option>
            <option value="Sweeteners">Sweeteners</option>
            <option value="Dairy">Dairy</option>
            <option value="Oils & Fats">Oils &amp; Fats</option>
            <option value="Daily Bread">Daily Bread</option>
            <option value="Artisan Pastry">Artisan Pastry</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: RAW MATERIALS TABLE (Part 4) */}
      {(!showFinishedOnly && !showMovementsOnly && !showAdjustmentsOnly && !showLowStockOnly) && (
        <div className="exbos-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h4 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                Raw Materials Inventory
              </h4>
              <p className="text-[11px] text-slate-400">
                Purchased ingredients and packaging used in the production process.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredRaw.length} raw materials
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Available Qty</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3 text-right">Latest Purchase Price</th>
                  <th className="py-2.5 px-3 text-right">Inventory Value</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3 text-center">Stock Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRaw.map((mat) => {
                  const invValue = Math.round(mat.currentStock * mat.purchasePriceRWF)
                  const isLow = mat.currentStock <= (mat.minimumStockLevel || 10)

                  return (
                    <tr key={mat.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {mat.name}
                        {mat.packageSize > 0 && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Package: {mat.packageSize} {mat.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{mat.category}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        isLow ? 'text-amber-300' : 'text-white'
                      }`}>
                        {mat.currentStock}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono">{mat.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatRWF(mat.purchasePriceRWF, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatRWF(invValue, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[140px]">
                        {mat.supplier}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isLow ? 'Low Stock' : 'Optimal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openRawModal(mat)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Edit Material"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#218DFF]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustItem({ ...mat, isRaw: true })
                              setAdjustQty(0)
                              setAdjustReason('Physical Count Audit')
                              setAdjustModalOpen(true)
                            }}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300 cursor-pointer"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: FINISHED PRODUCTS TABLE (Part 5) */}
      {(!showRawOnly && !showMovementsOnly && !showAdjustmentsOnly && !showLowStockOnly) && (
        <div className="exbos-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h4 className="font-orbitron text-sm font-bold text-white uppercase tracking-wider">
                Finished Products (Ready for Sale)
              </h4>
              <p className="text-[11px] text-slate-400">
                Manufactured goods available on shelf with true production costs and selling margins.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {filteredFinished.length} finished goods
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Available Stock</th>
                  <th className="py-2.5 px-3 text-right">Production Cost</th>
                  <th className="py-2.5 px-3 text-right">Selling Price</th>
                  <th className="py-2.5 px-3 text-right">Gross Profit / Unit</th>
                  <th className="py-2.5 px-3 text-right">Gross Margin</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFinished.map((prod) => {
                  const cost = Number(prod.unitProductionCostRWF || 0)
                  const price = Number(prod.sellingPriceRWF || 0)
                  const profit = price - cost
                  const margin = price > 0 ? Number(((profit / price) * 100).toFixed(1)) : 0
                  const isLow = (prod.currentStock || 0) <= (prod.minimumStock || 10)

                  return (
                    <tr key={prod.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {prod.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{prod.category}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{prod.sku || '—'}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        isLow ? 'text-amber-300' : 'text-white'
                      }`}>
                        {prod.currentStock || 0} {prod.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        {formatRWF(cost, hideFinancials)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatRWF(price, hideFinancials)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                        profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {profit >= 0 ? `+${formatRWF(profit, hideFinancials)}` : `-${formatRWF(Math.abs(profit), hideFinancials)}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {margin}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isLow
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openFinishedModal(prod)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#218DFF]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustItem({ ...prod, isRaw: false })
                              setAdjustQty(0)
                              setAdjustReason('Physical Count Audit')
                              setAdjustModalOpen(true)
                            }}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-emerald-300 cursor-pointer"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STOCK MOVEMENTS LOG */}
      {(showMovementsOnly || activePage === 'Stock Movements') && (
        <div className="exbos-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h4 className="font-orbitron text-sm font-bold text-white">
              Stock Movement Audit Log
            </h4>
            <span className="text-xs font-mono text-slate-400">
              {stockMovements.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-slate-400 font-orbitron uppercase text-[10px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Item / Material</th>
                  <th className="py-2.5 px-3">Movement Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity Change</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3">Reason / Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-300">{mov.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{mov.item}</td>
                    <td className="py-2.5 px-3 text-slate-300">{mov.type}</td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      mov.quantity > 0 ? 'text-emerald-400' : 'text-amber-300'
                    }`}>
                      {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} {mov.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white">
                      {mov.balanceAfter} {mov.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{mov.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: LOW STOCK ALERTS */}
      {(showLowStockOnly || activePage === 'Low Stock Alerts') && (
        <div className="exbos-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h4 className="font-orbitron text-sm font-bold text-white">
                Low Stock Warning Center
              </h4>
            </div>
            <span className="text-xs font-mono text-amber-300">
              {lowStockItems.length} items requiring attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                      {item.isRaw ? 'Raw Material' : 'Finished Good'}
                    </span>
                    <strong className="text-sm text-white">{item.name}</strong>
                  </div>
                  <span className="text-xs text-slate-300 block">
                    Current: <strong className="text-amber-300">{item.currentStock} {item.unit}</strong> (Min: {item.minimumStockLevel || item.minimumStock} {item.unit})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openRawModal(item.isRaw ? item : null)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 cursor-pointer"
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAW MATERIAL MODAL (Part 4) */}
      {rawModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRawModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="font-orbitron text-lg font-extrabold text-white">
                {editingRaw ? 'Edit Raw Material' : 'Register Raw Material'}
              </h3>
              <button
                type="button"
                onClick={() => setRawModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRaw} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Material Name *</label>
                <input
                  type="text"
                  required
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  placeholder="e.g. Azania Wheat Flour"
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Category *</label>
                  <select
                    value={rawCategory}
                    onChange={(e) => setRawCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                  >
                    <option value="Grains & Flours">Grains &amp; Flours</option>
                    <option value="Sweeteners">Sweeteners</option>
                    <option value="Leavening Agents">Leavening Agents</option>
                    <option value="Oils & Fats">Oils &amp; Fats</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Seasonings">Seasonings</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Unit of Measurement *</label>
                  <select
                    value={rawUnit}
                    onChange={(e) => setRawUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <optgroup label="Length &amp; Distance" className="bg-[#071644] text-slate-300 font-bold">
                      <option value="m">Meters (m)</option>
                      <option value="cm">Centimeters (cm)</option>
                      <option value="mm">Millimeters (mm)</option>
                      <option value="yd">Yards (yd)</option>
                      <option value="ft">Feet (ft)</option>
                    </optgroup>
                    <optgroup label="Weight &amp; Mass" className="bg-[#071644] text-slate-300 font-bold">
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="mg">Milligrams (mg)</option>
                      <option value="ton">Tons (t)</option>
                    </optgroup>
                    <optgroup label="Volume &amp; Liquids" className="bg-[#071644] text-slate-300 font-bold">
                      <option value="L">Liters (L)</option>
                      <option value="ml">Milliliters (ml)</option>
                    </optgroup>
                    <optgroup label="Count, Sheets &amp; Packaging" className="bg-[#071644] text-slate-300 font-bold">
                      <option value="pcs">Pieces (pcs)</option>
                      <option value="packs">Packs</option>
                      <option value="bags">Bags / Sacks</option>
                      <option value="boxes">Boxes</option>
                      <option value="rolls">Rolls</option>
                      <option value="sheets">Sheets</option>
                      <option value="bundles">Bundles</option>
                    </optgroup>
                    <optgroup label="Area &amp; Surface" className="bg-[#071644] text-slate-300 font-bold">
                      <option value="sqm">Square Meters (m²)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Purchase Price (RWF) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rawPrice}
                    onChange={(e) => setRawPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Opening Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={rawOpeningQty}
                    onChange={(e) => setRawOpeningQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Minimum Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={rawMinStock}
                    onChange={(e) => setRawMinStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Primary Supplier</label>
                <input
                  type="text"
                  value={rawSupplier}
                  onChange={(e) => setRawSupplier(e.target.value)}
                  placeholder="e.g. Bakhresa Grain Milling"
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRawModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white cursor-pointer shadow-md transition-all"
                >
                  Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINISHED PRODUCT MODAL (Part 5) */}
      {finishedModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setFinishedModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="font-orbitron text-lg font-extrabold text-white">
                {editingFinished ? 'Edit Finished Product' : 'Register Finished Product'}
              </h3>
              <button
                type="button"
                onClick={() => setFinishedModalOpen(false)}
                className="p-1 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinished} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#9EDCFF]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={fpName}
                  onChange={(e) => setFpName(e.target.value)}
                  placeholder="e.g. Golden Sliced Bread (Standard 800g)"
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none focus:border-[#218DFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Category *</label>
                  <select
                    value={fpCategory}
                    onChange={(e) => setFpCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                  >
                    <option value="Daily Bread">Daily Bread</option>
                    <option value="Artisan Pastry">Artisan Pastry</option>
                    <option value="Cakes & Confectionery">Cakes &amp; Confectionery</option>
                    <option value="Snacks & Savory">Snacks &amp; Savory</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Unit of Sale</label>
                  <input
                    type="text"
                    value={fpUnit}
                    onChange={(e) => setFpUnit(e.target.value)}
                    placeholder="pcs, loaves, boxes"
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#9EDCFF]">Selling Price (RWF) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fpSellingPrice}
                    onChange={(e) => setFpSellingPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-400">Unit Production Cost (RWF)</label>
                  <input
                    type="number"
                    min="0"
                    value={fpCost}
                    onChange={(e) => setFpCost(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs font-mono font-bold text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Immediate Profit Impact Box (Part 5) */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Gross Profit</span>
                  <strong className="font-orbitron text-sm text-emerald-400">
                    +{formatRWF(fpProfit)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Profit Margin</span>
                  <strong className="font-orbitron text-sm text-emerald-400">
                    {fpMargin}%
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setFinishedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3ba0ff] hover:to-[#1653e6] text-xs font-bold text-white cursor-pointer shadow-md transition-all"
                >
                  Save Finished Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {adjustModalOpen && adjustItem && (
        <div
          className="fixed inset-0 z-50 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setAdjustModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0B215E] via-[#071644] to-[#040C26] border-2 border-[#218DFF]/40 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-orbitron text-base font-bold text-white">
                Adjust Stock: {adjustItem.name}
              </h3>
              <button
                type="button"
                onClick={() => setAdjustModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Quantity Change (+ to add, - to deduct):
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. -5 or +10"
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-sm font-mono font-bold text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">
                  Current Stock: {adjustItem.currentStock} {adjustItem.unit}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Adjustment Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#071644] border border-white/20 text-xs text-white focus:outline-none"
                >
                  <option value="Physical Count Audit">Physical Count Audit</option>
                  <option value="Damaged / Spoiled Goods">Damaged / Spoiled Goods</option>
                  <option value="Unrecorded Internal Use">Unrecorded Internal Use</option>
                  <option value="Supplier Replacement">Supplier Replacement</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#218DFF] hover:bg-[#3ba0ff] text-xs font-bold text-white shadow-md"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

