import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { exbosApi } from '../utils/apiClient'
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
  const { login, pendingCalculator, addToast } = useExbos()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')

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
        navigate(`/dashboard?arch=${authenticatedUser.architectureId || 'buy-and-sell'}`)
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
    <div className="min-h-screen flex flex-col justify-between bg-[#edf4ff] dark:bg-[#03091F]">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24 sm:py-28">
        <div className="w-full max-w-md relative">
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
                    <ShieldCheck className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>ENCRYPTED CLOUD WORKSPACE</span>
                  </span>
                  <h1 className="font-orbitron text-2xl font-extrabold text-[#071544] dark:text-white">
                    Sign In to Your Business
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Enter your registered business email and password to open your live EXCELLENCE BOS workspace.
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

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Business Email */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                      Registered Business Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>

                  {/* Password + Show/Hide */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-[#9EDCFF]/85">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#218DFF] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
                        className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-xs sm:text-sm text-[#071544] dark:text-white focus:outline-none focus:border-[#218DFF]"
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
                      <span>Keep me signed in</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="font-semibold text-[#218DFF] hover:underline no-underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-sapphire py-3.5 text-sm font-orbitron disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{submitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-center text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-blue-200/60 dark:border-[#9EDCFF]/15">
                  Don&apos;t have a business workspace yet?{' '}
                  <Link to="/register" className="font-bold text-[#218DFF] hover:underline no-underline">
                    Register Your Business
                  </Link>
                </div>
              </>
            ) : (
              /* Forgot Password Account Recovery (Connected to Gmail SMTP & MongoDB Atlas) */
              <div className="space-y-5">
                <div className="text-center space-y-1.5">
                  <span className="font-orbitron text-[11px] font-bold uppercase tracking-widest text-[#218DFF]">
                    Account Security Recovery
                  </span>
                  <h1 className="font-orbitron text-2xl font-extrabold text-[#071544] dark:text-white">
                    Reset Your Password
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    We will send a 6-digit verification code to your registered business email.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {forgotStep === 1 && (
                  <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        Registered Business Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="founder@yourbusiness.rw"
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-sapphire py-3 text-sm disabled:opacity-60"
                    >
                      {submitting ? 'Sending Code...' : 'Send 6-Digit Reset Code'}
                    </button>
                    <div className="text-center pt-1">
                      <Link to="/login" className="text-xs font-semibold text-[#218DFF] hover:underline no-underline">
                        ← Back to Sign In
                      </Link>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-700 dark:text-emerald-300">
                      Verification code sent to <strong>{email}</strong>. Enter the 6-digit code and your new password below.
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="000000"
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm font-mono tracking-widest text-[#071544] dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-[#9EDCFF]">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-3 rounded-2xl bg-white/85 dark:bg-[#071544]/85 border border-blue-200 dark:border-[#9EDCFF]/30 text-sm text-[#071544] dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-sapphire py-3 text-sm disabled:opacity-60"
                    >
                      {submitting ? 'Updating Password...' : 'Verify & Update Password'}
                    </button>
                  </form>
                )}

                {forgotStep === 3 && (
                  <div className="text-center space-y-4 py-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="text-sm font-semibold text-[#071544] dark:text-white">
                      Your password has been updated! You can now sign in to your workspace.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="btn-sapphire px-6 py-2.5 text-xs"
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
