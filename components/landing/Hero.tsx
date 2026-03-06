import CTAButton from '@/components/shared/CTAButton'

export default function Hero() {
  return (
    <section className="bg-white pt-20 pb-16 px-4 text-center">
      <div className="max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-green inline-block" />
          <span className="text-sm font-medium text-gray-700">
            30+ businesses growing with Freedom World
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Build Your Business{' '}
          <span className="text-brand-green-dark">Community</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Acquire customers, build loyalty, and monetize — all in one platform.
          Token rewards. AI-powered setup.{' '}
          <strong className="text-gray-900">Live in 15 minutes.</strong>
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <CTAButton href="/signup" location="hero-primary" size="lg">
            Create Your Community — Free
          </CTAButton>
          <CTAButton
            href="#how-it-works"
            location="hero-secondary"
            variant="outline"
            size="lg"
          >
            See how it works
          </CTAButton>
        </div>

        {/* Trust signals */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span>✓ No credit card required</span>
          <span>✓ Setup in 15 minutes</span>
          <span>✓ Free to start</span>
        </div>
      </div>
    </section>
  )
}
