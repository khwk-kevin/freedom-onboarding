import Link from 'next/link'

const LOYALTY_FEATURES = [
  {
    color: '#10F48B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2C5.582 2 2 5.582 2 10s3.582 8 8 8 8-3.582 8-8-3.582-8-8-8z" stroke="#10F48B" strokeWidth="1.3" fill="none"/>
        <path d="M7 10c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z" fill="#10F48B" opacity="0.5"/>
        <path d="M10 7V4M10 16v-3M4 10H1M19 10h-3" stroke="#10F48B" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    title: 'Missions & Daily Challenges',
    desc: 'Create consistent engagement loops through daily missions that inspire participation and reinforce loyalty behaviors.',
  },
  {
    color: '#36BBF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 17V7l6-5 6 5v10" stroke="#36BBF6" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
        <path d="M7 17v-5h6v5" stroke="#36BBF6" strokeWidth="1.3" fill="none"/>
        <path d="M1 17h18" stroke="#36BBF6" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Top Contribution Tracker',
    desc: 'Inspire your community to engage more by celebrating high-performing members through badges and rankings.',
  },
  {
    color: '#F742A2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="#F742A2" strokeWidth="1.3" fill="none"/>
        <path d="M10 6v4l3 3" stroke="#F742A2" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M7 3l1.5 2.5M13 3l-1.5 2.5" stroke="#F742A2" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    title: 'Loyalty Tokens',
    desc: 'Give your customers something worth earning. Launch your own tokens or points that can be redeemed or collected across your ecosystem.',
  },
  {
    color: '#10F48B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6L10 2z" stroke="#10F48B" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Converted Referrals',
    desc: 'Expand your customer base through performance-based referrals that reward verified purchases and mission completions.',
  },
]

const COMMUNITY_FEATURES = [
  {
    color: '#36BBF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M18 10c0 4.418-3.582 8-8 8a7.976 7.976 0 01-4.5-1.38L2 18l1.38-3.5A7.976 7.976 0 012 10c0-4.418 3.582-8 8-8s8 3.582 8 8z" stroke="#36BBF6" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
        <path d="M7 10h6M7 13h4" stroke="#36BBF6" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Customer Support Chat',
    desc: 'Resolve issues faster through integrated chat that connects customers to human or AI support in real time.',
  },
  {
    color: '#F742A2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M15 8c0 3.866-3.134 7-7 7a6.977 6.977 0 01-3.94-1.21L1 15l1.21-3.06A6.977 6.977 0 012 8c0-3.866 3.134-7 7-7s7 3.134 7 7z" stroke="#F742A2" strokeWidth="1.3" fill="none"/>
        <path d="M19 16l-2-1.5A5.5 5.5 0 0118 12c0-3.038-2.462-5.5-5.5-5.5" stroke="#F742A2" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
        <path d="M6 8h8M6 11h5" stroke="#F742A2" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Community Chat',
    desc: 'Keep conversations flowing with live chat channels designed for collaboration and community building.',
  },
  {
    color: '#10F48B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="#10F48B" strokeWidth="1.3" fill="none"/>
        <path d="M6 8h8M6 11h5" stroke="#10F48B" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="15" cy="4" r="3" fill="#10F48B" opacity="0.3" stroke="#10F48B" strokeWidth="1"/>
      </svg>
    ),
    title: 'Feed',
    desc: 'Broadcast important news, offers, and alerts straight into your users\' activity feed for real-time visibility.',
  },
  {
    color: '#36BBF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="#36BBF6" strokeWidth="1.3" fill="none"/>
        <path d="M6 10h8M10 6v8" stroke="#36BBF6" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Polls & Surveys',
    desc: 'Test ideas, measure satisfaction, and identify trends fast with built-in polls and surveys.',
  },
]

const COMMERCE_FEATURES = [
  {
    color: '#F742A2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14l-1.5 9H4.5L3 5z" stroke="#F742A2" strokeWidth="1.3" fill="none"/>
        <path d="M7 5l1-3h4l1 3" stroke="#F742A2" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="7.5" cy="16.5" r="1.5" fill="#F742A2"/>
        <circle cx="13.5" cy="16.5" r="1.5" fill="#F742A2"/>
      </svg>
    ),
    title: 'Shop',
    desc: 'Reach customers everywhere. List and manage products or NFTs across multiple channels, including POS and in-app sales.',
  },
  {
    color: '#10F48B',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="5" width="16" height="11" rx="2" stroke="#10F48B" strokeWidth="1.3" fill="none"/>
        <path d="M6 10h3M11 10h3" stroke="#10F48B" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M2 8h16" stroke="#10F48B" strokeWidth="1.2"/>
      </svg>
    ),
    title: 'Payments',
    desc: 'Expand your payment capabilities with integrated support for cards, tokens, and loyalty systems, fully secure and compliant.',
  },
  {
    color: '#36BBF6',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.5 7.5H20L14 14l2.5 7.5L10 18l-6.5 3.5L6 14 0 9.5h7.5L10 2z" stroke="#36BBF6" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Secure Checkout',
    desc: 'Reduce friction at the final step with a checkout process designed for speed, safety, and trust.',
  },
  {
    color: '#F742A2',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="14" rx="3" stroke="#F742A2" strokeWidth="1.3" fill="none"/>
        <path d="M7 10h6M10 7v6" stroke="#F742A2" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    title: 'POS',
    desc: 'Gain financial clarity with a dashboard that consolidates all sales and payment settlement activity in one place with Merchant Mode.',
  },
]

function FeatureCard({ feat }: { feat: { color: string; icon: React.ReactNode; title: string; desc: string } }) {
  return (
    <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 flex gap-4 hover:border-white/[0.12] transition-colors group">
      <div
        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}28` }}
      >
        {feat.icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <h4 className="text-white text-sm font-bold">{feat.title}</h4>
        <p className="text-[#67697C] text-xs leading-relaxed">{feat.desc}</p>
      </div>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(ellipse at 70%, rgba(16,244,139,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-16 md:gap-24">
        {/* Section header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            explore features built to
          </h2>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#10F48B] leading-tight -mt-2 md:-mt-3">
            lift your business higher
          </h2>
        </div>

        {/* Block 1: Loyalty Engine */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl md:text-4xl font-black uppercase text-white leading-tight">
                build a loyalty engine that lasts.
              </h3>
            </div>
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit self-start md:self-auto"
            >
              <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
                build loyalty today
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOYALTY_FEATURES.map((f, i) => <FeatureCard key={i} feat={f} />)}
          </div>
        </div>

        {/* Block 2: Community */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h3 className="text-2xl md:text-4xl font-black uppercase text-white leading-tight whitespace-pre-line">
              {'connect better.\nsupport smarter.'}
            </h3>
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit self-start md:self-auto"
            >
              <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
                explore community hub
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMUNITY_FEATURES.map((f, i) => <FeatureCard key={i} feat={f} />)}
          </div>
        </div>

        {/* Block 3: Commerce */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h3 className="text-2xl md:text-4xl font-black uppercase text-white leading-tight whitespace-pre-line">
              {'sell anything.\nget paid anywhere.'}
            </h3>
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit self-start md:self-auto"
            >
              <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
                open your shop
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMERCE_FEATURES.map((f, i) => <FeatureCard key={i} feat={f} />)}
          </div>
        </div>
      </div>
    </section>
  )
}
