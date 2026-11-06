import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * CustomSelect Component
 * Implements ExBOS's signature liquid-sapphire dropdown design:
 * - Neo-glassmorphism styling (#071644 base with #218DFF electric blue accents)
 * - Spring animated dropdown panel with backdrop blur
 * - Gradient selection highlighting with checkmark indicator
 * - Keyboard (Escape) & click-outside dismiss handling
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

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

  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOpt = normalizedOptions.find((opt) => !opt.isHeader && !opt.header && opt.value === value)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        style={{ backgroundColor: '#071644', color: '#ffffff' }}
        className={`w-full px-3.5 py-2.5 rounded-xl exbos-modal-input text-xs sm:text-sm text-white flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 active:scale-[0.99] border ${
          open ? 'border-[#218DFF] shadow-[0_0_15px_rgba(33,141,255,0.3)]' : 'border-white/15 hover:border-white/35'
        } focus:outline-none text-left select-none ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOpt?.icon && <span className="shrink-0">{selectedOpt.icon}</span>}
          <span className="truncate font-medium">{selectedOpt ? selectedOpt.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#218DFF] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`spring-dropdown-panel absolute left-0 right-0 top-full mt-1.5 rounded-2xl bg-[#06143b] border-2 border-[#218DFF]/70 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(33,141,255,0.35)] z-50 p-1.5 max-h-60 overflow-y-auto space-y-1 backdrop-blur-xl ${menuClassName}`}
        >
          {normalizedOptions.map((opt, idx) => {
            if (opt.isHeader || opt.header) {
              return (
                <div
                  key={`hdr-${idx}-${opt.label || opt.value}`}
                  className="px-3 py-1.5 text-[10px] font-orbitron font-bold text-[#9EDCFF] uppercase tracking-wider bg-white/5 rounded-lg select-none pointer-events-none mt-1.5 first:mt-0"
                >
                  {opt.label || opt.value}
                </div>
              )
            }
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all border text-xs sm:text-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] border-[#9EDCFF]/60 text-white font-bold shadow-sapphire-glow'
                    : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#9EDCFF] shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

