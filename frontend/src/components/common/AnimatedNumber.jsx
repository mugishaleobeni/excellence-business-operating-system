import React, { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Parse a raw number or formatted statistic string (e.g. "1,250,000 RWF",
 * "+420,000 RWF", "-15,000 RWF", "38.5%", "$1,200.50", "42 units", "••••••••")
 * into its animatable numeric value and lossless prefix/suffix metadata.
 */
export function parseAnimatedStatValue(value) {
  if (value === null || value === undefined) {
    return { animatable: false, raw: '' }
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { animatable: false, raw: String(value) }
    }
    const str = String(value)
    const decMatch = str.split('.')[1]
    return {
      animatable: true,
      raw: value.toLocaleString(),
      prefix: value < 0 ? '-' : '',
      target: Math.abs(value),
      signedTarget: value,
      decimals: decMatch ? decMatch.length : 0,
      useCommas: true,
      suffix: ''
    }
  }

  const raw = String(value)
  // Never animate privacy-masked strings or empty text
  if (!raw.trim() || raw.includes('••') || raw.includes('***')) {
    return { animatable: false, raw }
  }

  // Match optional leading prefix (currency/sign/label), numeric core, and trailing suffix
  // Avoid animating date-like strings (e.g. "2026-11-26" or "12/04/2026") or ratios ("3/3")
  if (/\d{4}-\d{2}-\d{2}/.test(raw) || /^\s*\d+\s*\/\s*\d+\s*$/.test(raw)) {
    return { animatable: false, raw }
  }

  const match = raw.match(/^([^0-9\-+]*)([+-]?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(.*)$/)
  if (!match) {
    return { animatable: false, raw }
  }

  const [, leadingText, signChar, intPart, fracPart, trailingText] = match
  // If trailing text contains another separate number (e.g. "10 items · 500 RWF"), keep static
  // Exception: allow "18%" or "/mo" without extra digits
  if (/\d/.test(trailingText)) {
    return { animatable: false, raw }
  }

  const numericStr = `${intPart.replace(/,/g, '')}${fracPart ? `.${fracPart}` : ''}`
  const absNum = Number(numericStr)
  if (!Number.isFinite(absNum)) {
    return { animatable: false, raw }
  }

  const isNegative = signChar === '-'
  const signedTarget = isNegative ? -absNum : absNum
  const useCommas = intPart.includes(',') || absNum >= 1000

  return {
    animatable: true,
    raw,
    prefix: `${leadingText}${signChar === '+' ? '+' : ''}`,
    explicitNegative: isNegative,
    target: absNum,
    signedTarget,
    decimals: fracPart ? fracPart.length : 0,
    useCommas,
    suffix: trailingText
  }
}

function formatFrameValue(currentVal, parsed) {
  const isNeg = currentVal < 0 || (currentVal === 0 && parsed.explicitNegative)
  const absVal = Math.abs(currentVal)
  const fixed = parsed.decimals > 0 ? absVal.toFixed(parsed.decimals) : String(Math.round(absVal))
  const [intStr, decStr] = fixed.split('.')
  const formattedInt = parsed.useCommas
    ? intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : intStr
  const numberPart = decStr !== undefined ? `${formattedInt}.${decStr}` : formattedInt
  const signPrefix = isNeg ? '-' : ''
  return `${parsed.prefix}${signPrefix}${numberPart}${parsed.suffix}`
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * AnimatedNumber
 * Smoothly counts up numeric statistics from 0 to their target value when the card
 * enters the viewport. Preserves commas, currency symbols, decimals, signs, and
 * percentages while avoiding redundant re-animations on unrelated re-renders.
 */
export default function AnimatedNumber({
  value,
  duration = 1700,
  updateDuration = 650,
  className = ''
}) {
  const parsed = useMemo(() => parseAnimatedStatValue(value), [value])
  const spanRef = useRef(null)
  const rafRef = useRef(null)
  const hasEnteredViewportRef = useRef(false)
  const hasAnimatedInitialRef = useRef(false)
  const lastNumericRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [displayText, setDisplayText] = useState(() => {
    if (!parsed.animatable || prefersReducedMotion()) {
      return parsed.raw
    }
    return formatFrameValue(0, parsed)
  })

  // Observe when the card enters the viewport
  useEffect(() => {
    const el = spanRef.current
    if (!el || hasEnteredViewportRef.current) return

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      hasEnteredViewportRef.current = true
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            hasEnteredViewportRef.current = true
            setIsVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Run smooth count-up animation when visible and value is ready or genuinely changes
  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (!parsed.animatable) {
      setDisplayText(parsed.raw)
      return
    }

    if (prefersReducedMotion()) {
      lastNumericRef.current = parsed.signedTarget
      hasAnimatedInitialRef.current = true
      setDisplayText(parsed.raw)
      return
    }

    if (!isVisible) {
      if (!hasAnimatedInitialRef.current) {
        setDisplayText(formatFrameValue(0, parsed))
      }
      return
    }

    const target = parsed.signedTarget
    // Avoid redundant re-animation when component re-renders with the exact same value
    if (hasAnimatedInitialRef.current && lastNumericRef.current === target) {
      setDisplayText(parsed.raw)
      return
    }

    const fromValue =
      hasAnimatedInitialRef.current && lastNumericRef.current !== null
        ? lastNumericRef.current
        : 0

    // If both start and target are 0, snap immediately without wasting frames
    if (fromValue === target) {
      lastNumericRef.current = target
      hasAnimatedInitialRef.current = true
      setDisplayText(parsed.raw)
      return
    }

    const animDuration =
      hasAnimatedInitialRef.current && fromValue !== 0 ? updateDuration : duration
    const startTime = performance.now()
    const delta = target - fromValue

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / animDuration)
      // Ease-out quartic curve for smooth, refined deceleration
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = fromValue + delta * eased

      if (progress < 1) {
        setDisplayText(formatFrameValue(current, parsed))
        rafRef.current = requestAnimationFrame(tick)
      } else {
        lastNumericRef.current = target
        hasAnimatedInitialRef.current = true
        setDisplayText(parsed.raw)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isVisible, parsed, duration, updateDuration])

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`.trim()}>
      {displayText}
    </span>
  )
}
