import React, { useEffect, useState, useCallback } from 'react'
import { MessageSquare, CheckCircle2, Send, RefreshCw, AlertCircle } from 'lucide-react'
import apiClient from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'
import { useExbos } from '../../../context/ExbosContext'

export default function UnpaidCustomersReminderPanel({
  activeArchId = 'buy-and-sell',
  hideFinancials = false
}) {
  const { addToast, updateDemoRecord, addTransaction, workspaces } = useExbos()
  const [unpaidList, setUnpaidList] = useState([])
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)

  const loadUnpaid = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.whatsappGetUnpaid(activeArchId)
      if (res?.ok && res?.data?.unpaid) {
        setUnpaidList(res.data.unpaid)
        return
      }
    } catch {} finally {
      setLoading(false)
    }

    // Fallback: compute locally from workspace records if backend is offline
    const records = workspaces?.[activeArchId]?.records || {}
    const localUnpaid = []
    ;(records.Sales || []).forEach((s) => {
      const total = Number(s.amountRWF || 0)
      const st = String(s.status || '').toLowerCase()
      const paid =
        s.paidAmountRWF !== undefined
          ? Number(s.paidAmountRWF)
          : st.includes('part')
          ? Math.round(total / 2)
          : st.includes('unpaid') || st.includes('credit')
          ? 0
          : total
      const rem =
        s.remainingAmountRWF !== undefined ? Number(s.remainingAmountRWF) : Math.max(0, total - paid)
      if (rem > 0) {
        localUnpaid.push({
          id: s.id,
          recordType: 'sale',
          bucket: 'Sales',
          customerName: s.customerName || s.customer || 'Walk-in Client',
          customerPhone: s.customerPhone || '',
          productsBought: s.title || s.productTitle || 'Product',
          totalAmountRWF: total,
          paidAmountRWF: paid,
          remainingAmountRWF: rem
        })
      }
    })
    setUnpaidList(localUnpaid)
  }, [activeArchId, workspaces])

  useEffect(() => {
    loadUnpaid()
  }, [loadUnpaid])

  const handleSendReminder = async (targetId = 'ALL', label = 'all unpaid customers') => {
    setSendingId(targetId)
    try {
      const res = await apiClient.whatsappSendReminders({
        archId: activeArchId,
        targetId
      })
      if (res?.ok && res?.data) {
        const { dispatchedCount, skippedCount } = res.data
        addToast &&
          addToast({
            type: dispatchedCount > 0 ? 'success' : 'warning',
            title: 'WhatsApp Reminders Processed',
            message: `Sent/queued ${dispatchedCount} reminder(s) for ${label}${
              skippedCount > 0 ? ` (${skippedCount} skipped: missing phone)` : ''
            }.`
          })
      }
    } catch (err) {
      addToast &&
        addToast({
          type: 'error',
          title: 'Reminder Failed',
          message: err?.message || 'Unable to send WhatsApp reminders.'
        })
    } finally {
      setSendingId(null)
    }
  }

  const handleVerifyPaid = async (item) => {
    setVerifyingId(item.id)
    try {
      const res = await apiClient.whatsappVerifyPayment({
        archId: activeArchId,
        targetId: item.id,
        amount: item.remainingAmountRWF,
        paymentMethod: 'MoMo / Cash'
      })
      if (res?.ok) {
        // Sync local workspace state immediately so tables & metrics update
        if (item.recordType === 'sale') {
          updateDemoRecord(activeArchId, item.bucket || 'Sales', item.id, {
            paidAmountRWF: item.totalAmountRWF,
            remainingAmountRWF: 0,
            status: 'Paid in Full'
          })
        } else {
          updateDemoRecord(activeArchId, 'Customers', item.id, {
            balanceOwedRWF: 0,
            status: 'Active'
          })
        }
        addTransaction({
          architectureId: activeArchId,
          recordId: item.recordType === 'sale' ? item.id : null,
          sourceModule: 'Sales',
          title: `Debt Payment Verified: ${item.customerName} (${item.productsBought})`,
          type: 'in',
          category: 'Customer Debt Collection',
          amountRWF: item.remainingAmountRWF,
          source: 'Dashboard'
        })
        setUnpaidList((prev) => prev.filter((u) => u.id !== item.id))
        addToast &&
          addToast({
            type: 'success',
            title: 'Payment Verified',
            message: `${item.customerName} cleared from Unpaid Customers list (${formatRWF(
              item.remainingAmountRWF,
              hideFinancials
            )}).`
          })
      }
    } catch (err) {
      addToast &&
        addToast({
          type: 'error',
          title: 'Verification Failed',
          message: err?.message || 'Could not verify payment.'
        })
    } finally {
      setVerifyingId(null)
    }
  }

  if (!loading && unpaidList.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-[#051238]/90 p-5 space-y-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-orbitron text-sm sm:text-base font-bold text-white">
              Unpaid Customers &amp; WhatsApp Reminders ({unpaidList.length})
            </h4>
            <p className="text-xs text-slate-300">
              Send itemized WhatsApp reminders (products bought, paid &amp; remaining) or verify payment to clear the unpaid list.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUnpaid}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => handleSendReminder('ALL', 'all unpaid customers')}
            disabled={sendingId === 'ALL' || unpaidList.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{sendingId === 'ALL' ? 'Sending...' : 'Remind All Unpaid'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {unpaidList.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-white">{item.customerName}</span>
                <span className="text-[11px] font-mono text-[#9EDCFF]">
                  {item.customerPhone || 'No phone'}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Bought:</span>{' '}
                <strong className="text-white">{item.productsBought}</strong>
              </div>
              <div className="flex flex-wrap gap-3 text-xs pt-1">
                <span className="text-emerald-300">
                  Paid: <strong>{formatRWF(item.paidAmountRWF, hideFinancials)}</strong>
                </span>
                <span className="text-amber-300">
                  Remaining: <strong>{formatRWF(item.remainingAmountRWF, hideFinancials)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSendReminder(item.id, item.customerName)}
                disabled={sendingId === item.id || !item.customerPhone}
                title={item.customerPhone ? 'Send WhatsApp Reminder' : 'Customer phone number required'}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{sendingId === item.id ? 'Sending...' : 'Send Reminder'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPaid(item)}
                disabled={verifyingId === item.id}
                className="px-3 py-1.5 rounded-lg bg-[#218DFF] hover:bg-[#1045CA] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{verifyingId === item.id ? 'Verifying...' : 'Verify Paid'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

