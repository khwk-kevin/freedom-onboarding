'use client';

import { useState, FormEvent } from 'react';
import { X } from 'lucide-react';

interface SignupWallProps {
  businessName?: string;
  logoUrl?: string;
  onSignupSuccess: (merchantId: string, email: string) => void;
  onContinueWithoutSaving: () => void;
}

const COGNITO_DOMAIN = 'auth.freedom.world';
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3l2f2po0frgcmuca646g84uvkh';

function getCallbackUrl() {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api/auth/callback`;
}

function buildSSOUrl(provider: string) {
  const state = btoa(JSON.stringify({ returnTo: '/onboarding', continueOnboarding: true }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: getCallbackUrl(),
    identity_provider: provider,
    state,
  });
  return `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export function SignupWall({
  businessName,
  logoUrl,
  onSignupSuccess,
  onContinueWithoutSaving,
}: SignupWallProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  function handleSSO(provider: string) {
    window.location.href = buildSSOUrl(provider);
  }

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number & special character');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed. Please try again.');
        return;
      }

      onSignupSuccess(data.merchantId || data.userId || '', email);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    onContinueWithoutSaving();
  }

  if (dismissed) return null;

  const displayName = businessName || 'Your Community';

  // ── Collapsed: slim banner pinned above chat input ──────────
  if (!expanded) {
    return (
      <div
        className="mx-3 mb-2 rounded-2xl overflow-hidden animate-in"
        style={{
          background: 'linear-gradient(135deg, rgba(5,3,20,0.95) 0%, rgba(16,20,40,0.95) 100%)',
          border: '1px solid rgba(16,244,139,0.2)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(16,244,139,0.1)' }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <span className="text-base">🎉</span>
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {displayName} is looking great!
            </p>
            <p className="text-[10px] text-white/50">
              Sign up to save your progress
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setExpanded(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95"
            style={{ background: '#10F48B', color: '#050314' }}
          >
            Save →
          </button>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Expanded: slide-up panel (not full screen) ──────────────
  return (
    <div className="mx-3 mb-2 rounded-2xl overflow-hidden animate-in" style={{
      background: 'linear-gradient(135deg, rgba(5,3,20,0.97) 0%, rgba(16,20,40,0.97) 100%)',
      border: '1px solid rgba(16,244,139,0.15)',
      boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
    }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-white">{displayName} is taking shape! 🎉</h3>
            <p className="text-[11px] text-white/50">Sign up to save & finish building</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="px-5 pb-5">
        {!showEmailForm ? (
          <div className="space-y-2">
            {/* SSO buttons — compact */}
            <button
              onClick={() => handleSSO('Google')}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleSSO('SignInWithApple')}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-all active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Continue with Apple
            </button>

            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-medium border border-white/10 text-white/50 hover:text-white/70 hover:border-white/15 transition-all"
            >
              Sign up with Email
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-2">
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/60 mb-1"
            >
              ← Back
            </button>
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#10F48B]/50"
            />
            <input
              type="password"
              required
              placeholder="Password (8+ chars, mixed)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#10F48B]/50"
            />
            <input
              type="password"
              required
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#10F48B]/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-900 transition-all disabled:opacity-50"
              style={{ background: loading ? '#10F48B80' : '#10F48B' }}
            >
              {loading ? 'Creating...' : 'Create Account & Save'}
            </button>
          </form>
        )}

        {/* Dismiss link */}
        <div className="mt-3 text-center">
          <button
            onClick={handleDismiss}
            className="text-[10px] text-white/25 hover:text-white/40 transition-colors"
          >
            Continue without saving
          </button>
        </div>
      </div>
    </div>
  );
}
