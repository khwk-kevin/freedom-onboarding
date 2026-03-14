'use client';

import { useState, useRef, useEffect } from 'react';
import { useOnboarding } from '@/context/OnboardingContext';
import type { BuildProgressStep } from '@/context/OnboardingContext';

// ── App type icon mapping ─────────────────────────────────────────────────────
function getAppTypeIcon(businessType?: string, appFormat?: string): string {
  const type = (businessType || appFormat || '').toLowerCase();
  if (type.includes('game') || type.includes('gaming')) return '🎮';
  if (
    type.includes('restaurant') ||
    type.includes('cafe') ||
    type.includes('food') ||
    type.includes('coffee')
  )
    return '🍽️';
  if (
    type.includes('retail') ||
    type.includes('shop') ||
    type.includes('store') ||
    type.includes('ecommerce')
  )
    return '🛍️';
  if (
    type.includes('salon') ||
    type.includes('spa') ||
    type.includes('beauty') ||
    type.includes('barber') ||
    type.includes('service')
  )
    return '💇';
  if (
    type.includes('portfolio') ||
    type.includes('photography') ||
    type.includes('creative')
  )
    return '📸';
  if (
    type.includes('tool') ||
    type.includes('utility') ||
    type.includes('productivity') ||
    type.includes('saas')
  )
    return '🔧';
  if (type.includes('marketplace')) return '🏪';
  if (type.includes('gym') || type.includes('fitness') || type.includes('health')) return '💪';
  if (type.includes('education') || type.includes('course') || type.includes('learning')) return '📚';
  return '📱';
}

// ── Human-readable label for action identifiers ───────────────────────────────
function labelForAction(action: string): string {
  const labels: Record<string, string> = {
    ordering: 'Place an order',
    booking: 'Book an appointment',
    gallery: 'Browse gallery',
    loyalty: 'Earn rewards',
    community: 'Join community',
    contact: 'Get in touch',
    delivery: 'Request delivery',
    messaging: 'Send a message',
    events: 'View events',
    subscriptions: 'Subscribe',
    menu: 'Browse menu',
    browse: 'Browse products',
    checkout: 'Check out',
    profile: 'Manage profile',
    payment: 'Make payment',
    review: 'Leave a review',
  };
  return labels[action] || action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ');
}

// ── Screen label for action identifiers ──────────────────────────────────────
function screenForAction(action: string): string {
  const screens: Record<string, string> = {
    ordering: 'Order screen',
    booking: 'Booking screen',
    gallery: 'Gallery',
    loyalty: 'Rewards hub',
    community: 'Community feed',
    contact: 'Contact & map',
    delivery: 'Delivery tracker',
    messaging: 'Messages',
    events: 'Events calendar',
    subscriptions: 'Plans & pricing',
    menu: 'Menu browser',
    browse: 'Product catalog',
    checkout: 'Checkout flow',
    profile: 'User profile',
    payment: 'Payment screen',
    review: 'Reviews page',
  };
  return screens[action] || action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ') + ' screen';
}

