import React, { useEffect, useState, useCallback } from 'react'
import { X, Clock, CheckCircle2, AlertTriangle, Printer, DollarSign, ShieldAlert } from 'lucide-react'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF, formatWithCommas, parseNumericInput } from '../../../utils/currencyWords'
import { printThermalReceipt } from '../../../utils/printDocument'
import { useExbos } from '../../../context/ExbosContext'
import { readOfflineJsonCache, writeOfflineJsonCache } from '../../../utils/offlineStorage'

export default function CashierShiftModal({
  isOpen,
  onClose,
  activeArchId = 'buy-and-sell',
  activeBranchId = 'main',
  user = null,
  addToast
}) {
  const { enqueueOfflineAction } = useExbos()
  const [loading, setLoading] = useState(true)
  const [activeShift, setActiveShift] = useState(null)
  const [shifts, setShifts] = useState([])
  const [openingFloat, setOpeningFloat] = useState('0')
  const [countedCash, setCountedCash] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const shiftCacheKey = `exbos_shifts_${activeBranchId || 'main'}`

  const loadShifts = useCallback(async () => {
    const cached = readOfflineJsonCache(shiftCacheKey)
    if (cached) {
      setActiveShift(cached.activeShift || null)
      setShifts(Array.isArray(cached.shifts) ? cached.shifts : [])
      setLoading(false)
    } else {
      setLoading(true)
    }
    try {
      const res = await exbosApi.getShifts(activeBranchId)
      const data = res?.data?.data || res?.data
      if (res?.ok && data) {
        const nextActive = data.activeShift || null
        const nextList = Array.isArray(data.shifts) ? data.shifts : []
        setActiveShift(nextActive)
        setShifts(nextList)
        writeOfflineJsonCache(shiftCacheKey, { activeShift: nextActive, shifts: nextList })
      }
    } finally {
      setLoading(false)
    }
  }, [activeBranchId, shiftCacheKey])

  useEffect(() => {
    if (isOpen) {
      loadShifts()
      setCountedCash('')
      setNotes('')
    }
  }, [isOpen, loadShifts])

  if (!isOpen) return null

  const handleOpenShift = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const openPayload = {
      branchId: activeBranchId || 'main',
      archId: activeArchId,
      openingFloatRWF: parseNumericInput(openingFloat) || 0,
      cashierName: user?.name || user?.email || 'Cashier',
      notes: notes.trim()
    }
    const openOfflineLocally = () => {
      const localShift = {
        id: `SHF-${Date.now()}`,
        ...openPayload,
        status: 'Open',
        openedAt: new Date().toISOString(),
        _pendingSync: true
      }
      setActiveShift(localShift)
      writeOfflineJsonCache(shiftCacheKey, { activeShift: localShift, shifts })
      enqueueOfflineAction?.({ type: 'shift_open', payload: openPayload })
      addToast?.({
        type: 'warning',
        title: 'Shift Opened Locally (Offline)',
        message: 'Drawer float saved on this device and will sync automatically when online.'
      })
      setNotes('')
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        openOfflineLocally()
        return
      }
      const res = await exbosApi.openShift(openPayload)
      if (!res?.ok && (res?.offline || res?.status === 0)) {
        openOfflineLocally()
        return
      }
      if (!res?.ok) {
        addToast?.({ type: 'error', title: 'Could Not Open Shift', message: res?.data?.error || res?.error || 'Try again.' })
        return
      }
      addToast?.({ type: 'success', title: 'Cashier Shift Opened', message: 'Drawer float recorded. Happy selling!' })
      setNotes('')
      loadShifts()
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseShift = async (e) => {
    e.preventDefault()
    if (!activeShift) return
    setSubmitting(true)
    const closePayload = {
      countedCashRWF: parseNumericInput(countedCash) || 0,
      closingNotes: notes.trim()
    }
    const closeOfflineLocally = () => {
      const closedShift = {
        ...activeShift,
        ...closePayload,
        status: 'Closed',
        closedAt: new Date().toISOString(),
        expectedCashRWF: activeShift.openingFloatRWF || 0,
        varianceRWF: (closePayload.countedCashRWF || 0) - (activeShift.openingFloatRWF || 0),
        _pendingSync: true
      }
      const nextShifts = [closedShift, ...shifts.filter((s) => s.id !== closedShift.id)]
      setActiveShift(null)
      setShifts(nextShifts)
      writeOfflineJsonCache(shiftCacheKey, { activeShift: null, shifts: nextShifts })
      enqueueOfflineAction?.({ type: 'shift_close', shiftId: activeShift.id, payload: closePayload })
      addToast?.({
        type: 'warning',
        title: 'Shift Closed Locally (Offline)',
        message: 'Z-Report saved on this device and will sync automatically when online.'
      })
      setCountedCash('')
      setNotes('')
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        closeOfflineLocally()
        return
      }
      const res = await exbosApi.closeShift(activeShift.id, closePayload)
      if (!res?.ok && (res?.offline || res?.status === 0)) {
        closeOfflineLocally()
        return
      }
      const closed = res?.data?.data?.shift || res?.data?.shift
      if (!res?.ok) {
        addToast?.({ type: 'error', title: 'Close Failed', message: res?.data?.error || res?.error || 'Could not close shift.' })
        return
      }
      const variance = Number(closed?.varianceRWF || 0)
      addToast?.({
        type: variance < -1000 ? 'warning' : 'success',
        title: 'Shift Closed & Z-Report Saved',
        message:
          variance < 0
            ? `Cash shortage of ${formatRWF(Math.abs(variance))} detected (Owner notified).`
            : variance > 0
            ? `Cash overage of ${formatRWF(variance)} recorded.`
            : 'Cash drawer balanced 100%.'
      })
      setCountedCash('')
      setNotes('')
      loadShifts()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintZReport = (sh) => {
    printThermalReceipt(
      {
        id: sh.id,
        type: 'Shift Z-Report',
        date: String(sh.closedAt || sh.openedAt || '').slice(0, 16).replace('T', ' '),
        recipientName: `Cashier: ${sh.cashierName}`,
        amount: sh.totalSalesRWF || 0,
        paidAmount: sh.countedCashRWF || 0,
        paymentMethod: `Expected Cash: ${formatRWF(sh.expectedCashRWF || 0)}`,
        items: [
          { name: 'Opening Float', quantity: 1, unit: 'RWF', unitPrice: sh.openingFloatRWF || 0, total: sh.openingFloatRWF || 0 },
          { name: 'Cash Sales', quantity: 1, unit: 'RWF', unitPrice: sh.cashSalesRWF || 0, total: sh.cashSalesRWF || 0 },
          { name: 'MTN MoMo / Mobile', quantity: 1, unit: 'RWF', unitPrice: sh.momoSalesRWF || 0, total: sh.momoSalesRWF || 0 },
          { name: 'Cash Expenses', quantity: 1, unit: 'RWF', unitPrice: sh.cashExpensesRWF || 0, total: -(sh.cashExpensesRWF || 0) },
          { name: 'Drawer Variance', quantity: 1, unit: 'RWF', unitPrice: sh.varianceRWF || 0, total: sh.varianceRWF || 0 }
        ]
      },
      { businessName: user?.businessName || 'ExBOS Business', phone: user?.phone || '' },
      '80mm'
    )
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#06143D] border border-[#218DFF]/40 shadow-2xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-[#9EDCFF]" />
            <div>
              <h3 className="font-orbitron text-sm font-bold">Cashier Shift &amp; Daily Z-Report</h3>
              <p className="text-[11px] text-slate-300">
                Open cash drawer float, reconcile counted cash vs system sales, and print 80mm Z-Reports.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {loading ? (
            <div className="py-8 text-center text-slate-300">Loading shift ledger...</div>
          ) : activeShift ? (
            <form onSubmit={handleCloseShift} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/35 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-extrabold">
                    SHIFT OPEN · {activeShift.id}
                  </span>
                  <p className="text-white font-bold mt-1">
                    Cashier: {activeShift.cashierName} · Opening Float: {formatRWF(activeShift.openingFloatRWF)}
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Opened: {String(activeShift.openedAt || '').slice(0, 16).replace('T', ' ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Actual Counted Cash in Drawer (RWF)</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={countedCash}
                    onChange={(e) => setCountedCash(formatWithCommas(e.target.value))}
                    placeholder="e.g. 145,000"
                    className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/20 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Closing Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Handed cash to manager"
                    className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-orbitron font-extrabold cursor-pointer"
                >
                  {submitting ? 'Closing...' : 'Close Shift & Generate Z-Report'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOpenShift} className="p-4 rounded-2xl bg-[#030B24] border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-[#9EDCFF] font-bold">
                <DollarSign className="w-4 h-4" /> Open New Cashier Shift
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Opening Cash Drawer Float (RWF)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(formatWithCommas(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/20 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Shift Note (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Morning shift"
                    className="w-full px-3 py-2 rounded-xl bg-[#06143D] border border-white/20 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white font-orbitron font-bold cursor-pointer"
                >
                  {submitting ? 'Opening...' : 'Open Shift'}
                </button>
              </div>
            </form>
          )}

          {/* Recent Closed Z-Reports */}
          <div className="space-y-2">
            <h4 className="font-orbitron text-[11px] uppercase tracking-wider text-[#9EDCFF] font-bold">
              Recent Shift Z-Reports ({shifts.filter((s) => s.status === 'closed').length})
            </h4>
            {shifts.filter((s) => s.status === 'closed').length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No closed shifts yet.</p>
            ) : (
              shifts
                .filter((s) => s.status === 'closed')
                .map((sh) => {
                  const v = Number(sh.varianceRWF || 0)
                  return (
                    <div
                      key={sh.id}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#9EDCFF] font-bold">{sh.id}</span>
                          <span className="font-bold text-white">{sh.cashierName}</span>
                          {v < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              <ShieldAlert className="w-3 h-3" /> Shortage {formatRWF(Math.abs(v))}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> {v === 0 ? 'Balanced' : `+${formatRWF(v)}`}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300">
                          Sales: <strong>{formatRWF(sh.totalSalesRWF)}</strong> (Cash {formatRWF(sh.cashSalesRWF)} · MoMo{' '}
                          {formatRWF(sh.momoSalesRWF)}) · Counted: <strong>{formatRWF(sh.countedCashRWF)}</strong> / Expected:{' '}
                          {formatRWF(sh.expectedCashRWF)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintZReport(sh)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print 80mm Z-Report
                      </button>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

