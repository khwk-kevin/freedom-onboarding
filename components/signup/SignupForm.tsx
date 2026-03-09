'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { extractUTMParams, mergeWithStoredUTM } from '@/lib/utils/utm'
import { track } from '@/lib/tracking/unified'

interface SignupFormProps {
  redirectTo?: string
}

const COGNITO_DOMAIN = 'auth.freedom.world'
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3l2f2po0frgcmuca646g84uvkh'

function getCallbackUrl() {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/api/auth/callback`
}

function buildSSOUrl(provider: string, state?: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: getCallbackUrl(),
    identity_provider: provider,
  })
  if (state) params.set('state', state)
  return `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
}

function getUTMState(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const searchParams = new URLSearchParams(window.location.search)
  const utmParams = mergeWithStoredUTM({
    ...extractUTMParams(searchParams),
    referrer: document.referrer || undefined,
    landing_page: window.location.href,
  })
  if (Object.keys(utmParams).length === 0) return undefined
  return btoa(JSON.stringify(utmParams))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export default function SignupForm({ redirectTo = '/start' }: SignupFormProps) {
  const router = useRouter()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check URL for OAuth errors
  const urlError =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null

  function handleSSO(provider: string, label: string) {
    track.signupStart(label as 'email' | 'google')
    const state = getUTMState()
    window.location.href = buildSSOUrl(provider, state)
  }

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!PASSWORD_REGEX.test(pw)) {
      return 'Password must include uppercase, lowercase, number, and special character'
    }
    return null
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    track.signupStart('email')

    try {
      const searchParams = new URLSearchParams(window.location.search)
      const utmParams = mergeWithStoredUTM({
        ...extractUTMParams(searchParams),
        referrer: document.referrer || undefined,
        landing_page: window.location.href,
      })

      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, utmParams }),
      })

      const data = await res.json()

      if (!res.ok) {
        track.signupError(data.error || 'Signup failed')
        setError(data.error || 'Signup failed')
        return
      }

      track.signupComplete(data.cognitoSub || '', data.merchantId || '', 'direct')
      router.push(redirectTo)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      {(error || urlError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error || `Login failed: ${urlError}`}
        </div>
      )}

      {/* SSO Buttons */}
      <button
        onClick={() => handleSSO('Google', 'google')}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <button
        onClick={() => handleSSO('SignInWithApple', 'apple')}
        className="w-full flex items-center justify-center gap-3 bg-black hover:bg-gray-900 text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        Continue with Apple
      </button>

      <button
        onClick={() => handleSSO('LINE', 'line')}
        className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34d] text-white font-medium py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .348-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .349-.281.631-.63.631h-2.386c-.345 0-.627-.282-.627-.631V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .349-.281.631-.629.631M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        Continue with LINE
      </button>

      {/* Divider */}
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-gray-200" />
        <span className="flex-shrink mx-4 text-xs text-gray-400 uppercase">or</span>
        <div className="flex-grow border-t border-gray-200" />
      </div>

      {/* Email/password toggle */}
      {!showEmailForm ? (
        <button
          onClick={() => setShowEmailForm(true)}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          Sign up with email instead
        </button>
      ) : (
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-dark focus:border-transparent"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-dark focus:border-transparent"
              placeholder="Min 8 chars with uppercase, number, symbol"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green-dark focus:border-transparent"
              placeholder="Repeat password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green-dark hover:bg-green-700 disabled:bg-brand-green/70 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Creating account…' : 'Create free account'}
          </button>
        </form>
      )}

      <p className="text-xs text-gray-500 text-center">
        By signing up you agree to our{' '}
        <a href="#" className="text-brand-green-dark hover:underline">
          Terms
        </a>{' '}
        and{' '}
        <a href="#" className="text-brand-green-dark hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
