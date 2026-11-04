import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useExbos } from '../../context/ExbosContext'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Layers,
  X,
  Play,
  ExternalLink,
  LayoutDashboard,
  Workflow,
  AlertCircle
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function ArchitectureShowcase() {
  const { architectures, setPreselectedArchitecture } = useExbos()
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalArch, setModalArch] = useState(null)
  const [headerInView, setHeaderInView] = useState(false)
  const [showSlowScrollPopup, setShowSlowScrollPopup] = useState(false)
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const lastStepTimeRef = useRef(0)
  const lockedIndexRef = useRef(0)
  const isClampingScrollRef = useRef(false)
  const popupTimerRef = useRef(null)
  const wheelWindowRef = useRef({ time: 0, delta: 0 })
  const navigate = useNavigate()

  const currentArch = architectures[activeIndex] || architectures[0]

  const triggerSlowScrollNotice = () => {
    // Show the slow-scroll guidance only once per browser session
    try {
      if (sessionStorage.getItem('exbos_slow_scroll_notice_shown') === '1') return
      sessionStorage.setItem('exbos_slow_scroll_notice_shown', '1')
    } catch {
      if (popupTimerRef.shownOnce) return
      popupTimerRef.shownOnce = true
    }
    setShowSlowScrollPopup(true)
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current)
    }
    popupTimerRef.current = setTimeout(() => {
      setShowSlowScrollPopup(false)
    }, 3800)
  }

  useEffect(() => {
    return () => {
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current)
      }
    }
  }, [])

  // Trigger Canva Block Reveal animation when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setHeaderInView(true)
      return undefined
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHeaderInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Preload adjacent images for smooth crossfade
  useEffect(() => {
    architectures.forEach((arch) => {
      if (arch.image) {
        const img = new Image()
        img.src = arch.image
      }
    })
  }, [architectures])

  // Animate text reveal whenever activeIndex changes
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !contentRef.current) return
    gsap.fromTo(
      contentRef.current,
      { opacity: 0.25, y: 18 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
    )
  }, [activeIndex])

  // GSAP ScrollTrigger slow, one-by-one controlled progression + fast-scroll guard
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isDesktop = window.innerWidth >= 1024
    const sectionEl = sectionRef.current
    if (prefersReducedMotion || !isDesktop || !sectionEl) return

    const total = architectures.length
    const MIN_STEP_COOLDOWN_MS = 1050

    const getScrollYForIndex = (self, idx) => {
      const distance = self.end - self.start
      const ratio = (idx + 0.35) / total
      return self.start + distance * ratio
    }

    const trigger = ScrollTrigger.create({
      trigger: sectionEl,
      start: 'top top',
      end: '+=540%',
      pin: true,
      scrub: 1.4,
      onUpdate: (self) => {
        if (isClampingScrollRef.current) return
        const now = Date.now()
        const rawIndex = Math.min(total - 1, Math.floor(self.progress * total))
        const currentLocked = lockedIndexRef.current
        const velocity = Math.abs(self.getVelocity())

        if (rawIndex === currentLocked) return

        const elapsed = now - lastStepTimeRef.current
        const indexJump = Math.abs(rawIndex - currentLocked)

        // If user scrolls too quickly or tries to skip an architecture:
        // hold them at one-by-one progression and show the slow-scroll popup
        if (elapsed < MIN_STEP_COOLDOWN_MS || indexJump > 1 || velocity > 1350) {
          triggerSlowScrollNotice()

          let allowedIdx = currentLocked
          if (elapsed >= MIN_STEP_COOLDOWN_MS) {
            const stepDir = rawIndex > currentLocked ? 1 : -1
            allowedIdx = Math.max(0, Math.min(total - 1, currentLocked + stepDir))
            lockedIndexRef.current = allowedIdx
            lastStepTimeRef.current = now
            setActiveIndex(allowedIdx)
          }

          if (self.isActive) {
            isClampingScrollRef.current = true
            self.scroll(getScrollYForIndex(self, allowedIdx))
            requestAnimationFrame(() => {
              isClampingScrollRef.current = false
            })
          }
          return
        }

        // Normal slow scroll: advance one architecture smoothly
        lockedIndexRef.current = rawIndex
        lastStepTimeRef.current = now
        setActiveIndex(rawIndex)
      }
    })

    // Detect fast wheel bursts inside the section to show the helpful slow-scroll popup
    const handleWheel = (e) => {
      if (!trigger.isActive) return
      const now = Date.now()
      const absDelta = Math.abs(e.deltaY)
      if (now - wheelWindowRef.current.time < 220) {
        wheelWindowRef.current.delta += absDelta
      } else {
        wheelWindowRef.current.time = now
        wheelWindowRef.current.delta = absDelta
      }

      if (absDelta > 105 || wheelWindowRef.current.delta > 175) {
        triggerSlowScrollNotice()
      }
    }

    sectionEl.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      sectionEl.removeEventListener('wheel', handleWheel)
      trigger.kill()
    }
  }, [architectures.length])

  const handleSelectArch = (idx) => {
    lockedIndexRef.current = idx
    lastStepTimeRef.current = Date.now()
    setActiveIndex(idx)
  }

  const handleGetStartedWithArch = (arch) => {
    setPreselectedArchitecture(arch.id)
    setModalArch(null)
    navigate(`/register?arch=${arch.id}`)
  }

  // Curved path horizontal offsets (px) for the 6 circular selectors on desktop
  const curveOffsets = [44, 16, 0, 0, 16, 44]

  return (
    <section
      ref={sectionRef}
      id="business-architectures"
      aria-label="Interactive Business Architecture Showcase"
      className="relative min-h-screen lg:h-screen w-full overflow-hidden flex items-center pt-20 pb-8 lg:pt-20 lg:pb-6 bg-[#03091F] text-white"
    >
      {/* Full-Screen Crossfading Background Images / Videos */}
      <div className="absolute inset-0 z-0">
        {architectures.map((arch, idx) => {
          const isCurrent = idx === activeIndex
          return (
            <div
              key={arch.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}
              style={{ transitionProperty: 'opacity, transform', transitionDuration: '750ms' }}
            >
              {arch.videoUrl ? (
                <video
                  src={arch.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={arch.image}
                  alt={`${arch.name} — ${arch.headline}`}
                  loading={idx <= 1 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )
        })}

        {/* Dark Liquid Sapphire Overlays for Crisp Readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(95deg, rgba(3,9,31,0.94) 0%, rgba(7,21,68,0.86) 48%, rgba(10,39,134,0.68) 100%)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 20% 30%, rgba(33,141,255,0.22) 0%, transparent 55%)'
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10">
        {/* Top Section Header & Progress Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 lg:pb-4 border-b border-[#9EDCFF]/20">
          <div>
            <div
              className={`mb-1.5 ${headerInView ? 'canva-block-reveal' : 'opacity-0'}`}
              style={{ '--canva-block-delay': '0.1s' }}
            >
              <span className="canva-block-inner inline-flex items-center gap-2 text-[#9EDCFF] text-xs sm:text-sm font-orbitron font-extrabold uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5 text-[#218DFF]" />
                <span>Six Business Architectures · One Intelligent Platform</span>
              </span>
            </div>
            <h2 className="font-orbitron text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Built for the Way You Do Business.
            </h2>
            <p className="text-xs sm:text-sm text-[#9EDCFF]/85 max-w-2xl mt-1">
              Every business operates differently. Discover how ExBOS adapts to the way you produce, sell, serve, and grow.
            </p>
          </div>

          {/* Progress Counter Pill: 01 / 06 */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="px-3.5 py-1.5 rounded-2xl bg-[#071544]/85 backdrop-blur-xl border border-[#9EDCFF]/35 shadow-sapphire-glow flex items-center gap-2.5">
              <span className="font-orbitron text-lg font-extrabold text-[#218DFF]">
                {currentArch.number}
              </span>
              <span className="text-[#9EDCFF]/50 font-mono">/</span>
              <span className="font-orbitron text-xs font-semibold text-[#9EDCFF]">
                0{architectures.length}
              </span>
              <div className="w-16 h-1.5 rounded-full bg-[#03091F] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#218DFF] to-[#9EDCFF] transition-all duration-500"
                  style={{ width: `${((activeIndex + 1) / architectures.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleSelectArch(activeIndex === 0 ? architectures.length - 1 : activeIndex - 1)
                }
                aria-label="Previous business architecture"
                className="p-2 rounded-xl bg-[#071544]/80 hover:bg-[#1045CA] border border-[#9EDCFF]/30 text-white cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSelectArch(activeIndex === architectures.length - 1 ? 0 : activeIndex + 1)
                }
                aria-label="Next business architecture"
                className="p-2 rounded-xl bg-[#071544]/80 hover:bg-[#1045CA] border border-[#9EDCFF]/30 text-white cursor-pointer transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Two-Column Showcase Grid: Left Explanation + Right Curved Circular Selectors */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center pt-3 lg:pt-4">
          {/* Left Column: Active Architecture Glass Card (Fitted cleanly inside single viewport) */}
          <div ref={contentRef} className="lg:col-span-7 space-y-2.5">
            <div className="p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl bg-[#071544]/75 backdrop-blur-2xl border border-[#9EDCFF]/30 shadow-sapphire-dark space-y-3 sm:space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#218DFF]/20 border border-[#218DFF]/50 text-[#9EDCFF] font-orbitron text-[11px] font-bold uppercase tracking-wider">
                  Architecture {currentArch.number} — {currentArch.name}
                </span>
                <Link
                  to={`/business-models/${currentArch.slug}`}
                  className="text-xs font-semibold text-[#9EDCFF] hover:text-white flex items-center gap-1 no-underline"
                >
                  <span>Dedicated SEO Guide</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-orbitron text-xl sm:text-2xl lg:text-3xl font-extrabold leading-snug text-white">
                  {currentArch.headline}
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentArch.description}
                </p>
              </div>

              {/* Highlighted Capabilities */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-orbitron uppercase tracking-wider text-[#9EDCFF]/80">
                  Highlighted Capabilities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentArch.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A2786]/75 border border-[#9EDCFF]/30 text-xs font-semibold text-white shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#218DFF]" />
                      <span>{cap}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Typical Examples Preview — Canva Block Reveal Animation on Every Architecture */}
              <div className="pt-2 border-t border-[#9EDCFF]/15 flex flex-wrap items-center gap-1.5 text-xs text-[#9EDCFF]/90">
                <span
                  key={`ideal-label-${currentArch.id}`}
                  className={headerInView ? 'canva-block-reveal' : 'opacity-0'}
                  style={{ '--canva-block-delay': '0.08s' }}
                >
                  <span className="canva-block-inner font-bold text-white inline-block">
                    Ideal for:
                  </span>
                </span>
                {currentArch.examples.slice(0, 4).map((ex, idx) => (
                  <span
                    key={`${currentArch.id}-${ex}`}
                    className={headerInView ? 'canva-block-reveal' : 'opacity-0'}
                    style={{ '--canva-block-delay': `${0.16 + idx * 0.1}s` }}
                  >
                    <span className="canva-block-inner inline-block px-2 py-0.5 rounded-md bg-white/10 font-semibold text-[#9EDCFF]">
                      {ex}
                    </span>
                  </span>
                ))}
              </div>

              {/* Action Buttons: See How It Works + Get Started */}
              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalArch(currentArch)}
                  className="btn-sapphire px-4 py-2.5 text-xs sm:text-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9EDCFF]" />
                  <span>See How It Works</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGetStartedWithArch(currentArch)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#9EDCFF]/40 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Get Started with {currentArch.shortName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9EDCFF]" />
                </button>
              </div>
            </div>

            {/* Bottom Brand Signature */}
            <p className="font-bold text-[11px] tracking-wider text-[#9EDCFF]/80 uppercase">
              ExBOS by <span className="font-pylarix">PYLARIX</span> — Don&apos;t Just Run Your Business. Understand It.
            </p>
          </div>

          {/* Right Column: Curved Vertical Path of 6 Circular Image Selectors (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col items-end justify-center relative py-1">
            {/* Decorative SVG Curved Arc Line */}
            <svg
              className="absolute right-24 top-2 bottom-2 h-[92%] w-36 pointer-events-none opacity-45"
              viewBox="0 0 120 500"
              fill="none"
            >
              <path
                d="M 95 20 Q 10 250 95 480"
                stroke="url(#sapphireArc)"
                strokeWidth="2.5"
                strokeDasharray="6 6"
              />
              <defs>
                <linearGradient id="sapphireArc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9EDCFF" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#218DFF" stopOpacity="1" />
                  <stop offset="100%" stopColor="#9EDCFF" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>

            <div className="space-y-2.5 relative z-10 w-full flex flex-col items-end">
              {architectures.map((arch, idx) => {
                const isActive = idx === activeIndex
                const rightOffset = curveOffsets[idx] || 0
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => handleSelectArch(idx)}
                    aria-label={`Select ${arch.number} ${arch.name} business architecture`}
                    aria-pressed={isActive}
                    style={{ marginRight: `${rightOffset}px` }}
                    className={`group flex items-center gap-3 text-right px-3 py-1.5 rounded-full transition-all duration-300 cursor-pointer border ${
                      isActive
                        ? 'bg-[#1045CA]/65 border-[#9EDCFF] shadow-sapphire-glow scale-105'
                        : 'bg-[#071544]/65 border-[#9EDCFF]/25 hover:border-[#218DFF] hover:bg-[#0A2786]/60 opacity-85 hover:opacity-100'
                    }`}
                  >
                    <div className="pl-2 pr-1">
                      <span className="block font-orbitron text-[10px] tracking-widest text-[#9EDCFF]">
                        {arch.number}
                      </span>
                      <span
                        className={`block text-xs font-bold whitespace-nowrap ${
                          isActive ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {arch.name}
                      </span>
                    </div>

                    {/* Circular Business Image / Video Frame */}
                    <div
                      className={`relative rounded-full overflow-hidden shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'w-12 h-12 ring-3 ring-[#218DFF] shadow-sapphire-glow'
                          : 'w-10 h-10 ring-2 ring-[#9EDCFF]/40 group-hover:ring-[#218DFF]'
                      }`}
                    >
                      {arch.videoUrl ? (
                        <video
                          src={arch.videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={arch.thumb || arch.image}
                          alt={arch.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div
                        className={`absolute inset-0 transition-opacity ${
                          isActive ? 'bg-transparent' : 'bg-[#03091F]/35 group-hover:bg-transparent'
                        }`}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mobile & Tablet Touch-Friendly Horizontal Row of Circular Selectors */}
          <div className="lg:hidden overflow-x-auto pb-3">
            <div className="flex items-center gap-3 min-w-max">
              {architectures.map((arch, idx) => {
                const isActive = idx === activeIndex
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => handleSelectArch(idx)}
                    aria-label={`Select ${arch.name}`}
                    className={`flex items-center gap-2.5 p-2 pr-4 rounded-full border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1045CA]/80 border-[#9EDCFF] shadow-sapphire-glow scale-105'
                        : 'bg-[#071544]/80 border-[#9EDCFF]/25 opacity-80'
                    }`}
                  >
                    {arch.videoUrl ? (
                      <video
                        src={arch.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`rounded-full object-cover ${
                          isActive ? 'w-11 h-11 ring-2 ring-[#9EDCFF]' : 'w-9 h-9'
                        }`}
                      />
                    ) : (
                      <img
                        src={arch.thumb || arch.image}
                        alt={arch.name}
                        className={`rounded-full object-cover ${
                          isActive ? 'w-11 h-11 ring-2 ring-[#9EDCFF]' : 'w-9 h-9'
                        }`}
                      />
                    )}
                    <div className="text-left">
                      <span className="block font-orbitron text-[10px] text-[#9EDCFF]">
                        {arch.number}
                      </span>
                      <span className="block text-xs font-bold text-white whitespace-nowrap">
                        {arch.shortName}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* "See How It Works" Lamp-Inspired Modal Dialog */}
      {modalArch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="arch-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#03091F]/80 backdrop-blur-xl"
        >
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#071544]/95 border border-[#9EDCFF]/40 shadow-sapphire-dark text-white p-6 sm:p-8 lamp-modal-card">
            {/* Lamp Top Glow Beam */}
            <div className="absolute top-0 inset-x-12 h-24 lamp-beam pointer-events-none rounded-b-full" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#218DFF]/25 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
                    {modalArch.number} · {modalArch.name} Architecture
                  </span>
                  <h3 id="arch-modal-title" className="font-orbitron text-2xl sm:text-3xl font-extrabold mt-2">
                    {modalArch.headline}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalArch(null)}
                  aria-label="Close modal"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-[#9EDCFF]/30 text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* How ExBOS Helps Banner */}
              <div className="p-4 rounded-2xl bg-[#1045CA]/30 border border-[#218DFF]/40 text-sm text-[#eaf2ff] leading-relaxed">
                <strong className="text-[#9EDCFF] block mb-1 font-orbitron text-xs uppercase">
                  How ExBOS Helps Manage This Business:
                </strong>
                {modalArch.howExbosHelps}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Core Workflows */}
                <div className="p-4 rounded-2xl bg-[#03091F]/65 border border-[#9EDCFF]/20 space-y-3">
                  <h4 className="font-orbitron text-xs uppercase tracking-wider text-[#9EDCFF] flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-[#218DFF]" />
                    <span>Core Operational Workflows</span>
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-200 list-none p-0 m-0">
                    {modalArch.workflows.map((wf) => (
                      <li key={wf} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#218DFF] shrink-0 mt-0.5" />
                        <span>{wf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dashboard Features & Typical Businesses */}
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#03091F]/65 border border-[#9EDCFF]/20 space-y-2.5">
                    <h4 className="font-orbitron text-xs uppercase tracking-wider text-[#9EDCFF] flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#218DFF]" />
                      <span>Specialized Dashboard Features</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs sm:text-sm text-slate-200 list-none p-0 m-0">
                      {modalArch.dashboardFeatures.map((df) => (
                        <li key={df} className="flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#9EDCFF] shrink-0 mt-0.5" />
                          <span>{df}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#03091F]/65 border border-[#9EDCFF]/20 space-y-2">
                    <h4 className="font-orbitron text-xs uppercase tracking-wider text-[#9EDCFF]">
                      Typical Business Examples
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {modalArch.examples.map((ex) => (
                        <span
                          key={ex}
                          className="px-2.5 py-1 rounded-lg bg-[#1045CA]/35 border border-[#9EDCFF]/25 text-xs text-white"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#9EDCFF]/20 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalArch(null)
                    navigate(`/dashboard?arch=${modalArch.id}`)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#9EDCFF]/30 text-xs sm:text-sm font-semibold text-[#9EDCFF] cursor-pointer flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Preview {modalArch.shortName} Live Dashboard</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalArch(null)}
                    className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-xs sm:text-sm text-slate-300 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGetStartedWithArch(modalArch)}
                    className="btn-sapphire px-6 py-2.5 text-xs sm:text-sm"
                  >
                    <span>Get Started with {modalArch.shortName}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fast-Scroll Guidance Popup */}
      {showSlowScrollPopup && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md px-5 py-3.5 rounded-2xl bg-[#071544]/95 backdrop-blur-2xl border-2 border-[#218DFF] shadow-[0_20px_50px_rgba(3,9,31,0.85),0_0_24px_rgba(33,141,255,0.45)] text-white flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#218DFF]/25 border border-[#9EDCFF]/45 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-[#9EDCFF]" />
            </div>
            <p className="text-xs sm:text-sm font-bold leading-snug text-white">
              Please you can scroll slowly to understand this section, please.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSlowScrollPopup(false)}
            aria-label="Dismiss slow scroll notice"
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-extrabold text-[#9EDCFF] hover:text-white cursor-pointer shrink-0 transition-all"
          >
            Got it
          </button>
        </div>
      )}
    </section>
  )
}

