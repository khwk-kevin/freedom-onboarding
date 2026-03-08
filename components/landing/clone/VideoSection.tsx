export default function VideoSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4">
      <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] aspect-video flex items-center justify-center">
        {/* Green glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(16,244,139,0.08) 0%, transparent 70%)',
          }}
        />
        {/* Play icon */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[#10F48B]/20 border border-[#10F48B]/40 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M10 7l12 7-12 7V7z" fill="#10F48B" />
            </svg>
          </div>
          <p className="text-[#A6A7B5] text-sm">Watch how it works</p>
        </div>
      </div>
    </section>
  )
}
