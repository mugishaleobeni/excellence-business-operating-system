import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useExbos } from '../context/ExbosContext'
import { exbosApi } from '../utils/apiClient'
import PublicNavbar from '../components/layout/PublicNavbar'
import CodeSlots from '../components/common/CodeSlots'
import { formatRWF } from '../utils/currencyWords'
import {
  UserPlus,
  MailCheck,
  Layers,
  Building2,
  Sliders,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  AlertTriangle,
  X
} from 'lucide-react'

const STEPS = [
  { num: 1, title: 'Create Account', icon: UserPlus },
  { num: 2, title: 'Verify Email', icon: MailCheck },
  { num: 3, title: 'Business Architecture', icon: Layers },
  { num: 4, title: 'Register Business', icon: Building2 },
  { num: 5, title: 'Configure Workspace', icon: Sliders },
  { num: 6, title: 'Choose Subscription', icon: CreditCard },
  { num: 7, title: 'Complete Setup', icon: CheckCircle2 }
]

export default function RegisterPage() {
  const {
    architectures,
    pricingPlans,
    preselectedArchitecture,
    registerNewBusiness,
    pendingCalculator
  } = useExbos()

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryArch = searchParams.get('arch')
  const queryPlan = searchParams.get('plan')
  const returnTo = searchParams.get('returnTo')

  const [step, setStep] = useState(1)
  const [maxCompletedStep, setMaxCompletedStep] = useState(1)
  const [emailVerified, setEmailVerified] = useState(false)
  const [serverOtpHint, setServerOtpHint] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [codeStatus, setCodeStatus] = useState('idle')
  const [errors, setErrors] = useState({})
  const [toasts, setToasts] = useState([])

  const showToast = (message, title = 'Validation Error') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4500)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '+250 ',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    architectureId: queryArch || preselectedArchitecture || 'buy-and-sell',
    businessName: '',
    businessCategory: '',
    country: 'Rwanda',
    location: '',
    currency: 'RWF',
    language: 'en',
    initialConfigNotes: '',
    enableStockTracking: true,
    enableWhatsAppLink: true,
    planTier: queryPlan || 'Free',
    demoSpendableRWF: '',
    demoMonthlyRevenueRWF: '',
    demoPrimaryItem: ''
  })

  useEffect(() => {
    if (queryArch) {
      setForm((prev) => ({ ...prev, architectureId: queryArch }))
    }
  }, [queryArch])

  const getEmailValidationError = (email) => {
    if (!email || !email.trim()) return 'Please fill out this field.'
    const trimmed = email.trim()
    if (!trimmed.includes('@')) {
      return "Missing '@' symbol in email address."
    }
    const parts = trimmed.split('@')
    if (parts.length > 2) {
      return "Email cannot contain multiple '@' symbols."
    }
    const [local, domain] = parts
    if (!local) {
      return "Please enter a username before the '@' sign."
    }
    if (!domain) {
      return "Please enter a domain name after the '@' sign (e.g. gmail.com)."
    }
    if (!domain.includes('.')) {
      return "Domain is missing a top-level extension (e.g. .com, .rw)."
    }
    const domainParts = domain.split('.')
    if (domainParts.some((p) => !p)) {
      return "Invalid domain format (e.g. example@domain.com)."
    }
    const tld = domainParts[domainParts.length - 1]
    if (tld.length < 2) {
      return "Domain extension is too short (e.g. .rw, .com)."
    }
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(trimmed)) {
      return "Email contains invalid characters or structure."
    }
    return null
  }

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 6) score += 1
    if (pwd.length >= 10) score += 1
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: '#ef4444', class: 'active-weak' }
    } else if (score === 3 || score === 4) {
      return { score: 2, label: 'Strong', color: '#10b981', class: 'active-strong' }
    } else {
      return { score: 3, label: 'Powerful', color: '#06b6d4', class: 'active-powerful' }
    }
  }

  const handlePhoneChange = (val) => {
    let raw = val
    if (!raw.startsWith('+250 ')) {
      const digits = raw.replace(/[^0-9]/g, '')
      if (digits.startsWith('250')) {
        raw = '+250 ' + digits.slice(3)
      } else {
        raw = '+250 ' + digits
      }
    }
    setForm((prev) => ({ ...prev, phone: raw }))
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: null }))
      }
  }

  const selectedArchObj =
    architectures.find((a) => a.id === form.architectureId) || architectures[0]

  const validateStep = (currentStep) => {
    const errs = {}
    if (currentStep === 1) {
      if (!form.fullName.trim()) errs.fullName = 'Please fill out this field.'
      
      const emailErr = getEmailValidationError(form.email)
      if (emailErr) errs.email = emailErr

      const digitsOnly = form.phone.replace(/[^0-9]/g, '')
      if (!form.phone.trim() || digitsOnly === '250') {
        errs.phone = 'Please fill out this field.'
      } else if (digitsOnly.length < 12) {
        errs.phone = 'Invalid phone number (must be 9 digits after +250)'
      }

      if (!form.password) {
        errs.password = 'Please fill out this field.'
      } else if (form.password.length < 6) {
        errs.password = 'Password must be at least 6 characters.'
      }

      if (!form.confirmPassword) {
        errs.confirmPassword = 'Please fill out this field.'
      } else if (form.password !== form.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.'
      }
    } else if (currentStep === 4) {
      if (!form.businessName.trim()) errs.businessName = 'Please fill out this field.'
    }
    setErrors(errs)
    const firstField = Object.keys(errs)[0]
    if (firstField) {
      showToast(errs[firstField], 'Please check input')
      return false
    }
    return true
  }

  const nextStep = async (e) => {
    if (e) e.preventDefault()
    if (!validateStep(step)) return

    // Step 1 -> Step 2: Send 6-digit OTP verification code via Flask + Gmail SMTP
    if (step === 1) {
      setSubmitting(true)
      try {
        const res = await exbosApi.sendVerification({
          email: form.email.trim().toLowerCase(),
          fullName: form.fullName.trim()
        })
        if (!res.ok) {
          showToast(res.error || 'Could not send verification email.', 'Registration Error')
          return
        }
        const sentFlag = res.data?.data?.emailSent
        const fallbackCode = res.data?.data?.verificationCode || ''
        if (!sentFlag && fallbackCode) {
          setServerOtpHint(fallbackCode)
        } else {
          setServerOtpHint('')
        }
        setMaxCompletedStep((prev) => Math.max(prev, 2))
        setStep(2)
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Step 2 -> Step 3: Verify the 6-digit OTP code against MongoDB before unlocking Step 3
    if (step === 2) {
      if (form.verificationCode.trim().length < 6) {
        showToast('Please enter the 6-digit verification code sent to your email.', 'Verification Required')
        return
      }
      if (!emailVerified) {
        setSubmitting(true)
        try {
          const res = await exbosApi.verifyEmail({
            email: form.email.trim().toLowerCase(),
            code: form.verificationCode.trim()
          })
          if (!res.ok) {
            setCodeStatus('error')
            showToast(res.error || 'Invalid or expired 6-digit verification code.', 'Verification Failed')
            return
          }
          setEmailVerified(true)
          setCodeStatus('success')
        } finally {
          setSubmitting(false)
        }
      }
      setMaxCompletedStep((prev) => Math.max(prev, 3))
      setStep(3)
      return
    }

    const nextNum = Math.min(7, step + 1)
    setMaxCompletedStep((prev) => Math.max(prev, nextNum))
    setStep(nextNum)
  }

  const prevStep = () => setStep((prev) => Math.max(1, prev - 1))

  const handleStepBarClick = (targetStep) => {
    if (targetStep === step) return
    if (targetStep < step) {
      setStep(targetStep)
      return
    }
    if (targetStep <= maxCompletedStep && validateStep(step)) {
      setStep(targetStep)
    } else {
      showToast(
        `Please complete Step 0${step} (${STEPS[step - 1].title}) before advancing to Step 0${targetStep}.`,
        'Step Locked'
      )
    }
  }

  const handleResendVerificationCode = async () => {
    setSubmitting(true)
    try {
      const res = await exbosApi.sendVerification({
        email: form.email.trim().toLowerCase(),
        fullName: form.fullName.trim()
      })
      if (res.ok) {
        const sentFlag = res.data?.data?.emailSent
        const fallbackCode = res.data?.data?.verificationCode || ''
        if (!sentFlag && fallbackCode) {
          setServerOtpHint(fallbackCode)
        }
        setForm((prev) => ({ ...prev, verificationCode: '' }))
        setCodeStatus('idle')
        setEmailVerified(false)
      } else {
        showToast(res.error || 'Failed to resend verification code.', 'Error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinishRegistration = async () => {
    if (!validateStep(1) || !validateStep(4)) {
      return
    }
    setSubmitting(true)
    try {
      const createdUser = await registerNewBusiness({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        password: form.password,
        businessName: form.businessName.trim(),
        businessCategory: form.businessCategory.trim() || selectedArchObj.name,
        country: form.country,
        location: form.location.trim() || 'Kigali, Rwanda',
        architectureId: form.architectureId,
        planTier: form.planTier,
        currency: form.currency,
        language: form.language,
        startingSpendableRWF: form.demoSpendableRWF,
        startingMonthlyRevenueRWF: form.demoMonthlyRevenueRWF,
        primaryItem: form.demoPrimaryItem
      })
      const targetArch = createdUser?.architectureId || form.architectureId || 'buy-and-sell'
      try {
        localStorage.setItem('exbos_active_arch', targetArch)
      } catch {}
      if (returnTo === 'calculator' || pendingCalculator) {
        navigate('/business-tools')
      } else {
        navigate(`/dashboard?arch=${targetArch}&module=Overview&page=Dashboard`)
      }
    } catch (err) {
      showToast(err.message || 'Could not complete registration.', 'Registration Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col relative w-full overflow-hidden isolate"
      style={{
        background:
          'linear-gradient(180deg, #071544 0%, #0A2786 38%, #0E3AA6 70%, #0A2786 100%)'
      }}
    >
      {/* Background glow orbs, fine dot grid, light sweep (matching Explore Business Financial Tools) */}
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

      {/* System Toast Notification Container */}
      <div className="exbos-toast-container" aria-live="assertive">
        {toasts.map((t) => (
          <div key={t.id} className="exbos-toast" role="alert">
            <div className="exbos-toast-icon">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="exbos-toast-body">
              <div className="exbos-toast-title">{t.title}</div>
              <div className="exbos-toast-msg">{t.message}</div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="exbos-toast-close"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-28 pb-20">
        {/* Progress Stepper Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-orbitron text-xs uppercase tracking-widest text-[#9EDCFF]">
                Guided Business Setup · Step {step} of 7
              </span>
              <h1 className="font-orbitron text-2xl sm:text-4xl font-extrabold text-white">
                {STEPS[step - 1].title}
              </h1>
            </div>
            <span className="font-orbitron text-sm font-bold px-3.5 py-1.5 rounded-xl bg-white/15 text-[#9EDCFF] backdrop-blur-md">
              {Math.round((step / 7) * 100)}% Complete
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon
              const active = s.num === step
              const done = s.num < step
              const locked = s.num > maxCompletedStep
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => handleStepBarClick(s.num)}
                  style={{
                    boxShadow: 'none',
                    border: 'none',
                    outline: 'none',
                    backdropFilter: 'blur(18px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(160%)'
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl text-left transition-all flex flex-col gap-1 ${
                    active
                      ? 'bg-white/30 text-white cursor-pointer'
                      : done
                      ? 'bg-white/15 text-[#9EDCFF] hover:bg-white/20 cursor-pointer'
                      : locked
                      ? 'bg-white/5 opacity-45 text-slate-300 cursor-not-allowed'
                      : 'bg-white/10 opacity-80 text-slate-200 hover:opacity-100 hover:bg-white/15 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron text-[10px] font-bold">0{s.num}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden md:block text-[11px] font-semibold truncate">
                    {s.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Glassmorphism Setup Card */}
        <div
          className="rounded-3xl p-6 sm:p-10 space-y-6 text-white"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: 'none',
            boxShadow: 'none'
          }}
        >


          {/* STEP 1: CREATE ACCOUNT */}
          {step === 1 && (
            <form onSubmit={nextStep} noValidate className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm({ ...form, fullName: e.target.value })
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }))
                    }}
                    placeholder="e.g. Jean-Paul Habimana"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value })
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }))
                    }}
                    placeholder="founder@yourbusiness.rw"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Phone Number (WhatsApp Ready) *
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                      Password *
                    </label>
                    {form.password && (
                      <span
                        className="text-[11px] font-orbitron font-bold uppercase transition-colors"
                        style={{ color: getPasswordStrength(form.password).color }}
                      >
                        {getPasswordStrength(form.password).label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value })
                        if (errors.password) setErrors((prev) => ({ ...prev, password: null }))
                      }}
                      placeholder="Strong password"
                      className="w-full px-4 pr-10 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 bg-transparent border-0 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Dynamic Password Strength Bar (Weak / Strong / Powerful) */}
                  {form.password && (
                    <div className="password-strength-bar">
                      <div
                        className={`password-strength-segment ${
                          getPasswordStrength(form.password).score >= 1
                            ? getPasswordStrength(form.password).class
                            : ''
                        }`}
                      />
                      <div
                        className={`password-strength-segment ${
                          getPasswordStrength(form.password).score >= 2
                            ? getPasswordStrength(form.password).class
                            : ''
                        }`}
                      />
                      <div
                        className={`password-strength-segment ${
                          getPasswordStrength(form.password).score >= 3
                            ? getPasswordStrength(form.password).class
                            : ''
                        }`}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 sm:col-span-2 relative">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => {
                        setForm({ ...form, confirmPassword: e.target.value })
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }))
                      }}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link to="/login" className="text-xs font-bold text-white hover:text-[#9EDCFF] no-underline transition-colors">
                  Already have an account? Sign In
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-sapphire px-6 py-3 text-sm disabled:opacity-60"
                >
                  <span>{submitting ? 'Sending Verification Code...' : 'Continue to Step 2'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY EMAIL */}
          {step === 2 && (
            <form onSubmit={nextStep} className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/10 text-sm text-[#9EDCFF] backdrop-blur-md flex items-center justify-between gap-4 flex-wrap">
                <div>
                  We sent a 6-digit verification code to{' '}
                  <strong className="text-white">{form.email}</strong>. Enter the code below to verify your email address.
                  {serverOtpHint && (
                    <div className="mt-1.5 text-xs text-amber-300 font-mono">
                      Offline SMTP Fallback Code: <strong>{serverOtpHint}</strong>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResendVerificationCode}
                  className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white cursor-pointer shrink-0"
                >
                  Resend Code
                </button>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#9EDCFF]">
                  6-Digit Verification Code
                </label>

                <div className="pt-2 pb-2">
                  <CodeSlots
                    length={6}
                    value={form.verificationCode}
                    status={codeStatus}
                    onChange={(code) => {
                      setForm((prev) => ({ ...prev, verificationCode: code }))
                      setEmailVerified(false)
                      if (codeStatus !== 'idle') setCodeStatus('idle')
                    }}
                    onComplete={async (code) => {
                      if (code.length === 6) {
                        const res = await exbosApi.verifyEmail({
                          email: form.email.trim().toLowerCase(),
                          code: code.trim()
                        })
                        if (res.ok) {
                          setEmailVerified(true)
                          setCodeStatus('success')
                        } else {
                          setEmailVerified(false)
                          setCodeStatus('error')
                          showToast(res.error || 'Invalid 6-digit verification code.', 'Verification Failed')
                        }
                      }
                    }}
                    accentColor="#f5f5f5"
                    inkColor="#f5f5f5"
                    slotColor="#27272a"
                    digitColor="#18181b"
                    dangerColor="#ff3b30"
                    slotSize={48}
                    gap={10}
                    radius={12}
                    bounce={0.2}
                    settle={0.3}
                    rise={8}
                    cascade={20}
                    mask={false}
                    caret
                  />
                </div>

                {codeStatus === 'success' && (
                  <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
                    ✓ 6-Digit code verified successfully!
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={form.verificationCode.length < 6}
                  className="btn-sapphire px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Verify Email &amp; Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CHOOSE BUSINESS ARCHITECTURE */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-white font-medium">
                <strong className="font-bold text-white">How does your business operate?</strong> Select your primary architecture so EXCELLENCE BOS configures the right dashboard modules and financial workflows.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {architectures.map((arch) => {
                  const selected = form.architectureId === arch.id
                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setForm({ ...form, architectureId: arch.id })}
                      style={{ boxShadow: 'none', border: 'none', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                      className={`text-left p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        selected
                          ? 'bg-white/30 text-white'
                          : 'bg-white/10 text-white hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-orbitron text-xs font-bold text-white font-black">
                          {arch.number}
                        </span>
                        {selected && <Check className="w-4 h-4 text-[#9EDCFF]" />}
                      </div>
                      <div>
                        <h3 className="font-orbitron font-bold text-base text-white">{arch.name}</h3>
                        <p className="text-xs mt-1 text-white opacity-90 leading-relaxed">
                          {arch.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button type="button" onClick={nextStep} className="btn-sapphire px-6 py-3 text-sm">
                  <span>Continue with {selectedArchObj.shortName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REGISTER BUSINESS */}
          {step === 4 && (
            <form onSubmit={nextStep} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="e.g. Kigali Prime Enterprise"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Business Category
                  </label>
                  <input
                    type="text"
                    value={form.businessCategory}
                    onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Country &amp; Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                      Currency
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full px-3 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                    >
                      <option value="RWF">RWF (Default)</option>
                      <option value="USD">USD</option>
                      <option value="KES">KES</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                      Language
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="w-full px-3 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                    >
                      <option value="en">English</option>
                      <option value="rw">Ikinyarwanda</option>
                    </select>
                  </div>
                </div>

                {/* Opening Balances & First Item for Dashboard Initialization */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Opening Spendable Balance (RWF)
                  </label>
                  <input
                    type="number"
                    value={form.demoSpendableRWF}
                    onChange={(e) => setForm({ ...form, demoSpendableRWF: e.target.value })}
                    placeholder="e.g. 0 or current cash/MoMo balance"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Current Monthly Revenue Target (RWF)
                  </label>
                  <input
                    type="number"
                    value={form.demoMonthlyRevenueRWF}
                    onChange={(e) => setForm({ ...form, demoMonthlyRevenueRWF: e.target.value })}
                    placeholder="e.g. 0 or monthly target"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-[#9EDCFF]">
                    Your First Product, Service, or Batch Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.demoPrimaryItem}
                    onChange={(e) => setForm({ ...form, demoPrimaryItem: e.target.value })}
                    placeholder="e.g. Portland Cement 50kg / Artisan Loaf / Technical Service"
                    className="w-full px-4 py-3 rounded-2xl reg-input bg-white/15 border-0 outline-none text-sm text-white focus:outline-none focus:bg-white/25 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button type="submit" className="btn-sapphire px-6 py-3 text-sm">
                  <span>Continue to Workspace Configuration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: CONFIGURE BUSINESS (ARCHITECTURE SPECIFIC + SKIP OPTION) */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md space-y-2">
                <span className="font-orbitron text-xs uppercase text-[#1045CA] dark:text-[#9EDCFF] font-bold">
                  {selectedArchObj.name} Initial Modules
                </span>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  We have pre-enabled the recommended workflows for <strong>{selectedArchObj.name}</strong>:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedArchObj.workflows.map((wf) => (
                    <span
                      key={wf}
                      className="px-3 py-1 rounded-xl bg-white/80 dark:bg-[#071544] text-xs font-semibold text-[#071544] dark:text-[#9EDCFF]"
                    >
                      ✓ {wf}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={form.enableStockTracking}
                    onChange={(e) => setForm({ ...form, enableStockTracking: e.target.checked })}
                  />
                  <span className="text-sm font-medium">
                    Initialize &ldquo;Where Is My Money?&rdquo; Cash, MoMo, Bank &amp; Stock Ledger
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/10 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={form.enableWhatsAppLink}
                    onChange={(e) => setForm({ ...form, enableWhatsAppLink: e.target.checked })}
                  />
                  <span className="text-sm font-medium">
                    Link {form.phone} to Official EXCELLENCE BOS WhatsApp Assistant
                  </span>
                </label>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/10 text-xs font-semibold text-[#9EDCFF] cursor-pointer"
                  >
                    Skip Optional Setup for Later
                  </button>
                  <button type="button" onClick={nextStep} className="btn-sapphire px-6 py-3 text-sm">
                    <span>Save &amp; Choose Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: CHOOSE SUBSCRIPTION */}
          {step === 6 && (
            <div className="space-y-6">
              <p className="text-sm text-white font-medium">
                Select your subscription plan. Pricing and features are synchronized live from Super Administrator settings.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pricingPlans.map((plan) => {
                  const selected = form.planTier === plan.tier
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setForm({ ...form, planTier: plan.tier })}
                      className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        selected
                          ? 'bg-gradient-to-b from-[#1045CA] to-[#071544] text-white border-[#9EDCFF] shadow-sapphire-glow'
                          : 'bg-white/75 dark:bg-[#071544]/65 border-blue-200 dark:border-[#9EDCFF]/20 text-white'
                      }`}
                    >
                      <div>
                        <div className="font-orbitron font-bold text-sm uppercase">{plan.name}</div>
                        <div className="font-orbitron text-xl font-extrabold mt-1">
                          {plan.priceRWF === 0 ? '0 RWF' : formatRWF(plan.priceRWF)}
                        </div>
                        <p className="text-xs opacity-80 mt-2">{plan.description}</p>
                      </div>
                      <span className="text-xs font-orbitron font-bold underline">
                        {selected ? '✓ Selected Plan' : 'Choose Plan'}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2.5 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button type="button" onClick={nextStep} className="btn-sapphire px-6 py-3 text-sm">
                  <span>Review &amp; Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: COMPLETE REGISTRATION */}
          {step === 7 && (
            <div className="space-y-6 text-center py-4">
              <div className="space-y-2 max-w-xl mx-auto pt-2">
                <span className="font-orbitron text-xs uppercase tracking-widest text-white font-bold">
                  Step 7 of 7 · Workspace Ready
                </span>
                <h2 className="font-orbitron text-2xl sm:text-3xl font-extrabold text-white">
                  {form.businessName || `${selectedArchObj.shortName} Enterprise`} Is Ready!
                </h2>
                <p className="text-sm text-white opacity-90">
                  Architecture: <strong>{selectedArchObj.name}</strong> · Plan:{' '}
                  <strong>{form.planTier}</strong> · Currency: <strong>{form.currency}</strong>
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-2xl bg-white/10 backdrop-blur-md text-left text-xs space-y-1.5">
                <div>✓ User account &amp; Argon2id security profile created</div>
                <div>✓ {selectedArchObj.name} navigation &amp; modules configured</div>
                <div>✓ &ldquo;Where Is My Money?&rdquo; &amp; 6-Month Survival engine initialized</div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-5 py-3 rounded-xl bg-white/60 dark:bg-white/10 text-xs font-semibold text-white cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinishRegistration}
                  className="btn-sapphire px-8 py-4 text-sm sm:text-base font-orbitron disabled:opacity-60"
                >
                  <span>
                    {submitting
                      ? 'Creating Cloud Workspace...'
                      : pendingCalculator || returnTo === 'calculator'
                      ? 'Complete & Return to Calculator'
                      : 'Open Personalized Dashboard'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

