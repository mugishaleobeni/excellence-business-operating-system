import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useExbos } from '../../context/ExbosContext'
import { isTokenValid } from '../../utils/apiClient'
import exbosLogo from '../../../logo/exboslogo.png'
import LanguageDropdown from '../common/LanguageDropdown'
import CountryFlag from '../common/CountryFlag'
import CardNav from './CardNav'
import RequestIntegrationModal from '../common/RequestIntegrationModal'
import { ArrowRight, Check, ChevronDown, MessageSquare, Mail, Plug, LayoutDashboard } from 'lucide-react'

export default function PublicNavbar() {
  const { user, language, setLanguage } = useExbos()
  const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null
  const isAuthenticated = Boolean(user && token && isTokenValid(token))
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [integrationsOpen, setIntegrationsOpen] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const integrationsRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (integrationsRef.current && !integrationsRef.current.contains(e.target)) {
        setIntegrationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { label: language === 'rw' ? 'Ahabanza' : 'Home', to: '/' },
    { label: language === 'rw' ? 'Imikorere' : 'Features', to: '/features' },
    { label: language === 'rw' ? "Imiterere y'Ubucuruzi" : 'Business Models', to: '/business-models' },
    { label: language === 'rw' ? 'Ibikoresho bya Imari' : 'Business Tools', to: '/business-tools' },
    { label: language === 'rw' ? 'Ibiciro' : 'Pricing', to: '/pricing' },
    { label: language === 'rw' ? 'Ubumenyi' : 'Resources', to: '/resources' },
    { label: language === 'rw' ? 'Ibyerekeye ExBOS' : 'About', to: '/about' },
    ...(isAuthenticated ? [{ label: 'Dashboard', to: '/dashboard' }] : [])
  ]

  // EXCELLENCE BOS Content structured into CardNav cards for Mobile Responsive
  const cardNavItems = [
    {
      label: language === 'rw' ? 'Urubuga & Imikorere' : 'Platform & Features',
      description:
        language === 'rw'
          ? 'Menya ikiguzi cyose, ukurikirane inyungu nyayo n’amafaranga yawe.'
          : 'Understand your costs, manage operations, and track real performance.',
      links: [
        { label: language === 'rw' ? 'Ahabanza' : 'Home', href: '/' },
        { label: language === 'rw' ? 'Imikorere' : 'Features', href: '/features' },
        { label: language === 'rw' ? 'Ibyerekeye ExBOS' : 'About ExBOS', href: '/about' },
        { label: language === 'rw' ? 'Ubumenyi' : 'Resources & Guides', href: '/resources' }
      ]
    },
    {
      label: language === 'rw' ? 'Imiterere & Ibikoresho' : 'Models & Financial Tools',
      description:
        language === 'rw'
          ? "Imiterere 6 y'ubucuruzi n'ibikoresho 5 bipima kuramba k'ubucuruzi."
          : 'Six business architectures and five financial survival calculators.',
      links: [
        { label: language === 'rw' ? "Imiterere y'Ubucuruzi" : 'Business Models (01–06)', href: '/business-models' },
        { label: language === 'rw' ? 'Ibikoresho bya Imari' : 'Business Financial Tools', href: '/business-tools' },
        { label: language === 'rw' ? 'Ibiciro (RWF)' : 'Pricing Plans (RWF)', href: '/pricing' }
      ]
    },
    {
      label: language === 'rw' ? 'Imiyoboro & Ihuza' : 'Integrations',
      description:
        language === 'rw'
          ? 'Huza na WhatsApp, Gmail, cyangwa usabe imiyoboro ya API na banki.'
          : 'Connect WhatsApp, Gmail, or request enterprise API & accounting links.',
      links: [
        {
          label: 'WhatsApp Business',
          href: 'https://wa.me/250781963981?text=Hello%20ExBOS%20Support,%20I%20would%20like%20to%20learn%20more%20about%20WhatsApp%20integration',
          target: '_blank'
        },
        {
          label: 'Gmail & PDF Dispatch',
          href: '/features#gmail'
        },
        {
          label: language === 'rw' ? 'Saba Ihuza Rishya' : 'Request Integration',
          onClick: () => setRequestModalOpen(true)
        }
      ]
    },
    {
      label: language === 'rw' ? 'Konti & Kwiyandikisha' : 'Account & Access',
      description: isAuthenticated
        ? (language === 'rw'
            ? `Winjiye muri konti ya ${user?.name || 'ExBOS'}. Kanda hano ukomeze muri Dashboard.`
            : `Logged in as ${user?.name || 'User'}. Return to your operational dashboard.`)
        : (language === 'rw'
            ? 'Injira muri konti yawe cyangwa utangire gukoresha ExBOS.'
            : 'Sign in to your account or start your 7-step guided business setup.'),
      links: isAuthenticated
        ? [
            {
              label: language === 'rw' ? 'Fungura Dashboard' : 'Go to Dashboard',
              href: '/dashboard'
            }
          ]
        : [
            { label: language === 'rw' ? 'Tangira' : 'Get Started', href: '/register' },
            { label: language === 'rw' ? 'Injira' : 'Sign In', href: '/login' }
          ]
    }
  ]

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full">
      {/* Desktop Full-Width Sticky Navigation Bar (Background Appears on Scroll) */}
      <nav
        aria-label="Main Public Navigation"
        className={`hidden lg:flex w-full rounded-none px-4 sm:px-8 lg:px-12 items-center justify-between gap-4 desktop-nav-base ${
          scrolled ? 'desktop-nav-scrolled py-3' : 'desktop-nav-top py-4'
        }`}
      >
        {/* Brand Logo Only */}
        <Link
          to="/"
          aria-label="EXCELLENCE BOS Home"
          className="flex items-center no-underline shrink-0 outline-none focus:outline-none"
        >
          <img
            src={exbosLogo}
            alt="EXCELLENCE BOS Logo"
            width={48}
            height={48}
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav Links: White words before scroll, existing dark/sapphire colors on scroll */}
        <div className="flex items-center justify-center flex-1 gap-3 xl:gap-5">
          {navLinks.slice(0, 4).map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-2 py-2 text-xs xl:text-sm whitespace-nowrap no-underline outline-none focus:outline-none transition-colors duration-300 ${
                  scrolled
                    ? active
                      ? 'text-[#218DFF] font-bold border-b-2 border-[#218DFF]'
                      : 'text-slate-700 font-medium hover:text-[#218DFF]'
                    : active
                    ? 'text-white font-bold border-b-2 border-white'
                    : 'text-white font-medium hover:text-[#9EDCFF]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}

          {/* Integrations Dropdown Item on Desktop */}
          <div ref={integrationsRef} className="relative">
            <button
              type="button"
              onClick={() => setIntegrationsOpen(!integrationsOpen)}
              className={`px-2 py-2 text-xs xl:text-sm whitespace-nowrap no-underline outline-none focus:outline-none transition-colors duration-300 flex items-center gap-1.5 cursor-pointer font-medium ${
                scrolled
                  ? integrationsOpen
                    ? 'text-[#218DFF] font-bold'
                    : 'text-slate-700 hover:text-[#218DFF]'
                  : integrationsOpen
                  ? 'text-white font-bold'
                  : 'text-white hover:text-[#9EDCFF]'
              }`}
            >
              <span>{language === 'rw' ? 'Imiyoboro' : 'Integrations'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  integrationsOpen ? 'rotate-180 text-[#218DFF]' : 'opacity-70'
                }`}
              />
            </button>

            {integrationsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 rounded-2xl bg-[#071536] border border-[#218DFF]/40 shadow-2xl p-2.5 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/250781963981?text=Hello%20ExBOS%20Support,%20I%20would%20like%20to%20learn%20more%20about%20WhatsApp%20integration"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIntegrationsOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#163065]/70 border border-transparent hover:border-[#234C9A] transition-all no-underline group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#163065] border border-[#234C9A] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-xs font-bold text-white group-hover:text-[#9EDCFF]">
                        WhatsApp
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Live
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {language === 'rw'
                        ? 'Ubutumwa bw’ubuguzi, inyemezabwishyu n’ibisobanuro kuri WhatsApp.'
                        : 'MoMo receipts, daily closing summaries & order alerts via WhatsApp.'}
                    </p>
                  </div>
                </a>

                {/* Gmail */}
                <Link
                  to="/features"
                  onClick={() => setIntegrationsOpen(false)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#163065]/70 border border-transparent hover:border-[#234C9A] transition-all no-underline group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#163065] border border-[#234C9A] flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-xs font-bold text-white group-hover:text-[#9EDCFF]">
                        Gmail
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                        Email Sync
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {language === 'rw'
                        ? 'Ohereza fagitire za PDF na raporo z’umunsi zikorerwa muri Gmail.'
                        : 'Automated invoices, end-of-day audit PDFs & tax statements.'}
                    </p>
                  </div>
                </Link>

                {/* Request Integration */}
                <button
                  type="button"
                  onClick={() => {
                    setIntegrationsOpen(false)
                    setRequestModalOpen(true)
                  }}
                  className="w-full text-left flex items-start gap-3 p-2.5 rounded-xl hover:bg-[#163065]/70 border border-transparent hover:border-[#234C9A] transition-all cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#163065] border border-[#234C9A] flex items-center justify-center text-[#218DFF] group-hover:scale-105 transition-transform shrink-0">
                    <Plug className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron text-xs font-bold text-white group-hover:text-[#9EDCFF]">
                        {language === 'rw' ? 'Saba Ihuza Rishya' : 'Request Integration'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                        Custom API
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      {language === 'rw'
                        ? 'MTN MoMo API, Airtel Money, QuickBooks, Xero cyangwa POS.'
                        : 'MTN MoMo API, Airtel Money, QuickBooks, Xero, POS or ERP.'}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {navLinks.slice(4).map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`px-2 py-2 text-xs xl:text-sm whitespace-nowrap no-underline outline-none focus:outline-none transition-colors duration-300 ${
                  scrolled
                    ? active
                      ? 'text-[#218DFF] font-bold border-b-2 border-[#218DFF]'
                      : 'text-slate-700 font-medium hover:text-[#218DFF]'
                    : active
                    ? 'text-white font-bold border-b-2 border-white'
                    : 'text-white font-medium hover:text-[#9EDCFF]'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right Controls: Language Dropdown + CTA Button (Dashboard if authenticated, Register if not) */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageDropdown />

          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="btn-sapphire px-5 py-2.5 text-sm no-underline flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-[#9EDCFF]" />
              <span>{language === 'rw' ? 'Dashboard' : 'Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn-sapphire px-5 py-2.5 text-sm no-underline"
            >
              <span>{language === 'rw' ? 'Tangira' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile & Tablet Responsive CardNav: Left = CTA | Center = Logo | Right = Menu */}
      <div className="lg:hidden px-3 pt-2.5">
        <CardNav
          logo={exbosLogo}
          logoAlt="EXCELLENCE BOS"
          logoHref="/"
          items={cardNavItems}
          cta={{
            label: isAuthenticated ? 'Dashboard' : (language === 'rw' ? 'Tangira' : 'Get Started'),
            href: isAuthenticated ? '/dashboard' : '/register'
          }}
          menuTranslation={({ closeMenu }) => (
            <div className="flex flex-col gap-2.5">
              <div className="cn-card-head">
                <span className="cn-card-label font-orbitron">
                  {language === 'rw' ? 'Ururimi / Language' : 'Language / Ururimi'}
                </span>
                <p className="cn-card-desc">
                  {language === 'rw'
                    ? "Hitamo ururimi rw'urubuga n'amafaranga mu magambo."
                    : 'Select platform language and currency-in-words translation.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { code: 'en', label: 'English', sub: 'United States' },
                  { code: 'rw', label: 'Kinyarwanda', sub: 'Rwanda' }
                ].map((langItem) => {
                  const isSelected = language === langItem.code
                  return (
                    <button
                      key={langItem.code}
                      type="button"
                      onClick={() => {
                        setLanguage(langItem.code)
                        closeMenu()
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#1045CA] to-[#0A2786] text-white border-[#9EDCFF]/60 shadow-sapphire-glow'
                          : 'bg-white border-blue-200/70 text-[#071544] hover:border-[#218DFF]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <CountryFlag
                          lang={langItem.code}
                          className="w-5 h-3.5 rounded-sm shadow-sm shrink-0"
                        />
                        <span className="truncate">
                          <strong className="block text-xs font-orbitron truncate">
                            {langItem.label}
                          </strong>
                          <span
                            className={`block text-[10px] truncate ${
                              isSelected ? 'text-[#9EDCFF]' : 'text-slate-500'
                            }`}
                          >
                            {langItem.sub}
                          </span>
                        </span>
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#9EDCFF] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          theme="light"
          cardEffect="rise"
          openOn="click"
          surface="glass"
          stagger={0.12}
          bounce={0.2}
          menuLabel={true}
          speed={1}
          cardHeight={150}
          maxWidth={960}
          intro={true}
          onNavigate={(href) => navigate(href)}
        />
      </div>

      {/* Request Integration Modal */}
      <RequestIntegrationModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </header>
  )
}
