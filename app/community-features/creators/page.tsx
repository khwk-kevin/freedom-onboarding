import type { Metadata } from 'next'
import PainPoints from '@/components/landing/PainPoints'
import FAQ from '@/components/landing/FAQ'
import BottomCTA from '@/components/landing/BottomCTA'
import { FAQSchema, BreadcrumbSchema } from '@/components/shared/SchemaMarkup'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://freedom-onboarding.vercel.app'

export const metadata: Metadata = {
  title: 'Freedom World for Creators — Own Your Audience & Monetize Directly',
  description:
    'Stop depending on algorithms. Build a community you own. Sell digital products, run token campaigns, and monetize your audience directly. Set up in 15 minutes.',
  keywords: [
    'creator community platform',
    'influencer monetization',
    'direct fan monetization',
    'creator token rewards',
    'independent creator platform Thailand',
    'platform-independent monetization',
  ],
  openGraph: {
    title: 'Freedom World for Creators & Influencers',
    description:
      'Own your audience. Monetize directly. No algorithm, no platform dependency.',
    url: `${APP_URL}/community-features/creators`,
    siteName: 'Freedom World',
    images: [
      {
        url: `${APP_URL}/images/og/creators.png`,
        width: 1200,
        height: 630,
        alt: 'Freedom World for Creators',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freedom World for Creators',
    description: 'Own your audience. Monetize directly. No algorithm.',
    images: [`${APP_URL}/images/og/creators.png`],
  },
  alternates: {
    canonical: `${APP_URL}/community-features/creators`,
  },
}

const CREATOR_FAQS = [
  {
    q: 'How is this different from Instagram or TikTok?',
    a: 'You own your Freedom World community — no algorithm decides who sees your content. Every member opted in directly, and you can reach all of them anytime.',
  },
  {
    q: 'What can I sell through my community?',
    a: 'Digital products, physical merchandise, exclusive content, experiences, events, coaching sessions — anything you create. Your community shop handles the payments.',
  },
  {
    q: 'How do token rewards work for creators?',
    a: 'Your fans earn your custom tokens for purchases, engagement, and sharing. They redeem tokens for exclusive perks you set — early access, merch discounts, backstage passes.',
  },
  {
    q: 'Will I lose my social media following?',
    a: 'No — Freedom World is a complement to your social channels, not a replacement. Use social to drive people to your community where you own the relationship.',
  },
  {
    q: 'How do I migrate my existing fans?',
    a: 'Share your community link on your social channels, in your bio, and via email. Our AI assistant creates your community in 15 minutes, then your promotion takes it from there.',
  },
  {
    q: 'Is it free to create my community?',
    a: 'Yes. Creating your community is free. You pay a small transaction fee when your fans make purchases — only when you earn.',
  },
]

export default function CreatorsVerticalPage() {
  const breadcrumbs = [
    { name: 'Home', url: APP_URL },
    { name: 'Community Features', url: `${APP_URL}/community-features` },
    { name: 'Creators', url: `${APP_URL}/community-features/creators` },
  ]

  return (
    <>
      <FAQSchema faqs={CREATOR_FAQS} />
      <BreadcrumbSchema items={breadcrumbs} />

      <main>
        {/* Creator-specific hero */}
        <section className="bg-white pt-20 pb-16 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-lg">🎨</span>
              <span className="text-sm font-medium text-gray-700">
                For creators, influencers &amp; artists
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Own Your Audience.{' '}
              <span className="text-brand-green-dark">Monetize Directly.</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Stop building on rented land. Create a community you own — no
              algorithm changes, no platform dependency. Your fans, your revenue,
              your rules.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/signup"
                aria-label="Build your creator community for free"
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg bg-brand-green hover:bg-[#00E87A] text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              >
                Build My Community — Free
              </a>
              <a
                href="#how-it-works"
                aria-label="See how Freedom World works for creators"
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg border-2 border-brand-green text-brand-green-dark hover:bg-brand-green/10 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span>✓ No algorithm dependency</span>
              <span>✓ Direct fan monetization</span>
              <span>✓ Free to start</span>
            </div>
          </div>
        </section>

        <PainPoints vertical="creators" />

        {/* How it works for creators */}
        <section id="how-it-works" className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
              From zero to community in 15 minutes
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: '🤖',
                  title: 'AI sets up your community',
                  description:
                    'Answer a few questions about your brand. Our AI generates your logo, banner, and community page automatically.',
                },
                {
                  step: '02',
                  icon: '🛍️',
                  title: 'Add your products & perks',
                  description:
                    'List digital products, merch, or exclusive experiences. Set up token rewards so fans earn for every purchase.',
                },
                {
                  step: '03',
                  icon: '🚀',
                  title: 'Share and grow',
                  description:
                    'Drop your community link in your bio. Every fan who joins is yours — not the platform\'s.',
                },
              ].map((step) => (
                <div key={step.step} className="text-center">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <div className="text-xs font-bold text-brand-green-dark mb-1 tracking-widest uppercase">
                    Step {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof for creators */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { value: '400+', label: 'Students in one education community' },
                { value: '9×', label: 'More spend from token users' },
                { value: '35.5%', label: 'Monthly retention rate' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="text-4xl font-extrabold text-brand-green-dark mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-500 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQ faqs={CREATOR_FAQS} title="Questions from creators" />

        <BottomCTA
          headline="Your audience deserves a home you own"
          subheadline="Build your creator community today. Own the relationship. Monetize directly. Set up in 15 minutes."
          ctaText="Build My Community — Free"
          location="creators-bottom-cta"
        />
      </main>
    </>
  )
}
