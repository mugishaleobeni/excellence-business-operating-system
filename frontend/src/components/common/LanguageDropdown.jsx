import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
    subtitle: 'U Rwanda · Amafaranga mu magambo'
  }
]

export default function LanguageDropdown() {
  const { language, setLanguage } = useExbos()
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState({})
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const current = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  const updateMenuPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return
    const rect = buttonRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const menuWidth = Math.min(240, vw - 24)
    // Align with button left on mobile or right on desktop, clamped strictly within [12, vw - menuWidth - 12]
    const preferredLeft = vw < 640 ? rect.left : rect.right - menuWidth
    const clampedLeft = Math.max(12, Math.min(preferredLeft, vw - menuWidth - 12))
    const spaceBelow = vh - rect.bottom
    const openUpward = spaceBelow < 160 && rect.top > 160

    setMenuStyle({
      position: 'fixed',
      width: `${menuWidth}px`,
      left: `${clampedLeft}px`,
      ...(openUpward
        ? { bottom: `${vh - rect.top + 8}px` }
        : { top: `${rect.bottom + 8}px` }),
      zIndex: 99999
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updateMenuPosition()

    const handleClickOutside = (e) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        (!menuRef.current || !menuRef.current.contains(e.target))
      ) {
        setOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleScrollOrResize = () => updateMenuPosition()

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [open, updateMenuPosition])

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
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

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Choose language"
            style={menuStyle}
            className="spring-dropdown-panel rounded-2xl bg-[#071544]/98 backdrop-blur-2xl p-2 border border-[#9EDCFF]/45 shadow-2xl space-y-1.5"
          >
            {LANGUAGES.map((item, idx) => {
              const isSelected = item.code === language
              return (
                <button
                  key={item.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  style={{ animationDelay: `${idx * 65}ms` }}
                  onClick={() => {
                    setLanguage(item.code)
                    setOpen(false)
                  }}
                  className={`spring-dropdown-item cn-link w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] text-white border-[#9EDCFF]/60 shadow-sapphire-glow'
                      : 'bg-[#03091F]/80 border-[#9EDCFF]/15 text-white hover:border-[#218DFF]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <CountryFlag lang={item.code} className="w-6 h-4 rounded-sm shadow-sm shrink-0" />
                    <span className="min-w-0">
                      <strong className="block text-xs font-orbitron text-white truncate">{item.label}</strong>
                      <span
                        className={`block text-[10px] truncate ${
                          isSelected ? 'text-[#9EDCFF]' : 'text-slate-300'
                        }`}
                      >
                        {item.subtitle}
                      </span>
                    </span>
                  </span>
                  {isSelected ? (
                    <Check className="w-4 h-4 text-[#9EDCFF] shrink-0" />
                  ) : (
                    <span className="cn-arrow shrink-0" aria-hidden="true">
                      <ArrowUpRight className="cn-arrow-out text-[#9EDCFF]" size={14} strokeWidth={2.2} />
                      <ArrowUpRight className="cn-arrow-in text-[#9EDCFF]" size={14} strokeWidth={2.2} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}
