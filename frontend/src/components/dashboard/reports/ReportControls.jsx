import React from 'react'
import {
  Calendar,
  Search,
  X,
  Printer,
  FileSpreadsheet,
  Download,
  Filter
} from 'lucide-react'

export default function ReportControls({
  dateFilter,
  onDateFilterChange,
  customStart,
  onCustomStartChange,
  customEnd,
  onCustomEndChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterOptions = null, // e.g., category, status dropdown
  onExportPdf,
  onExportExcel,
  onPrint,
  totalRecordsCount = 0
}) {
  const dateOptions = ['Today', 'Yesterday', '7 Days', '30 Days', 'This Month', 'Custom']

  return (
    <div className="space-y-3">
      {/* Top Bar: Date Filter Pills & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#9EDCFF] mr-1 uppercase tracking-wider font-orbitron shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#218DFF]" />
            <span>Period:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {dateOptions.map((opt) => {
              const active = dateFilter === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onDateFilterChange(opt)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'exbos-glass-pill-active border border-white/30 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Buttons: Export PDF, Excel, Print */}
        <div className="flex items-center gap-2 shrink-0">
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              title="Print report"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Print</span>
            </button>
          )}

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              title="Export PDF Report"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>PDF</span>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              title="Export Excel / CSV"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-[#9EDCFF] hover:text-white flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#218DFF]" />
              <span>Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Pickers Drawer (when 'Custom' is selected) */}
      {dateFilter === 'Custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10 text-xs animate-in fade-in">
          <span className="text-slate-300 font-semibold">Custom Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From</span>
            <input
              type="date"
              value={customStart || ''}
              onChange={(e) => onCustomStartChange && onCustomStartChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#071644] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#218DFF]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">To</span>
            <input
              type="date"
              value={customEnd || ''}
              onChange={(e) => onCustomEndChange && onCustomEndChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#071644] border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-[#218DFF]"
            />
          </div>
        </div>
      )}

      {/* Search & Report-Specific Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/30 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns or Slot */}
        <div className="flex items-center gap-2">
          {filterOptions}
          {typeof totalRecordsCount === 'number' && (
            <span className="text-[11px] font-mono text-slate-400 ml-1 shrink-0">
              {totalRecordsCount} {totalRecordsCount === 1 ? 'record' : 'records'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

