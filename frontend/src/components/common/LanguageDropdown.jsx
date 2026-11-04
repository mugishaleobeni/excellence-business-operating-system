import React, { useState, useRef, useEffect } from 'react'
import { useExbos } from '../../context/ExbosContext'
import CountryFlag from './CountryFlag'
import { ChevronDown, Check, ArrowUpRight } from 'lucide-react'

const LANGUAGES = [
  {
    code: 'en',
    label: 'English',
    subtitle: 'United States · RWF Words'
  },
  {
    code: 'rw',
    label: 'Kinyarwanda',
    subtitle: "U Rwanda · Amafaranga mu magambo"
  }
]

export default function LanguageDropdown() {
  const { language, setLanguage } = useExbos()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Select Language"
        className="px-3 py-2 rounded-xl bg-white/80 dark:bg-[#071544]/85 border border-blue-200/70 dark:border-[#9EDCFF]/30 text-[#071544] dark:text-[#9EDCFF] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm"
      >
        <CountryFlag lang={current.code} />
        <span>{current.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#218DFF] transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose language"
          className="spring-dropdown-panel absolute right-0 mt-2 w-56 rounded-2xl liquid-glass p-2 border border-[#9EDCFF]/40 shadow-sapphire-dark z-50 space-y-1.5"
        >
          {LANGUAGES.map((item, idx) => {
            const isSelected = item.code === language
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                style={{ animationDelay: `${idx * 85}ms` }}
                onClick={() => {
                  setLanguage(item.code)
                  setOpen(false)
                }}
                className={`spring-dropdown-item cn-link w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] text-white border-[#9EDCFF]/60 shadow-sapphire-glow'
                    : 'bg-white/60 dark:bg-[#03091F]/65 border-blue-200/50 dark:border-[#9EDCFF]/15 text-[#071544] dark:text-white hover:border-[#218DFF]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CountryFlag lang={item.code} className="w-6 h-4 rounded-sm shadow-sm shrink-0" />
                  <span>
                    <strong className="block text-xs font-orbitron">{item.label}</strong>
                    <span
                      className={`block text-[10px] ${
                        isSelected ? 'text-[#9EDCFF]' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </span>
                </span>
                {isSelected ? (
                  <Check className="w-4 h-4 text-[#9EDCFF] shrink-0" />
                ) : (
                  <span className="cn-arrow" aria-hidden="true">
                    <ArrowUpRight className="cn-arrow-out" size={14} strokeWidth={2.2} />
                    <ArrowUpRight className="cn-arrow-in" size={14} strokeWidth={2.2} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
