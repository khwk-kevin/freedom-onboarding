'use client';

import { useState } from 'react';

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  done: boolean;
  category: 'onboarding' | 'growth' | 'monetize';
}

interface NextStep {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'growth' | 'monetize' | 'engage';
  consoleRoute?: string; // Deep link into Freedom console
}

interface MerchantDashboardCardProps {
  businessName: string;
  primaryColor?: string;
  logoUrl?: string;
  bannerUrl?: string;
  // What was completed during onboarding
  hasLogo?: boolean;
  hasBanner?: boolean;
  hasDescription?: boolean;
  hasLocation?: boolean;
  hasRewards?: boolean;
  hasWelcomePost?: boolean;
  // Callbacks
  onGoLive?: () => void;
  onViewConsole?: () => void;
}

export function MerchantDashboardCard({
  businessName,
  primaryColor = '#10F48B',
  logoUrl,
  bannerUrl,
  hasLogo = false,
  hasBanner = false,
  hasDescription = false,
  hasLocation = false,
  hasRewards = false,
  hasWelcomePost = false,
  onGoLive,
  onViewConsole,
}: MerchantDashboardCardProps) {
  const [showNextSteps, setShowNextSteps] = useState(false);

  // Calculate achievements
  const achievements: Achievement[] = [
    { id: 'community', emoji: '🏠', title: 'Created your community', done: true, category: 'onboarding' },
    { id: 'brand', emoji: '🎨', title: 'Set up your brand identity', done: hasDescription, category: 'onboarding' },
    { id: 'logo', emoji: '✨', title: 'Logo ready', done: hasLogo, category: 'onboarding' },
    { id: 'cover', emoji: '🖼️', title: 'Cover page designed', done: hasBanner, category: 'onboarding' },
    { id: 'location', emoji: '📍', title: 'Business location added', done: hasLocation, category: 'onboarding' },
    { id: 'rewards', emoji: '🎁', title: 'Rewards system configured', done: hasRewards, category: 'onboarding' },
    { id: 'post', emoji: '📝', title: 'First post published', done: hasWelcomePost, category: 'onboarding' },
  ];

  const completed = achievements.filter(a => a.done).length;
  const total = achievements.length;
  const percent = Math.round((completed / total) * 100);

  // Next steps to pull them back to console
  const nextSteps: NextStep[] = [
    { id: 'members', emoji: '👥', title: 'Get your first 10 members', subtitle: 'Share your community link or QR code', category: 'growth', consoleRoute: '/app/home' },
    { id: 'payment', emoji: '💳', title: 'Set up payments', subtitle: 'Accept payments through Freedom', category: 'monetize', consoleRoute: '/app/payment/transaction' },
    { id: 'product', emoji: '🛍️', title: 'Add your first product', subtitle: 'List items in your community shop', category: 'monetize', consoleRoute: '/app/shop' },
    { id: 'offer', emoji: '🏷️', title: 'Create your first offer', subtitle: 'Launch a campaign to attract customers', category: 'growth', consoleRoute: '/app/campaign' },
    { id: 'qr', emoji: '📱', title: 'Print your QR code', subtitle: 'Put it at your counter for easy joins', category: 'growth', consoleRoute: '/app/home' },
    { id: 'chat', emoji: '💬', title: 'Reply to your first member', subtitle: 'Build relationships through live chat', category: 'engage', consoleRoute: '/app/live-chat' },
  ];

  const categoryColors: Record<string, { bg: string; text: string; label: string }> = {
    growth: { bg: '#DBEAFE', text: '#2563EB', label: 'Growth' },
    monetize: { bg: '#FEF3C7', text: '#D97706', label: 'Monetize' },
    engage: { bg: '#E0E7FF', text: '#6366F1', label: 'Engage' },
  };

  return (
    <div className="w-full max-w-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white">
      
      {/* Hero section with banner + achievements */}
      <div className="relative">
        {/* Banner background */}
        <div
          className="h-24 sm:h-28 relative overflow-hidden"
          style={{ background: bannerUrl ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC, ${primaryColor}88)` }}
        >
          {bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Business name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <div className="flex items-end gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white shadow-md shrink-0" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0"
                  style={{ background: `${primaryColor}90`, border: '2px solid white' }}>
                  {businessName?.[0] || '?'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white truncate leading-tight">{businessName || 'Your Business'}</h3>
                <p className="text-[11px] text-white/70">Freedom World Community</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress ring + stats */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Circular progress */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={primaryColor}
                strokeWidth="3"
                strokeDasharray={`${percent}, 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm sm:text-base font-bold" style={{ color: primaryColor }}>{percent}%</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base font-semibold text-gray-900">Setup Progress</p>
            <p className="text-xs text-gray-500 mt-0.5">{completed} of {total} steps complete</p>
            {percent < 100 && (
              <p className="text-[11px] mt-1" style={{ color: primaryColor }}>
                {percent >= 70 ? '🔥 Almost there!' : percent >= 40 ? '💪 Great progress!' : '🚀 Off to a great start!'}
              </p>
            )}
            {percent === 100 && (
              <p className="text-[11px] mt-1" style={{ color: primaryColor }}>🎉 Setup complete!</p>
            )}
          </div>
        </div>
      </div>

      {/* Completed achievements */}
      <div className="px-3 sm:px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">What you&apos;ve built</p>
        <div className="space-y-1.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all"
              style={{ 
                background: a.done ? `${primaryColor}08` : 'transparent',
                opacity: a.done ? 1 : 0.4,
              }}
            >
              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: a.done ? primaryColor : 'transparent',
                  border: a.done ? 'none' : '1.5px solid #D1D5DB',
                }}
              >
                {a.done && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              
              <span className="text-sm">{a.emoji}</span>
              <span className={`text-xs sm:text-sm flex-1 ${a.done ? 'text-gray-800 font-medium' : 'text-gray-400 line-through'}`}>
                {a.title}
              </span>
              {a.done && (
                <span className="text-[10px] font-medium" style={{ color: primaryColor }}>Done</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expand to see next steps */}
      <div className="px-3 sm:px-4 pb-3">
        <button
          onClick={() => setShowNextSteps(!showNextSteps)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
          style={{ 
            background: showNextSteps ? `${primaryColor}10` : '#F3F4F6',
            color: showNextSteps ? primaryColor : '#6B7280',
            border: showNextSteps ? `1px solid ${primaryColor}25` : '1px solid transparent',
          }}
        >
          {showNextSteps ? '▲ Hide' : '▼ What to do next'} — {nextSteps.length} steps to grow
        </button>
        
        {showNextSteps && (
          <div className="mt-2 space-y-2">
            {nextSteps.map((step) => {
              const cat = categoryColors[step.category];
              return (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  <span className="text-lg sm:text-xl mt-0.5">{step.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">{step.title}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" 
                        style={{ background: cat.bg, color: cat.text }}>
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.subtitle}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CTA buttons */}
      <div className="p-3 sm:p-4 border-t border-gray-100 space-y-2">
        <button
          onClick={onGoLive}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}DD)` }}
        >
          🚀 Go Live — Publish Your Community
        </button>
        <button
          onClick={onViewConsole}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all active:scale-[0.98]"
        >
          Open Freedom Console →
        </button>
      </div>
    </div>
  );
}
