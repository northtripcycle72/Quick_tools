'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AuthClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form State
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isForgot, setIsForgot] = useState(false)

  // Status & Feedback State
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [successScreen, setSuccessScreen] = useState<'verify' | 'reset' | null>(null)
  const [loading, setLoading] = useState(false)

  // Check URL tab & OAuth errors on mount
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'register') {
      setActiveTab('register')
    } else if (tab === 'login') {
      setActiveTab('login')
    }

    if (searchParams.get('error') === 'oauth_failed') {
      const desc = searchParams.get('desc')
      showError(desc ? `Sign-in error: ${desc}` : 'Google sign-in failed or was cancelled. Please try again.')
    }
  }, [searchParams])

  const showError = (msg: string) => {
    setMessage(msg)
    setMessageType('error')
  }

  // Password Strength Calculation (0 to 4)
  const passwordStrength = useMemo(() => {
    if (!password) return 0
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 10) score += 1
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return score
  }, [password])

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 1: return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' }
      case 2: return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' }
      case 3: return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' }
      case 4: return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' }
      default: return { label: '', color: 'bg-gray-200', text: '' }
    }
  }

  /* ── Form Handler ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Forgot Password Flow
    if (isForgot) {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/reset-password`,
      })
      if (error) {
        showError(error.message)
      } else {
        setEmail('')
        setSuccessScreen('reset')
      }
      setLoading(false)
      return
    }

    // Registration Flow (MySQL quick_tool_db)
    if (activeTab === 'register') {
      if (!fullName.trim()) {
        showError('Please enter your full name.')
        setLoading(false)
        return
      }
      if (password !== confirmPassword) {
        showError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        showError('Password must be at least 6 characters.')
        setLoading(false)
        return
      }
      if (!agreeTerms) {
        showError('Please accept the Terms of Service & Privacy Policy to continue.')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          showError(data.error || 'Registration failed.')
        } else {
          setEmail('')
          setPassword('')
          setConfirmPassword('')
          setFullName('')
          const redirectTo = searchParams.get('redirect') || '/'
          router.push(redirectTo)
          router.refresh()
        }
      } catch (err: unknown) {
        console.error('[Registration Error]', err)
        showError('Network error during registration. Please ensure MySQL service is running.')
      }
      setLoading(false)
      return
    }

    // Login Flow (MySQL quick_tool_db)
    if (activeTab === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
            rememberMe,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          showError(data.error || 'Sign in failed.')
        } else {
          const redirectTo = searchParams.get('redirect') || '/'
          router.push(redirectTo)
          router.refresh()
        }
      } catch (err: unknown) {
        console.error('[Login Error]', err)
        showError('Network error during sign in. Please ensure MySQL service is running.')
      }
      setLoading(false)
    }
  }

  /* ── Google OAuth ── */
  const handleGoogleOAuth = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    })
    if (error) showError(error.message)
  }

  /* ── Success Screen Component ── */
  if (successScreen) {
    const isVerify = successScreen === 'verify'
    return (
      <main className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/50 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner ${
                isVerify
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 44 }}>
                {isVerify ? 'mark_email_read' : 'lock_reset'}
              </span>
            </div>
          </div>

          <h2 className="text-headline-sm text-on-surface font-extrabold mb-3">
            {isVerify ? 'Verification Email Sent!' : 'Password Reset Link Sent!'}
          </h2>
          <p className="text-body-md text-on-surface-variant mb-4 leading-relaxed">
            {isVerify
              ? 'We have sent a confirmation link to your email address. Please check your inbox and click the link to activate your account.'
              : 'A password reset link has been dispatched to your email address. Click the link to define a new password.'}
          </p>

          <div className="bg-surface-variant/30 rounded-xl p-4 mb-6 border border-outline-variant/30 text-left flex items-start gap-3">
            <span className="material-symbols-outlined text-primary shrink-0 text-[20px] mt-0.5">info</span>
            <p className="text-body-sm text-on-surface-variant">
              Can&apos;t find the email? Make sure to check your <strong>spam or junk folder</strong>.
            </p>
          </div>

          <button
            onClick={() => {
              setSuccessScreen(null)
              setActiveTab('login')
              setIsForgot(false)
              setMessage('')
            }}
            className="w-full bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl hover:opacity-90 transition-all shadow-md text-label-md flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Sign In
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 sm:p-6 my-auto">
      <div className="w-full max-w-[460px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-6 sm:p-8 transition-all">

        {/* ── Top Header Navigation ── */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-primary transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Home
          </Link>
          <span className="text-label-sm font-semibold text-outline tracking-wider uppercase">
            QuickTools Auth
          </span>
        </div>

        {/* ── Brand Logo ── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-container text-on-primary rounded-xl mb-3 shadow-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
              bolt
            </span>
          </div>
          <h1 className="text-headline-md text-on-surface font-black tracking-tight mb-1">
            {isForgot
              ? 'Reset Password'
              : activeTab === 'login'
                ? 'Welcome Back'
                : 'Create an Account'}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {isForgot
              ? 'Enter your email to receive a recovery link.'
              : activeTab === 'login'
                ? 'Sign in to access your dashboard and tools.'
                : 'Get started for free — access all online tools.'}
          </p>
        </div>

        {/* ── Tab Switcher (Login vs Register) ── */}
        {!isForgot && (
          <div className="grid grid-cols-2 p-1 bg-surface-variant/40 rounded-xl mb-6 border border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login')
                setMessage('')
              }}
              className={`py-2.5 px-4 text-label-md font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'login'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register')
                setMessage('')
              }}
              className={`py-2.5 px-4 text-label-md font-bold rounded-lg transition-all duration-200 ${
                activeTab === 'register'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* ── Google OAuth Button ── */}
        {!isForgot && (
          <>
            <button
              type="button"
              onClick={handleGoogleOAuth}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-outline-variant/60 rounded-xl text-label-md text-on-surface hover:bg-surface-container-low transition-all font-semibold shadow-2xs"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-grow border-t border-outline-variant/40" />
              <span className="px-3 text-on-surface-variant text-label-sm uppercase tracking-wider bg-surface-container-lowest">
                or continue with email
              </span>
              <div className="flex-grow border-t border-outline-variant/40" />
            </div>
          </>
        )}

        {/* ── Form Inputs ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Registration Only: Full Name */}
          {activeTab === 'register' && !isForgot && (
            <div>
              <label htmlFor="reg-name" className="block text-label-md text-on-surface mb-1.5 font-semibold">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-outline-variant/40 rounded-xl text-body-md text-on-surface bg-surface-variant/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label htmlFor="auth-email" className="block text-label-md text-on-surface mb-1.5 font-semibold">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-outline-variant/40 rounded-xl text-body-md text-on-surface bg-surface-variant/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
            />
          </div>

          {/* Password Input (Hidden on forgot password screen) */}
          {!isForgot && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="auth-password" className="block text-label-md text-on-surface font-semibold">
                  Password
                </label>
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(true)
                      setMessage('')
                    }}
                    className="text-label-md text-primary hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-20 border border-outline-variant/40 rounded-xl text-body-md text-on-surface bg-surface-variant/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-outline hover:text-primary transition-colors px-1.5 py-1 rounded select-none"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>

              {/* Dynamic Password Strength Indicator (Registration Mode) */}
              {activeTab === 'register' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-label-sm mb-1">
                    <span className="text-on-surface-variant font-medium">Strength:</span>
                    <span className={`font-bold ${getStrengthLabel(passwordStrength).text}`}>
                      {getStrengthLabel(passwordStrength).label}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-surface-variant">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full transition-all duration-300 ${
                          passwordStrength >= step ? getStrengthLabel(passwordStrength).color : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (Registration Mode Only) */}
          {activeTab === 'register' && !isForgot && (
            <div>
              <label htmlFor="reg-confirm-password" className="block text-label-md text-on-surface mb-1.5 font-semibold">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className={`w-full px-4 py-3 pr-10 border rounded-xl text-body-md text-on-surface bg-surface-variant/20 focus:outline-none transition-all placeholder:text-outline ${
                    confirmPassword && confirmPassword === password
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : confirmPassword && confirmPassword !== password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-outline-variant/40 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
                {confirmPassword && (
                  <span
                    className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] ${
                      confirmPassword === password ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {confirmPassword === password ? 'check_circle' : 'cancel'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Remember Me (Login Mode) */}
          {activeTab === 'login' && !isForgot && (
            <div className="flex items-center justify-between text-body-sm">
              <label className="flex items-center gap-2.5 cursor-pointer text-on-surface select-none font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30"
                />
                <span>Remember me on this device</span>
              </label>
            </div>
          )}

          {/* Terms & Conditions (Registration Mode) */}
          {activeTab === 'register' && !isForgot && (
            <div className="flex items-start gap-2.5 text-body-sm text-on-surface-variant mt-1">
              <input
                id="terms-check"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/30 mt-0.5 shrink-0"
              />
              <label htmlFor="terms-check" className="cursor-pointer select-none">
                I agree to the{' '}
                <Link href="/terms" className="text-primary font-semibold hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary font-semibold hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
          )}

          {/* ── Error Banner ── */}
          {message && messageType === 'error' && (
            <div className="flex items-center gap-2.5 text-body-sm px-4 py-3 rounded-xl border bg-error-container text-on-error-container border-error/20">
              <span className="material-symbols-outlined shrink-0 text-[20px]">error</span>
              <span>{message}</span>
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3.5 px-6 rounded-xl text-label-md font-bold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-on-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : isForgot ? (
              'Send Reset Link'
            ) : activeTab === 'login' ? (
              'Sign In'
            ) : (
              'Create Free Account'
            )}
          </button>
        </form>

        {/* ── Back to Sign In Link for Forgot Password ── */}
        {isForgot && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsForgot(false)
                setMessage('')
              }}
              className="text-primary hover:underline text-label-md font-semibold inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Sign In
            </button>
          </div>
        )}

        {/* ── Footer Trust Badges ── */}
        <div className="mt-8 pt-5 border-t border-outline-variant/30 flex justify-center gap-6 opacity-80">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">lock</span>
            <span className="text-[11px] font-semibold">256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
            <span className="text-[11px] font-semibold">Privacy First</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span className="text-[11px] font-semibold">Free Forever</span>
          </div>
        </div>

      </div>
    </main>
  )
}