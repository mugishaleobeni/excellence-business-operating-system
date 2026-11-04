import React, { useId, useRef, useState, useEffect } from 'react'
import { Check } from 'lucide-react'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const digitsOf = (raw) => String(raw ?? '').replace(/\D/g, '')

const toSlots = (raw, n) => {
  const d = digitsOf(raw).slice(0, n)
  return Array.from({ length: n }, (_, i) => d[i] ?? '')
}

const firstEmptyOf = (slots) => {
  const i = slots.indexOf('')
  return i === -1 ? slots.length - 1 : i
}

export default function CodeSlots({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  status = 'idle', // 'idle' | 'error' | 'success'
  mask = false,
  caret = true,
  disabled = false,
  autoFocus = false,
  accentColor = '#f5f5f5',
  inkColor = '#f5f5f5',
  slotColor = '#27272a',
  digitColor = '#18181b',
  dangerColor = '#ff3b30',
  slotSize = 48,
  gap = 10,
  radius = 12,
  bounce = 0.2,
  settle = 0.3,
  rise = 8,
  cascade = 20,
  ariaLabel = 'One-time code',
  className = ''
}) {
  const uid = useId()
  const inputRef = useRef(null)
  const [slots, setSlots] = useState(() => toSlots(value ?? defaultValue, length))
  const [active, setActive] = useState(() => firstEmptyOf(slots))
  const [focused, setFocused] = useState(false)
  const lastCompletedRef = useRef('')

  // Sync when value prop changes externally
  useEffect(() => {
    if (value !== undefined) {
      const next = toSlots(value, length)
      setSlots(next)
      setActive(firstEmptyOf(next))
    }
  }, [value, length])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const commit = (nextSlots) => {
    setSlots(nextSlots)
    const code = nextSlots.join('')
    onChange?.(code)

    if (code.length === length && nextSlots.every(Boolean)) {
      if (lastCompletedRef.current !== code) {
        lastCompletedRef.current = code
        onComplete?.(code)
      }
    } else {
      lastCompletedRef.current = ''
    }
  }

  const insert = (raw, fromIndex = active) => {
    const digits = digitsOf(raw)
    if (!digits) return
    const next = [...slots]
    let idx = fromIndex
    for (const ch of digits) {
      if (idx >= length) break
      next[idx] = ch
      idx += 1
    }
    commit(next)
    setActive(Math.min(idx, length - 1))
  }

  const clearSlot = (idx, stepBack = false) => {
    const next = [...slots]
    if (!next[idx] && stepBack && idx > 0) {
      next[idx - 1] = ''
      setActive(idx - 1)
    } else {
      next[idx] = ''
      if (stepBack && idx > 0) setActive(idx - 1)
      else setActive(idx)
    }
    commit(next)
  }

  const onKeyDown = (e) => {
    if (disabled || status === 'success') return
    const k = e.key
    if (/^[0-9]$/.test(k)) {
      e.preventDefault()
      insert(k, active)
    } else if (k === 'Backspace') {
      e.preventDefault()
      if (slots[active]) {
        clearSlot(active, false)
      } else {
        clearSlot(active, true)
      }
    } else if (k === 'Delete') {
      e.preventDefault()
      clearSlot(active, false)
    } else if (k === 'ArrowLeft') {
      e.preventDefault()
      setActive((prev) => Math.max(prev - 1, 0))
    } else if (k === 'ArrowRight') {
      e.preventDefault()
      setActive((prev) => Math.min(prev + 1, length - 1))
    }
  }

  const onPaste = (e) => {
    if (disabled || status === 'success') return
    e.preventDefault()
    insert(e.clipboardData.getData('text'), 0)
  }

  const onInput = (e) => {
    if (disabled || status === 'success') return
    const d = digitsOf(e.target.value)
    if (d) insert(d, active)
  }

  const height = Math.round(slotSize * 1.18)
  const isSuccess = status === 'success'
  const isError = status === 'error'

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        '--cs-accent': accentColor,
        '--cs-ink': inkColor,
        '--cs-slot': slotColor,
        '--cs-digit': digitColor,
        '--cs-danger': dangerColor,
        '--cs-size': `${slotSize}px`,
        '--cs-height': `${height}px`,
        '--cs-gap': `${gap}px`,
        '--cs-radius': `${Math.min(radius, slotSize / 2)}px`
      }}
    >
      <div
        className="relative inline-flex items-center cursor-text select-none"
        style={{ gap: `${gap}px` }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden native input capture */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          value=""
          disabled={disabled}
          readOnly={isSuccess}
          aria-label={ariaLabel}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onChange={onInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full"
        />

        {slots.map((char, i) => {
          const isActive = focused && i === active && !isSuccess
          const isFilled = Boolean(char)

          return (
            <div
              key={i}
              className="relative flex items-center justify-center font-orbitron font-extrabold transition-all duration-300"
              style={{
                width: `${slotSize}px`,
                height: `${height}px`,
                borderRadius: `${radius}px`,
                backgroundColor: isError
                  ? 'rgba(255, 59, 48, 0.22)'
                  : isSuccess
                  ? 'rgba(34, 197, 94, 0.25)'
                  : isFilled
                  ? 'rgba(255, 255, 255, 0.95)'
                  : 'rgba(39, 39, 42, 0.85)',
                color: isError
                  ? dangerColor
                  : isSuccess
                  ? '#ffffff'
                  : isFilled
                  ? digitColor
                  : '#f5f5f5',
                border: isError
                  ? `2px solid ${dangerColor}`
                  : isSuccess
                  ? '2px solid #22c55e'
                  : isActive
                  ? '2px solid #218DFF'
                  : '1px solid rgba(255, 255, 255, 0.25)',
                boxShadow: isActive
                  ? '0 0 16px rgba(33, 141, 255, 0.55)'
                  : isSuccess
                  ? '0 0 16px rgba(34, 197, 94, 0.55)'
                  : 'none',
                transform: isFilled ? 'scale(1)' : 'scale(0.97)',
                fontSize: `${Math.round(slotSize * 0.48)}px`
              }}
            >
              {/* Digit display */}
              <span
                className="transition-transform duration-200"
                style={{
                  transform: isFilled ? 'translateY(0)' : 'translateY(4px)',
                  opacity: isFilled ? 1 : 0
                }}
              >
                {mask && char ? '•' : char}
              </span>

              {/* Blinking Caret */}
              {caret && isActive && !isFilled && !isSuccess && (
                <span
                  className="absolute w-[2px] h-[50%] bg-[#218DFF] rounded-full animate-pulse"
                  style={{ animationDuration: '1s' }}
                />
              )}

              {/* Individual slot checkmark wash on success */}
              {isSuccess && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-emerald-500 text-white animate-in fade-in zoom-in-75 duration-300"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <span id={`${uid}-count`} className="sr-only" aria-live="polite">
        {isSuccess
          ? 'Code accepted'
          : `${slots.filter(Boolean).length} of ${length} digits entered`}
      </span>
    </div>
  )
}
