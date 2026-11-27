import React, { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  PlayCircle,
  Calendar,
  Users,
  Award,
  Clock,
  Sparkles,
  ExternalLink,
  Printer,
  ShieldCheck,
  Smartphone,
  Video,
  MapPin
} from 'lucide-react'
import { useExbos } from '../../../context/ExbosContext'
import { exbosApi } from '../../../utils/apiClient'
import { formatRWF } from '../../../utils/currencyWords'

export default function TrainingAcademyView({ activeArchId = 'buy-and-sell' }) {
  const { user, language = 'en', addToast } = useExbos()
  const [activeTab, setActiveTab] = useState('guides') // 'guides' | 'book' | 'bookings'
  const [guideLang, setGuideLang] = useState(language === 'rw' ? 'rw' : 'en')
  const [loading, setLoading] = useState(true)

  const [catalog, setCatalog] = useState(null)
  const [coursesData, setCoursesData] = useState({
    courses: [],
    completedLessonIds: [],
    progressPercent: 0,
    certificateId: '',
    certifiedAt: ''
  })
  const [bookings, setBookings] = useState([])
  const [expandedLessonId, setExpandedLessonId] = useState('')
  const [togglingId, setTogglingId] = useState('')

  // Booking form state
  const [selectedPkg, setSelectedPkg] = useState(null)
  const [deliveryMode, setDeliveryMode] = useState('online')
  const [staffCount, setStaffCount] = useState(2)
  const [preferredDate, setPreferredDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().slice(0, 10)
  })
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('10:00 AM')
  const [bookingLang, setBookingLang] = useState(language === 'rw' ? 'rw' : 'en')
  const [phone, setPhone] = useState(user?.phone || '')
  const [paymentMethod, setPaymentMethod] = useState('MTN MoMo')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, crsRes, bkRes] = await Promise.all([
        exbosApi.getTrainingCatalog(),
        exbosApi.getTrainingCourses(activeArchId),
        exbosApi.getMyTrainingBookings()
      ])
      const catData = catRes?.data?.data || catRes?.data
      if (catRes?.ok && catData) {
        setCatalog(catData)
      }
      const crsData = crsRes?.data?.data || crsRes?.data
      if (crsRes?.ok && crsData) {
        setCoursesData({
          courses: Array.isArray(crsData.courses) ? crsData.courses : [],
          completedLessonIds: Array.isArray(crsData.completedLessonIds) ? crsData.completedLessonIds : [],
          progressPercent: Number(crsData.progressPercent || 0),
          certificateId: crsData.certificateId || '',
          certifiedAt: crsData.certifiedAt || ''
        })
        if (!expandedLessonId && Array.isArray(crsData.courses) && crsData.courses[0]) {
          setExpandedLessonId(crsData.courses[0].id)
        }
      }
      const bkData = bkRes?.data?.data || bkRes?.data
      if (bkRes?.ok && bkData) {
        setBookings(Array.isArray(bkData.bookings) ? bkData.bookings : [])
      }
    } finally {
      setLoading(false)
    }
  }, [activeArchId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleToggleLesson = async (lessonId) => {
    const isDone = coursesData.completedLessonIds.includes(lessonId)
    setTogglingId(lessonId)
    try {
      const res = await exbosApi.updateTrainingProgress({
        lessonId,
        completed: !isDone,
        archId: activeArchId
      })
      const d = res?.data?.data || res?.data
      if (res?.ok && d) {
        const prevCert = coursesData.certificateId
        setCoursesData((prev) => ({
          ...prev,
          completedLessonIds: d.completedLessonIds || [],
          progressPercent: Number(d.progressPercent || 0),
          certificateId: d.certificateId || '',
          certifiedAt: d.certifiedAt || ''
        }))
        if (!prevCert && d.certificateId) {
          addToast?.({
            type: 'success',
            title: 'ExBOS Training Certificate Unlocked',
            message: `Congratulations! Certificate ${d.certificateId} is ready in My Bookings & Certificate.`
          })
        }
      }
    } finally {
      setTogglingId('')
    }
  }

  const activeQuote = selectedPkg
    ? deliveryMode === 'onsite' && selectedPkg.allowOnsite
      ? selectedPkg.onsiteQuote
      : selectedPkg.onlineQuote
    : null

  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!selectedPkg) return
    const finalAmt = Number(activeQuote?.finalAmountRWF || 0)
    if (finalAmt > 0 && !paymentReference.trim()) {
      addToast?.({
        type: 'warning',
        title: 'Payment Reference Required',
        message: 'Enter your MTN MoMo / Airtel Money transaction ID to confirm this paid training.'
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await exbosApi.createTrainingBooking({
        packageId: selectedPkg.id,
        deliveryMode,
        staffCount: Number(staffCount || 1),
        preferredDate,
        preferredTimeSlot,
        language: bookingLang,
        phone: phone.trim(),
        paymentMethod: finalAmt > 0 ? paymentMethod : 'Free',
        paymentReference: paymentReference.trim(),
        notes: notes.trim(),
        archId: activeArchId
      })
      if (!res?.ok) {
        addToast?.({
          type: 'error',
          title: 'Booking Failed',
          message: res?.data?.error || res?.error || 'Could not submit training booking.'
        })
        return
      }
      addToast?.({
        type: 'success',
        title: 'Training Session Booked',
        message:
          finalAmt > 0
            ? 'Payment reference submitted. Our team will verify and send your session link on WhatsApp.'
            : 'Your free training request was received. Our trainer will confirm your slot on WhatsApp.'
      })
      setSelectedPkg(null)
      setPaymentReference('')
      setNotes('')
      setActiveTab('bookings')
      loadAll()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrintCertificate = () => {
    if (!coursesData.certificateId) return
    const win = window.open('', '_blank', 'width=900,height=650')
    if (!win) return
    const issued = coursesData.certifiedAt
      ? new Date(coursesData.certifiedAt).toLocaleDateString()
      : new Date().toLocaleDateString()
    win.document.write(`
      <html>
        <head><title>ExBOS Operator Certificate - ${coursesData.certificateId}</title></head>
        <body style="margin:0;padding:40px;background:#03091F;color:#EAF2FF;font-family:system-ui,sans-serif;text-align:center;">
          <div style="max-width:740px;margin:0 auto;padding:48px;border:3px solid #218DFF;border-radius:24px;background:linear-gradient(135deg,#071544,#03091F);">
            <p style="letter-spacing:0.22em;text-transform:uppercase;color:#9EDCFF;font-size:12px;font-weight:700;">PYLARIX · EXCELLENCE BUSINESS OPERATING SYSTEM</p>
            <h1 style="font-size:32px;margin:16px 0 8px;color:#FFFFFF;">Certificate of ExBOS Mastery</h1>
            <p style="color:#9EDCFF;font-size:14px;margin-bottom:28px;">This certifies that</p>
            <h2 style="font-size:28px;color:#34D399;margin:0 0 8px;">${user?.name || user?.email || 'ExBOS Operator'}</h2>
            <p style="font-size:15px;color:#CBD5E1;margin:0 0 28px;">${user?.businessName || 'ExBOS Business'}</p>
            <p style="font-size:14px;color:#E2E8F0;line-height:1.6;max-width:560px;margin:0 auto 32px;">
              has successfully completed the ExBOS Staff Operations &amp; Financial Control Training Curriculum,
              including POS Sales, Inventory Control, Where Is My Money Reconciliation, Offline Sync, and RRA Tax Readiness.
            </p>
            <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(158,220,255,0.25);padding-top:20px;font-size:12px;color:#9EDCFF;">
              <span>Certificate ID: <strong>${coursesData.certificateId}</strong></span>
              <span>Issued: <strong>${issued}</strong></span>
            </div>
          </div>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const packages = catalog?.packages || []
  const freePromoActive = Boolean(catalog?.freePromoActive)
  const allowance = catalog?.allowance || {}
  const paymentInfo = catalog?.paymentInstructions || {}

  return (
    <div className="space-y-5">
      {/* Hero Banner */}
      <div className="rounded-3xl border border-[#218DFF]/30 bg-gradient-to-br from-[#071644] via-[#040E2E] to-[#081A52] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-orbitron font-bold bg-[#218DFF]/20 text-[#9EDCFF] border border-[#218DFF]/35">
                <GraduationCap className="w-3.5 h-3.5" />
                EXBOS STAFF TRAINING &amp; ACADEMY
              </span>
              {freePromoActive && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                  <Sparkles className="w-3 h-3" />
                  {catalog?.freePromoLabel || 'Free Launch Offer Active'}
                </span>
              )}
              {!freePromoActive && allowance.freeSessionsRemaining > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/35">
                  {allowance.freeSessionsRemaining} Free Session{allowance.freeSessionsRemaining === 1 ? '' : 's'} Left ({allowance.effectivePlan})
                </span>
              )}
            </div>
            <h2 className="font-orbitron text-lg sm:text-xl font-extrabold text-white">
              Master ExBOS &amp; Train Your Team Faster
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Complete free bilingual step-by-step guides tailored to your business, or book live 1-on-1 / team training sessions
              for cashiers, branch managers, and accountants (Online or On-Site).
            </p>
          </div>

          {/* Progress Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-[#030B24]/80 border border-white/10 min-w-[210px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Your Academy Progress</span>
              <span className="font-orbitron font-bold text-[#9EDCFF]">{coursesData.progressPercent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#218DFF] to-emerald-400 transition-all duration-500"
                style={{ width: `${coursesData.progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {coursesData.certificateId
                ? `Certified: ${coursesData.certificateId}`
                : `Complete all ${coursesData.courses.length} guides to earn your certificate`}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <div className="inline-flex flex-wrap rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
            {[
              { id: 'guides', label: 'Free Quick-Start Guides', icon: PlayCircle },
              { id: 'book', label: 'Book Staff Training', icon: Calendar },
              { id: 'bookings', label: `My Bookings & Certificate (${bookings.length})`, icon: Award }
            ].map((t) => {
              const Icon = t.icon
              const active = activeTab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition ${
                    active ? 'bg-[#218DFF] text-white shadow' : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {activeTab === 'guides' && (
            <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setGuideLang('en')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  guideLang === 'en' ? 'bg-[#218DFF] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setGuideLang('rw')}
                className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                  guideLang === 'rw' ? 'bg-[#218DFF] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kinyarwanda
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="exbos-glass-card p-10 text-center text-xs text-slate-300">
          Loading ExBOS Training Academy...
        </div>
      ) : (
        <>
          {/* TAB 1: FREE BILINGUAL QUICK-START GUIDES */}
          {activeTab === 'guides' && (
            <div className="grid grid-cols-1 gap-3">
              {coursesData.courses.map((course) => {
                const isDone = coursesData.completedLessonIds.includes(course.id)
                const isOpen = expandedLessonId === course.id
                const title = guideLang === 'rw' ? course.titleRw || course.titleEn : course.titleEn
                const summary = guideLang === 'rw' ? course.summaryRw || course.summaryEn : course.summaryEn
                const steps = guideLang === 'rw' ? course.stepsRw || course.stepsEn || [] : course.stepsEn || []

                return (
                  <div
                    key={course.id}
                    className={`rounded-2xl border p-4 transition ${
                      isDone
                        ? 'bg-emerald-500/[0.06] border-emerald-400/30'
                        : 'bg-[#06143D]/80 border-white/10 hover:border-[#218DFF]/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setExpandedLessonId(isOpen ? '' : course.id)}
                        className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#9EDCFF]/60 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{title}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-300 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {course.durationMinutes} min
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {course.videoUrl && (
                          <a
                            href={course.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#9EDCFF] text-xs font-bold inline-flex items-center gap-1"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Watch
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={togglingId === course.id}
                          onClick={() => handleToggleLesson(course.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-[#218DFF] hover:bg-[#197be6] text-white'
                          }`}
                        >
                          {isDone ? 'Completed' : 'Mark Done'}
                        </button>
                      </div>
                    </div>

                    {isOpen && steps.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/10 pl-8 space-y-2">
                        <p className="text-[10px] font-orbitron uppercase tracking-wider text-[#9EDCFF] font-bold">
                          {guideLang === 'rw' ? 'Intambwe zo gukurikiza' : 'Step-by-Step Walkthrough'}
                        </p>
                        <ol className="space-y-2 text-xs text-slate-200 list-decimal list-inside">
                          {steps.map((st, i) => (
                            <li key={i} className="leading-relaxed">
                              {st}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* TAB 2: BOOK LIVE STAFF TRAINING (FREE -> PAID READY) */}
          {activeTab === 'book' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => {
                  const q = pkg.onlineQuote || {}
                  const isFreeNow = Number(q.finalAmountRWF || 0) <= 0
                  const isSelected = selectedPkg?.id === pkg.id

                  return (
                    <div
                      key={pkg.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition ${
                        isSelected
                          ? 'bg-[#218DFF]/15 border-[#218DFF] shadow-lg shadow-[#218DFF]/20'
                          : 'bg-[#06143D]/85 border-white/15 hover:border-[#218DFF]/50'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-orbitron text-sm font-bold text-white">{pkg.name}</h3>
                            <p className="text-[11px] text-[#9EDCFF] mt-0.5">
                              {pkg.durationLabel} · Up to {pkg.maxStaff} staff
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {isFreeNow ? (
                              <div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold">
                                  FREE
                                </span>
                                {Number(q.originalPriceRWF || 0) > 0 && (
                                  <div className="text-[10px] text-slate-400 line-through mt-1">
                                    {formatRWF(q.originalPriceRWF)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="font-orbitron text-sm font-extrabold text-white">
                                  {formatRWF(q.finalAmountRWF)}
                                </div>
                                {q.discountPercent > 0 && (
                                  <div className="text-[10px] text-emerald-300">
                                    {q.discountPercent}% {allowance.effectivePlan} discount
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">{pkg.description}</p>

                        <ul className="space-y-1.5 text-xs text-slate-200">
                          {(pkg.highlights || []).map((h, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPkg(pkg)
                          setDeliveryMode('online')
                          setStaffCount(Math.min(2, pkg.maxStaff || 2))
                        }}
                        className={`w-full py-2.5 rounded-xl text-xs font-orbitron font-bold cursor-pointer transition ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-[#218DFF] hover:bg-[#197be6] text-white'
                        }`}
                      >
                        {isSelected ? 'Selected — Complete Booking Below' : 'Select Training Package'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Booking Checkout Form */}
              {selectedPkg && (
                <form
                  onSubmit={handleSubmitBooking}
                  className="rounded-3xl border border-[#218DFF]/40 bg-[#040E2E]/95 p-5 sm:p-6 space-y-5 shadow-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <h3 className="font-orbitron text-base font-bold text-white">
                        Book: {selectedPkg.name}
                      </h3>
                      <p className="text-xs text-slate-300">
                        Choose your preferred date, delivery mode, and number of staff attending.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block">Total Due</span>
                      <span className="font-orbitron text-lg font-extrabold text-emerald-300">
                        {Number(activeQuote?.finalAmountRWF || 0) <= 0
                          ? 'FREE (0 RWF)'
                          : formatRWF(activeQuote.finalAmountRWF)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Delivery Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryMode('online')}
                          className={`py-2 px-2.5 rounded-xl border font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                            deliveryMode === 'online'
                              ? 'bg-[#218DFF]/25 border-[#218DFF] text-white'
                              : 'bg-white/5 border-white/10 text-slate-300'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" /> Online
                        </button>
                        {selectedPkg.allowOnsite && (
                          <button
                            type="button"
                            onClick={() => setDeliveryMode('onsite')}
                            className={`py-2 px-2.5 rounded-xl border font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                              deliveryMode === 'onsite'
                                ? 'bg-[#218DFF]/25 border-[#218DFF] text-white'
                                : 'bg-white/5 border-white/10 text-slate-300'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5" /> On-Site
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Preferred Date</label>
                      <input
                        type="date"
                        required
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Preferred Time</label>
                      <select
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      >
                        <option value="09:00 AM">09:00 AM (Morning)</option>
                        <option value="11:00 AM">11:00 AM (Late Morning)</option>
                        <option value="02:00 PM">02:00 PM (Afternoon)</option>
                        <option value="04:30 PM">04:30 PM (Evening)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Staff Attending (Max {selectedPkg.maxStaff})</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedPkg.maxStaff || 20}
                        value={staffCount}
                        onChange={(e) => setStaffCount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">Training Language</label>
                      <select
                        value={bookingLang}
                        onChange={(e) => setBookingLang(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      >
                        <option value="rw">Kinyarwanda</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-200 block">WhatsApp / Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+250 78..."
                        className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                      />
                    </div>
                  </div>

                  {/* Paid Training Payment Box */}
                  {Number(activeQuote?.finalAmountRWF || 0) > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/35 space-y-3">
                      <div className="flex items-center gap-2 text-amber-200 font-bold text-xs">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Money Payment Instructions ({formatRWF(activeQuote.finalAmountRWF)})</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        Pay via MTN MoMo Code <strong>{paymentInfo.momoCode || '*182*8*1*100999#'}</strong> (
                        {paymentInfo.momoName || 'PYLARIX / ExBOS'}) or Airtel Money{' '}
                        <strong>{paymentInfo.airtelNumber || '+250 792 946 680'}</strong>, then enter your transaction ID below.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                        >
                          <option value="MTN MoMo">MTN MoMo</option>
                          <option value="Airtel Money">Airtel Money</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                        <input
                          type="text"
                          required
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Enter MoMo / Payment Reference ID"
                          className="px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs">
                    <label className="font-bold text-slate-200 block">Topics or Staff Questions (Optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Train 3 cashiers on offline POS, barcode scanning, and WhatsApp receipts"
                      className="w-full px-3 py-2 rounded-xl bg-[#03091F] border border-white/15 text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedPkg(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#0055FF] text-white text-xs font-orbitron font-bold cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Confirm Training Booking'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: MY BOOKINGS & CERTIFICATE */}
          {activeTab === 'bookings' && (
            <div className="space-y-5">
              {/* Certificate Card */}
              <div className="rounded-2xl border border-[#218DFF]/30 bg-[#06143D]/85 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-sm font-bold text-white">ExBOS Certified Operator Certificate</h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {coursesData.certificateId
                        ? `Earned! Certificate ID: ${coursesData.certificateId}`
                        : `Progress: ${coursesData.progressPercent}% — complete all Free Quick-Start Guides to unlock your printable certificate.`}
                    </p>
                  </div>
                </div>
                {coursesData.certificateId ? (
                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4" /> Print Certificate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('guides')}
                    className="px-4 py-2 rounded-xl bg-[#218DFF] text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Continue Guides
                  </button>
                )}
              </div>

              {/* Bookings List */}
              <div className="space-y-3">
                <h3 className="font-orbitron text-xs uppercase tracking-wider text-[#9EDCFF] font-bold">
                  Scheduled &amp; Past Training Bookings
                </h3>
                {bookings.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#06143D]/60 p-8 text-center space-y-2">
                    <Users className="w-8 h-8 text-[#9EDCFF]/50 mx-auto" />
                    <p className="text-sm font-bold text-white">No live training sessions booked yet</p>
                    <p className="text-xs text-slate-400">
                      Book a free or team staff training session so your cashiers and managers master ExBOS fast.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('book')}
                      className="mt-2 px-4 py-2 rounded-xl bg-[#218DFF] text-white text-xs font-bold cursor-pointer"
                    >
                      Book Training Now
                    </button>
                  </div>
                ) : (
                  bookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="rounded-2xl border border-white/15 bg-[#06143D]/85 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] text-[#9EDCFF] font-bold">{bk.id}</span>
                          <span className="text-sm font-bold text-white">{bk.packageName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              bk.bookingStatus === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : bk.bookingStatus === 'completed'
                                ? 'bg-[#218DFF]/20 text-[#9EDCFF]'
                                : bk.bookingStatus === 'cancelled'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {bk.bookingStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          {bk.preferredDate} at {bk.preferredTimeSlot} · {bk.deliveryMode?.toUpperCase()} · {bk.staffCount}{' '}
                          staff ·{' '}
                          <strong>
                            {Number(bk.finalAmountRWF || 0) <= 0 ? 'FREE' : formatRWF(bk.finalAmountRWF)}
                          </strong>{' '}
                          ({bk.paymentStatus?.replace('_', ' ')})
                        </p>
                        {bk.assignedTrainer && (
                          <p className="text-[11px] text-emerald-300 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Trainer: {bk.assignedTrainer}
                          </p>
                        )}
                      </div>

                      {bk.meetingLink && (
                        <a
                          href={bk.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-[#218DFF] hover:bg-[#197be6] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Join Session
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
