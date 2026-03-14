'use client';

import { useState, useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/posthog';
import { EVENTS } from '@/lib/analytics/events';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface BuildProgress {
  step: string;
  message: string;
  devUrl?: string;
}

interface AppBuildingCardProps {
  merchantId: string;
  onboardingData: Record<string, unknown>;
  primaryColor?: string;
  businessName?: string;
  onComplete?: (devUrl: string, projectId: string) => void;
  onError?: (error: string) => void;
}

const STEP_ICONS: Record<string, string> = {
  // New pipeline step names (deploy.ts v2)
  provision_start: '📦',
  provision_github: '✅',
  build_prepare: '🔧',
  build_ready: '✅',
  vault_start: '📝',
  vault_done: '✅',
  build_start: '🏗️',
  build_failed: '🔄',
  build_done: '✅',
  export_start: '📦',
  export_done: '✅',
  deploy_start: '🚀',
  upload_start: '☁️',
  upload_done: '✅',
  deploy_done: '✅',
  deploy_failed: '❌',
  done: '🎉',
  error: '❌',
  // Legacy step names (kept for backward compat)
  github: '📦',
  github_done: '✅',
  github_skip: '📦',
  railway: '🔧',
  railway_done: '✅',
  env: '⚙️',
  env_done: '✅',
  starting: '🔄',
  ready: '✅',
  ready_timeout: '⏳',
  vault: '📝',
  assets: '🖼️',
  building: '🏗️',
  build_partial: '⚠️',
  build_fallback: '📋',
};

export function AppBuildingCard({
  merchantId,
  onboardingData,
  primaryColor = '#10F48B',
  businessName = 'Your App',
  onComplete,
  onError,
}: AppBuildingCardProps) {
  const [steps, setSteps] = useState<BuildProgress[]>([]);
  const [isBuilding, setIsBuilding] = useState(true);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const startBuild = async () => {
      try {
        const res = await fetch(`${API_URL}/apps/build-app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId, onboardingData }),
        });

        if (!res.ok || !res.body) {
          throw new Error('Failed to start build');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setSteps(prev => [...prev, { step: data.step, message: data.message, devUrl: data.devUrl }]);

                if (data.devUrl) {
                  setDevUrl(data.devUrl);
                }

                if (data.event === 'complete' || data.step === 'done') {
                  setIsBuilding(false);
                  if (data.devUrl) {
                    onComplete?.(data.devUrl, data.projectId || '');
                  }
                }

                if (data.event === 'error' || data.step === 'error') {
                  setIsBuilding(false);
                  onError?.(data.message);
                }
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Build failed';
        setIsBuilding(false);
        setSteps(prev => [...prev, { step: 'error', message }]);
        onError?.(message);
      }
    };

    startBuild();
  }, [merchantId, onboardingData, onComplete, onError]);

  return (
    <div className="w-full max-w-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
      {/* Header */}
      <div
        className="px-5 py-4 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{isBuilding ? '🏗️' : '🎉'}</span>
          <div>
            <h3 className="font-semibold text-base">
              {isBuilding ? `Building ${businessName}...` : `${businessName} is Ready!`}
            </h3>
            <p className="text-xs opacity-80">
              {isBuilding ? 'AI is creating your custom app' : 'Your app is live and ready to share'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-5 py-3 max-h-48 overflow-y-auto">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 py-1 text-sm">
            <span className="text-base flex-shrink-0">{STEP_ICONS[s.step] || '⏳'}</span>
            <span className={`${s.step.includes('done') || s.step === 'done' ? 'text-gray-700' : 'text-gray-500'}`}>
              {s.message}
            </span>
          </div>
        ))}
        {isBuilding && (
          <div className="flex items-center gap-2 py-1 text-sm text-gray-400">
            <span className="animate-pulse">⏳</span>
            <span>Working...</span>
          </div>
        )}
      </div>

      {/* Complete state — action buttons */}
      {!isBuilding && devUrl && (
        <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
          <a
            href={devUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 px-4 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            onClick={() => track(EVENTS.APP_URL_CLICKED, { url: devUrl, button: 'view_app' })}
          >
            View Your App 🚀
          </a>
          <a
            href={devUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-4 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
            onClick={() => track(EVENTS.APP_URL_CLICKED, { url: devUrl, button: 'go_live' })}
          >
            Go Live ↗
          </a>
        </div>
      )}
    </div>
  );
}
