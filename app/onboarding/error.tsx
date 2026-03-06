'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function OnboardingError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Onboarding Error]', error);
  }, [error]);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mb-6">
        <MessageCircle className="text-brand-green-dark" size={36} aria-hidden="true" />
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-gray-900 mb-3">
        AVA ran into a hiccup
      </h1>
      <p className="text-gray-500 max-w-sm mb-2 leading-relaxed">
        Something went wrong during your onboarding session. Don't worry — you
        can pick up right where you left off.
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono mb-6">
          Ref: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-green hover:bg-brand-green-dark text-black text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          aria-label="Retry onboarding"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Resume My Session
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          Back to Home
        </a>
      </div>

      {/* Trust signal */}
      <p className="mt-8 text-xs text-gray-400">
        Your progress has been saved — no need to start over.
      </p>
    </div>
  );
}
