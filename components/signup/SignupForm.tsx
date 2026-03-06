'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { extractUTMParams, mergeWithStoredUTM } from '@/lib/utils/utm'
import { track } from '@/lib/tracking/unified'

interface SignupFormProps {
  redirectTo?: string
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/

export default function SignupForm({ redirectTo = '/onboarding' }: SignupFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters'
    if (!PASSWORD_REGEX.test(pw)) {
      return 'Password must include uppercase, lowercase, number, and special character'
    }
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const pwError = validatePassword(password)
    if (pwError) { setError(pwError); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    track.signupStart('email')

    try {
      // Collect UTM params from current URL + session storage
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

      // Success — track and redirect to onboarding
      track.signupComplete(data.cognitoSub || '', data.merchantId || '', 'direct')
      router.push(redirectTo)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

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
        className="w-full bg-brand-green-dark hover:bg-green-700 disabled:bg-brand-green/70 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
      >
        {loading ? 'Creating account…' : 'Create free account'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        By signing up you agree to our{' '}
        <a href="#" className="text-brand-green-dark hover:underline">Terms</a>
        {' '}and{' '}
        <a href="#" className="text-brand-green-dark hover:underline">Privacy Policy</a>.
      </p>
    </form>
  )
}
