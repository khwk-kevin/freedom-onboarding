import Link from 'next/link'

const CARDS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="13" width="5" height="12" rx="1.5" fill="#10F48B" opacity="0.7" />
        <rect x="11" y="8" width="5" height="17" rx="1.5" fill="#10F48B" opacity="0.85" />
        <rect x="19" y="3" width="5" height="22" rx="1.5" fill="#10F48B" />
        <circle cx="21.5" cy="2" r="2" fill="#F742A2" />
      </svg>
    ),
    tag: 'ENGAGE',
    title: 'gamified\nengagement',
    desc: 'Create gamified experiences that drive user action.',
    color: '#10F48B',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="2.5" stroke="#36BBF6" strokeWidth="1.5" fill="none" />
        <path d="M8 14h4M16 14h4" stroke="#36BBF6" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 10l2 2 4-4" stroke="#10F48B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="6" r="3" fill="#F742A2" />
      </svg>
    ),
    tag: 'COMMERCE',
    title: 'integrated\ne-commerce',
    desc: 'Sell and list products end-to-end.',
    color: '#36BBF6',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4C8.477 4 4 8.477 4 14s4.477 10 10 10 10-4.477 10-10S19.523 4 14 4z" stroke="#F742A2" strokeWidth="1.5" fill="none" />
        <path d="M14 9v5l3.5 2" stroke="#F742A2" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="21" cy="21" r="4" fill="#1248C8" />
        <path d="M19.5 21h3M21 19.5v3" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    tag: 'RETENTION',
    title: 'customer retention\nsystems',
    desc: 'Connect, engage and promote with automated rewards.',
    color: '#F742A2',
  },
]

export default function StatsSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto">
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70%',
          height: '60%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(18,72,200,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-10 md:gap-16">
        {/* Heading */}
        <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Platform
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            all-in-one platform to grow and
            <br />
            <span className="text-[#10F48B]">engage your customers</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col gap-4 overflow-hidden group hover:border-white/[0.12] transition-colors"
            >
              {/* Inner glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${card.color}12 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10 flex flex-col gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.06] flex items-center justify-center">
                  {card.icon}
                </div>

                {/* Tag */}
                <span
                  className="text-xs font-semibold uppercase tracking-[0.15em]"
                  style={{ color: card.color }}
                >
                  {card.tag}
                </span>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black uppercase text-white leading-snug whitespace-pre-line">
                  {card.title}
                </h3>

                {/* Desc */}
                <p className="text-[#A6A7B5] text-sm leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/onboarding"
          className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit"
        >
          <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
            Get Started
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  )
}
