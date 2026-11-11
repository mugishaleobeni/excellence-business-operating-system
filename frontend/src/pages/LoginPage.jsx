import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { exbosApi, isTokenValid } from '../utils/apiClient'
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
  AlertCircle,
  ShieldCheck
} from 'lucide-react'

export default function LoginPage({ isForgotPassword = false }) {
  const { user, login, pendingCalculator, addToast } = useExbos()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

  // Auto-redirect if user already has an active, valid JWT session
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('exbos_access_token') : null
    if (user && token && isTokenValid(token) && !isForgotPassword) {
      if (returnTo === 'calculator') {
        navigate('/#explore-business-tools')
      } else {
        const targetArch =
          user.architectureId ||
          localStorage.getItem('exbos_active_arch') ||
          'buy-and-sell'
        navigate(`/dashboard?arch=${targetArch}&module=Overview&page=Dashboard`, {
          replace: true
        })
      }
    }
  }, [user, isForgotPassword, returnTo, navigate])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Forgot password steps (1: Request OTP, 2: Enter OTP & New Password, 3: Completed)
  const [forgotStep, setForgotStep] = useState(1)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const handleSignIn = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your registered email address and password.')
      return
    }

    setSubmitting(true)
    try {
      const authenticatedUser = await login({
        email: email.trim().toLowerCase(),
        password
      })
      const targetArch = authenticatedUser.architectureId || 'buy-and-sell'
      try {
        localStorage.setItem('exbos_active_arch', targetArch)
      } catch {}

      addToast({
        type: 'success',
        title: 'Signed In',
        message: `Welcome back, ${authenticatedUser.name || authenticatedUser.businessName}!`
      })
      if (
        authenticatedUser.role === 'SUPER_ADMIN' ||
        authenticatedUser.role === 'Platform Super Administrator'
      ) {
        navigate('/super-admin')
      } else if (returnTo === 'calculator' || pendingCalculator) {
        navigate('/business-tools')
      } else {
        navigate(`/dashboard?arch=${targetArch}&module=Overview&page=Dashboard`)
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email.trim()) {
      setErrorMsg('Please enter your registered business email.')
      return
    }
    setSubmitting(true)
    try {
      const res = await exbosApi.forgotPassword(email.trim().toLowerCase())
      if (!res.ok) {
        setErrorMsg(res.error || 'Could not send reset code.')
        return
      }
      addToast({
        type: 'success',
        title: 'Verification Code Sent',
        message: `A 6-digit password reset code has been sent to ${email.trim()}.`
      })
      setForgotStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (resetCode.trim().length < 6) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await exbosApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: resetCode.trim(),
        newPassword
      })
      if (!res.ok) {
        setErrorMsg(res.error || 'Invalid or expired verification code.')
        return
      }
      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been updated. You can now sign in.'
      })
      setForgotStep(3)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative w-full overflow-hidden isolate"
      style={{
        background:
          'linear-gradient(180deg, #071544 0%, #0A2786 38%, #0E3AA6 70%, #0A2786 100%)'
      }}
    >
      {/* Background glow orbs, fine dot grid, light sweep (matching RegisterPage and Financial Tools) */}
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

      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-28 relative z-10">
        <div className="w-full max-w-md relative">
          {/* Floating User Icon Orb - Solid Premium Dark Sapphire */}
          <div className="w-16 h-16 rounded-2xl bg-[#071544]/90 border-2 border-[#218DFF]/60 shadow-[0_10px_30px_rgba(0,0,0,0.5),0_0_20px_rgba(33,141,255,0.35)] backdrop-blur-xl flex items-center justify-center text-white mx-auto -mb-8 relative z-20">
            {isForgotPassword ? (
              <KeyRound className="w-7 h-7 text-[#9EDCFF]" />
            ) : (
              <User className="w-8 h-8 text-[#9EDCFF]" />
            )}
          </div>

          <div
            className="rounded-3xl pt-12 pb-8 px-6 sm:px-8 space-y-6 text-white"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              border: 'none',
              boxShadow: 'none'
            }}
          >
            {!isForgotPassword ? (
              <>
                <div className="text-center space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-widest text-[#9EDCFF]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>ENCRYPTED CLOUD WORKSPACE</span>
                  </span>
                  <h1 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Sign In to Your Business
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Enter your registered business email and password to open your live EXCELLENCE BOS workspace.
                  </p>
                </div>

                {pendingCalculator && (
                  <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-xs sm:text-sm text-[#9EDCFF] flex items-center gap-2.5 backdrop-blur-md">
                    <Sparkles className="w-4 h-4 text-[#218DFF] shrink-0" />
                    <span>
                      Your calculator inputs are preserved. Sign in to view your results immediately.
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs sm:text-sm text-rose-200 flex items-start gap-2.5 backdrop-blur-md">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Business Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                      Registered Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#9EDCFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (errorMsg) setErrorMsg('')
                        }}
                        placeholder="founder@yourbusiness.rw"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password + Show/Hide */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#9EDCFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (errorMsg) setErrorMsg('')
                        }}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white bg-transparent border-0 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Stay signed in + Forgot Password */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={staySignedIn}
                        onChange={(e) => setStaySignedIn(e.target.checked)}
                        className="rounded border-white/30 bg-white/10 text-[#218DFF] accent-[#218DFF]"
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-[#9EDCFF] hover:text-white transition-colors no-underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-sapphire py-3.5 text-sm font-orbitron disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center text-xs text-slate-200 pt-3 border-t border-white/15">
                  Don&apos;t have a business workspace yet?{' '}
                  <Link to="/register" className="font-bold text-[#9EDCFF] hover:text-white hover:underline no-underline transition-colors">
                    Register Your Business
                  </Link>
                </div>
              </>
            ) : (
              /* Forgot Password Account Recovery (Connected to Gmail SMTP & MongoDB Atlas) */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <span className="font-orbitron text-[11px] font-bold uppercase tracking-widest text-[#9EDCFF]">
                    Account Security Recovery
                  </span>
                  <h1 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Reset Your Password
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    We will send a 6-digit verification code to your registered business email.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs sm:text-sm text-rose-200 flex items-start gap-2.5 backdrop-blur-md">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {forgotStep === 1 && (
                  <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                        Registered Business Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="founder@yourbusiness.rw"
                        className="w-full px-4 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-sapphire py-3 text-sm disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Sending Code...' : 'Send 6-Digit Reset Code'}
                    </button>
                    <div className="text-center pt-1">
                      <Link to="/login" className="text-xs font-semibold text-[#9EDCFF] hover:text-white transition-colors no-underline">
                        ← Back to Sign In
                      </Link>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-xs sm:text-sm text-emerald-200 backdrop-blur-md">
                      Verification code sent to <strong className="text-white">{email}</strong>. Enter the 6-digit code and your new password below.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm font-mono tracking-widest text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-3 rounded-2xl bg-white/15 border border-white/20 outline-none text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:border-[#218DFF] focus:ring-2 focus:ring-[#218DFF]/40 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-sapphire py-3 text-sm disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? 'Updating Password...' : 'Verify & Update Password'}
                    </button>
                  </form>
                )}

                {forgotStep === 3 && (
                  <div className="text-center space-y-4 py-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-white">
                      Your password has been updated! You can now sign in to your workspace.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="btn-sapphire px-6 py-2.5 text-xs cursor-pointer"
                    >
                      Return to Sign In
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
