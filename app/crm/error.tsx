'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CRMError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[CRM Error]', error);
  }, [error]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="text-red-500" size={32} aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-gray-500 max-w-md mb-6 text-sm leading-relaxed">
        An error occurred while loading this page. The team has been notified.
        {error.digest && (
          <span className="block mt-1 text-xs text-gray-400 font-mono">
            Error ID: {error.digest}
          </span>
        )}
      </p>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green hover:bg-brand-green-dark text-black text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
          aria-label="Retry loading the page"
        >
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </button>
        <a
          href="/crm"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
