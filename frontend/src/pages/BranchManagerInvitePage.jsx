import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  MapPin,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { apiClient } from '../utils/apiClient'
import { useExbos } from '../context/ExbosContext'

export default function BranchManagerInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { setUser, addToast } = useExbos()

  const [loadingInvite, setLoadingInvite] = useState(true)
  const [inviteInfo, setInviteInfo] = useState(null)
  const [inviteError, setInviteError] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadInvite = async () => {
      if (!token) {
        setInviteError('Invalid invitation link.')
        setLoadingInvite(false)
        return
      }
      setLoadingInvite(true)
      setInviteError('')
      const res = await apiClient.getBranchManagerInvite(token)
      if (!mounted) return
      if (res.ok && res.data?.data) {
        const info = res.data.data
        setInviteInfo(info)
        if (info.suggestedName) setFullName(info.suggestedName)
        if (info.suggestedEmail) setEmail(info.suggestedEmail)
        if (info.suggestedPhone) setPhone(info.suggestedPhone)
      } else {
        setInviteError(res.error || res.data?.error || 'This invitation link is invalid or has expired.')
      }
      setLoadingInvite(false)
    }
    loadInvite()
    return () => {
      mounted = false
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const cleanName = fullName.trim()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanName) {
      setFormError('Please enter your full name.')
      return
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.')
      return
    }

    setSubmitting(true)
    try {
      const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://exbos.pages.dev'
      const res = await apiClient.completeBranchManagerInvite(token, {
        fullName: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        password,
        confirmPassword,
        frontendOrigin
      })

      if (!res.ok) {
        setFormError(res.error || res.data?.error || 'Could not complete account setup.')
        setSubmitting(false)
        return
      }

      const payload = res.data?.data || res.data || {}
      const accessToken = payload.access_token
      const newUser = payload.user

      if (accessToken && newUser) {
        try {
          localStorage.setItem('exbos_access_token', accessToken)
          localStorage.setItem('exbos_user', JSON.stringify(newUser))
          if (newUser.assignedBranchId) {
            localStorage.setItem('exbos_active_branch_id', newUser.assignedBranchId)
          }
          localStorage.setItem('exbos_active_module', 'Overview')
          localStorage.setItem('exbos_active_page', 'Dashboard')
        } catch {}
        if (typeof setUser === 'function') {
          setUser(newUser)
        }
      }

      setCompleted(true)
      if (addToast) {
        addToast({
          type: 'success',
          title: 'Branch Manager Account Ready',
          message: `Welcome to ${inviteInfo?.branchName || 'your branch'}! The business owner has been notified.`
        })
      }

      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1100)
    } catch (err) {
      setFormError(err?.message || 'Unexpected error while setting up your account.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#03091F] text-white flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Ambient Sapphire Glow */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-96 h-96 rounded-full bg-[#218DFF]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#0A2786]/40 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img
            src="/logo/exboslogo.png"
            alt="ExBOS Logo"
            className="w-11 h-11 rounded-2xl border border-[#9EDCFF]/40 bg-[#050D2B] object-contain shadow-lg"
          />
          <div>
            <div className="font-orbitron text-base font-black tracking-wider text-white">
              EXCELLENCE BOS
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9EDCFF]">
              Branch Manager Account Setup
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl bg-[#071544]/90 border border-[#9EDCFF]/30 shadow-[0_24px_70px_rgba(0,0,0,0.65)] p-6 sm:p-8 backdrop-blur-xl">
          {loadingInvite ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-[#218DFF] animate-spin" />
              <div className="font-orbitron text-sm font-bold text-white">
                Verifying Invitation Link...
              </div>
              <p className="text-xs text-slate-300">
                Checking branch assignment and security token.
              </p>
            </div>
          ) : inviteError ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-400/35 flex items-center justify-center text-rose-300">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-orbitron text-lg font-extrabold text-white">
                  Invitation Unavailable
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {inviteError}
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] text-white text-xs font-orbitron font-bold no-underline shadow-lg"
                >
                  Go to Sign In
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-semibold no-underline"
                >
                  ExBOS Home
                </Link>
              </div>
            </div>
          ) : completed ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h1 className="font-orbitron text-lg font-extrabold text-white">
                  Account Activated Successfully
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Your Branch Manager account for <strong>{inviteInfo?.branchName}</strong> is ready and the Business Owner has been notified. Redirecting to your branch dashboard...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Branch Summary Banner */}
              <div className="rounded-2xl bg-[#03091F]/80 border border-[#218DFF]/35 p-4 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-orbitron font-bold uppercase text-emerald-300">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Branch Invitation</span>
                </div>
                <div className="font-orbitron text-base sm:text-lg font-black text-white">
                  {inviteInfo?.branchName}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#9EDCFF]" />
                    <span>{inviteInfo?.businessName}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#218DFF]" />
                    <span>{inviteInfo?.branchLocation}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Enter your email address and choose the password you want to use to sign in as Branch Manager.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jean Paul Mugabo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Your Login Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+25078..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#03091F]/80 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#218DFF]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#218DFF] to-[#1045CA] hover:from-[#3B9BFF] hover:to-[#1856E8] text-white font-orbitron text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-[0_10px_30px_rgba(33,141,255,0.4)] disabled:opacity-50 transition"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Your Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Open Branch Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

