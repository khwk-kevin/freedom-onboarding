'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/crm/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050314] flex items-center justify-center px-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-4">
          <Image
            src="/images/freedom-logo.svg"
            alt="Freedom World"
            width={200}
            height={64}
            priority
          />
        </div>
        <p className="text-center text-gray-400 text-sm mb-8">BD Console</p>

        <h1 className="text-white text-xl font-bold mb-2 text-center">Forgot Password</h1>
        <p className="text-gray-400 text-xs text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-[#00ff88] text-4xl mb-2">✓</div>
            <p className="text-white font-medium">Check your email for a reset link</p>
            <p className="text-gray-400 text-xs">Sent to {email}</p>
            <Link href="/crm/login" className="text-xs text-[#00ff88] hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@freedomworld.com"
                required
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ff88]/50 focus:border-[#00ff88]/50"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff88] hover:bg-[#00dd77] disabled:opacity-60 text-black font-bold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <Link href="/crm/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
