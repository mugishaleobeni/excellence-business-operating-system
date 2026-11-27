import React, { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Video
} from 'lucide-react'
import { exbosApi } from '../../utils/apiClient'
import { formatRWF } from '../../utils/currencyWords'

export default function SuperAdminTrainingPanel({ addToast }) {
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [config, setConfig] = useState(null)
  const [bookings, setBookings] = useState([])
  const [courses, setCourses] = useState([])
  const [kpis, setKpis] = useState({})
  const [subTab, setSubTab] = useState('bookings') // 'bookings' | 'pricing' | 'courses'

  // Inline booking editor state
  const [editingBookingId, setEditingBookingId] = useState('')
  const [bkDraft, setBkDraft] = useState({})
  const [savingBk, setSavingBk] = useState(false)

  // New course form state
  const [newCourse, setNewCourse] = useState({
    titleEn: '',
    titleRw: '',
    architectureId: 'all',
    durationMinutes: 5,
    videoUrl: '',
    summaryEn: ''
  })

  const loadOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await exbosApi.superAdminGetTrainingOverview()
      const data = res?.data?.data || res?.data
      if (res?.ok && data) {
        setConfig(data.config || null)
        setBookings(Array.isArray(data.bookings) ? data.bookings : [])
        setCourses(Array.isArray(data.courses) ? data.courses : [])
        setKpis(data.kpis || {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const handleSaveConfig = async (overrideCfg = null) => {
    const target = overrideCfg || config
    if (!target) return
    setSavingConfig(true)
    try {
      const res = await exbosApi.superAdminUpdateTrainingConfig(target)
      const saved = res?.data?.data?.config || res?.data?.config
      if (!res?.ok) {
        addToast?.({
          type: 'error',
          title: 'Save Failed',
          message: res?.data?.error || 'Could not save training pricing.'
        })
        return
      }
      if (saved) setConfig(saved)
      addToast?.({
        type: 'success',
        title: 'Training Pricing & Promo Updated',
        message: target.freePromoActive
          ? 'Free Launch Promo Mode is ON — users can book free training.'
          : 'Paid Training Mode is ACTIVE — live RWF pricing is now enforced.'
      })
    } finally {
      setSavingConfig(false)
    }
  }

  const updatePkgField = (idx, key, val) => {
    setConfig((prev) => {
      if (!prev) return prev
      const nextPkgs = [...(prev.packages || [])]
      nextPkgs[idx] = { ...nextPkgs[idx], [key]: val }
      return { ...prev, packages: nextPkgs }
    })
  }

  const addNewPackage = () => {
    setConfig((prev) => {
      if (!prev) return prev
      const nextPkgs = [
        ...(prev.packages || []),
        {
          id: `custom-pkg-${Date.now().toString().slice(-4)}`,
          name: 'Custom Staff Training',
          nameRw: 'Amahugurwa Yihariye',
          description: 'Tailored training session for your team.',
          descriptionRw: 'Amahugurwa yihariye ku bakozi banyu.',
          durationLabel: '1.5 hours',
          maxStaff: 5,
          onlinePriceRWF: 25000,
          onsitePriceRWF: 40000,
          allowOnsite: true,
          isFirstSessionFree: false,
          enabled: true,
          highlights: ['Hands-on POS & stock walkthrough', 'Live Q&A with trainer']
        }
      ]
      return { ...prev, packages: nextPkgs }
    })
  }

  const removePackage = (idx) => {
    setConfig((prev) => {
      if (!prev) return prev
      const nextPkgs = (prev.packages || []).filter((_, i) => i !== idx)
      return { ...prev, packages: nextPkgs }
    })
  }

  const openBookingEditor = (bk) => {
    setEditingBookingId(bk.id)
    setBkDraft({
      paymentStatus: bk.paymentStatus || 'free',
      bookingStatus: bk.bookingStatus || 'requested',
      assignedTrainer: bk.assignedTrainer || '',
      meetingLink: bk.meetingLink || '',
      adminNotes: bk.adminNotes || ''
    })
  }

  const handleSaveBooking = async (bookingId) => {
    setSavingBk(true)
    try {
      const res = await exbosApi.superAdminUpdateTrainingBooking(bookingId, bkDraft)
      if (!res?.ok) {
        addToast?.({ type: 'error', title: 'Update Failed', message: res?.data?.error || 'Could not update booking.' })
        return
      }
      addToast?.({
        type: 'success',
        title: 'Training Booking Updated',
        message:
          bkDraft.bookingStatus === 'confirmed'
            ? 'Booking confirmed and WhatsApp notification sent to the business owner.'
            : 'Booking status saved.'
      })
      setEditingBookingId('')
      loadOverview()
    } finally {
      setSavingBk(false)
    }
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()
    if (!newCourse.titleEn.trim()) return
    const res = await exbosApi.superAdminUpsertTrainingCourse({
      ...newCourse,
      stepsEn: [newCourse.summaryEn || 'Follow the guided walkthrough in ExBOS.']
    })
    if (res?.ok) {
      addToast?.({ type: 'success', title: 'Lesson Added', message: 'New training lesson is live for users.' })
      setNewCourse({
        titleEn: '',
        titleRw: '',
        architectureId: 'all',
        durationMinutes: 5,
        videoUrl: '',
        summaryEn: ''
      })
      loadOverview()
    }
  }

  const handleDeleteCourse = async (courseId) => {
    const res = await exbosApi.superAdminDeleteTrainingCourse(courseId)
    if (res?.ok) {
      addToast?.({ type: 'info', title: 'Lesson Removed', message: 'Training lesson deleted.' })
      loadOverview()
    }
  }

  if (loading || !config) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-300">
        Loading Staff Training &amp; Monetization Console...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top KPI Cards + Free-to-Paid Switch */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#071644]/90 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Training Revenue
          </div>
          <div className="font-orbitron text-lg font-extrabold text-emerald-300 mt-1">
            {formatRWF(kpis.totalRevenueRWF || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Pending: {formatRWF(kpis.pendingRevenueRWF || 0)}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#071644]/90 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#9EDCFF]" /> Total Bookings
          </div>
          <div className="font-orbitron text-lg font-extrabold text-white mt-1">{kpis.totalBookings || 0}</div>
          <div className="text-[10px] text-amber-300 mt-0.5">
            {kpis.pendingApprovalsCount || 0} pending action
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#071644]/90 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-sky-400" /> Free Sessions
          </div>
          <div className="font-orbitron text-lg font-extrabold text-[#9EDCFF] mt-1">
            {kpis.freeSessionsCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Completed: {kpis.completedSessionsCount || 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#071644]/90 border border-[#218DFF]/40 flex flex-col justify-between gap-2">
          <div className="text-[10px] uppercase tracking-wider text-[#9EDCFF] font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Monetization Mode
          </div>
          <button
            type="button"
            disabled={savingConfig}
            onClick={() => {
              const next = { ...config, freePromoActive: !config.freePromoActive }
              setConfig(next)
              handleSaveConfig(next)
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-orbitron font-bold cursor-pointer transition ${
              config.freePromoActive
                ? 'bg-emerald-500/25 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/35'
                : 'bg-[#218DFF] text-white hover:bg-[#197be6]'
            }`}
          >
            {config.freePromoActive ? 'FREE PROMO: ON' : 'PAID MODE: ACTIVE'}
          </button>
        </div>
      </div>

      {/* Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
          {[
            { id: 'bookings', label: `Bookings & Payments (${bookings.length})` },
            { id: 'pricing', label: `Edit Packages & Prices (${(config.packages || []).length})` },
            { id: 'courses', label: `Academy Guides (${courses.length})` }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                subTab === t.id ? 'bg-[#218DFF] text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={loadOverview}
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* SUB-TAB 1: BOOKINGS & PAYMENT VERIFICATION */}
      {subTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-slate-400">
              No training bookings submitted yet.
            </div>
          ) : (
            bookings.map((bk) => {
              const isEditing = editingBookingId === bk.id
              return (
                <div
                  key={bk.id}
                  className="p-4 rounded-2xl bg-[#071644]/85 border border-white/15 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[#9EDCFF] font-bold">{bk.id}</span>
                        <span className="font-bold text-white">{bk.businessName}</span>
                        <span className="text-slate-400">({bk.requesterEmail})</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#218DFF]/20 text-[#9EDCFF] text-[10px] font-bold">
                          {bk.packageName}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {bk.preferredDate} · {bk.preferredTimeSlot} · {bk.deliveryMode?.toUpperCase()} · {bk.staffCount}{' '}
                        staff · Phone: <strong>{bk.requesterPhone || '—'}</strong> · Amount:{' '}
                        <strong className="text-emerald-300">
                          {Number(bk.finalAmountRWF || 0) <= 0 ? 'FREE' : formatRWF(bk.finalAmountRWF)}
                        </strong>
                        {bk.paymentReference ? ` · MoMo Ref: ${bk.paymentReference}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase text-amber-300">
                        {bk.paymentStatus} / {bk.bookingStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => (isEditing ? setEditingBookingId('') : openBookingEditor(bk))}
                        className="px-3 py-1.5 rounded-xl bg-[#218DFF] text-white font-bold cursor-pointer"
                      >
                        {isEditing ? 'Close' : 'Manage'}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <select
                        value={bkDraft.paymentStatus}
                        onChange={(e) => setBkDraft((p) => ({ ...p, paymentStatus: e.target.value }))}
                        className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      >
                        <option value="free">Payment: Free</option>
                        <option value="pending_verification">Payment: Pending Verification</option>
                        <option value="paid">Payment: Verified Paid</option>
                        <option value="rejected">Payment: Rejected</option>
                      </select>
                      <select
                        value={bkDraft.bookingStatus}
                        onChange={(e) => setBkDraft((p) => ({ ...p, bookingStatus: e.target.value }))}
                        className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      >
                        <option value="requested">Booking: Requested</option>
                        <option value="confirmed">Booking: Confirmed (Notify WhatsApp)</option>
                        <option value="completed">Booking: Completed</option>
                        <option value="cancelled">Booking: Cancelled</option>
                      </select>
                      <input
                        type="text"
                        value={bkDraft.assignedTrainer}
                        onChange={(e) => setBkDraft((p) => ({ ...p, assignedTrainer: e.target.value }))}
                        placeholder="Assigned Trainer Name"
                        className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                      <input
                        type="url"
                        value={bkDraft.meetingLink}
                        onChange={(e) => setBkDraft((p) => ({ ...p, meetingLink: e.target.value }))}
                        placeholder="Google Meet / Zoom Link"
                        className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                      <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                        <button
                          type="button"
                          disabled={savingBk}
                          onClick={() => handleSaveBooking(bk.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {savingBk ? 'Saving...' : 'Save & Notify Owner'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: LIVE EDITABLE PACKAGES, PRICES & PAYMENT DETAILS */}
      {subTab === 'pricing' && (
        <div className="space-y-5">
          {/* Promo & Payment Instructions */}
          <div className="p-5 rounded-2xl bg-[#071644]/85 border border-white/15 space-y-4 text-xs">
            <h3 className="font-orbitron text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#9EDCFF]" />
              Global Promo &amp; Mobile Money Instructions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Promo Label</label>
                <input
                  type="text"
                  value={config.freePromoLabel || ''}
                  onChange={(e) => setConfig((p) => ({ ...p, freePromoLabel: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Promo End Date (Optional)</label>
                <input
                  type="date"
                  value={config.freePromoEndsAt || ''}
                  onChange={(e) => setConfig((p) => ({ ...p, freePromoEndsAt: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">MTN MoMo Pay Code</label>
                <input
                  type="text"
                  value={config.paymentInstructions?.momoCode || ''}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      paymentInstructions: { ...(p.paymentInstructions || {}), momoCode: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Airtel / Support Phone</label>
                <input
                  type="text"
                  value={config.paymentInstructions?.airtelNumber || ''}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      paymentInstructions: { ...(p.paymentInstructions || {}), airtelNumber: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                />
              </div>
            </div>
          </div>

          {/* Live Editable Package Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron text-sm font-bold text-white">Editable Training Packages</h3>
              <button
                type="button"
                onClick={addNewPackage}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Package
              </button>
            </div>

            {(config.packages || []).map((pkg, idx) => (
              <div
                key={pkg.id || idx}
                className="p-4 rounded-2xl bg-[#071644]/85 border border-white/15 space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="lg:col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-1">Package Name</label>
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePkgField(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Online Price (RWF)</label>
                    <input
                      type="number"
                      min={0}
                      value={pkg.onlinePriceRWF}
                      onChange={(e) => updatePkgField(idx, 'onlinePriceRWF', Number(e.target.value || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-emerald-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">On-Site Price (RWF)</label>
                    <input
                      type="number"
                      min={0}
                      value={pkg.onsitePriceRWF}
                      onChange={(e) => updatePkgField(idx, 'onsitePriceRWF', Number(e.target.value || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Max Staff / Duration</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={pkg.maxStaff}
                        onChange={(e) => updatePkgField(idx, 'maxStaff', Number(e.target.value || 1))}
                        className="w-full px-2 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                      <input
                        type="text"
                        value={pkg.durationLabel}
                        onChange={(e) => updatePkgField(idx, 'durationLabel', e.target.value)}
                        className="w-full px-2 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(pkg.enabled)}
                        onChange={(e) => updatePkgField(idx, 'enabled', e.target.checked)}
                      />
                      Visible to Users
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(pkg.allowOnsite)}
                        onChange={(e) => updatePkgField(idx, 'allowOnsite', e.target.checked)}
                      />
                      Allow On-Site
                    </label>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-emerald-300">
                      <input
                        type="checkbox"
                        checked={Boolean(pkg.isFirstSessionFree)}
                        onChange={(e) => updatePkgField(idx, 'isFirstSessionFree', e.target.checked)}
                      />
                      1st Session Free
                    </label>
                  </div>

                  {(config.packages || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePackage(idx)}
                      className="text-rose-300 hover:text-rose-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                type="button"
                disabled={savingConfig}
                onClick={() => handleSaveConfig()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#0055FF] text-white text-xs font-orbitron font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? 'Saving...' : 'Save All Training Packages & Prices'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ACADEMY COURSES & VIDEO WALKTHROUGHS */}
      {subTab === 'courses' && (
        <div className="space-y-4 text-xs">
          <form
            onSubmit={handleAddCourse}
            className="p-4 rounded-2xl bg-[#071644]/85 border border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <input
              type="text"
              required
              value={newCourse.titleEn}
              onChange={(e) => setNewCourse((p) => ({ ...p, titleEn: e.target.value }))}
              placeholder="Lesson Title (English)"
              className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
            />
            <input
              type="text"
              value={newCourse.titleRw}
              onChange={(e) => setNewCourse((p) => ({ ...p, titleRw: e.target.value }))}
              placeholder="Lesson Title (Kinyarwanda)"
              className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
            />
            <input
              type="url"
              value={newCourse.videoUrl}
              onChange={(e) => setNewCourse((p) => ({ ...p, videoUrl: e.target.value }))}
              placeholder="Video URL (YouTube / Loom — optional)"
              className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
            />
            <select
              value={newCourse.architectureId}
              onChange={(e) => setNewCourse((p) => ({ ...p, architectureId: e.target.value }))}
              className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
            >
              <option value="all">All Architectures</option>
              <option value="buy-and-sell">Buy &amp; Sell</option>
              <option value="make-and-sell">Make &amp; Sell</option>
              <option value="services">Services</option>
              <option value="agriculture">Agriculture &amp; Livestock</option>
              <option value="food-hospitality">Food &amp; Hospitality</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input
              type="text"
              value={newCourse.summaryEn}
              onChange={(e) => setNewCourse((p) => ({ ...p, summaryEn: e.target.value }))}
              placeholder="Short lesson summary"
              className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Video className="w-4 h-4" /> Add Lesson
            </button>
          </form>

          <div className="space-y-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-[#071644]/70 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-white">{c.titleEn}</div>
                  <div className="text-[11px] text-slate-400">
                    Arch: {c.architectureId} · {c.durationMinutes} min
                    {c.videoUrl ? ` · Video attached` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCourse(c.id)}
                  className="p-2 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
