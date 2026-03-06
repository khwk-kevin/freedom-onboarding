'use client';
import { useState, ReactNode } from 'react';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-6">
            <Lock className="text-gray-500" size={22} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">BD Console</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Freedom World Merchant CRM</p>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter BD team password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-black font-semibold py-2 rounded-lg text-sm transition-colors"
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
