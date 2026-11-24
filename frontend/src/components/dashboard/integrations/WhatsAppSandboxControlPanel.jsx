import React, { useCallback, useEffect, useState } from 'react'
import {
  MessageSquare,
  ShieldCheck,
  Copy,
  Check,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  Clock,
  ExternalLink,
  Bell,
  CheckCircle2,
  AlertCircle,
  Radio,
  BarChart3
} from 'lucide-react'
import { apiClient } from '../../../utils/apiClient'

export default function WhatsAppSandboxControlPanel({ activeArchId = 'buy-and-sell' }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingMode, setSavingMode] = useState(false)
  const [addingRecipient, setAddingRecipient] = useState(false)
  const [sendingTo, setSendingTo] = useState('')
  const [sendingSummary, setSendingSummary] = useState(false)

  const [newPhone, setNewPhone] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newRole, setNewRole] = useState('owner')

  const [copiedField, setCopiedField] = useState('')
  const [notice, setNotice] = useState(null)
  const [lastDelivery, setLastDelivery] = useState(null)

  const loadConfig = useCallback(async () => {
    setLoading(true)
    const res = await apiClient.whatsappGetConfig()
    if (res.ok && res.data?.data) {
      setConfig(res.data.data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const showFeedback = (type, text) => {
    setNotice({ type, text })
    setTimeout(() => setNotice(null), 5000)
  }

  const handleCopy = (key, value) => {
    if (!value) return
    navigator.clipboard?.writeText(value)
    setCopiedField(key)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const handleToggleMode = async (nextMode) => {
    setSavingMode(true)
    const res = await apiClient.whatsappUpdateConfig({ mode: nextMode })
    setSavingMode(false)
    if (res.ok) {
      showFeedback('success', `WhatsApp delivery switched to ${nextMode.toUpperCase()} mode.`)
      loadConfig()
    } else {
      showFeedback('error', res.error || 'Could not update WhatsApp mode.')
    }
  }

  const handleToggleAlert = async (alertKey) => {
    const current = Boolean(config?.alerts?.[alertKey])
    const res = await apiClient.whatsappUpdateConfig({
      alerts: { [alertKey]: !current }
    })
    if (res.ok) {
      loadConfig()
    } else {
      showFeedback('error', res.error || 'Could not update alert preference.')
    }
  }

  const handleAddRecipient = async (e) => {
    e.preventDefault()
    if (!newPhone.trim()) return
    setAddingRecipient(true)
    const res = await apiClient.whatsappAddRecipient({
      phone: newPhone.trim(),
      label: newLabel.trim() || 'Registered Recipient',
      role: newRole
    })
    setAddingRecipient(false)
    if (res.ok) {
      setNewPhone('')
      setNewLabel('')
      showFeedback('success', res.data?.message || 'Recipient registered for live Meta WhatsApp delivery.')
      loadConfig()
    } else {
      showFeedback('error', res.error || res.data?.error || 'Could not register recipient number.')
    }
  }

  const handleRemoveRecipient = async (phone) => {
    const res = await apiClient.whatsappRemoveRecipient(phone)
    if (res.ok) {
      showFeedback('success', `Removed ${phone} from registered recipients.`)
      loadConfig()
    } else {
      showFeedback('error', res.error || 'Could not remove recipient.')
    }
  }

  const handleTestSend = async (phone, testType = 'custom') => {
    setSendingTo(`${phone}:${testType}`)
    const res = await apiClient.whatsappTestSend({
      phone,
      testType,
      architectureId: activeArchId
    })
    setSendingTo('')
    if (res.ok && res.data?.data) {
      const delivery = res.data.data
      setLastDelivery(delivery)
      if (delivery.sent) {
        showFeedback('success', `Delivered to ${delivery.to} (${delivery.status}).`)
      } else {
        showFeedback(
          'info',
          delivery.note || delivery.error || `Status: ${delivery.status}. Use the 1-click wa.me fallback below.`
        )
      }
      loadConfig()
    } else {
      showFeedback('error', res.error || 'Test message failed.')
    }
  }

  const handleSendDailySummary = async () => {
    setSendingSummary(true)
    const res = await apiClient.whatsappSendDailySummary({ architectureId: activeArchId })
    setSendingSummary(false)
    if (res.ok && res.data?.data) {
      const deliveries = res.data.data.deliveries || []
      if (deliveries.length > 0) {
        setLastDelivery(deliveries[0])
        showFeedback('success', res.data.message || `Live summary sent to ${deliveries.length} recipient(s).`)
      } else {
        showFeedback('info', res.data.message || 'Add a registered recipient number first.')
      }
      loadConfig()
    } else {
      showFeedback('error', res.error || 'Could not send live summary.')
    }
  }

  const mode = config?.mode || 'sandbox'
  const recipients = config?.registeredRecipients || []
  const alerts = config?.alerts || {}
  const recentLogs = config?.recentLogs || []

  return (
    <div className="sapphire-analytics-card p-5 sm:p-6 space-y-5 lg:col-span-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/35 flex items-center justify-center text-emerald-300 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-orbitron text-sm sm:text-base font-bold text-[#071544] dark:text-white">
                Meta WhatsApp Hybrid Sandbox &amp; Live Alerts Center
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-orbitron font-bold uppercase ${
                  mode === 'production'
                    ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                    : 'bg-amber-500/20 border border-amber-400/40 text-amber-300'
                }`}
              >
                {mode === 'production' ? 'Production (All Numbers)' : 'Sandbox (Registered Recipients + wa.me Fallback)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Register your Meta-verified recipient phone numbers (up to 5 during Business Verification) to send &amp; receive real WhatsApp alerts, 2-way commands, and automatic 24h session tracking today. Unregistered numbers automatically fall back to 1-click <code>wa.me</code> links.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={savingMode || mode === 'sandbox'}
            onClick={() => handleToggleMode('sandbox')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition ${
              mode === 'sandbox'
                ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200'
                : 'bg-white/10 border border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            Sandbox Mode
          </button>
          <button
            type="button"
            disabled={savingMode || mode === 'production'}
            onClick={() => handleToggleMode('production')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition ${
              mode === 'production'
                ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200'
                : 'bg-white/10 border border-white/15 text-slate-300 hover:text-white'
            }`}
          >
            Production Mode
          </button>
          <button
            type="button"
            onClick={loadConfig}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-[#9EDCFF] cursor-pointer"
            title="Refresh WhatsApp status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'error'
              ? 'bg-rose-500/15 border-rose-400/40 text-rose-200'
              : notice.type === 'info'
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
          }`}
        >
          {notice.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Meta Webhook Setup Box (2-Way Live Connection) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#03091F]/60 border border-[#218DFF]/25">
        <div>
          <div className="text-[10px] font-orbitron uppercase tracking-wider text-[#9EDCFF] mb-1">
            Meta Webhook Callback URL
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={config?.webhookUrl || 'https://exbos.onrender.com/api/v1/whatsapp/webhook'}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#050D2B] border border-white/15 text-[11px] font-mono text-white"
            />
            <button
              type="button"
              onClick={() => handleCopy('webhook', config?.webhookUrl)}
              className="px-2.5 py-1.5 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'webhook' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-orbitron uppercase tracking-wider text-[#9EDCFF] mb-1">
            Meta Webhook Verify Token
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={config?.verifyToken || 'exbos-whatsapp-verify-2026'}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#050D2B] border border-white/15 text-[11px] font-mono text-white"
            />
            <button
              type="button"
              onClick={() => handleCopy('token', config?.verifyToken)}
              className="px-2.5 py-1.5 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 text-[#9EDCFF] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedField === 'token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Registered Recipient Form */}
      <form onSubmit={handleAddRecipient} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Meta Registered Phone Number *
          </label>
          <input
            type="tel"
            required
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="+250788123456"
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Label / Owner Name
          </label>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Owner Phone / Admin"
            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Alert Role
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#071544] border border-white/20 text-xs text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="owner">Owner</option>
            <option value="super_admin">Super Admin</option>
            <option value="staff">Staff / Branch</option>
            <option value="tester">Tester</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={addingRecipient}
            className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addingRecipient ? 'Saving...' : 'Register'}</span>
          </button>
        </div>
      </form>

      {/* Registered Recipients List with 24h Session Window Status */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase">
            Registered Recipients ({recipients.length})
          </span>
          <button
            type="button"
            disabled={sendingSummary}
            onClick={handleSendDailySummary}
            className="px-3 py-1.5 rounded-xl bg-[#218DFF]/20 hover:bg-[#218DFF]/30 border border-[#218DFF]/40 text-[11px] font-bold text-[#9EDCFF] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{sendingSummary ? 'Sending Summary...' : 'Send Live Business Summary Now'}</span>
          </button>
        </div>

        {recipients.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 text-center">
            No registered recipients yet. Add the phone number you verified in Meta Developers above to start receiving live WhatsApp alerts and 2-way commands immediately.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recipients.map((rec) => (
              <div
                key={rec.phone}
                className="p-3.5 rounded-xl bg-[#03091F]/70 border border-white/15 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-white flex flex-wrap items-center gap-1.5">
                      <span>{rec.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] uppercase font-mono">
                        {rec.role}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-300 mt-0.5">{rec.phone}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(rec.phone)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 24h Window Status */}
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {rec.sessionWindowOpen ? (
                    <span className="text-emerald-300 font-semibold">
                      24h Window Open ({rec.windowHoursLeft}h left — Full Custom Messages Active)
                    </span>
                  ) : (
                    <span className="text-amber-300">
                      24h Window Closed — Send Template or reply &quot;Hi&quot; to ExBOS WhatsApp
                    </span>
                  )}
                </div>

                {/* Quick Test Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    disabled={sendingTo === `${rec.phone}:custom`}
                    onClick={() => handleTestSend(rec.phone, 'custom')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{sendingTo === `${rec.phone}:custom` ? 'Sending...' : 'Test Text'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={sendingTo === `${rec.phone}:template`}
                    onClick={() => handleTestSend(rec.phone, 'template')}
                    className="px-2.5 py-1 rounded-lg bg-[#218DFF]/20 hover:bg-[#218DFF]/30 border border-[#218DFF]/30 text-[#9EDCFF] text-[10px] font-bold cursor-pointer"
                  >
                    {sendingTo === `${rec.phone}:template` ? 'Sending...' : 'Ping Template (hello_world)'}
                  </button>
                  <button
                    type="button"
                    disabled={sendingTo === `${rec.phone}:summary`}
                    onClick={() => handleTestSend(rec.phone, 'summary')}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold cursor-pointer"
                  >
                    {sendingTo === `${rec.phone}:summary` ? 'Sending...' : 'Send Summary'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Delivery Result + 1-Click wa.me Fallback */}
      {lastDelivery && (
        <div className="p-3.5 rounded-xl bg-[#050D2B] border border-[#9EDCFF]/25 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5 min-w-0">
            <div className="font-bold text-white">
              Latest Dispatch to {lastDelivery.to}:{' '}
              <span className={lastDelivery.sent ? 'text-emerald-300' : 'text-amber-300'}>
                {lastDelivery.status}
              </span>
            </div>
            {(lastDelivery.note || lastDelivery.error) && (
              <div className="text-[11px] text-slate-300">{lastDelivery.note || lastDelivery.error}</div>
            )}
          </div>
          {lastDelivery.waMeLink && (
            <a
              href={lastDelivery.waMeLink}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1.5 no-underline shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in WhatsApp (wa.me)</span>
            </a>
          )}
        </div>
      )}

      {/* Automated Alert Switches */}
      <div className="pt-2 border-t border-white/10 space-y-2">
        <div className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          <span>Automated Live WhatsApp Alerts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[
            { key: 'branchManagerActivated', label: 'Branch Manager Activated' },
            { key: 'paymentProofSubmitted', label: 'Subscription Payment Proofs' },
            { key: 'lowStockAlert', label: 'Low-Stock Warnings' },
            { key: 'dailySummary', label: 'Daily Business Summary' }
          ].map((item) => {
            const on = Boolean(alerts[item.key])
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleToggleAlert(item.key)}
                className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between gap-2 cursor-pointer transition ${
                  on
                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] font-mono uppercase">{on ? 'ON' : 'OFF'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent WhatsApp Activity Log */}
      {recentLogs.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="text-xs font-orbitron font-bold text-[#9EDCFF] uppercase flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Recent WhatsApp Delivery &amp; Inbound Log</span>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
            {recentLogs.slice(0, 8).map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#03091F]/70 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px]"
              >
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] uppercase font-bold mr-2 ${
                      log.direction === 'inbound'
                        ? 'bg-sky-500/20 text-sky-300'
                        : log.sent
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {log.direction === 'inbound' ? 'INBOUND' : log.status || 'OUTBOUND'}
                  </span>
                  <span className="font-mono text-slate-300 mr-2">{log.from || log.to}</span>
                  <span className="text-slate-200 truncate">{String(log.message || '').slice(0, 90)}</span>
                </div>
                {log.waMeLink && !log.sent && log.direction !== 'inbound' && (
                  <a
                    href={log.waMeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-emerald-300 hover:underline no-underline shrink-0"
                  >
                    Open wa.me
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