// ── Animated section wrapper ──────────────────────────────────────────────────
// Section appears with fade + slide when data becomes available
function BlueprintSection({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(visible);
  const [show, setShow] = useState(visible);

  useEffect(() => {
    if (visible && !mounted) {
      setMounted(true);
      // Tiny delay so CSS transitions fire after DOM insertion
      const t = setTimeout(() => setShow(true), 30);
      return () => clearTimeout(t);
    }
    if (!visible && mounted) {
      setShow(false);
    }
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {children}
    </div>
  );
}

// ── Left-bar text section ─────────────────────────────────────────────────────
function BarText({
  text,
  accent,
  className = '',
}: {
  text: string;
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={`pl-3 py-0.5 text-sm leading-relaxed ${className}`}
      style={{ borderLeft: `2px solid ${accent}55`, color: '#C8C8DC' }}
    >
      {text}
    </div>
  );
}

// ── List item with icon ───────────────────────────────────────────────────────
function BarItem({
  icon,
  text,
  accent,
}: {
  icon: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-2 pl-3 py-0.5" style={{ borderLeft: `2px solid ${accent}55` }}>
      <span className="text-xs mt-0.5 shrink-0" style={{ color: accent }}>
        {icon}
      </span>
      <span className="text-sm" style={{ color: '#C8C8DC' }}>
        {text}
      </span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon?: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {icon && <span className="text-sm">{icon}</span>}
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7B7B9A' }}>
        {label}
      </span>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ filled, total, accent }: { filled: number; total: number; accent: string }) {
  const pct = Math.round((filled / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: '#7B7B9A' }}>
          {filled}/{total} specs captured
        </span>
        <span className="text-xs font-bold" style={{ color: accent }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E1E2E' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accent}, ${accent}BB)` }}
        />
      </div>
    </div>
  );
}

// ── Build step icon map (mirrors AppBuildingCard) ────────────────────────────
const STEP_ICONS: Record<string, string> = {
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
  // Legacy
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

// ── Build progress panel ──────────────────────────────────────────────────────
function BuildProgressPanel({
  steps,
  isBuilding,
  devUrl,
  error,
  accent,
}: {
  steps: BuildProgressStep[];
  isBuilding: boolean;
  devUrl?: string;
  error?: string;
  accent: string;
}) {
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: `1px solid ${accent}18` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base animate-pulse">{error ? '❌' : isBuilding ? '🏗️' : '🎉'}</span>
          <h2 className="text-sm font-bold text-white tracking-tight">
            {error ? 'Build Error' : isBuilding ? 'Building Your App…' : 'App is Live!'}
          </h2>
        </div>
        {isBuilding && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full animate-pulse"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}
          >
            Live
          </span>
        )}
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-1.5">
        {steps.map((s, i) => {
          const isDone = s.step.includes('done') || s.step === 'done';
          const isErr = s.step === 'error' || s.step.includes('failed');
          return (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-sm shrink-0 mt-0.5">
                {STEP_ICONS[s.step] || '⏳'}
              </span>
              <span
                className="text-sm leading-snug"
                style={{ color: isErr ? '#F87171' : isDone ? '#C8C8DC' : `${accent}CC` }}
              >
                {s.message}
              </span>
            </div>
          );
        })}
        {isBuilding && (
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-sm animate-pulse">⏳</span>
            <span className="text-sm" style={{ color: '#7B7B9A' }}>Working…</span>
          </div>
        )}
        {error && (
          <div className="mt-3 px-3 py-2 rounded-xl text-sm" style={{ background: '#F8717120', color: '#F87171' }}>
            {error}
          </div>
        )}
        <div ref={stepsEndRef} />
      </div>

      {/* Complete state — action button */}
      {!isBuilding && devUrl && !error && (
        <div className="px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${accent}18` }}>
          <a
            href={devUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
              color: '#0A0A12',
              boxShadow: `0 4px 20px ${accent}40`,
            }}
          >
            View Your App →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Main AppBlueprint component ───────────────────────────────────────────────

interface AppBlueprintProps {
  /** Extra class names for the wrapper */
  className?: string;
}

export function AppBlueprint({ className = '' }: AppBlueprintProps) {
  const {
    communityData,
    handleCardAction,
    isLoading,
    buildProgress,
  } = useOnboarding();

  // ── Field values ──────────────────────────────────────────────────────────
  const accent = communityData.primaryColor || '#10F48B';
  const businessName = communityData.name || '';
  const description = communityData.description || '';
  const businessType = communityData.businessType || '';
  const audiencePersona = communityData.audiencePersona || '';
  const heroFeature = communityData.heroFeature || '';
  const userFlow = communityData.userFlow || '';
  const differentiator = communityData.differentiator || '';
  const primaryActions = (communityData.primaryActions || []).filter(Boolean);
  const rawProducts = communityData.products || [];

  // Functional spec fields — now properly typed on communityData
  const coreActions = (communityData.coreActions?.length ? communityData.coreActions : primaryActions);
  const keyScreens = communityData.keyScreens?.length
    ? communityData.keyScreens
    : primaryActions.map(a => screenForAction(a));
  const monetizationModel = communityData.monetizationModel || '';
  const mvpScope = communityData.mvpScope || heroFeature || '';
  const userJourney = communityData.userJourney || userFlow || '';
  const antiPreferences = communityData.antiPreferences || [];
  const appFormat = communityData.appFormat || '';

  // ── Progress counting ─────────────────────────────────────────────────────
  // 11 tracked fields
  const trackedFields: boolean[] = [
    Boolean(businessName),
    Boolean(description),
    coreActions.length > 0,
    keyScreens.length > 0,
    Boolean(monetizationModel),
    Boolean(userJourney),
    Boolean(communityData.dataModel),
    Boolean(mvpScope),
    Boolean(audiencePersona),
    rawProducts.length > 0,
    antiPreferences.length > 0,
  ];
  const filledCount = trackedFields.filter(Boolean).length;
  const totalCount = 11;
  const progressPct = Math.round((filledCount / totalCount) * 100);
  const canBuild = filledCount >= 7; // 60%+

  // ── App type icon ─────────────────────────────────────────────────────────
  const appIcon = getAppTypeIcon(businessType, appFormat);

  // ── Products display helpers ──────────────────────────────────────────────
  const productNames = rawProducts.slice(0, 4).map(p => {
    const str = String(p);
    return str.split(':')[0].trim();
  });
  const extraProducts = rawProducts.length > 4 ? rawProducts.length - 4 : 0;

  const hasAnything = filledCount > 0;

  // ── Build phase — switch sidebar to progress view ─────────────────────────
  const buildPhase = buildProgress?.buildPhase ?? 'spec';
  const isInBuildMode = buildPhase === 'building' || buildPhase === 'complete' || buildPhase === 'error';

  return (
    <div className={`flex flex-col ${className}`}>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: '#0F0F1A',
          border: `1px solid ${accent}22`,
          boxShadow: (hasAnything || isInBuildMode) ? `0 0 40px ${accent}10` : 'none',
          transition: 'box-shadow 0.4s ease',
        }}
      >
        {/* ── Build mode view ─────────────────────────────────────────────── */}
        {isInBuildMode && buildProgress ? (
          <BuildProgressPanel
            steps={buildProgress.steps}
            isBuilding={buildProgress.isBuilding}
            devUrl={buildProgress.devUrl}
            error={buildProgress.error}
            accent={accent}
          />
        ) : (
          /* ── Spec view ──────────────────────────────────────────────────── */
          <>
            {/* Header */}
            <div
              className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0"
              style={{ borderBottom: `1px solid ${accent}18` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <h2 className="text-sm font-bold text-white tracking-tight">Your App Blueprint</h2>
              </div>
              {hasAnything && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}35` }}
                >
                  {progressPct}%
                </span>
              )}
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-5">
              {!hasAnything ? (
                /* Empty state */
                <div className="py-10 flex flex-col items-center text-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${accent}12`, border: `1px solid ${accent}22` }}
                  >
                    ✨
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Blueprint will appear here</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#7B7B9A' }}>
                      As you chat with AVA, your app spec fills up live
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* App name + icon */}
                  <BlueprintSection visible={Boolean(businessName)}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{appIcon}</span>
                      <h3 className="text-xl font-bold text-white leading-tight">{businessName}</h3>
                    </div>
                  </BlueprintSection>

                  {/* What it does */}
                  <BlueprintSection visible={Boolean(description)}>
                    <div>
                      <SectionLabel label="What it does" />
                      <BarText text={description} accent={accent} />
                    </div>
                  </BlueprintSection>

                  {/* Core actions */}
                  <BlueprintSection visible={coreActions.length > 0}>
                    <div>
                      <SectionLabel label="Core actions" />
                      <div className="space-y-1">
                        {coreActions.slice(0, 6).map((action, i) => (
                          <BarItem key={i} icon="✓" text={labelForAction(action)} accent={accent} />
                        ))}
                      </div>
                    </div>
                  </BlueprintSection>

                  {/* Key screens */}
                  <BlueprintSection visible={keyScreens.length > 0}>
                    <div>
                      <SectionLabel label="Key screens" />
                      <div className="space-y-1">
                        {keyScreens.slice(0, 5).map((screen, i) => (
                          <BarItem key={i} icon="◉" text={screen} accent={accent} />
                        ))}
                      </div>
                    </div>
                  </BlueprintSection>

                  {/* Monetization */}
                  <BlueprintSection visible={Boolean(monetizationModel)}>
                    <div>
                      <SectionLabel icon="💰" label="Monetization" />
                      <BarText text={monetizationModel} accent={accent} />
                    </div>
                  </BlueprintSection>

                  {/* MVP */}
                  <BlueprintSection visible={Boolean(mvpScope)}>
                    <div>
                      <SectionLabel icon="🎯" label="MVP (build first)" />
                      <BarText text={mvpScope} accent={accent} />
                    </div>
                  </BlueprintSection>

                  {/* User journey */}
                  <BlueprintSection visible={Boolean(userJourney)}>
                    <div>
                      <SectionLabel label="User journey" />
                      <BarText text={userJourney} accent={accent} />
                    </div>
                  </BlueprintSection>

                  {/* Audience */}
                  <BlueprintSection visible={Boolean(audiencePersona)}>
                    <div>
                      <SectionLabel icon="👥" label="Audience" />
                      <BarText text={audiencePersona} accent={accent} />
                    </div>
                  </BlueprintSection>

                  {/* Products */}
                  <BlueprintSection visible={rawProducts.length > 0}>
                    <div>
                      <SectionLabel icon="🛒" label="Products" />
                      <div className="space-y-1">
                        {productNames.map((name, i) => (
                          <BarItem key={i} icon="·" text={name} accent={accent} />
                        ))}
                        {extraProducts > 0 && (
                          <div className="pl-3 text-xs" style={{ color: `${accent}88`, borderLeft: `2px solid ${accent}33` }}>
                            + {extraProducts} more
                          </div>
                        )}
                      </div>
                    </div>
                  </BlueprintSection>

                  {/* Anti-preferences */}
                  <BlueprintSection visible={antiPreferences.length > 0}>
                    <div>
                      <SectionLabel label="Avoid" />
                      <div className="space-y-1">
                        {antiPreferences.slice(0, 4).map((pref, i) => (
                          <BarItem key={i} icon="✕" text={pref} accent="#F87171" />
                        ))}
                      </div>
                    </div>
                  </BlueprintSection>

                  {/* Differentiator */}
                  <BlueprintSection visible={Boolean(differentiator)}>
                    <div>
                      <SectionLabel label="What sets it apart" />
                      <BarText text={differentiator} accent={accent} />
                    </div>
                  </BlueprintSection>
                </>
              )}
            </div>

            {/* Footer — progress bar + build button */}
            {hasAnything && (
              <div
                className="px-5 py-4 space-y-4 shrink-0"
                style={{ borderTop: `1px solid ${accent}18` }}
              >
                <ProgressBar filled={filledCount} total={totalCount} accent={accent} />

                {canBuild && (
                  <button
                    onClick={() => handleCardAction('dashboard_go_live')}
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}BB)`,
                      color: '#0A0A12',
                      boxShadow: `0 4px 20px ${accent}40`,
                    }}
                  >
                    ✨ Build My App
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Mobile bottom sheet wrapper ───────────────────────────────────────────────

interface AppBlueprintSheetProps {
  isOpen: boolean;
  onClose: () => void;
  progressPct?: number;
}

/**
 * Bottom sheet for mobile: renders AppBlueprint in a slide-up panel.
 */
export function AppBlueprintSheet({ isOpen, onClose, progressPct = 0 }: AppBlueprintSheetProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sheet */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl overflow-hidden transition-transform duration-300 ease-out"
        style={{
          height: '80vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          background: '#0A0A12',
          boxShadow: isOpen ? '0 -8px 40px rgba(0,0,0,0.6)' : 'none',
        }}
        aria-hidden={!isOpen}
      >
        {/* Drag handle + close */}
        <div className="flex flex-col items-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Close blueprint"
        >
          ✕
        </button>

        {/* Blueprint inside sheet */}
        <div className="h-full overflow-hidden px-4 pb-6 pt-1 flex flex-col">
          <AppBlueprint className="flex-1 min-h-0" />
        </div>
      </div>
    </>
  );
}

// ── Mobile floating trigger button ───────────────────────────────────────────

interface AppBlueprintButtonProps {
  onClick: () => void;
  isOpen: boolean;
  filledCount: number;
  totalCount: number;
  accent: string;
}

/**
 * Floating pill button on mobile that shows "📋 View Blueprint (73%)"
 */
export function AppBlueprintButton({
  onClick,
  isOpen,
  filledCount,
  totalCount,
  accent,
}: AppBlueprintButtonProps) {
  const pct = Math.round((filledCount / totalCount) * 100);
  const hasData = filledCount > 0;

  return (
    <button
      onClick={onClick}
      className="md:hidden fixed bottom-28 left-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full
                 text-sm font-semibold transition-all duration-200 active:scale-95 shadow-2xl"
      style={{
        background: isOpen ? 'rgba(255,255,255,0.15)' : (hasData ? accent : '#1A1A2E'),
        color: isOpen ? '#fff' : (hasData ? '#0A0A12' : '#7B7B9A'),
        border: isOpen ? '1px solid rgba(255,255,255,0.2)' : `1px solid ${accent}44`,
        boxShadow: hasData ? `0 4px 24px ${accent}40` : 'none',
      }}
    >
      <span>📋</span>
      <span>{isOpen ? 'Close' : (hasData ? `Blueprint (${pct}%)` : 'Blueprint')}</span>
    </button>
  );
}
