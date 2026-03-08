import Link from 'next/link'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2C6.03 2 2 6.03 2 11s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" stroke="#10F48B" strokeWidth="1.5" fill="none"/>
        <path d="M8 11c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z" fill="#10F48B" opacity="0.5"/>
        <path d="M11 8V5M11 17v-3M5 11H2M20 11h-3" stroke="#10F48B" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Missions & Challenges',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M2 7h18M2 11h14M2 15h10" stroke="#36BBF6" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="15" r="3" fill="#36BBF6" opacity="0.3" stroke="#36BBF6" strokeWidth="1.2"/>
      </svg>
    ),
    label: 'Community Feed',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 16v-1a7 7 0 0114 0v1" stroke="#F742A2" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="11" cy="7" r="4" stroke="#F742A2" strokeWidth="1.5" fill="none"/>
        <path d="M18 9l2 2-2 2" stroke="#F742A2" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Referral System',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="3" width="18" height="13" rx="2" stroke="#10F48B" strokeWidth="1.5" fill="none"/>
        <path d="M7 19h8M11 16v3" stroke="#10F48B" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 9l3 3 5-5" stroke="#10F48B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Interactive Map',
  },
]

export default function EngageSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          right: '-10%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(ellipse at 80% 50%, rgba(16,244,139,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left: text + features */}
        <div className="flex flex-col gap-6 md:gap-8">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Engage
          </span>

          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
              build customer
            </h2>
            <h2 className="text-3xl md:text-5xl font-black uppercase text-[#10F48B] leading-tight">
              connections
            </h2>
          </div>

          <p className="text-[#A6A7B5] text-base leading-relaxed max-w-sm">
            Build a connected community in a gamified marketing ecosystem that keeps customers coming back.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3"
              >
                {f.icon}
                <span className="text-white text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit"
          >
            <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
              create your community
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Right: visual mockup */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden aspect-square md:aspect-[4/5] flex items-center justify-center">
          {/* Glow inner */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(16,244,139,0.07) 0%, transparent 70%)',
            }}
          />
          {/* Decorative concentric circles */}
          <div className="relative z-10 flex items-center justify-center w-full h-full">
            {[1, 0.65, 0.38].map((scale, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-white/[0.06]"
                style={{
                  width: `${scale * 80}%`,
                  height: `${scale * 80}%`,
                  borderColor: i === 0 ? 'rgba(16,244,139,0.12)' : undefined,
                }}
              />
            ))}
            {/* Center logo placeholder */}
            <div className="relative z-20 w-20 h-20 rounded-full bg-[#1248C8]/30 border border-[#1248C8]/50 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 6C11.373 6 6 11.373 6 18s5.373 12 12 12 12-5.373 12-12S24.627 6 18 6z" stroke="#10F48B" strokeWidth="1.5" fill="none"/>
                <circle cx="18" cy="18" r="4" fill="#10F48B" opacity="0.6"/>
              </svg>
            </div>

            {/* Floating feature pills */}
            {[
              { label: 'Missions', color: '#10F48B', top: '12%', left: '5%' },
              { label: 'Leaderboard', color: '#36BBF6', top: '12%', right: '5%' },
              { label: 'Rewards', color: '#F742A2', bottom: '18%', left: '5%' },
              { label: 'Community', color: '#10F48B', bottom: '18%', right: '5%' },
            ].map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full px-3 py-1.5 border text-xs font-semibold"
                style={{
                  top: p.top,
                  bottom: p.bottom,
                  left: p.left,
                  right: p.right,
                  borderColor: `${p.color}40`,
                  background: `${p.color}18`,
                  color: p.color,
                }}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
