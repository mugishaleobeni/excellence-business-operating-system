import React from 'react'

/**
 * Reusable ExBOS Sapphire-Glass Skeleton Loaders.
 * Non-intrusive shimmer placeholders displayed only during active data fetches.
 */

export function KpiCardsSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl p-5 bg-[#071544]/70 border border-white/10 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-white/15" />
            <div className="h-8 w-8 rounded-xl bg-white/10" />
          </div>
          <div className="h-7 w-32 rounded-lg bg-white/20" />
          <div className="h-2.5 w-20 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export function ListRowsSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse py-2">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-2xl bg-[#03091F]/65 border border-white/10 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-3.5 w-2/5 rounded-full bg-white/15" />
              <div className="h-2.5 w-3/5 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-white/10 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function TableRowsSkeleton({ rows = 6, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`sk-row-${rIdx}`} className="border-b border-white/5 animate-pulse">
          {Array.from({ length: cols }).map((__, cIdx) => (
            <td key={`sk-col-${cIdx}`} className="py-4 px-3">
              <div
                className={`h-3.5 rounded-full bg-white/15 ${
                  cIdx === 0 ? 'w-36' : cIdx === cols - 1 ? 'w-24 ml-auto' : 'w-24'
                }`}
              />
              {cIdx === 0 && <div className="h-2.5 w-44 rounded-full bg-white/10 mt-2" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 p-2 sm:p-4 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-52 rounded-lg bg-white/15" />
          <div className="h-3 w-72 rounded-full bg-white/10" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-white/10" />
      </div>
      <KpiCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-3xl p-6 bg-[#071544]/70 border border-white/10 space-y-4">
          <div className="h-4 w-44 rounded-full bg-white/15" />
          <div className="h-44 w-full rounded-2xl bg-white/10" />
        </div>
        <div className="rounded-3xl p-6 bg-[#071544]/70 border border-white/10 space-y-3">
          <div className="h-4 w-36 rounded-full bg-white/15" />
          <ListRowsSkeleton rows={3} />
        </div>
      </div>
    </div>
  )
}
