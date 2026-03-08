import Link from 'next/link'

const MAP_FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2C7.134 2 4 5.134 4 9c0 5.25 7 11 7 11s7-5.75 7-11c0-3.866-3.134-7-7-7z" stroke="#10F48B" strokeWidth="1.4" fill="none"/>
        <circle cx="11" cy="9" r="2.5" fill="#10F48B" opacity="0.7"/>
      </svg>
    ),
    title: 'Bring Customers to Your Door',
    desc: 'Draw more foot traffic with Missions that bring motivated customers to your door to complete challenges, redeem NFTs, and claim rewards or exclusive offers.',
    color: '#10F48B',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#36BBF6" strokeWidth="1.4" fill="none"/>
        <path d="M11 3v16M3 11h16" stroke="#36BBF6" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        <circle cx="11" cy="11" r="3" fill="#36BBF6" opacity="0.3"/>
      </svg>
    ),
    title: 'Reach Explorers Across the Globe',
    desc: 'Tourists and explorers collect digital stamps as they travel. Featuring your business turns every visit into a collectible memory — promoting your brand to a global audience.',
    color: '#36BBF6',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2l2.5 7h7.5L15 14l2.5 7L11 17l-6.5 4 2.5-7L1 9h7.5L11 2z" stroke="#F742A2" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Win Visibility Inside The Scape',
    desc: 'Give your customers something worth earning. Launch your own tokens or points that can be redeemed or collected across your ecosystem.',
    color: '#F742A2',
  },
]

// Map pin component
function MapPin({ x, y, color, size = 'md' }: { x: string; y: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
  return (
    <div className={`absolute ${s}`} style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
      <div
        className="w-full h-full rounded-full animate-ping absolute"
        style={{ background: `${color}30` }}
      />
      <div
        className="w-full h-full rounded-full flex items-center justify-center"
        style={{ background: `${color}20`, border: `1px solid ${color}60` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

export default function MapSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%',
          right: '-5%',
          width: '45%',
          height: '70%',
          background: 'radial-gradient(ellipse at 70% 30%, rgba(54,187,246,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Discovery
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            put your business
          </h2>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#10F48B] leading-tight -mt-2 md:-mt-3">
            on the map
          </h2>
        </div>

        {/* Map visual */}
        <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden aspect-[16/7] flex items-center justify-center">
          {/* Grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
            }}
          />
          {/* Center glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '80%',
              background: 'radial-gradient(ellipse, rgba(18,72,200,0.2) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Map pins */}
          <MapPin x="25%" y="35%" color="#10F48B" size="lg" />
          <MapPin x="40%" y="55%" color="#36BBF6" size="md" />
          <MapPin x="55%" y="30%" color="#F742A2" size="md" />
          <MapPin x="65%" y="60%" color="#10F48B" size="sm" />
          <MapPin x="75%" y="40%" color="#36BBF6" size="lg" />
          <MapPin x="30%" y="70%" color="#F742A2" size="sm" />
          <MapPin x="50%" y="50%" color="#10F48B" size="md" />

          {/* Route line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path
              d="M 25% 35% Q 40% 20% 55% 30% T 75% 40%"
              stroke="rgba(16,244,139,0.25)"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Freedom World badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-[#050314]/80 border border-white/[0.1] px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#10F48B] animate-pulse" />
            <span className="text-white text-xs font-semibold">Freedom World Map</span>
          </div>

          {/* Business count badge */}
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1">
            <div className="rounded-xl bg-[#1248C8]/60 border border-[#1248C8]/40 px-3 py-2">
              <p className="text-white font-black text-lg leading-none">80+</p>
              <p className="text-[#A6A7B5] text-xs">Partner Merchants</p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MAP_FEATURES.map((feat, i) => (
            <div
              key={i}
              className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col gap-4 overflow-hidden hover:border-white/[0.12] transition-colors group"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${feat.color}12 0%, transparent 70%)`,
                }}
              />
              <div
                className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${feat.color}20`, border: `1px solid ${feat.color}30` }}
              >
                {feat.icon}
              </div>
              <h3 className="text-white font-bold text-base relative">{feat.title}</h3>
              <p className="text-[#A6A7B5] text-sm leading-relaxed relative">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
              see how it works
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
