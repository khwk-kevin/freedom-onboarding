'use client';
import { useState, ReactNode } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Lock } from 'lucide-react';

export function CRMAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050314] flex items-center justify-center">
        <div className="bg-[#0d0b1a] rounded-2xl border border-white/10 p-8 w-full max-w-sm shadow-2xl">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/freedom-logo.svg"
              alt="Freedom World"
              width={160}
              height={51}
              className="brightness-0 invert"
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">BD Console</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = login(password);
              if (!ok) {
                setError('Incorrect password. Please try again.');
                setPassword('');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter BD team password"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00ff88]/50 focus:border-[#00ff88]/50"
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-[#00ff88] hover:bg-[#00e87a] text-[#050314] font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              Access Console
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
