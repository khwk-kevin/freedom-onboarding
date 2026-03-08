const WHY_CARDS = [
  {
    accent: '#10F48B',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" stroke="#10F48B" strokeWidth="1.5" fill="none"/>
        <path d="M10 16l4 4 8-8" stroke="#10F48B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="24" cy="8" r="4" fill="#10F48B" opacity="0.25"/>
        <path d="M22 8h4M24 6v4" stroke="#10F48B" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    titleLine1: 'pay less, ',
    titleLine2: 'earn more.',
    desc: 'All the tools you need to grow your business – without breaking the bank.',
  },
  {
    accent: '#36BBF6',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="4" width="24" height="24" rx="5" stroke="#36BBF6" strokeWidth="1.5" fill="none"/>
        <path d="M10 12h12M10 16h8M10 20h10" stroke="#36BBF6" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="26" cy="8" r="3" fill="#36BBF6" opacity="0.3" stroke="#36BBF6" strokeWidth="1"/>
      </svg>
    ),
    titleLine1: 'everything in ',
    titleLine2: 'one dashboard.',
    desc: 'Save time and manage your business from a single, easy-to-use console.',
  },
  {
    accent: '#F742A2',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="11" r="5" stroke="#F742A2" strokeWidth="1.5" fill="none"/>
        <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#F742A2" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M21 8l2 2 4-4" stroke="#10F48B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    titleLine1: 'know your',
    titleLine2: 'customers better.',
    desc: 'Use deep customer data to deliver personalized offers, exclusive content, and gamified experiences.',
  },
]

export default function WhySection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(ellipse, rgba(16,244,139,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Benefits
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            why will freedom world
          </h2>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-[#10F48B] leading-tight -mt-2 md:-mt-3">
            work for you?
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WHY_CARDS.map((card, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden p-px"
              style={{
                background: `linear-gradient(135deg, ${card.accent}20 0%, transparent 50%)`,
              }}
            >
              <div className="relative rounded-2xl bg-[#050314] border border-white/[0.06] p-8 h-full flex flex-col gap-6">
                {/* Glow top corner */}
                <div
                  className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at 0% 0%, ${card.accent}15 0%, transparent 70%)`,
                  }}
                />

                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${card.accent}12`, border: `1px solid ${card.accent}25` }}
                >
                  {card.icon}
                </div>

                <div className="relative flex flex-col gap-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase text-white leading-tight">
                    <span>{card.titleLine1}</span>
                    <span style={{ color: card.accent }}>{card.titleLine2}</span>
                  </h3>
                  <p className="text-[#A6A7B5] text-sm leading-relaxed">{card.desc}</p>
                </div>

                {/* Bottom accent line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${card.accent}40, transparent)` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
