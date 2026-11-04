import React, { useState, useMemo, useRef } from "react";
import {
  Boxes,
  Clock,
  AlertOctagon,
  Plus,
  Search,
  PackageCheck,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  X
} from "lucide-react";
import { formatRWF } from "../../../utils/currencyWords";
import { renderBarcodeSvg } from "../../../utils/barcodeUtils";
import DeleteConfirmModal from "../../common/DeleteConfirmModal";

function getStockExpiryMeta(expiryDate) {
  if (!expiryDate) {
    return {
      status: 'none',
      label: '—',
      sublabel: 'Non-perishable',
      days: null,
      badgeClass: 'text-slate-400 bg-white/5 border-white/10'
    }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expiryDate)
  exp.setHours(0, 0, 0, 0)

  if (isNaN(exp.getTime())) {
    return {
      status: 'none',
      label: String(expiryDate),
      sublabel: '',
      days: null,
      badgeClass: 'text-slate-400 bg-white/5 border-white/10'
    }
  }

  const diffTime = exp.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      sublabel: 'Do Not Sell',
      days: diffDays,
      badgeClass: 'text-rose-300 bg-rose-500/20 border-rose-500/40 font-bold'
    }
  }
  if (diffDays <= 30) {
    return {
      status: 'expiring-soon',
      label: diffDays === 0 ? 'Expires Today' : `Expiring in ${diffDays}d`,
      sublabel: '30-Day Alert',
      days: diffDays,
      badgeClass: 'text-amber-300 bg-amber-500/20 border-amber-500/40 font-bold'
    }
  }
  return {
    status: 'good',
    label: `Valid (${diffDays}d left)`,
    sublabel: 'Safe Shelf Life',
    days: diffDays,
    badgeClass: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
  }
}

