import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * CustomDateInput Component
 * ExBOS Signature Date Picker:
 * - Neo-glassmorphism styling (#071644 base with #218DFF electric blue accents)
 * - Spring animated dropdown calendar panel
 * - Quick shortcuts ("Today", "Yesterday")
 * - Dispatches standard 'YYYY-MM-DD' ISO strings to onChange
 */
export default function CustomDateInput({
  value,
  onChange,
  label,
  required = false,
  placeholder = 'Select date...',
  className = '',
  buttonClassName = '',
  min,
  max,
  disabled = false,
  readOnly = false,
  showShortcuts = true
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current value or default to today for calendar view
  const initialDate = value ? new Date(value) : new Date()
  const validInitial = !isNaN(initialDate.getTime()) ? initialDate : new Date()

  const [viewYear, setViewYear] = useState(validInitial.getFullYear())
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth()) // 0-11

  // Keep view aligned if value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  // Dismiss on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('pointerdown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open])

  // Format YYYY-MM-DD
  const formatISO = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  // Display string (e.g. "Nov 5, 2026")
  const displayLabel = (() => {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  })()

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((prev) => prev - 1)
    } else {
      setViewMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((prev) => prev + 1)
    } else {
      setViewMonth((prev) => prev + 1)
    }
  }

  const handleSelectDay = (day) => {
    const iso = formatISO(viewYear, viewMonth, day)
    onChange(iso)
    setOpen(false)
  }

  const handleShortcut = (shortcutKey) => {
    const d = new Date()
    if (shortcutKey === 'yesterday') {
      d.setDate(d.getDate() - 1)
    }
    const iso = d.toISOString().split('T')[0]
    onChange(iso)
    setOpen(false)
  }

  // Month Grid Calculations
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const todayIso = new Date().toISOString().split('T')[0]

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1">
          {label} {required && <span className="text-[#218DFF]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || readOnly}
        onClick={() => setOpen((prev) => !prev)}
        style={{ backgroundColor: '#071644', color: '#ffffff' }}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-white flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
          open
            ? 'border-[#218DFF] shadow-[0_0_15px_rgba(33,141,255,0.3)]'
            : 'border-white/15 hover:border-white/35'
        } focus:outline-none text-left select-none ${buttonClassName} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="w-4 h-4 text-[#218DFF] shrink-0" />
          <span className={`truncate font-medium ${!displayLabel ? 'text-slate-400 font-normal' : ''}`}>
            {displayLabel || placeholder}
          </span>
        </span>

        {value && !disabled && !readOnly ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="text-[10px] font-mono text-[#9EDCFF]/60 uppercase">
            {value ? value.slice(0, 4) : 'Date'}
          </span>
        )}
      </button>

      {/* Calendar Dropdown Popup */}
      {open && (
        <div className="spring-dropdown-panel absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 rounded-2xl bg-[#06143b] border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(33,141,255,0.35)] z-50 p-3.5 backdrop-blur-xl animate-fadeIn">
          {/* Calendar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-orbitron font-bold text-xs text-white tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-semibold text-slate-400 uppercase">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7 w-7" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayIso = formatISO(viewYear, viewMonth, day)
              const isSelected = value === dayIso
              const isToday = todayIso === dayIso

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] border border-[#9EDCFF] text-white font-bold shadow-[0_0_10px_rgba(33,141,255,0.5)]'
                      : isToday
                      ? 'bg-white/10 text-emerald-300 border border-emerald-400/40 font-bold'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Quick Shortcuts */}
          {showShortcuts && (
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleShortcut('today')}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white font-medium"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleShortcut('yesterday')}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white font-medium"
                >
                  Yesterday
                </button>
              </div>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('')
                    setOpen(false)
                  }}
                  className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

