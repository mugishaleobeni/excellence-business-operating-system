import React, { useState } from 'react'
import { formatRWF } from '../../../utils/currencyWords'
import { CreditCard } from 'lucide-react'

export default function PaymentMethodDonutChart({
  data = [], // [{ label: 'Cash', value: 400000, color: '#10B981' }, ...]
  hideFinancials = false,
  title = 'Sales by Payment Method'
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const defaultColors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6']

  const sanitizedData = data.map((d, i) => ({
    label: d.label,
    value: Math.max(0, Number(d.value) || 0),
    color: d.color || defaultColors[i % defaultColors.length]
  }))

  const total = sanitizedData.reduce((acc, d) => acc + d.value, 0)

  // SVG Donut calculation
  const size = 180
  const strokeWidth = 26
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedPercent = 0
  const segments = sanitizedData.map((d, i) => {
    const percent = total > 0 ? (d.value / total) * 100 : 0
    const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`
    const strokeDashoffset = -((accumulatedPercent * circumference) / 100)
    accumulatedPercent += percent
    return {
      ...d,
      percent: Math.round(percent),
      strokeDasharray,
      strokeDashoffset,
      index: i
    }
  })

  return (
    <div className="exbos-glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#218DFF]" />
          <h4 className="font-orbitron text-sm font-bold text-white">{title}</h4>
        </div>
        <span className="text-[11px] font-mono text-[#9EDCFF]">
          Total: {formatRWF(total, hideFinancials)}
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-6 pt-2">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {total > 0 &&
              segments.map((seg) => {
                const isHovered = hoveredIdx === seg.index
                return (
                  <circle
                    key={seg.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(seg.index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
          </svg>

          {/* Central Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            {hoveredIdx !== null && segments[hoveredIdx] ? (
              <>
                <span className="text-[10px] font-bold uppercase text-slate-300 truncate max-w-[100px]">
                  {segments[hoveredIdx].label}
                </span>
                <span className="font-orbitron text-sm font-extrabold text-white">
                  {segments[hoveredIdx].percent}%
                </span>
                <span className="text-[9px] text-[#9EDCFF] font-mono">
                  {formatRWF(segments[hoveredIdx].value, hideFinancials)}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Total
                </span>
                <span className="font-orbitron text-xs sm:text-sm font-extrabold text-white truncate max-w-[120px]">
                  {formatRWF(total, hideFinancials)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="flex-1 w-full max-w-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[10px] font-orbitron uppercase">
                <th className="py-1.5 px-2 text-left">Payment Method</th>
                <th className="py-1.5 px-2 text-right">Received (RWF)</th>
                <th className="py-1.5 px-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {segments.map((s) => (
                <tr
                  key={s.label}
                  onMouseEnter={() => setHoveredIdx(s.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer ${
                    hoveredIdx === s.index ? 'bg-white/10' : ''
                  }`}
                >
                  <td className="py-2 px-2 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-white font-medium">{s.label}</span>
                  </td>
                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-200">
                    {formatRWF(s.value, hideFinancials)}
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-slate-400">
                    {s.percent}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/15 font-bold">
                <td className="py-2 px-2 text-white font-orbitron">Total</td>
                <td className="py-2 px-2 text-right font-mono text-emerald-400 font-extrabold">
                  {formatRWF(total, hideFinancials)}
                </td>
                <td className="py-2 px-2 text-right font-mono text-slate-300">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

