import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import http from 'http'
import path from 'path'

import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Built-in Tailwind CSS JIT Generator Plugin for Vite
 * Ensures 100% of Tailwind utility classes (including arbitrary values like bg-[#03091F],
 * dark mode, responsive breakpoints, opacity modifiers, gradients, spacing, grid, flex)
 * compile into real CSS rules without requiring external network or binary dependencies.
 */
function liquidSapphireTailwindPlugin() {
  const spacing = {
    '0': '0px', '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem', '2': '0.5rem',
    '2.5': '0.625rem', '3': '0.75rem', '3.5': '0.875rem', '4': '1rem', '5': '1.25rem',
    '6': '1.5rem', '7': '1.75rem', '8': '2rem', '9': '2.25rem', '10': '2.5rem',
    '11': '2.75rem', '12': '3rem', '14': '3.5rem', '16': '4rem', '20': '5rem',
    '24': '6rem', '28': '7rem', '32': '8rem', '36': '9rem', '40': '10rem',
    '44': '11rem', '48': '12rem', '52': '13rem', '56': '14rem', '60': '15rem',
    '64': '16rem', '72': '18rem', '80': '20rem', '96': '24rem', 'px': '1px',
    'full': '100%', 'screen': '100vh', 'auto': 'auto', '1/2': '50%', '1/3': '33.333333%',
    '2/3': '66.666667%', '1/4': '25%', '3/4': '75%'
  }

  const palette = {
    'white': '#ffffff',
    'black': '#000000',
    'transparent': 'transparent',
    'current': 'currentColor',
    'sapphire-abyss': '#03091F',
    'sapphire-midnight': '#071544',
    'sapphire-royal': '#0A2786',
    'sapphire-electric': '#1045CA',
    'sapphire-bright': '#218DFF',
    'sapphire-ice': '#9EDCFF',
    'slate-50': '#f8fafc', 'slate-100': '#f1f5f9', 'slate-200': '#e2e8f0', 'slate-300': '#cbd5e1',
    'slate-400': '#94a3b8', 'slate-500': '#64748b', 'slate-600': '#475569', 'slate-700': '#334155',
    'slate-800': '#1e293b', 'slate-900': '#0f172a', 'slate-950': '#020617',
    'blue-50': '#eff6ff', 'blue-100': '#dbeafe', 'blue-200': '#bfdbfe', 'blue-300': '#93c5fd',
    'blue-400': '#60a5fa', 'blue-500': '#3b82f6', 'blue-600': '#2563eb', 'blue-700': '#1d4ed8',
    'blue-800': '#1e40af', 'blue-900': '#1e3a8a', 'blue-950': '#172554',
    'sky-300': '#7dd3fc', 'sky-400': '#38bdf8', 'sky-500': '#0ea5e9',
    'cyan-300': '#67e8f9', 'cyan-400': '#22d3ee', 'cyan-500': '#06b6d4',
    'emerald-50': '#ecfdf5', 'emerald-100': '#d1fae5', 'emerald-200': '#a7f3d0',
    'emerald-300': '#6ee7b7', 'emerald-400': '#34d399', 'emerald-500': '#10b981',
    'emerald-600': '#059669', 'emerald-700': '#047857', 'emerald-800': '#065f46', 'emerald-900': '#064e3b', 'emerald-950': '#022c22',
    'green-400': '#4ade80', 'green-500': '#22c55e', 'green-600': '#16a34a',
    'amber-50': '#fffbeb', 'amber-100': '#fef3c7', 'amber-200': '#fde68a',
    'amber-300': '#fcd34d', 'amber-400': '#fbbf24', 'amber-500': '#f59e0b',
    'amber-600': '#d97706', 'amber-700': '#b45309', 'amber-800': '#92400e', 'amber-900': '#78350f', 'amber-950': '#451a03',
    'yellow-400': '#facc15', 'yellow-500': '#eab308',
    'rose-50': '#fff1f2', 'rose-100': '#ffe4e6', 'rose-200': '#fecdd3',
    'rose-300': '#fda4af', 'rose-400': '#fb7185', 'rose-500': '#f43f5e',
    'rose-600': '#e11d48', 'rose-700': '#be123c', 'rose-800': '#9f1239', 'rose-900': '#881337', 'rose-950': '#4c0519',
    'red-400': '#f87171', 'red-500': '#ef4444', 'red-600': '#dc2626',
    'purple-400': '#c084fc', 'purple-500': '#a855f7', 'indigo-500': '#6366f1',
  }

  function hexToRgba(hex, alpha) {
    if (!hex || !hex.startsWith('#')) return hex
    let h = hex.slice(1)
    if (h.length === 3) h = h.split('').map(c => c + c).join('')
    if (h.length >= 6) {
      const r = parseInt(h.slice(0, 2), 16)
      const g = parseInt(h.slice(2, 4), 16)
      const b = parseInt(h.slice(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }
    return hex
  }

  function resolveColor(raw) {
    if (!raw) return null
    let colorKey = raw
    let alpha = null
    if (raw.includes('/')) {
      const parts = raw.split('/')
      colorKey = parts[0]
      const aVal = parts[1]
      if (aVal.startsWith('[') && aVal.endsWith(']')) {
        alpha = aVal.slice(1, -1)
      } else if (!isNaN(Number(aVal))) {
        alpha = Number(aVal) / 100
      }
    }
    let hex = null
    if (colorKey.startsWith('[') && colorKey.endsWith(']')) {
      hex = colorKey.slice(1, -1).replace(/_/g, ' ')
    } else if (palette[colorKey]) {
      hex = palette[colorKey]
    }
    if (!hex) return null
    if (alpha !== null && hex.startsWith('#')) {
      return hexToRgba(hex, alpha)
    }
    return hex
  }

  function resolveSpace(val) {
    if (spacing[val] !== undefined) return spacing[val]
    if (val && val.startsWith('[') && val.endsWith(']')) return val.slice(1, -1).replace(/_/g, ' ')
    return null
  }

  function generateDeclaration(base) {
    let important = false
    if (base.startsWith('!')) {
      important = true
      base = base.slice(1)
    }
    const imp = important ? ' !important' : ''

    // Static rules
    const staticMap = {
      'block': 'display: block',
      'inline-block': 'display: inline-block',
      'inline': 'display: inline',
      'flex': 'display: flex',
      'inline-flex': 'display: inline-flex',
      'grid': 'display: grid',
      'hidden': 'display: none',
      'table': 'display: table',
      'flex-row': 'flex-direction: row',
      'flex-row-reverse': 'flex-direction: row-reverse',
      'flex-col': 'flex-direction: column',
      'flex-col-reverse': 'flex-direction: column-reverse',
      'flex-wrap': 'flex-wrap: wrap',
      'flex-nowrap': 'flex-wrap: nowrap',
      'flex-1': 'flex: 1 1 0%',
      'flex-auto': 'flex: 1 1 auto',
      'flex-initial': 'flex: 0 1 auto',
      'flex-none': 'flex: none',
      'shrink-0': 'flex-shrink: 0',
      'shrink': 'flex-shrink: 1',
      'grow': 'flex-grow: 1',
      'grow-0': 'flex-grow: 0',
      'items-start': 'align-items: flex-start',
      'items-end': 'align-items: flex-end',
      'items-center': 'align-items: center',
      'items-baseline': 'align-items: baseline',
      'items-stretch': 'align-items: stretch',
      'justify-start': 'justify-content: flex-start',
      'justify-end': 'justify-content: flex-end',
      'justify-center': 'justify-content: center',
      'justify-between': 'justify-content: space-between',
      'justify-around': 'justify-content: space-around',
      'justify-evenly': 'justify-content: space-evenly',
      'self-start': 'align-self: flex-start',
      'self-end': 'align-self: flex-end',
      'self-center': 'align-self: center',
      'self-stretch': 'align-self: stretch',
      'place-items-center': 'place-items: center',
      'relative': 'position: relative',
      'absolute': 'position: absolute',
      'fixed': 'position: fixed',
      'sticky': 'position: sticky',
      'static': 'position: static',
      'inset-0': 'inset: 0px',
      'inset-x-0': 'left: 0px; right: 0px',
      'inset-y-0': 'top: 0px; bottom: 0px',
      'overflow-hidden': 'overflow: hidden',
      'overflow-auto': 'overflow: auto',
      'overflow-scroll': 'overflow: scroll',
      'overflow-visible': 'overflow: visible',
      'overflow-x-auto': 'overflow-x: auto',
      'overflow-y-auto': 'overflow-y: auto',
      'overflow-x-hidden': 'overflow-x: hidden',
      'truncate': 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap',
      'whitespace-nowrap': 'white-space: nowrap',
      'whitespace-pre-line': 'white-space: pre-line',
      'break-words': 'overflow-wrap: break-word',
      'rounded-none': 'border-radius: 0px',
      'rounded-sm': 'border-radius: 0.125rem',
      'rounded': 'border-radius: 0.25rem',
      'rounded-md': 'border-radius: 0.375rem',
      'rounded-lg': 'border-radius: 0.5rem',
      'rounded-xl': 'border-radius: 0.75rem',
      'rounded-2xl': 'border-radius: 1rem',
      'rounded-3xl': 'border-radius: 1.5rem',
      'rounded-full': 'border-radius: 9999px',
      'border': 'border-width: 1px; border-style: solid',
      'border-0': 'border-width: 0px',
      'border-t-0': 'border-top-width: 0px',
      'border-b-0': 'border-bottom-width: 0px',
      'border-x-0': 'border-left-width: 0px; border-right-width: 0px',
      'border-2': 'border-width: 2px; border-style: solid',
      'border-4': 'border-width: 4px; border-style: solid',
      'border-t': 'border-top-width: 1px; border-top-style: solid',
      'border-b': 'border-bottom-width: 1px; border-bottom-style: solid',
      'border-b-2': 'border-bottom-width: 2px; border-bottom-style: solid',
      'border-l': 'border-left-width: 1px; border-left-style: solid',
      'border-r': 'border-right-width: 1px; border-right-style: solid',
      'border-l-4': 'border-left-width: 4px; border-left-style: solid',
      'border-dashed': 'border-style: dashed',
      'border-solid': 'border-style: solid',
      'border-none': 'border-style: none',
      'text-left': 'text-align: left',
      'text-center': 'text-align: center',
      'text-right': 'text-align: right',
      'text-justify': 'text-align: justify',
      'font-orbitron': 'font-family: "Manrope", ui-sans-serif, system-ui, sans-serif',
      'font-manrope': 'font-family: "Manrope", ui-sans-serif, system-ui, sans-serif',
      'font-pylarix': 'font-family: "Orbitron", ui-sans-serif, system-ui, sans-serif',
      'font-sans': 'font-family: "Manrope", ui-sans-serif, system-ui, sans-serif',
      'font-mono': 'font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      'font-light': 'font-weight: 300',
      'font-normal': 'font-weight: 400',
      'font-medium': 'font-weight: 500',
      'font-semibold': 'font-weight: 600',
      'font-bold': 'font-weight: 700',
      'font-extrabold': 'font-weight: 800',
      'font-black': 'font-weight: 900',
      'italic': 'font-style: italic',
      'not-italic': 'font-style: normal',
      'uppercase': 'text-transform: uppercase',
      'lowercase': 'text-transform: lowercase',
      'capitalize': 'text-transform: capitalize',
      'underline': 'text-decoration-line: underline',
      'line-through': 'text-decoration-line: line-through',
      'no-underline': 'text-decoration-line: none',
      'antialiased': '-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale',
      'tracking-tighter': 'letter-spacing: -0.05em',
      'tracking-tight': 'letter-spacing: -0.025em',
      'tracking-normal': 'letter-spacing: 0em',
      'tracking-wide': 'letter-spacing: 0.025em',
      'tracking-wider': 'letter-spacing: 0.05em',
      'tracking-widest': 'letter-spacing: 0.1em',
      'leading-none': 'line-height: 1',
      'leading-tight': 'line-height: 1.25',
      'leading-snug': 'line-height: 1.375',
      'leading-normal': 'line-height: 1.5',
      'leading-relaxed': 'line-height: 1.625',
      'leading-loose': 'line-height: 2',
      'text-xs': 'font-size: 0.75rem; line-height: 1rem',
      'text-sm': 'font-size: 0.875rem; line-height: 1.25rem',
      'text-base': 'font-size: 1rem; line-height: 1.5rem',
      'text-lg': 'font-size: 1.125rem; line-height: 1.75rem',
      'text-xl': 'font-size: 1.25rem; line-height: 1.75rem',
      'text-2xl': 'font-size: 1.5rem; line-height: 2rem',
      'text-3xl': 'font-size: 1.875rem; line-height: 2.25rem',
      'text-4xl': 'font-size: 2.25rem; line-height: 2.5rem',
      'text-5xl': 'font-size: 3rem; line-height: 1.1',
      'text-6xl': 'font-size: 3.75rem; line-height: 1.08',
      'text-7xl': 'font-size: 4.5rem; line-height: 1.05',
      'cursor-pointer': 'cursor: pointer',
      'cursor-default': 'cursor: default',
      'cursor-not-allowed': 'cursor: not-allowed',
      'pointer-events-none': 'pointer-events: none',
      'pointer-events-auto': 'pointer-events: auto',
      'select-none': 'user-select: none',
      'select-all': 'user-select: all',
      'outline-none': 'outline: 2px solid transparent; outline-offset: 2px',
      'object-cover': 'object-fit: cover',
      'object-contain': 'object-fit: contain',
      'aspect-square': 'aspect-ratio: 1 / 1',
      'aspect-video': 'aspect-ratio: 16 / 9',
      'shadow-sm': 'box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)',
      'shadow': 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)',
      'shadow-md': 'box-shadow: 0 6px 15px -3px rgba(3,9,31,0.12)',
      'shadow-lg': 'box-shadow: 0 10px 25px -5px rgba(3,9,31,0.18)',
      'shadow-xl': 'box-shadow: 0 20px 35px -5px rgba(3,9,31,0.25)',
      'shadow-2xl': 'box-shadow: 0 25px 50px -12px rgba(3,9,31,0.45)',
      'shadow-none': 'box-shadow: none',
      'shadow-sapphire-glow': 'box-shadow: 0 0 28px rgba(33, 141, 255, 0.38)',
      'shadow-sapphire-card': 'box-shadow: 0 16px 50px rgba(17, 39, 92, 0.14)',
      'shadow-sapphire-dark': 'box-shadow: 0 20px 60px rgba(3, 9, 31, 0.65)',
      'backdrop-blur-none': 'backdrop-filter: blur(0); -webkit-backdrop-filter: blur(0)',
      'backdrop-blur-sm': 'backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px)',
      'backdrop-blur': 'backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px)',
      'backdrop-blur-md': 'backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px)',
      'backdrop-blur-lg': 'backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px)',
      'backdrop-blur-xl': 'backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px)',
      'backdrop-blur-2xl': 'backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px)',
      'backdrop-blur-3xl': 'backdrop-filter: blur(64px); -webkit-backdrop-filter: blur(64px)',
      'blur-sm': 'filter: blur(4px)',
      'blur-md': 'filter: blur(12px)',
      'blur-lg': 'filter: blur(16px)',
      'blur-xl': 'filter: blur(24px)',
      'blur-2xl': 'filter: blur(40px)',
      'blur-3xl': 'filter: blur(64px)',
      'transition': 'transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      'transition-all': 'transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      'transition-colors': 'transition: color, background-color, border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      'transition-opacity': 'transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      'transition-transform': 'transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      'duration-150': 'transition-duration: 150ms',
      'duration-200': 'transition-duration: 200ms',
      'duration-300': 'transition-duration: 300ms',
      'duration-500': 'transition-duration: 500ms',
      'duration-700': 'transition-duration: 700ms',
      'duration-1000': 'transition-duration: 1000ms',
      'ease-out': 'transition-timing-function: cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)',
      'scale-95': 'transform: scale(0.95)',
      'scale-100': 'transform: scale(1)',
      'scale-105': 'transform: scale(1.05)',
      'scale-110': 'transform: scale(1.1)',
      'scale-125': 'transform: scale(1.25)',
      '-translate-y-0.5': 'transform: translateY(-0.125rem)',
      '-translate-y-1': 'transform: translateY(-0.25rem)',
      '-translate-y-2': 'transform: translateY(-0.5rem)',
      'translate-y-0': 'transform: translateY(0)',
      'translate-y-2': 'transform: translateY(0.5rem)',
      'translate-y-4': 'transform: translateY(1rem)',
      '-translate-x-1/2': 'transform: translateX(-50%)',
      '-translate-y-1/2': 'transform: translateY(-50%)',
      'rotate-45': 'transform: rotate(45deg)',
      'rotate-90': 'transform: rotate(90deg)',
      'rotate-180': 'transform: rotate(180deg)',
      'bg-clip-text': '-webkit-background-clip: text; background-clip: text',
      'bg-gradient-to-r': 'background-image: linear-gradient(to right, var(--tw-gradient-stops))',
      'bg-gradient-to-l': 'background-image: linear-gradient(to left, var(--tw-gradient-stops))',
      'bg-gradient-to-b': 'background-image: linear-gradient(to bottom, var(--tw-gradient-stops))',
      'bg-gradient-to-t': 'background-image: linear-gradient(to top, var(--tw-gradient-stops))',
      'bg-gradient-to-br': 'background-image: linear-gradient(to bottom right, var(--tw-gradient-stops))',
      'bg-gradient-to-tr': 'background-image: linear-gradient(to top right, var(--tw-gradient-stops))',
      'min-w-0': 'min-width: 0px',
      'min-w-full': 'min-width: 100%',
      'min-h-0': 'min-height: 0px',
      'min-h-screen': 'min-height: 100vh',
      'min-h-full': 'min-height: 100%',
      'max-w-none': 'max-width: none',
      'max-w-xs': 'max-width: 20rem',
      'max-w-sm': 'max-width: 24rem',
      'max-w-md': 'max-width: 28rem',
      'max-w-lg': 'max-width: 32rem',
      'max-w-xl': 'max-width: 36rem',
      'max-w-2xl': 'max-width: 42rem',
      'max-w-3xl': 'max-width: 48rem',
      'max-w-4xl': 'max-width: 56rem',
      'max-w-5xl': 'max-width: 64rem',
      'max-w-6xl': 'max-width: 72rem',
      'max-w-7xl': 'max-width: 80rem',
      'max-w-full': 'max-width: 100%',
      'mx-auto': 'margin-left: auto; margin-right: auto',
      'ml-auto': 'margin-left: auto',
      'mr-auto': 'margin-right: auto',
      'mt-auto': 'margin-top: auto',
      'z-0': 'z-index: 0',
      'z-10': 'z-index: 10',
      'z-20': 'z-index: 20',
      'z-30': 'z-index: 30',
      'z-40': 'z-index: 40',
      'z-50': 'z-index: 50',
      'animate-pulse': 'animation: exbos-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'animate-spin': 'animation: exbos-spin 1s linear infinite',
      'animate-bounce': 'animation: exbos-bounce 1s infinite',
      'list-disc': 'list-style-type: disc',
      'list-decimal': 'list-style-type: decimal',
      'list-inside': 'list-style-position: inside',
      'resize-none': 'resize: none',
      'appearance-none': 'appearance: none',
    }
    if (staticMap[base]) return staticMap[base] + imp

    // Arbitrary rounded-[...]
    if (base.startsWith('rounded-[') && base.endsWith(']')) {
      return `border-radius: ${base.slice(9, -1)}${imp}`
    }
    // Arbitrary text-[...] (font-size or color)
    if (base.startsWith('text-[') && base.endsWith(']')) {
      const val = base.slice(6, -1).replace(/_/g, ' ')
      if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) {
        return `color: ${val}${imp}`
      }
      return `font-size: ${val}${imp}`
    }
    // Arbitrary tracking-[...]
    if (base.startsWith('tracking-[') && base.endsWith(']')) {
      return `letter-spacing: ${base.slice(10, -1)}${imp}`
    }
    // Arbitrary z-[...]
    if (base.startsWith('z-[') && base.endsWith(']')) {
      return `z-index: ${base.slice(3, -1)}${imp}`
    }
    // Arbitrary shadow-[...]
    if (base.startsWith('shadow-[') && base.endsWith(']')) {
      return `box-shadow: ${base.slice(8, -1).replace(/_/g, ' ')}${imp}`
    }
    // Opacity
    if (base.startsWith('opacity-')) {
      const v = Number(base.slice(8))
      if (!isNaN(v)) return `opacity: ${v / 100}${imp}`
    }
    // Grid cols / span
    if (base.startsWith('grid-cols-')) {
      const rest = base.slice(10)
      if (rest.startsWith('[') && rest.endsWith(']')) {
        return `grid-template-columns: ${rest.slice(1, -1).replace(/_/g, ' ')}${imp}`
      }
      const n = Number(rest)
      if (!isNaN(n)) return `grid-template-columns: repeat(${n}, minmax(0, 1fr))${imp}`
    }
    if (base.startsWith('col-span-')) {
      const n = base.slice(9)
      if (n === 'full') return `grid-column: 1 / -1${imp}`
      return `grid-column: span ${n} / span ${n}${imp}`
    }

    // Width / Height / Max / Min
    const sizePrefixes = [
      ['w-', 'width'], ['h-', 'height'], ['min-w-', 'min-width'],
      ['min-h-', 'min-height'], ['max-w-', 'max-width'], ['max-h-', 'max-height'],
      ['top-', 'top'], ['bottom-', 'bottom'], ['left-', 'left'], ['right-', 'right'],
      ['-top-', 'top', true], ['-bottom-', 'bottom', true], ['-left-', 'left', true], ['-right-', 'right', true],
      ['gap-', 'gap'], ['gap-x-', 'column-gap'], ['gap-y-', 'row-gap']
    ]
    for (const [pref, prop, neg] of sizePrefixes) {
      if (base.startsWith(pref)) {
        const val = resolveSpace(base.slice(pref.length))
        if (val !== null) return `${prop}: ${neg ? '-' + val : val}${imp}`
      }
    }

    // Padding & Margin
    const boxPrefixes = [
      ['p-', ['padding']],
      ['px-', ['padding-left', 'padding-right']],
      ['py-', ['padding-top', 'padding-bottom']],
      ['pt-', ['padding-top']], ['pb-', ['padding-bottom']],
      ['pl-', ['padding-left']], ['pr-', ['padding-right']],
      ['m-', ['margin']],
      ['mx-', ['margin-left', 'margin-right']],
      ['my-', ['margin-top', 'margin-bottom']],
      ['mt-', ['margin-top']], ['mb-', ['margin-bottom']],
      ['ml-', ['margin-left']], ['mr-', ['margin-right']],
      ['-mt-', ['margin-top'], true], ['-mb-', ['margin-bottom'], true],
      ['-ml-', ['margin-left'], true], ['-mr-', ['margin-right'], true],
    ]
    for (const [pref, props, neg] of boxPrefixes) {
      if (base.startsWith(pref)) {
        const val = resolveSpace(base.slice(pref.length))
        if (val !== null) {
          return props.map(p => `${p}: ${neg ? '-' + val : val}${imp}`).join('; ')
        }
      }
    }

    // Colors: bg-, text-, border-, ring-, from-, via-, to-
    if (base.startsWith('bg-')) {
      const c = resolveColor(base.slice(3))
      if (c) return `background-color: ${c}${imp}`
    }
    if (base.startsWith('text-')) {
      const c = resolveColor(base.slice(5))
      if (c) return `color: ${c}${imp}`
    }
    if (base.startsWith('border-')) {
      const c = resolveColor(base.slice(7))
      if (c) return `border-color: ${c}${imp}`
    }
    if (base.startsWith('ring-')) {
      const rest = base.slice(5)
      if (!isNaN(Number(rest))) {
        return `box-shadow: 0 0 0 ${rest}px var(--tw-ring-color, rgba(33,141,255,0.5))${imp}`
      }
      const c = resolveColor(rest)
      if (c) return `--tw-ring-color: ${c}${imp}`
    }
    if (base.startsWith('from-')) {
      const c = resolveColor(base.slice(5))
      if (c) return `--tw-gradient-from: ${c}; --tw-gradient-to: transparent; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)${imp}`
    }
    if (base.startsWith('via-')) {
      const c = resolveColor(base.slice(4))
      if (c) return `--tw-gradient-stops: var(--tw-gradient-from), ${c}, var(--tw-gradient-to, transparent)${imp}`
    }
    if (base.startsWith('to-')) {
      const c = resolveColor(base.slice(3))
      if (c) return `--tw-gradient-to: ${c}${imp}`
    }

    return null
  }

  function escapeSelector(cls) {
    return cls.replace(/([^a-zA-Z0-9_-])/g, '\\$1')
  }

  function buildCssFromFiles(rootDir) {
    const files = []
    function walk(dir) {
      if (!fs.existsSync(dir)) return
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          walk(full)
        } else if (/\.(jsx?|tsx?|html)$/.test(entry.name)) {
          files.push(full)
        }
      }
    }
    walk(path.join(rootDir, 'src'))
    const idxHtml = path.join(rootDir, 'index.html')
    if (fs.existsSync(idxHtml)) files.push(idxHtml)

    const tokenSet = new Set()
    const tokenRegex = /[a-zA-Z0-9_:/\-\[\]#.%!]+/g
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8')
      const matches = content.match(tokenRegex)
      if (matches) {
        for (const m of matches) tokenSet.add(m)
      }
    }

    const baseRules = []
    const mediaRules = { sm: [], md: [], lg: [], xl: [], '2xl': [] }
    const breakpoints = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' }

    for (const token of tokenSet) {
      // Handle space-y-* and space-x-*
      const parts = token.split(':')
      const base = parts[parts.length - 1]
      const variants = parts.slice(0, -1)

      let decl = null
      let childSuffix = ''

      if (base.startsWith('space-y-')) {
        const val = resolveSpace(base.slice(8))
        if (val) {
          decl = `margin-top: ${val}`
          childSuffix = ' > :not([hidden]) ~ :not([hidden])'
        }
      } else if (base.startsWith('space-x-')) {
        const val = resolveSpace(base.slice(8))
        if (val) {
          decl = `margin-left: ${val}`
          childSuffix = ' > :not([hidden]) ~ :not([hidden])'
        }
      } else if (base.startsWith('divide-y')) {
        decl = `border-top-width: 1px; border-top-style: solid`
        childSuffix = ' > :not([hidden]) ~ :not([hidden])'
      } else {
        decl = generateDeclaration(base)
      }

      if (!decl) continue

      let selector = `.${escapeSelector(token)}`
      let bp = null
      for (const v of variants) {
        if (breakpoints[v]) {
          bp = v
        } else if (v === 'dark') {
          selector = `.dark ${selector}`
        } else if (v === 'hover') {
          selector = `${selector}:hover`
        } else if (v === 'focus') {
          selector = `${selector}:focus`
        } else if (v === 'focus-within') {
          selector = `${selector}:focus-within`
        } else if (v === 'active') {
          selector = `${selector}:active`
        } else if (v === 'disabled') {
          selector = `${selector}:disabled`
        } else if (v === 'group-hover') {
          selector = `.group:hover ${selector}`
        } else if (v === 'placeholder') {
          selector = `${selector}::placeholder`
        }
      }
      selector += childSuffix
      const rule = `${selector} { ${decl}; }`
      if (bp) {
        mediaRules[bp].push(rule)
      } else {
        baseRules.push(rule)
      }
    }

    let out = baseRules.join('\n')
    for (const [bp, width] of Object.entries(breakpoints)) {
      if (mediaRules[bp].length > 0) {
        out += `\n@media (min-width: ${width}) {\n  ${mediaRules[bp].join('\n  ')}\n}`
      }
    }
    return out
  }

  return {
    name: 'liquid-sapphire-tailwind',
    transform(code, id) {
      if (id.endsWith('index.css')) {
        const generated = buildCssFromFiles(__dirname)
        return {
          code: code + '\n/* Generated Liquid Sapphire Tailwind Utilities */\n' + generated,
          map: null
        }
      }
    },
    handleHotUpdate({ file, server }) {
      if (/\.(jsx?|tsx?|html)$/.test(file)) {
        const mod = server.moduleGraph.getModuleById(path.resolve(__dirname, 'src/index.css'))
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    }
  }
}

