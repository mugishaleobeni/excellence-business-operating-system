import React, { useState, useMemo, useEffect, useRef } from 'react'
import { formatRWF } from '../../utils/currencyWords'
import {
  Search,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Truck
} from 'lucide-react'
import DeleteConfirmModal from '../common/DeleteConfirmModal'

/**
 * Universal Responsive Table Component
 * - Clean solid glass styling (no gradient on buttons)
 * - True responsive layout: full table on large screens, card rows on mobile/tablet (no awkward horizontal scrollbar)
 * - Matching user reference image
 */
export default function UniversalModuleTable({
  title,
  subtitle,
  columns = [],
  data = [],
  onAddNew,
  addNewLabel = 'New Entry',
  onViewRow,
  onEditRow,
  onDeleteRow,
  onReorderRow,
  hideFinancials = false,
  emptyMessage = 'No records recorded yet for this view.'
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('ALL')
  const [sortKey, setSortKey] = useState('')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(1)
  const [openActionRowId, setOpenActionRowId] = useState(null)
  const [deleteConfirmRow, setDeleteConfirmRow] = useState(null)
  const actionsRef = useRef(null)
  const pageSize = 8

  // Close actions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setOpenActionRowId(null)
      }
    }
    if (openActionRowId !== null) {
      document.addEventListener('pointerdown', handleOutsideClick)
      return () => document.removeEventListener('pointerdown', handleOutsideClick)
    }
  }, [openActionRowId])

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    const set = new Set()
    data.forEach((row) => {
      if (row.category) set.add(row.category)
      if (row.status) set.add(row.status)
    })
    return Array.from(set)
  }, [data])

  // Filtered & Sorted Rows
  const processedData = useMemo(() => {
    let list = [...data]

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      list = list.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(q)
        )
      )
    }

    // Category filter
    if (filterCategory !== 'ALL') {
      list = list.filter(
        (row) => row.category === filterCategory || row.status === filterCategory
      )
    }

    // Sort
    if (sortKey) {
      list.sort((a, b) => {
        const valA = a[sortKey]
        const valB = b[sortKey]
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA
        }
        return sortAsc
          ? String(valA || '').localeCompare(String(valB || ''))
          : String(valB || '').localeCompare(String(valA || ''))
      })
    }

    return list
  }, [data, searchTerm, filterCategory, sortKey, sortAsc])

  // ExBOS Page Pattern 1: 3-Number Summary Strip
  const summaryStrip = useMemo(() => {
    const totalCount = data.length
    let totalVal = 0
    let alertCount = 0

    data.forEach((r) => {
      const amt =
        Number(
          r.amountRWF ??
            r.balanceOwedRWF ??
            (Number(r.quantity || 0) * Number(r.unitCostRWF || r.purchasePriceRWF || 0))
        ) || 0
      totalVal += amt
      const st = String(r.status || '').toLowerCase()
      const qty = Number(r.quantity) || 0
      const low = Number(r.lowStockAlert) || 5
      if (
        st.includes('overdue') ||
        st.includes('low') ||
        st.includes('unpaid') ||
        st.includes('critical') ||
        st.includes('dead') ||
        st.includes('expired') ||
        (r.quantity !== undefined && qty <= low)
      ) {
        alertCount++
      }
    })

    return { totalCount, totalVal, alertCount }
  }, [data])

  const totalPages = Math.max(1, Math.ceil(processedData.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, page, pageSize])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Table Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="font-orbitron text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-300 mt-1 leading-normal">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Search records..."
              className="pl-8 pr-3 h-9 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:bg-white/20 focus:border-[#218DFF]/60 focus:ring-2 focus:ring-[#218DFF]/30 focus:outline-none w-44 sm:w-56 transition-all shadow-inner"
            />
          </div>

          {/* Category Filter Dropdown */}
          {categories.length > 0 && (
            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value)
                  setPage(1)
                }}
                className="px-3 h-9 rounded-xl bg-[#071644] border border-white/20 text-xs font-semibold text-white focus:outline-none focus:border-[#218DFF]/60 focus:ring-2 focus:ring-[#218DFF]/30 cursor-pointer transition-all"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Entry Action Button - Clean Solid Sapphire Pill without white linear gradient */}
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="btn-sapphire-clean h-9 px-4 text-xs font-bold whitespace-nowrap active:scale-[0.98] transition-transform duration-150"
            >
              <Plus className="w-3.5 h-3.5 text-[#9EDCFF]" />
              <span>{addNewLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Number Summary Strip (ExBOS Master Workflow Rule: Section 1 & 9) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#9EDCFF] tracking-wider block">
              Total Listed Records
            </span>
            <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-white tracking-tight mt-1">
              {summaryStrip.totalCount} {summaryStrip.totalCount === 1 ? 'Record' : 'Records'}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-[#218DFF] shadow-[0_0_8px_#218DFF]" />
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#9EDCFF] tracking-wider block">
              Tracked Value / Turnover
            </span>
            <div className="font-mono tabular-nums text-base sm:text-lg font-bold text-emerald-400 tracking-tight mt-1">
              {formatRWF(summaryStrip.totalVal, hideFinancials)}
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#9EDCFF] tracking-wider block">
              Attention &amp; Status
            </span>
            <div
              className={`font-mono tabular-nums text-base sm:text-lg font-bold tracking-tight mt-1 ${
                summaryStrip.alertCount > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {summaryStrip.alertCount > 0
                ? `${summaryStrip.alertCount} Needs Attention`
                : 'All Good Standing'}
            </div>
          </div>
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              summaryStrip.alertCount > 0
                ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
            }`}
          />
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (Shown on md+ screens) */}
      <div className="hidden md:block w-full min-h-[220px] rounded-2xl bg-[#040C26]/90 border border-white/10 shadow-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/15 bg-white/5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-300">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3.5 px-4 font-bold whitespace-nowrap ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.width || ''} ${col.sortable ? 'cursor-pointer select-none hover:text-white transition-colors' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    <span className="truncate">{col.label}</span>
                    {col.sortable && (
                      <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-70 shrink-0" />
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3.5 px-4 text-center font-bold text-slate-300 w-28 whitespace-nowrap text-[10px] sm:text-[11px] uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-200">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 px-4 text-center text-slate-400 text-xs"
                >
                  <div className="max-w-sm mx-auto space-y-2">
                    <p>{emptyMessage}</p>
                    {onAddNew && (
                      <button
                        type="button"
                        onClick={onAddNew}
                        className="inline-flex items-center gap-1.5 text-xs text-[#9EDCFF] hover:text-white font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add first record</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-white/5 border-b border-white/10 transition-colors group cursor-pointer"
                  onClick={() => onViewRow && onViewRow(row)}
                >
                  {columns.map((col) => {
                    const val = row[col.key]

                    // Render category / tag as natural seamless text (no separate pill / badge background)
                    if (col.type === 'category' || col.type === 'pill') {
                      return (
                        <td key={col.key} className="py-3.5 px-3 truncate">
                          <span className="text-xs font-semibold text-slate-200 block truncate max-w-full" title={val || ''}>
                            {val || '—'}
                          </span>
                        </td>
                      )
                    }

                    // Render amount with bright red / green styling matching reference
                    if (col.type === 'amount') {
                      const num = Number(val) || 0
                      const isNegative = row.type === 'out' || num < 0
                      return (
                        <td
                          key={col.key}
                          className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-xs sm:text-sm whitespace-nowrap truncate"
                        >
                          <span
                            className={
                              isNegative ? 'text-rose-400' : 'text-emerald-400'
                            }
                          >
                            {isNegative ? '-' : '+'}
                            {formatRWF(Math.abs(num), hideFinancials)}
                          </span>
                        </td>
                      )
                    }

                    // Render status as seamless table text with no badge/pill background
                    if (col.type === 'status') {
                      const isLow = Number(row.quantity) <= (Number(row.lowStockAlert) || 5) || String(val || '').toLowerCase().includes('low') || String(val || '').toLowerCase().includes('warning')
                      const isDead = String(val || '').toLowerCase().includes('dead')
                      return (
                        <td key={col.key} className="py-3.5 px-4 truncate">
                          <span
                            className={`text-xs font-semibold truncate block max-w-full ${isLow ? 'text-amber-400' : isDead ? 'text-rose-400' : 'text-[#9EDCFF]'
                              }`}
                            title={val || (isLow ? 'Low Stock Alert' : 'Active')}
                          >
                            {val || (isLow ? `Low Stock (${row.quantity || 0} left)` : 'Active')}
                          </span>
                        </td>
                      )
                    }

                    return (
                      <td
                        key={col.key}
                        className={`py-3.5 px-4 text-slate-200 truncate ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          }`}
                      >
                        {col.key === 'title' && row.email ? (
                          <div className="min-w-0">
                            <span className="truncate block font-semibold text-white" title={val}>
                              {val}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                              {row.email}
                            </span>
                          </div>
                        ) : col.key === 'date' ? (
                          <span className="text-slate-400 font-mono tabular-nums text-xs whitespace-nowrap block truncate">
                            {val || '—'}
                          </span>
                        ) : col.key === 'phone' ? (
                          <span className="text-slate-200 font-mono tabular-nums text-xs whitespace-nowrap block truncate">
                            {val || row.phone || '—'}
                          </span>
                        ) : col.key === 'location' ? (
                          <span className="text-slate-300 text-xs block truncate" title={val || ''}>
                            {val || '—'}
                          </span>
                        ) : col.key === 'preferredProducts' ? (
                          <span className="text-slate-200 text-xs block truncate" title={val || ''}>
                            {val || '—'}
                          </span>
                        ) : (
                          <span className="truncate block font-medium" title={val !== undefined && val !== null ? String(val) : ''}>
                            {val !== undefined && val !== null ? String(val) : '—'}
                          </span>
                        )}
                      </td>
                    )
                  })}

                  {/* Actions Column with View, Update, Delete */}
                  <td
                    className="py-3.5 px-4 text-center whitespace-nowrap w-28"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {onReorderRow && (
                        <button
                          type="button"
                          onClick={() => onReorderRow(row)}
                          title="One-click Reorder Stock"
                          className="px-2 py-1 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/35 active:scale-95 border border-[#218DFF]/40 text-[#9EDCFF] hover:text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all duration-150 shadow-sm group"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#218DFF] group-hover:scale-110 transition-transform" />
                          <span>Reorder</span>
                        </button>
                      )}
                      {onViewRow && (
                        <button
                          type="button"
                          onClick={() => onViewRow(row)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#218DFF]/25 active:scale-95 border border-white/15 hover:border-[#9EDCFF]/60 text-slate-300 hover:text-white transition-all duration-150 cursor-pointer shadow-sm group"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#9EDCFF] group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      {onEditRow && (
                        <button
                          type="button"
                          onClick={() => onEditRow(row)}
                          title="Update / Edit"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-[#218DFF]/25 active:scale-95 border border-white/15 hover:border-[#218DFF]/60 text-slate-300 hover:text-white transition-all duration-150 cursor-pointer shadow-sm group"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#218DFF] group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                      {onDeleteRow && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmRow(row)}
                          title="Delete"
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-500/25 active:scale-95 border border-white/15 hover:border-rose-400/60 text-slate-300 hover:text-rose-300 transition-all duration-150 cursor-pointer shadow-sm group"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE RESPONSIVE CARDS VIEW (Shown on < md screens without horizontal scrolling) */}
      <div className="block md:hidden space-y-3">
        {paginatedRows.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl bg-[#040C26]/90 border border-white/10 text-slate-400 text-xs">
            <p>{emptyMessage}</p>
            {onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#9EDCFF] hover:text-white font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first record</span>
              </button>
            )}
          </div>
        ) : (
          paginatedRows.map((row, idx) => {
            const num = Number(row.amountRWF || row.balanceOwedRWF) || 0
            const isNegative = row.type === 'out' || num < 0
            return (
              <div
                key={row.id || idx}
                onClick={() => onViewRow && onViewRow(row)}
                className="p-4 rounded-2xl bg-[#040C26]/90 border border-white/10 space-y-2.5 transition-all hover:bg-white/5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {row.date || '—'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[150px]">
                    {row.category || '—'}
                  </span>
                </div>

                <div className="text-sm font-bold text-white leading-snug">
                  {row.title}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Amount</span>
                    <strong
                      className={`font-orbitron text-sm font-extrabold ${isNegative ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                    >
                      {isNegative ? '-' : '+'}
                      {formatRWF(Math.abs(num), hideFinancials)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2 relative" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs font-semibold text-[#9EDCFF] truncate max-w-[130px]">
                      {row.status || 'Active'}
                    </span>

                    {/* Mobile ... Dropdown */}
                    <div className="relative inline-block text-left" ref={openActionRowId === `mob-${row.id || idx}` ? actionsRef : null}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenActionRowId(openActionRowId === `mob-${row.id || idx}` ? null : `mob-${row.id || idx}`)
                        }}
                        title="Actions"
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${openActionRowId === `mob-${row.id || idx}`
                          ? 'bg-[#218DFF]/25 border-[#9EDCFF] text-white shadow-[0_0_12px_rgba(33,141,255,0.4)]'
                          : 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200 hover:text-white'
                          }`}
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {openActionRowId === `mob-${row.id || idx}` && (
                        <div
                          className="spring-dropdown-panel absolute right-0 bottom-full mb-2 w-44 rounded-2xl bg-[#071644] border border-[#9EDCFF]/40 shadow-2xl p-1.5 z-50 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {onReorderRow && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenActionRowId(null)
                                onReorderRow(row)
                              }}
                              className="spring-dropdown-item !bg-transparent hover:!bg-[#218DFF]/20 w-full text-left px-3 py-2 rounded-xl text-xs font-semibold !text-[#9EDCFF] hover:!text-white flex items-center gap-2.5 cursor-pointer transition-all border border-transparent hover:border-white/15"
                            >
                              <Truck className="w-3.5 h-3.5 text-[#218DFF]" />
                              <span>Reorder Stock</span>
                            </button>
                          )}
                          {onViewRow && (
                            <button
                              type="button"
                              style={{ animationDelay: '0ms' }}
                              onClick={() => {
                                setOpenActionRowId(null)
                                onViewRow(row)
                              }}
                              className="spring-dropdown-item !bg-transparent hover:!bg-white/15 w-full text-left px-3 py-2 rounded-xl text-xs font-semibold !text-slate-200 hover:!text-white flex items-center gap-2.5 cursor-pointer transition-all border border-transparent hover:border-white/15"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#9EDCFF]" />
                              <span>View Details</span>
                            </button>
                          )}
                          {onEditRow && (
                            <button
                              type="button"
                              style={{ animationDelay: '60ms' }}
                              onClick={() => {
                                setOpenActionRowId(null)
                                onEditRow(row)
                              }}
                              className="spring-dropdown-item !bg-transparent hover:!bg-white/15 w-full text-left px-3 py-2 rounded-xl text-xs font-semibold !text-slate-200 hover:!text-white flex items-center gap-2.5 cursor-pointer transition-all border border-transparent hover:border-white/15"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#218DFF]" />
                              <span>Edit Record</span>
                            </button>
                          )}
                          {onDeleteRow && (
                            <button
                              type="button"
                              style={{ animationDelay: '120ms' }}
                              onClick={() => {
                                setOpenActionRowId(null)
                                setDeleteConfirmRow(row)
                              }}
                              className="spring-dropdown-item !bg-transparent hover:!bg-rose-500/20 w-full text-left px-3 py-2 rounded-xl text-xs font-semibold !text-rose-400 hover:!text-rose-200 flex items-center gap-2.5 cursor-pointer transition-all border-t border-white/10 mt-1 pt-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Bar */}
      {processedData.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 px-1">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, processedData.length)} of {processedData.length} records
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg bg-white/10 border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-white px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg bg-white/10 border border-white/15 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmRow}
        onClose={() => setDeleteConfirmRow(null)}
        onConfirm={() => {
          if (onDeleteRow && deleteConfirmRow) {
            onDeleteRow(deleteConfirmRow)
          }
          setDeleteConfirmRow(null)
        }}
        itemName={deleteConfirmRow?.title || deleteConfirmRow?.name || deleteConfirmRow?.id || 'this record'}
        title="Delete Record"
      />
    </div>
  )
}
