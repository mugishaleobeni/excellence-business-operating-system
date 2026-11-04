import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useExbos } from '../../context/ExbosContext'
import exbosLogo from '../../../logo/exboslogo.png'
import LanguageDropdown from '../common/LanguageDropdown'
import CountryFlag from '../common/CountryFlag'
import CardNav from './CardNav'
import { ArrowRight, Check } from 'lucide-react'

export default function PublicNavbar() {
  const { language, setLanguage } = useExbos()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: language === 'rw' ? 'Ahabanza' : 'Home', to: '/' },
    { label: language === 'rw' ? 'Imikorere' : 'Features', to: '/features' },
    { label: language === 'rw' ? "Imiterere y'Ubucuruzi" : 'Business Models', to: '/business-models' },
    { label: language === 'rw' ? 'Ibikoresho bya Imari' : 'Business Tools', to: '/business-tools' },
    { label: language === 'rw' ? 'Ibiciro' : 'Pricing', to: '/pricing' },
    { label: language === 'rw' ? 'Ubumenyi' : 'Resources', to: '/resources' },
    { label: language === 'rw' ? 'Ibyerekeye ExBOS' : 'About', to: '/about' }
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
      label: language === 'rw' ? 'Konti & Kwiyandikisha' : 'Account & Access',
      description:
        language === 'rw'
          ? 'Injira muri konti yawe cyangwa utangire gukoresha ExBOS.'
          : 'Sign in to your account or start your 7-step guided business setup.',
      links: [
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
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav Links: White words before scroll, existing dark/sapphire colors on scroll */}
        <div className="flex items-center justify-center flex-1 gap-4 xl:gap-6">
          {navLinks.map((item) => {
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
                      : 'text-slate-700 font-medium'
                    : active
                    ? 'text-white font-bold border-b-2 border-white'
                    : 'text-white font-medium'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Right Controls: Language Dropdown + Only "Get Started" Button */}
        <div className="flex items-center gap-3 shrink-0">
          <LanguageDropdown />

          <Link
            to="/register"
            className="btn-sapphire px-5 py-2.5 text-sm no-underline"
          >
            <span>{language === 'rw' ? 'Tangira' : 'Get Started'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Mobile & Tablet Responsive CardNav: Left = Get Started | Center = Logo | Right = Menu + Translation inside Menu */}
      <div className="lg:hidden px-3 pt-2.5">
        <CardNav
          logo={exbosLogo}
          logoAlt="EXCELLENCE BOS"
          logoHref="/"
          items={cardNavItems}
          cta={{
            label: language === 'rw' ? 'Tangira' : 'Get Started',
            href: '/register'
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
    </header>
  )
}
