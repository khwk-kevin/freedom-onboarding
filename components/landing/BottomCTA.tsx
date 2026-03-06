import CTAButton from '@/components/shared/CTAButton'

interface BottomCTAProps {
  headline?: string
  subheadline?: string
  ctaText?: string
  ctaHref?: string
  location?: string
}

export default function BottomCTA({
  headline = 'Ready to build your community?',
  subheadline = 'Join 30+ businesses growing with Freedom World. AI-powered setup. Live in 15 minutes.',
  ctaText = 'Create Your Community — Free',
  ctaHref = '/signup',
  location = 'bottom-cta',
}: BottomCTAProps) {
  return (
    <section className="py-20 px-4 bg-gray-900">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">{headline}</h2>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          {subheadline}
        </p>

        <CTAButton href={ctaHref} location={location} size="lg">
          {ctaText}
        </CTAButton>

        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span>✓ No credit card required</span>
          <span>✓ Free to start</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </section>
  )
}
