import React, { useState, useEffect, useRef, forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'

// Lightweight motion shim for zero-dependency build reliability
const motion = new Proxy({}, {
  get: (_, tag) => forwardRef(({ animate, initial, exit, transition, whileHover, whileTap, whileInView, viewport, variants, ...props }, ref) => {
    const Tag = tag
    return <Tag ref={ref} {...props} />
  })
})
const useReducedMotion = () => false
import {
  MessageCircle,
  Package,
  ChartNoAxesCombined,
  TrendingUp,
  Users,
  FileBarChart,
  ArrowRight,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import womanImage from '../../../logo/why-choose-woman.png'

const SIX_EXBOS_FEATURES = [
  {
    id: 'whatsapp-entry',
    title: 'WhatsApp-Assisted Entry',
    description: 'Turn everyday WhatsApp messages into organized business records.',
    icon: MessageCircle
  },
  {
    id: 'smart-inventory',
    title: 'Smart Inventory',
    description: 'Track products, stock levels, purchases, and sales.',
    icon: Package
  },
  {
    id: 'sales-profit-insights',
    title: 'Sales & Profit Insights',
    description: 'Understand your sales, expenses, and business performance.',
    icon: ChartNoAxesCombined
  },
  {
    id: 'cash-flow-forecasting',
    title: 'Cash Flow Forecasting',
    description: 'Plan ahead and understand your future cash needs.',
    icon: TrendingUp
  },
  {
    id: 'customer-management',
    title: 'Customer Management',
    description: 'Keep customer information and transaction histories organized.',
    icon: Users
  },
  {
    id: 'financial-reporting',
    title: 'Financial Reporting',
    description: 'Visualize business performance through clear financial reports.',
    icon: FileBarChart
  }
]

const ORBITAL_CLASSES = [
  'why-orbital-pos-0',
  'why-orbital-pos-1',
  'why-orbital-pos-2',
  'why-orbital-pos-3'
]

export default function WhyChooseExbosSection() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [slideOffset, setSlideOffset] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartXRef = useRef(null)
  const touchStartYRef = useRef(null)

  const handleNext = () => {
    setSlideOffset((prev) => (prev + 1) % SIX_EXBOS_FEATURES.length)
  }

  const handlePrev = () => {
    setSlideOffset(
      (prev) => (prev - 1 + SIX_EXBOS_FEATURES.length) % SIX_EXBOS_FEATURES.length
    )
  }

  // Gentle automatic sliding across all 6 features (pauses when user pauses or prefers reduced motion)
  useEffect(() => {
    if (prefersReducedMotion || isPaused) return undefined
    const timer = setInterval(() => {
      setSlideOffset((prev) => (prev + 1) % SIX_EXBOS_FEATURES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [prefersReducedMotion, isPaused])

  const visibleFeatures = [0, 1, 2, 3].map(
    (slot) => SIX_EXBOS_FEATURES[(slideOffset + slot) % SIX_EXBOS_FEATURES.length]
  )

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0]
    if (!touch) return
    touchStartXRef.current = touch.clientX
    touchStartYRef.current = touch.clientY
  }

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches?.[0]
    if (!touch || touchStartXRef.current === null || touchStartYRef.current === null) return
    const dx = touch.clientX - touchStartXRef.current
    const dy = touch.clientY - touchStartYRef.current
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        setSlideOffset((prev) => (prev + 1) % SIX_EXBOS_FEATURES.length)
      } else {
        setSlideOffset(
          (prev) => (prev - 1 + SIX_EXBOS_FEATURES.length) % SIX_EXBOS_FEATURES.length
        )
      }
    }
    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  return (
    <section
      aria-label="Why Choose ExBOS?"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="why-exbos-section py-16 sm:py-20 px-4 sm:px-6 lg:px-10 text-white"
    >
      {/* Background Dot-Matrix Tech Texture */}
      <div className="why-exbos-dot-matrix" />

      {/* Curved Orbital SVG Path That Draws Itself on Scroll */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 760"
        className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="exbosOrbitalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(158, 220, 255, 0.15)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="100%" stopColor="rgba(33, 141, 255, 0.25)" />
          </linearGradient>
        </defs>

        {/* Gradually Drawn Curved Orbital Path Along the Right */}
        <motion.path
          d="M 600 95 Q 810 380 600 665"
          fill="none"
          stroke="url(#exbosOrbitalStroke)"
          strokeWidth="2.5"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Subtle Secondary Dashed Orbital Guide */}
        <motion.path
          d="M 565 115 Q 770 380 565 645"
          fill="none"
          stroke="rgba(158, 220, 255, 0.3)"
          strokeWidth="1.25"
          strokeDasharray="6 8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
        />
      </svg>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
        {/* LEFT SIDE: Circular Glass Element + Woman in Foreground + Overlapping Heading Glass Card */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start">
          <div className="why-circular-glass-stage w-full max-w-[520px]">
            {/* Large Circular Blue-Glass Element Behind the Woman (Fades & Scales into View on Scroll) */}
            <motion.div
              className="why-circular-glass-orb top-6 sm:top-4"
              initial={{ opacity: 0, scale: 0.84 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
            />

            {/* Subtle Blue Ambient Glow Behind Her (Not Over Her) */}
            <div className="why-woman-ambient-glow top-14 sm:top-12" />

            {/* Woman in Royal-Blue Suit Holding Smartphone (Slides Upward Smoothly into Position) */}
            <motion.div
              className="relative z-10 w-full flex justify-center pt-2"
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.85, delay: 0.12, ease: 'easeOut' }}
            >
              <img
                src={womanImage}
                alt="Confident entrepreneur managing her business on ExBOS with her smartphone"
                className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[440px] h-auto object-contain select-none pointer-events-none drop-shadow-[0_22px_40px_rgba(3,9,31,0.65)]"
                draggable={false}
              />
            </motion.div>

            {/* Overlapping Circular Glass Content Panel: WHY CHOOSE ExBOS? (WHITE Heading + Blur-to-Clear) */}
            <motion.div
              className="why-heading-glass-panel w-full -mt-8 sm:-mt-12 text-left space-y-3"
              initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, delay: 0.22, ease: 'easeOut' }}
            >
              <motion.h2
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white uppercase leading-tight"
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.28, ease: 'easeOut' }}
              >
                WHY CHOOSE ExBOS?
              </motion.h2>

              <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
                Smarter business management. Less complexity. Better decisions.
              </p>

              <div className="pt-1">
                <motion.button
                  type="button"
                  onClick={() => navigate('/features')}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="hero-btn-primary text-sm sm:text-base"
                >
                  <span>Explore ExBOS</span>
                  <span className="hero-btn-icon-pill">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE: Compact White-Glassmorphism & Blur Cards Auto-Sliding Along Curved Orbital Path */}
        <div className="lg:col-span-6 space-y-4">
          <div
            role="region"
            aria-label="Six ExBOS Core Features Auto-Slider"
            aria-live="polite"
            className="space-y-3 sm:space-y-3.5"
          >
            {visibleFeatures.map((feature, slotIdx) => {
              const IconComponent = feature.icon
              const isLeadSlot = slotIdx === 0

              return (
                <motion.div
                  key={`${feature.id}-${slideOffset}-${slotIdx}`}
                  initial={{ opacity: 0, x: 18, y: 8 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  whileHover={{ y: -3, scale: 1.015 }}
                  transition={{
                    duration: 0.85,
                    delay: slotIdx * 0.09,
                    ease: 'easeOut'
                  }}
                  className={`why-orbital-card ${ORBITAL_CLASSES[slotIdx]} ${
                    isLeadSlot ? 'is-active' : ''
                  }`}
                >
                  {/* Compact Circular Blue-Glass Icon Container */}
                  <div className="why-orbital-icon-orb">
                    <IconComponent className="w-5 h-5 text-white" strokeWidth={2.1} />
                  </div>

                  {/* Compact White-Glassmorphism Card Text */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-[15px] font-extrabold text-[#071544] leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-snug mt-0.5">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Interactive Controls: Progress Dots + Backward / Pause-Play / Forward */}
          <div className="pt-2 lg:pl-12 flex flex-wrap items-center justify-between gap-3 max-w-[420px]">
            <div className="flex items-center gap-2">
              {SIX_EXBOS_FEATURES.map((feature, idx) => {
                const isActive = idx === slideOffset
                return (
                  <button
                    key={feature.id}
                    type="button"
                    aria-label={`Feature ${idx + 1}: ${feature.title}`}
                    title={feature.title}
                    onClick={() => setSlideOffset(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer border-0 ${
                      isActive
                        ? 'w-7 bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                        : 'w-2 bg-white/35 hover:bg-white/65'
                    }`}
                  />
                )
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous feature"
                title="Previous feature"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Resume animation' : 'Pause animation'}
                title={isPaused ? 'Resume animation' : 'Pause animation'}
                className="h-8 px-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold text-white transition-all cursor-pointer"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next feature"
                title="Next feature"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
