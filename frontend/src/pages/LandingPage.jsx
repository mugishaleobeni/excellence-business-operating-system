import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { isTokenValid } from '../utils/apiClient'
import { useAOS } from '../utils/useAOS'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import WhyChooseExbosSection from '../components/landing/WhyChooseExbosSection'
import ArchitectureShowcase from '../components/landing/ArchitectureShowcase'
import FinancialToolsSection from '../components/landing/FinancialToolsSection'
import PricingSection from '../components/landing/PricingSection'
import { FAQ_ITEMS } from '../data/architectures'
import heroVideo from '../../logo/Man_interacting_with_ExBOS_app_2b61917c_1080p.mp4'
import heroEndImage from '../../logo/Smiling Professional in Blue Tech Suit.png'
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  CheckCircle2
} from 'lucide-react'

export default function LandingPage() {
  useAOS()
  const navigate = useNavigate()
  const { user } = useExbos()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null
  const isAuthenticated = Boolean(user && token && isTokenValid(token))

  const [heroVideoEnded, setHeroVideoEnded] = useState(false)
  const heroVideoRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(0)

  // Continuously alternate between the Hero Video and the Hero Image:
  // Video plays -> crossfades to Image onEnded -> holds Image for 4.5s -> replays Video -> repeats forever
  useEffect(() => {
    if (!heroVideoEnded) return undefined
    const replayTimer = setTimeout(() => {
      const videoEl = heroVideoRef.current
      if (videoEl) {
        videoEl.currentTime = 0
        const playPromise = videoEl.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
      }
      setHeroVideoEnded(false)
    }, 4500)
    return () => clearTimeout(replayTimer)
  }, [heroVideoEnded])

  const scrollToTools = () => {
    const el = document.getElementById('explore-business-tools')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* 2.1 HERO SECTION — Sticky/Fixed in viewport so other sections scroll over it */}
        <section
          aria-label="Hero Section"
          className="sticky top-0 z-0 h-screen min-h-screen flex items-end lg:items-center justify-end overflow-hidden pt-24 pb-10 sm:pt-28 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:pl-10 lg:pr-4 xl:pr-6 bg-[#03091F] text-white"
        >
          {/* Full-screen Muted Hero Video & Ended Fallback Image (Smiling Professional in Blue Tech Suit) */}
          <div className="absolute inset-0 z-0">
            {/* Image shown when video ends (and as poster) */}
            <img
              src={heroEndImage}
              alt="Smiling Professional in Blue Tech Suit interacting with ExBOS"
              className="w-full h-full hero-bg-media"
            />

            {/* Muted Hero Video that plays first and fades into the image when it ends */}
            <video
              ref={heroVideoRef}
              src={heroVideo}
              poster={heroEndImage}
              autoPlay
              muted
              playsInline
              onEnded={() => {
                setHeroVideoEnded(true)
              }}
              className={`absolute inset-0 w-full h-full hero-bg-media transition-opacity duration-700 ${
                heroVideoEnded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <track
                kind="captions"
                src="/captions/hero-en.vtt"
                srcLang="en"
                label="English"
                default
              />
            </video>

            {/* Directional Sapphire Shadow Overlay so video/image & text remain clear */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(3, 9, 31, 0.45) 0%, rgba(7, 21, 68, 0.56) 46%, rgba(3, 9, 31, 0.78) 100%)'
              }}
            />
            {/* Top & Bottom Vignette Shadow (Stronger bottom shadow on mobile so text fits cleanly over the lower half) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(3, 9, 31, 0.35) 0%, transparent 28%, rgba(3, 9, 31, 0.68) 65%, rgba(3, 9, 31, 0.94) 100%)'
              }}
            />
          </div>

          <div className="relative z-10 w-full flex justify-end">
            {/* Hero Copy Positioned Close to the Right Scrollbar on Desktop, Fitted Cleanly on Mobile */}
            <div className="w-full lg:max-w-xl xl:max-w-2xl ml-auto space-y-4 sm:space-y-6 text-left">
              <div
                className="canva-block-reveal"
                style={{ '--canva-block-delay': '0.12s' }}
              >
                <h1 className="canva-block-inner font-orbitron text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-tight text-white hero-text-shadow">
                  Build a Business That Survives.{' '}
                  <span className="text-[#9EDCFF]">And Grows.</span>
                </h1>
              </div>

              <div
                className="canva-block-reveal"
                style={{ '--canva-block-delay': '0.42s' }}
              >
                <p className="canva-block-inner text-sm sm:text-base lg:text-lg text-white/95 font-medium leading-relaxed max-w-2xl hero-text-shadow">
                  Great businesses need more than great ideas. Understand your costs, manage your operations, track performance, and make smarter decisions with EXCELLENCE BOS.
                </p>
              </div>

              {/* Primary & Secondary Well-Designed CTAs with Deep Shadows */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-1 sm:pt-3">
                <div
                  className="canva-block-reveal canva-block-reveal--pill"
                  style={{ '--canva-block-delay': '0.72s' }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                    className="canva-block-inner hero-btn-primary"
                  >
                    <span>{isAuthenticated ? 'Open Dashboard' : 'Start Free'}</span>
                    <span className="hero-btn-icon-pill">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={scrollToTools}
                  className="hero-btn-secondary"
                >
                  <span className="hero-btn-icon-pill">
                    <Calculator className="w-4 h-4 text-[#9EDCFF]" />
                  </span>
                  <span>Explore Business Tools</span>
                </button>
              </div>

              {/* Supporting Message */}
              <div className="pt-2 sm:pt-4 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-bold tracking-wide sm:tracking-wider text-[#9EDCFF] hero-text-shadow">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#03091F]/65 border border-[#9EDCFF]/30 backdrop-blur-md">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#218DFF] shrink-0" />
                  <span>Plan Smarter. Operate Better. Grow Stronger.</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SCROLLING CONTENT OVERLAY — Scrolls up over the stationary Hero section */}
        <div className="relative z-20 bg-[#edf4ff] dark:bg-[#03091F] shadow-[0_-24px_60px_rgba(3,9,31,0.55)]">
          {/* 2.2 WHY CHOOSE ExBOS? — FUTURISTIC ANIMATED ORBITAL SECTION */}
          <WhyChooseExbosSection />

          {/* 2.3 INTERACTIVE BUSINESS ARCHITECTURE SHOWCASE */}
          <ArchitectureShowcase />

          {/* 2.3 & 3. EXPLORE BUSINESS FINANCIAL TOOLS */}
          <FinancialToolsSection />

          {/* 2.4 PRICING PLAN CATEGORIES */}
          <PricingSection />

          {/* 2.6 FREQUENTLY ASKED QUESTIONS (FAQ) + FOOTER — shared coded sapphire background */}
          <div
            className="exbos-blue-zone relative w-full overflow-hidden isolate"
            style={{
              background:
                'linear-gradient(180deg, #071544 0%, #0A2786 38%, #0E3AA6 70%, #0A2786 100%)'
            }}
          >
            <div aria-hidden="true" className="absolute inset-0 -z-10 pointer-events-none">
              <div
                className="absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(33,141,255,0.45) 0%, transparent 65%)',
                  filter: 'blur(40px)'
                }}
              />
              <div
                className="absolute top-1/3 -right-40 w-[700px] h-[700px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(158,220,255,0.28) 0%, transparent 65%)',
                  filter: 'blur(50px)'
                }}
              />
              <div
                className="absolute -bottom-48 left-1/4 w-[620px] h-[620px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(16,69,202,0.55) 0%, transparent 65%)',
                  filter: 'blur(50px)'
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(158,220,255,0.38) 1.2px, transparent 1.6px)',
                  backgroundSize: '28px 28px',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)',
                  maskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 85%)'
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(115deg, transparent 30%, rgba(158,220,255,0.07) 48%, transparent 66%)'
                }}
              />
            </div>

          <section id="faq" className="relative py-20 px-4 sm:px-6 lg:px-10 max-w-4xl mx-auto">
            <div className="text-center space-y-3 mb-12">
              <span className="inline-flex items-center gap-2 px-0 py-1 bg-transparent text-[#9EDCFF] text-xs font-orbitron uppercase">
                Frequently Asked Questions
              </span>
              <h2 className="font-orbitron text-2xl sm:text-4xl font-extrabold text-white">
                Everything You Need to Know About EXCELLENCE BOS
              </h2>
            </div>

            <div className="space-y-3.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={item.q}
                    className="liquid-glass rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer bg-transparent border-0 text-[#071544] dark:text-white font-orbitron font-bold text-sm sm:text-base"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-[#218DFF] shrink-0 transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-blue-200/40 dark:border-[#9EDCFF]/15 pt-3">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <PublicFooter />
          </div>
        </div>
      </main>
    </div>
  )
}