function StockLinesView({
  currentArch,
  inventory = [],
  hideFinancials,
  formatRWF,
  onReceiveStock,
  onViewStockLine,
  onEditStockLine,
  onDeleteStockLine
}) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'expiring-soon' | 'expired'
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null)

  const processedLines = useMemo(() => {
    return (inventory || []).map((item) => {
      const qty = Number(item.quantity) || 0
      const purchasePrice = Number(item.purchasePriceRWF ?? item.unitCostRWF) || 0
      const sellingPrice = Number(item.sellingPriceRWF) || (purchasePrice > 0 ? Math.round(purchasePrice * 1.25) : 0)
      const stockValue = qty * purchasePrice
      const expiry = getStockExpiryMeta(item.expiryDate)
      const lowAlert = Number(item.lowStockAlert) || 5
      const isLowStock = qty <= lowAlert

      return {
        ...item,
        qty,
        purchasePrice,
        sellingPrice,
        stockValue,
        expiry,
        isLowStock,
        unitLabel: item.unit || 'unit',
        supplierLabel: item.supplierName || item.supplier || '—',
        receivedDate: item.dateReceived || item.date || '—'
      }
    })
  }, [inventory])

  const totalStockValue = useMemo(() => {
    return processedLines.reduce((sum, item) => sum + item.stockValue, 0)
  }, [processedLines])

  const expiringSoonCount = useMemo(() => {
    return processedLines.filter((item) => item.expiry.status === 'expiring-soon').length
  }, [processedLines])

  const expiredCount = useMemo(() => {
    return processedLines.filter((item) => item.expiry.status === 'expired').length
  }, [processedLines])

  const categories = useMemo(() => {
    const set = new Set(processedLines.map((i) => i.category).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [processedLines])

  const suppliers = useMemo(() => {
    const set = new Set(processedLines.map((i) => i.supplierLabel).filter((s) => s && s !== '—'))
    return ['all', ...Array.from(set)]
  }, [processedLines])

  const filteredLines = useMemo(() => {
    return processedLines.filter((item) => {
      if (activeTab === 'expiring-soon' && item.expiry.status !== 'expiring-soon') return false
      if (activeTab === 'expired' && item.expiry.status !== 'expired') return false

      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (supplierFilter !== 'all' && item.supplierLabel !== supplierFilter) return false

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(term)
        const matchBarcode = item.barcode?.toLowerCase().includes(term)
        const matchSku = item.sku?.toLowerCase().includes(term)
        const matchSupplier = item.supplierLabel?.toLowerCase().includes(term)
        const matchCat = item.category?.toLowerCase().includes(term)
        if (!matchTitle && !matchBarcode && !matchSku && !matchSupplier && !matchCat) return false
      }

      return true
    })
  }, [processedLines, activeTab, categoryFilter, supplierFilter, searchTerm])

  return (
    <div className="space-y-6">
      {/* 1. 3-Number Summary Strip (Page Pattern 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Stock Value */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9EDCFF] flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Total Stock Value</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[10px] font-bold text-[#9EDCFF] border border-[#218DFF]/30">
              Asset Valuation
            </span>
          </div>
          <div className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white pt-2">
            {formatRWF(totalStockValue, hideFinancials)}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>On-hand stock at purchase cost</span>
            <span className="text-[#9EDCFF] font-bold font-mono">{processedLines.length} Batches</span>
          </div>
        </div>

        {/* Metric 2: Items Expiring in 30 Days */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Expiring in 30 Days</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              expiringSoonCount > 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-white/5 text-slate-400'
            }`}>
              30-Day Alert
            </span>
          </div>
          <div className={`font-orbitron text-2xl sm:text-3xl font-extrabold pt-2 ${
            expiringSoonCount > 0 ? 'text-amber-300' : 'text-white'
          }`}>
            {expiringSoonCount} {expiringSoonCount === 1 ? 'Batch' : 'Batches'}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Urgent stock to sell / promo</span>
            <span className={expiringSoonCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {expiringSoonCount > 0 ? 'Action Recommended' : 'All Batches Safe'}
            </span>
          </div>
        </div>

        {/* Metric 3: Expired Items */}
        <div className="exbos-glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Expired Items</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              expiredCount > 0 ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              {expiredCount > 0 ? 'Do Not Sell' : 'Zero Expired'}
            </span>
          </div>
          <div className={`font-orbitron text-2xl sm:text-3xl font-extrabold pt-2 ${
            expiredCount > 0 ? 'text-rose-400' : 'text-emerald-300'
          }`}>
            {expiredCount} {expiredCount === 1 ? 'Batch' : 'Batches'}
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs text-slate-300">
            <span>Past safe shelf expiration</span>
            <span className={expiredCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {expiredCount > 0 ? 'Remove from Shelf' : '100% Shelf Fresh'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Stock Lines Card */}
      <div className="exbos-glass-card p-5 sm:p-6 space-y-4">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/40 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider">
                02 · Buy &amp; Sell · Products (Stock)
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {currentArch?.name || 'Buy & Sell'}
              </span>
            </div>
            <h3 className="font-orbitron text-lg sm:text-xl font-extrabold text-white mt-1">
              Stock Lines &amp; Batch Valuation
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Organized batch-level records, purchase cost valuation, supplier trace, and 30-day expiration tracking.
            </p>
          </div>

          <button
            type="button"
            onClick={onReceiveStock}
            className="btn-sapphire-clean px-4 py-2.5 text-xs font-bold inline-flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-3.5 h-3.5 text-[#9EDCFF]" />
            <span>+ Receive Stock</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
          {/* Filter Tabs: All, Expiring Soon (30d), Expired */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#218DFF] text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              All ({processedLines.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expiring-soon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'expiring-soon'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                  : 'text-amber-300 hover:bg-white/5'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Expiring Soon (30d) ({expiringSoonCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expired')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'expired'
                  ? 'bg-rose-500 text-white font-extrabold shadow-md'
                  : 'text-rose-300 hover:bg-white/5'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Expired ({expiredCount})</span>
            </button>
          </div>

          {/* Search + Category & Supplier Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#218DFF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search stock, SKU, barcode..."
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="w-full pl-8 pr-7 py-2 rounded-xl exbos-modal-input text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Dropdown Filter */}
            {categories.length > 2 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="px-2.5 py-2 rounded-xl exbos-modal-input text-xs text-[#9EDCFF] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.filter((c) => c !== 'all').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Supplier Dropdown Filter */}
            {suppliers.length > 2 && (
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                style={{ backgroundColor: '#071644', color: '#ffffff' }}
                className="px-2.5 py-2 rounded-xl exbos-modal-input text-xs text-[#9EDCFF] font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">All Suppliers</option>
                {suppliers.filter((s) => s !== 'all').map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 3. Stock Lines Table (Desktop) */}
        {filteredLines.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white/5 rounded-2xl border border-white/10 space-y-2">
            <PackageCheck className="w-8 h-8 text-[#218DFF] mx-auto" />
            <p className="font-semibold text-white">No stock lines match your current filter.</p>
            <p className="text-slate-400">
              {activeTab === 'expiring-soon'
                ? 'Great news! You have zero products expiring in the next 30 days.'
                : activeTab === 'expired'
                ? 'Zero expired stock detected on your shelves.'
                : 'Click "+ Receive Stock" to register new supplier batches into inventory.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3 text-center">Quantity Left</th>
                  <th className="py-3 px-3 text-right">Purchase Price</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">Stock Value</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Date Received</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filteredLines.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/5 transition-colors group">
                    {/* 1. Product Name */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white group-hover:text-[#9EDCFF] transition-colors flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.isLowStock && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {item.category && (
                            <span className="px-1.5 py-0.2 rounded bg-white/5 text-slate-300">
                              {item.category}
                            </span>
                          )}
                          {(item.barcode || item.sku) && (
                            <span className="font-mono text-slate-500">
                              {item.barcode || item.sku}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Quantity Left */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-orbitron font-bold text-sm text-white">
                        {item.qty}
                      </span>{' '}
                      <span className="text-[10px] text-[#9EDCFF] font-semibold uppercase">
                        {item.unitLabel}
                      </span>
                    </td>

                    {/* 3. Purchase Price (per unit) */}
                    <td className="py-3 px-3 text-right font-orbitron font-semibold text-slate-300">
                      {formatRWF(item.purchasePrice, hideFinancials)}
                    </td>

                    {/* 4. Expiry Date (blank if none) */}
                    <td className="py-3 px-3">
                      {item.expiry.status === 'none' ? (
                        <span className="text-slate-400 text-[11px]">—</span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border ${item.expiry.badgeClass}`}>
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span>{item.expiry.label}</span>
                        </span>
                      )}
                    </td>

                    {/* 5. Selling Price */}
                    <td className="py-3 px-3 text-right font-orbitron font-bold text-white">
                      {formatRWF(item.sellingPrice, hideFinancials)}
                    </td>

                    {/* 6. Stock Value (quantity × purchase price) */}
                    <td className="py-3 px-3 text-right font-orbitron font-extrabold text-[#9EDCFF]">
                      {formatRWF(item.stockValue, hideFinancials)}
                    </td>

                    {/* 7. Supplier */}
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[150px]" title={item.supplierLabel}>
                      {item.supplierLabel}
                    </td>

                    {/* 8. Date Received */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {item.receivedDate}
                    </td>

                    {/* 9. Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewStockLine(item)}
                          title="View Batch Details"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#218DFF]/25 border border-white/15 hover:border-[#9EDCFF]/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9EDCFF] group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditStockLine(item)}
                          title="Edit Stock Line"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#218DFF]/25 border border-white/15 hover:border-[#218DFF]/60 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#218DFF] group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmItem(item)}
                          title="Delete Stock Line"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/25 border border-white/15 hover:border-rose-400/60 text-slate-300 hover:text-rose-300 transition-all cursor-pointer shadow-sm group"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmItem}
        onClose={() => setDeleteConfirmItem(null)}
        title="Delete Stock Line"
        itemName={deleteConfirmItem?.title || deleteConfirmItem?.batchCode || 'Stock Line'}
        description={`Are you sure you want to permanently delete this stock line? This will remove the inventory lot from your records.`}
        confirmText="Delete Stock Line"
        onConfirm={() => {
          if (deleteConfirmItem && onDeleteStockLine) {
            onDeleteStockLine(deleteConfirmItem)
          }
          setDeleteConfirmItem(null)
        }}
      />
    </div>
  )
}


export default StockLinesView;
