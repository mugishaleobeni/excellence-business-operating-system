import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import PublicNavbar from '../components/layout/PublicNavbar'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Building2,
  Layers
} from 'lucide-react'

export default function LoginPage({ isForgotPassword = false }) {
  const { login, pendingCalculator, architectures, demoWorkspaces, businesses } = useExbos()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  const [demoName, setDemoName] = useState('Jean-Paul Habimana')
  const [demoBusinessName, setDemoBusinessName] = useState('Kigali Prime Hardware & Mart')
  const [email, setEmail] = useState('jp@kigaliprime.rw')
  const [architectureId, setArchitectureId] = useState('buy-and-sell')
  const [password, setPassword] = useState('ExBos2026!Demo')
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)

  // Forgot password steps (1: Enter Email, 2: Reset Link Sent / Enter New Password, 3: Completed)
  const [forgotStep, setForgotStep] = useState(1)
  const [newPassword, setNewPassword] = useState('')

  const handleArchSelectChange = (newArchId) => {
    setArchitectureId(newArchId)
    const ws = demoWorkspaces?.[newArchId]
    if (ws) {
      setDemoName(ws.ownerName)
      setDemoBusinessName(ws.businessName)
      setEmail(ws.email)
    }
  }

  const handleEmailChange = (val) => {
    setEmail(val)
    const matchedBiz = businesses?.find(
      (b) => b.email && b.email.toLowerCase() === val.trim().toLowerCase()
    )
    if (matchedBiz) {
      setDemoName(matchedBiz.owner)
      setDemoBusinessName(matchedBiz.name)
      setArchitectureId(matchedBiz.architecture)
    }
  }

  const handleSignIn = (e) => {
    e.preventDefault()
    login({
      name: demoName.trim() || 'Demo Business Owner',
      email: email.trim() || 'demo@exbos.rw',
      role: 'Business Owner (Demo)',
      businessName: demoBusinessName.trim() || 'Demo Enterprise',
      architectureId,
      planTier: 'Gold'
    })
    if (returnTo === 'calculator' || pendingCalculator) {
      navigate('/business-tools')
    } else {
      navigate(`/dashboard?arch=${architectureId}`)
    }
  }

  const handleDemoProfile = (profile) => {
    login(profile)
    if (profile.role === 'Platform Super Administrator') {
      navigate('/super-admin')
    } else if (returnTo === 'calculator' || pendingCalculator) {
      navigate('/business-tools')
    } else {
      navigate(`/dashboard?arch=${profile.architectureId}`)
    }
  }

  const SIX_DEMO_PROFILES = [
    {
      num: '01',
      label: '01 · Make & Sell',
      name: demoWorkspaces?.['make-and-sell']?.ownerName || 'Eric Ndayisaba',
      email: demoWorkspaces?.['make-and-sell']?.email || 'eric@inyangebakery.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.['make-and-sell']?.businessName || 'Inyange Artisan Bakery',
      architectureId: 'make-and-sell',
      planTier: 'Gold'
    },
    {
      num: '02',
      label: '02 · Buy & Sell',
      name: demoWorkspaces?.['buy-and-sell']?.ownerName || 'Jean-Paul Habimana',
      email: demoWorkspaces?.['buy-and-sell']?.email || 'jp@kigaliprime.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.['buy-and-sell']?.businessName || 'Kigali Prime Hardware',
      architectureId: 'buy-and-sell',
      planTier: 'Gold'
    },
    {
      num: '03',
      label: '03 · Services',
      name: demoWorkspaces?.services?.ownerName || 'Diane Mukamana',
      email: demoWorkspaces?.services?.email || 'diane@luminastudio.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.services?.businessName || 'Lumina Aesthetics & Studio',
      architectureId: 'services',
      planTier: 'Gold'
    },
    {
      num: '04',
      label: '04 · Agriculture',
      name: demoWorkspaces?.agriculture?.ownerName || 'Aline Uwase',
      email: demoWorkspaces?.agriculture?.email || 'aline@agukafarm.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.agriculture?.businessName || 'Aguka Smart Pig Farm',
      architectureId: 'agriculture',
      planTier: 'Gold'
    },
    {
      num: '05',
      label: '05 · Hospitality',
      name: demoWorkspaces?.['food-and-hospitality']?.ownerName || 'Patrick Mugisha',
      email: demoWorkspaces?.['food-and-hospitality']?.email || 'patrick@millebistro.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.['food-and-hospitality']?.businessName || 'Mille Collines Bistro',
      architectureId: 'food-and-hospitality',
      planTier: 'Gold'
    },
    {
      num: '06',
      label: '06 · Hybrid',
      name: demoWorkspaces?.hybrid?.ownerName || 'Pacifique Nshimiyimana',
      email: demoWorkspaces?.hybrid?.email || 'pacifique@techpulse.rw',
      role: 'Business Owner (Demo)',
      businessName: demoWorkspaces?.hybrid?.businessName || 'TechPulse Electronics Hub',
      architectureId: 'hybrid',
      planTier: 'Gold'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#edf4ff] dark:bg-[#03091F]">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-28">
        <div className="w-full max-w-lg relative">
          {/* Floating User Icon Orb */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#218DFF] via-[#1045CA] to-[#071544] border-2 border-[#9EDCFF] shadow-sapphire-glow flex items-center justify-center text-white mx-auto -mb-8 relative z-20">
            {isForgotPassword ? (
              <KeyRound className="w-7 h-7 text-[#9EDCFF]" />
            ) : (
              <User className="w-8 h-8 text-[#9EDCFF]" />
            )}
          </div>

          <div className="liquid-glass rounded-3xl pt-12 pb-8 px-6 sm:px-8 border border-[#9EDCFF]/35 shadow-sapphire-dark space-y-5">
            {!isForgotPassword ? (
              <>
                <div className="text-center space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#218DFF]/15 border border-[#218DFF]/35 text-[11px] font-bold uppercase tracking-widest text-[#1045CA] dark:text-[#9EDCFF]">
                    <Sparkles className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>INTERACTIVE DEMO SIGN IN · LOCAL DEMO DATA ONLY</span>
                  </span>
                  <h1 className="font-orbitron text-2xl font-extrabold text-[#071544] dark:text-white">
                    Sign In to Demo Workspace
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Enter your own demo name, business name, and architecture below—or pick any of the 6 architecture demo profiles to explore live in the dashboard.
                  </p>
                </div>

                {pendingCalculator && (
                  <div className="p-3 rounded-xl bg-[#218DFF]/15 border border-[#218DFF]/40 text-xs text-[#1045CA] dark:text-[#9EDCFF] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#218DFF] shrink-0" />
                    <span>
                      Your calculator inputs are preserved. Sign in to view your results immediately.
                    </span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Demo Owner Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                        Your Demo Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={demoName}
                          onChange={(e) => setDemoName(e.target.value)}
                          placeholder="Your Full Name"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>
                    </div>

                    {/* Demo Business Name */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                        Demo Business Name
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={demoBusinessName}
                          onChange={(e) => setDemoBusinessName(e.target.value)}
                          placeholder="Your Business Name"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Architecture Selector */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                      Business Architecture (01 – 06)
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={architectureId}
                        onChange={(e) => handleArchSelectChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm font-semibold text-[#071544] dark:text-white cursor-pointer focus:outline-none focus:border-[#218DFF]"
                      >
                        {architectures.map((arch) => (
                          <option key={arch.id} value={arch.id}>
                            Architecture {arch.number} — {arch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Business Email */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                      Demo Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="owner@yourbusiness.rw"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>

                  {/* Password + Show/Hide */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                      Demo Password (Any Password Works in Demo)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#218DFF] bg-transparent border-0 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Stay signed in + Forgot Password */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={staySignedIn}
                        onChange={(e) => setStaySignedIn(e.target.checked)}
                        className="rounded border-blue-300 text-[#218DFF]"
                      />
                      <span>Keep demo session active</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-[#218DFF] hover:underline no-underline"
                    >
                      Forgot Password Demo?
                    </Link>
                  </div>

                  <button type="submit" className="w-full btn-sapphire py-3.5 text-sm font-orbitron">
                    <span>Sign In with My Demo Data</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Instant 1-Click Demo Profiles for All 6 Architectures + Super Admin */}
                <div className="pt-4 border-t border-blue-200/60 dark:border-[#9EDCFF]/15 space-y-2.5">
                  <div className="text-[11px] font-orbitron uppercase tracking-wider text-center text-slate-500 dark:text-[#9EDCFF]/75">
                    1-Click Demo Workspaces (All 6 Architectures)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SIX_DEMO_PROFILES.map((prof) => (
                      <button
                        key={prof.architectureId}
                        type="button"
                        onClick={() => handleDemoProfile(prof)}
                        className="p-2 rounded-xl bg-[#218DFF]/10 hover:bg-[#218DFF]/25 border border-[#218DFF]/30 text-left transition-all cursor-pointer"
                      >
                        <span className="block font-orbitron text-[10px] font-bold text-[#218DFF]">
                          {prof.label}
                        </span>
                        <span className="block text-[11px] font-bold text-[#071544] dark:text-white truncate">
                          {prof.businessName}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDemoProfile({
                        name: 'Leobeni (PYLARIX)',
                        email: 'admin@pylarix.com',
                        role: 'Platform Super Administrator',
                        businessName: 'PYLARIX Platform Control',
                        architectureId: 'hybrid',
                        planTier: 'Gold'
                      })
                    }
                    className="w-full p-2 rounded-xl bg-[#071544] hover:bg-[#1045CA] border border-[#9EDCFF]/35 text-[11px] font-bold text-[#9EDCFF] cursor-pointer text-center transition-all"
                  >
                    Open Platform Super Administrator Demo Portal →
                  </button>
                </div>

                <div className="text-center text-xs text-slate-600 dark:text-slate-300 pt-1">
                  Want to set up a custom demo business?{' '}
                  <Link to="/register" className="font-bold text-[#218DFF] hover:underline no-underline">
                    Register Demo Business
                  </Link>
                </div>
              </>
            ) : (
              /* Forgot Password Guided Demo Recovery */
              <div className="space-y-5">
                <div className="text-center space-y-1.5">
                  <span className="font-orbitron text-[11px] font-bold uppercase tracking-widest text-[#218DFF]">
                    Demo Account Recovery
                  </span>
                  <h1 className="font-orbitron text-2xl font-extrabold text-[#071544] dark:text-white">
                    Reset Your Demo Password
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Interactive demo simulation of password reset &amp; session recovery.
                  </p>
                </div>

                {forgotStep === 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setForgotStep(2)
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        Registered Demo Business Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
                      />
                    </div>
                    <button type="submit" className="w-full btn-sapphire py-3 text-sm">
                      Simulate Reset Link
                    </button>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setForgotStep(3)
                    }}
                    className="space-y-4"
                  >
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-700 dark:text-emerald-300">
                      Demo reset link verified for <strong>{email}</strong>. Enter a new demo password below.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        New Demo Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
                      />
                    </div>
                    <button type="submit" className="w-full btn-sapphire py-3 text-sm">
                      Update Demo Password
                    </button>
                  </form>
                )}

                {forgotStep === 3 && (
                  <div className="text-center space-y-4 py-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-[#071544] dark:text-white">
                      Demo password updated! You can now sign in with your demo profile.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="btn-sapphire px-6 py-2.5 text-xs"
                    >
                      Return to Demo Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