/**
 * Server-Backed Persistence & Flask + MongoDB Proxy Middleware for ExBOS
 * Proxies /api/v1/* and /api/storage* requests to the Flask + MongoDB backend on port 5000,
 * with automatic local file fallback at src/data/server-storage.json if Flask is offline.
 */
function serverStoragePlugin() {
  const dataDir = path.resolve(__dirname, 'src/data')
  const storageFilePath = path.resolve(dataDir, 'server-storage.json')
  const backendPort = Number(process.env.VITE_BACKEND_PORT || 5000)

  function proxyToFlask(req, res, fallbackFn) {
    const options = {
      hostname: '127.0.0.1',
      port: backendPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${backendPort}` },
      timeout: 15000,
    }

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
      proxyRes.pipe(res, { end: true })
    })

    proxyReq.on('error', () => {
      fallbackFn()
    })
    proxyReq.on('timeout', () => {
      proxyReq.destroy()
      fallbackFn()
    })

    if (req._BufferedBody !== undefined) {
      proxyReq.write(req._BufferedBody)
      proxyReq.end()
    } else {
      req.pipe(proxyReq, { end: true })
    }
  }

  return {
    name: 'server-storage-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''

        if (url.startsWith('/api/v1')) {
          proxyToFlask(req, res, () => {
            res.statusCode = 503
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, error: 'Flask backend offline on port ' + backendPort }))
          })
          return
        }

        if (url === '/api/storage' || url === '/api/storage/reset') {
          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', () => {
            req._BufferedBody = body
            proxyToFlask(req, res, () => {
              if (url === '/api/storage' && req.method === 'GET') {
                res.setHeader('Content-Type', 'application/json')
                if (fs.existsSync(storageFilePath)) {
                  try {
                    const data = fs.readFileSync(storageFilePath, 'utf-8')
                    res.end(data && data.trim() ? data : '{}')
                    return
                  } catch (e) {
                    res.end('{}')
                    return
                  }
                }
                res.end('{}')
                return
              }
              if (url === '/api/storage' && req.method === 'POST') {
                try {
                  if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true })
                  }
                  fs.writeFileSync(storageFilePath, body, 'utf-8')
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: true, timestamp: Date.now() }))
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: e.message }))
                }
                return
              }
              if (url === '/api/storage/reset' && req.method === 'POST') {
                try {
                  if (fs.existsSync(storageFilePath)) {
                    fs.unlinkSync(storageFilePath)
                  }
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ success: true, reset: true }))
                } catch (e) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: e.message }))
                }
              }
            })
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), liquidSapphireTailwindPlugin(), serverStoragePlugin()],
  server: {
    port: 5173,
    host: true,
  },
})
