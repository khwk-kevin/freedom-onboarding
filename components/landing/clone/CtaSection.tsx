import Link from 'next/link'

export default function CtaSection() {
  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      <div
        className="relative rounded-3xl overflow-hidden p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8"
        style={{
          background: 'linear-gradient(117deg, rgba(24,75,255,0.25) 0%, rgba(23,74,255,0.18) 100%)',
          border: '1px solid rgba(18,72,200,0.35)',
        }}
      >
        {/* Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(16,244,139,0.08) 0%, transparent 60%)',
          }}
        />

        {/* Decorative circle top right */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 100% 0%, rgba(18,72,200,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Dots grid decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4 max-w-xl">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Get Started
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            join as a
            <br />
            <span className="text-[#10F48B]">partner</span>
          </h2>
          <p className="text-[#A6A7B5] text-base leading-relaxed">
            Join the growing network of partners maximizing sales and customer engagement with Freedom World.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform"
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

          <Link
            href="/contact"
            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 border border-white/[0.2] text-white hover:bg-white/[0.06] transition-colors text-sm font-semibold uppercase"
          >
            contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
