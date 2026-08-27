'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  // Ensure user has valid session token from hash parameter
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        // Token might still be processing from URL hash, set a listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            setMessage('')
          }
        })
        return () => authListener.subscription.unsubscribe()
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth')
        }, 3000)
      }
    } catch {
      setMessage('An unexpected error occurred while updating your password.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/50 p-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
          </div>
          <h2 className="text-headline-sm text-on-surface font-extrabold mb-2">Password Updated!</h2>
          <p className="text-body-md text-on-surface-variant mb-6">
            Your password has been successfully reset. Redirecting you to the sign in page...
          </p>
          <Link
            href="/auth"
            className="inline-flex justify-center items-center w-full bg-primary text-on-primary font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all shadow-md text-label-md"
          >
            Go to Sign In Now
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/50 p-6 sm:p-8">
        
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant hover:text-primary transition-colors font-semibold"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Sign In
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[26px]">key</span>
            </div>
          </div>
          <h1 className="text-headline-md text-on-surface font-extrabold tracking-tight mb-1">
            Set New Password
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Please enter your new password below.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <div>
            <label htmlFor="new-password" className="block text-label-md text-on-surface font-semibold mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-widest text-outline hover:text-primary transition-colors px-1 py-0.5 select-none"
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-label-md text-on-surface font-semibold mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-outline-variant/40 rounded-xl text-body-md text-on-surface bg-surface-variant/20 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
            />
          </div>

          {/* Error Banner */}
          {message && (
            <div className="flex items-center gap-2 text-body-sm px-4 py-3 rounded-xl bg-error-container text-on-error-container border border-error/20">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary font-bold py-3.5 px-6 rounded-xl hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 text-label-md mt-2"
          >
            {loading ? 'Updating Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
