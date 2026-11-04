import React, { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { useAOS } from '../utils/useAOS'
import PublicNavbar from '../components/layout/PublicNavbar'
import PublicFooter from '../components/layout/PublicFooter'
import FinancialToolsSection from '../components/landing/FinancialToolsSection'
import PricingSection from '../components/landing/PricingSection'
import { SIX_ARCHITECTURES, SEO_ARTICLES } from '../data/architectures'
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  BookOpen,
  ShieldCheck,
  Wallet,
  Calculator,
  LayoutDashboard
} from 'lucide-react'

function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc && description) {
      metaDesc.setAttribute('content', description)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [title, description])
}

export function FeaturesPage() {
  useAOS()
  usePageMeta(
    'Features — ExBOS (Excellence Business Operations System) | By PYLARIX',
    'Explore ExBOS core features: Where Is My Money cash/MoMo/bank tracking, 6-Month Business Survival Planner, Landed Cost Inventory, Gmail, Google Drive & WhatsApp integration.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4" data-aos="fade-up">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#218DFF]/15 border border-[#218DFF]/35 text-[#1045CA] dark:text-[#9EDCFF] text-xs font-orbitron uppercase">
            ExBOS Platform Capabilities
          </span>
          <h1 className="font-orbitron text-3xl sm:text-5xl font-black text-[#071544] dark:text-white">
            Engineered to Answer Where Your Money Sits Right Now
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            ExBOS combines cash &amp; MoMo separation, true profit calculation, customer debt tracking, and 6-month survival planning inside one <span className="font-pylarix font-bold">PYLARIX</span> Liquid Sapphire interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-aos="fade-up">
          {[
            {
              title: 'Where Is My Money? (8-Bucket View)',
              desc: 'See Cash in hand, Mobile Money (MoMo), Bank, Stock & materials, Owed to me, What I owe, Active project cash gaps, and Personal withdrawals on one screen.'
            },
            {
              title: 'True Landed Cost & Real Profit',
              desc: 'Never confuse daily sales with profit. Automatically include transport, moto, loading, recipes, and monthly fixed overhead.'
            },
            {
              title: '6-Month Business Survival Engine',
              desc: 'Calculate Rent + Salaries + Electricity + Internet × 6 = Six-Month Safety Budget so your business survives slow sales.'
            },
            {
              title: 'Official ExBOS WhatsApp Assistant',
              desc: 'Record sales and expenses or request PDF & Google Drive reports directly from WhatsApp without needing a Meta developer account.'
            },
            {
              title: 'Gmail & Google Drive Export Vault',
              desc: 'Preview, print, and export professional reports in PDF, Excel (.xlsx), Word (.docx), and CSV formats.'
            },
            {
              title: 'Transaction Edit History & Audit Log',
              desc: 'Controlled financial corrections preserve original creation date, source (Dashboard or WhatsApp), creator, and editor audit trail.'
            }
          ].map((f) => (
            <div key={f.title} className="sapphire-analytics-card p-6 space-y-3">
              <CheckCircle2 className="w-6 h-6 text-[#218DFF]" />
              <h2 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                {f.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

export function BusinessModelsIndexPage() {
  useAOS()
  usePageMeta(
    'Six Business Architectures — ExBOS | Make & Sell, Buy & Sell, Services, Farming, Hospitality & Hybrid',
    'Discover how ExBOS (Excellence Business Operations System) adapts to six business architectures in Rwanda and across Africa.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#218DFF]/15 border border-[#218DFF]/35 text-[#1045CA] dark:text-[#9EDCFF] text-xs font-orbitron uppercase">
            Six Business Architectures · One Platform
          </span>
          <h1 className="font-orbitron text-3xl sm:text-5xl font-black text-[#071544] dark:text-white">
            Built for the Way You Do Business
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Select any of the six business models below to explore its workflows, dashboard modules, and how ExBOS solves its operational challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIX_ARCHITECTURES.map((arch) => (
            <div key={arch.id} className="sapphire-analytics-card overflow-hidden flex flex-col justify-between">
              <div>
                {arch.videoUrl ? (
                  <video
                    src={arch.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <img src={arch.image} alt={arch.name} className="w-full h-44 object-cover" />
                )}
                <div className="p-6 space-y-3">
                  <span className="font-orbitron text-xs font-bold text-[#218DFF]">
                    ARCHITECTURE {arch.number}
                  </span>
                  <h2 className="font-orbitron text-xl font-extrabold text-[#071544] dark:text-white">
                    {arch.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {arch.description}
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 flex items-center justify-between gap-2">
                <Link
                  to={`/business-models/${arch.slug}`}
                  className="btn-sapphire px-4 py-2.5 text-xs no-underline"
                >
                  <span>Explore {arch.shortName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/dashboard?arch=${arch.id}`}
                  className="text-xs font-semibold text-[#218DFF] no-underline"
                >
                  Live Dashboard →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

export function SingleArchitectureSeoPage() {
  useAOS()
  const { slug } = useParams()
  const navigate = useNavigate()
  const { setPreselectedArchitecture } = useExbos()

  const arch =
    SIX_ARCHITECTURES.find((a) => a.slug === slug || a.id === slug) ||
    SIX_ARCHITECTURES[0]

  usePageMeta(
    `${arch.name} Software — ExBOS (${arch.headline}) | PYLARIX`,
    `${arch.description} Manage ${arch.capabilities.join(', ')} with ExBOS (Excellence Business Operations System).`
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto w-full space-y-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 dark:text-[#9EDCFF]/80 flex items-center gap-2">
          <Link to="/" className="hover:text-[#218DFF] no-underline text-current">Home</Link>
          <span>/</span>
          <Link to="/business-models" className="hover:text-[#218DFF] no-underline text-current">Business Models</Link>
          <span>/</span>
          <strong className="text-[#218DFF]">{arch.name}</strong>
        </nav>

        <div className="rounded-3xl overflow-hidden bg-[#071544] text-white border border-[#9EDCFF]/35 shadow-sapphire-dark grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-5">
            <span className="px-3 py-1 rounded-full bg-[#218DFF]/25 border border-[#9EDCFF]/40 text-xs font-orbitron text-[#9EDCFF]">
              Architecture {arch.number} · {arch.name}
            </span>
            <h1 className="font-orbitron text-3xl sm:text-4xl font-black">{arch.headline}</h1>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{arch.description}</p>
            <div className="p-4 rounded-2xl bg-[#1045CA]/30 border border-[#9EDCFF]/30 text-xs sm:text-sm text-[#eaf2ff]">
              <strong className="block font-orbitron text-xs uppercase text-[#9EDCFF] mb-1">
                Problem Solved by ExBOS:
              </strong>
              {arch.howExbosHelps}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreselectedArchitecture(arch.id)
                  navigate(`/register?arch=${arch.id}`)
                }}
                className="btn-sapphire px-6 py-3 text-sm"
              >
                <span>Start Free with {arch.shortName}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/dashboard?arch=${arch.id}`)}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-[#9EDCFF]/35 text-white text-sm font-semibold cursor-pointer flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-[#9EDCFF]" />
                <span>Open {arch.shortName} Live Dashboard</span>
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            {arch.videoUrl ? (
              <video
                src={arch.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover min-h-[260px]"
              />
            ) : (
              <img src={arch.image} alt={arch.name} className="w-full h-full object-cover min-h-[260px]" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="liquid-glass rounded-3xl p-6 space-y-3">
            <h2 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
              Core Workflows Included
            </h2>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 list-none p-0 m-0">
              {arch.workflows.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#218DFF] shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-glass rounded-3xl p-6 space-y-3">
            <h2 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
              Typical Businesses Supported
            </h2>
            <div className="flex flex-wrap gap-2">
              {arch.examples.map((ex) => (
                <span
                  key={ex}
                  className="px-3.5 py-2 rounded-xl bg-[#218DFF]/15 text-[#1045CA] dark:text-[#9EDCFF] text-xs font-semibold"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

export function BusinessToolsPage() {
  useAOS()
  usePageMeta(
    'Business Financial Planning Tools & Calculators — ExBOS | PYLARIX',
    'Calculate Break-Even Sales, 6-Month Business Survival Budget (Fixed Cost × 6), Startup Capital, Pricing Margin & Emergency Reserves in RWF.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-20">
        <FinancialToolsSection />
      </main>
      <PublicFooter />
    </div>
  )
}

export function PricingPage() {
  useAOS()
  usePageMeta(
    'Pricing & Subscription Plans (RWF) — ExBOS | Forever Free, Bronze, Silver, Gold & Platinum',
    'Transparent RWF pricing for ExBOS (Excellence Business Operations System) by PYLARIX. Start Forever Free or upgrade to Bronze, Silver, Gold, or Platinum referral rewards.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-20">
        <PricingSection />
      </main>
      <PublicFooter />
    </div>
  )
}

export function AboutPage() {
  useAOS()
  usePageMeta(
    'About ExBOS & PYLARIX — Don’t Just Run Your Business. Understand It.',
    'ExBOS (Excellence Business Operations System) is developed by PYLARIX — We Create Solutions, Not Technology.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-10 max-w-5xl mx-auto w-full space-y-10">
        <div className="liquid-glass rounded-3xl p-8 sm:p-12 space-y-6">
          <span className="font-bold text-xs uppercase tracking-widest text-[#218DFF]">
            DEVELOPED BY <span className="font-pylarix">PYLARIX</span>
          </span>
          <h1 className="font-orbitron text-3xl sm:text-5xl font-black text-[#071544] dark:text-white">
            EXCELLENCE BOS — Don&apos;t Just Run Your Business. Understand It.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Many entrepreneurs work tirelessly every day yet still cannot answer where their cash went, which products are sleeping on the shelf, or whether their business could survive six months of slow sales.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Built by <strong className="font-pylarix text-[#1045CA] dark:text-[#9EDCFF]">PYLARIX</strong> (<em>We Create Solutions, Not Technology</em>), ExBOS unifies six distinct business architectures, financial survival calculators, and multi-channel document &amp; WhatsApp operations into one commercial platform.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

export function ResourcesPage() {
  useAOS()
  usePageMeta(
    'Business Management Guides & Resources — ExBOS | Profit, 6-Month Survival & Inventory',
    'Practical educational guides on calculating true business profit, building a 6-month survival reserve, managing shop inventory, and break-even planning.'
  )

  return (
    <div className="exbos-blue-page min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto w-full space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#218DFF]/15 border border-[#218DFF]/35 text-[#1045CA] dark:text-[#9EDCFF] text-xs font-orbitron uppercase">
            <BookOpen className="w-3.5 h-3.5 text-[#218DFF]" />
            <span>Entrepreneur Knowledge Base (Section 11 SEO Content)</span>
          </span>
          <h1 className="font-orbitron text-3xl sm:text-5xl font-black text-[#071544] dark:text-white">
            Practical Guides for Resilient Businesses
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SEO_ARTICLES.map((art) => (
            <article key={art.slug} className="sapphire-analytics-card p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#218DFF]/20 text-[#1045CA] dark:text-[#9EDCFF] font-orbitron font-bold">
                    {art.category}
                  </span>
                  <span className="text-slate-400">{art.readTime}</span>
                </div>
                <h2 className="font-orbitron text-lg font-bold text-[#071544] dark:text-white">
                  {art.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {art.summary}
                </p>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-none p-0 m-0 pt-2 border-t border-blue-200/50 dark:border-[#9EDCFF]/15">
                  {art.takeaways.map((tk) => (
                    <li key={tk} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#218DFF] shrink-0 mt-0.5" />
                      <span>{tk}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to="/business-tools"
                className="text-xs font-orbitron font-bold text-[#218DFF] hover:underline no-underline flex items-center gap-1"
              >
                <span>Open Interactive Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}

