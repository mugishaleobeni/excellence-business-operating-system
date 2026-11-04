import React from 'react'

/**
 * Barcode utilities for rendering SVG barcodes and print markups
 */

export function renderBarcodeSvg(codeStr, height = 56) {
  const code = String(codeStr || '600123456789')
  const bars = []
  let x = 12

  // Start guard bars
  bars.push({ x, w: 3 })
  x += 5
  bars.push({ x, w: 2 })
  x += 5

  for (let i = 0; i < code.length; i++) {
    const v = code.charCodeAt(i) + i * 5
    const w1 = (v % 3) + 1
    const gap1 = ((v >> 1) % 2) + 2
    const w2 = ((v >> 2) % 3) + 1
    const gap2 = ((v >> 3) % 2) + 2

    bars.push({ x, w: w1 * 2 })
    x += w1 * 2 + gap1
    bars.push({ x, w: w2 * 2 })
    x += w2 * 2 + gap2
  }

  // End guard bars
  bars.push({ x, w: 2 })
  x += 5
  bars.push({ x, w: 3 })
  x += 12

  return (
    <svg
      className="w-full block"
      style={{ height: `${height}px`, minHeight: `${height}px` }}
      viewBox={`0 0 ${x} 64`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <rect width={x} height="64" fill="#ffffff" rx="4" />
      {bars.map((b, idx) => (
        <rect
          key={idx}
          x={b.x}
          y="4"
          width={b.w}
          height="56"
          fill="#000000"
        />
      ))}
    </svg>
  )
}

// Generate raw SVG markup string for print window
export function generateBarcodeSvgMarkup(codeStr) {
  const code = String(codeStr || '600123456789')
  const bars = []
  let x = 12

  bars.push({ x, w: 3 })
  x += 5
  bars.push({ x, w: 2 })
  x += 5

  for (let i = 0; i < code.length; i++) {
    const v = code.charCodeAt(i) + i * 5
    const w1 = (v % 3) + 1
    const gap1 = ((v >> 1) % 2) + 2
    const w2 = ((v >> 2) % 3) + 1
    const gap2 = ((v >> 3) % 2) + 2

    bars.push({ x, w: w1 * 2 })
    x += w1 * 2 + gap1
    bars.push({ x, w: w2 * 2 })
    x += w2 * 2 + gap2
  }

  bars.push({ x, w: 2 })
  x += 5
  bars.push({ x, w: 3 })
  x += 12

  const rects = bars
    .map(
      (b) =>
        `<rect x="${b.x}" y="4" width="${b.w}" height="56" fill="#000000" />`
    )
    .join('')

  return `<svg viewBox="0 0 ${x} 64" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;"><rect width="${x}" height="64" fill="#ffffff" rx="4"/>${rects}</svg>`
}

