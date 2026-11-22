import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * CustomDateInput Component
 * ExBOS Signature Date Picker:
 * - Neo-glassmorphism styling (#071644 base with #218DFF electric blue accents)
 * - Portal-rendered, viewport-clamped dropdown so it is NEVER clipped inside modals or mobile screens
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
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 288 })

  const initialDate = value ? new Date(value) : new Date()
  const validInitial = !isNaN(initialDate.getTime()) ? initialDate : new Date()

  const [viewYear, setViewYear] = useState(validInitial.getFullYear())
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth())

  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
      }
    }
  }, [value])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return
    const rect = triggerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const panelWidth = Math.min(288, vw - 24)
    const estimatedHeight = showShortcuts ? 330 : 290

    // Clamp horizontally so calendar never overflows left or right edge
    let left = rect.left
    if (left + panelWidth > vw - 12) {
      left = vw - panelWidth - 12
    }
    if (left < 12) {
      left = 12
    }

    // Flip upward if not enough room below
    const spaceBelow = vh - rect.bottom - 12
    const spaceAbove = rect.top - 12
    let top
    if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + 8, Math.max(12, vh - estimatedHeight - 12))
    } else {
      top = Math.max(12, rect.top - estimatedHeight - 8)
    }

    setCoords({ top, left, width: panelWidth })
  }, [showShortcuts])

  useEffect(() => {
    if (!open) return undefined
    updatePosition()

    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  const formatISO = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

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

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const todayIso = new Date().toISOString().split('T')[0]

  const calendarPopup =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999
            }}
            className="spring-dropdown-panel rounded-2xl bg-[#06143b] border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(33,141,255,0.35)] p-3.5 backdrop-blur-xl animate-fadeIn"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="h-7 w-7 mx-auto" />
              ))}

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
                    className={`h-7 w-7 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
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
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white font-medium cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShortcut('yesterday')}
                    className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white font-medium cursor-pointer"
                  >
                    Yesterday
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-slate-400 hover:text-white font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1">
          {label} {required && <span className="text-[#218DFF]">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
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

      {calendarPopup}
    </div>
  )
}
