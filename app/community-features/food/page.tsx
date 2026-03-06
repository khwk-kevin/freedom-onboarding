import type { Metadata } from 'next'
import Hero from '@/components/landing/Hero'
import PainPoints from '@/components/landing/PainPoints'
import CaseStudy from '@/components/landing/CaseStudy'
import FAQ from '@/components/landing/FAQ'
import BottomCTA from '@/components/landing/BottomCTA'
import { FAQSchema, BreadcrumbSchema } from '@/components/shared/SchemaMarkup'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://freedom-onboarding.vercel.app'

export const metadata: Metadata = {
  title: 'Freedom World for Food & Restaurants — Build Customer Loyalty',
  description:
    'Replace paper loyalty cards with digital token rewards. Know your customers, grow repeat visits, and increase revenue by 107.5%. Set up in 15 minutes.',
  keywords: [
    'restaurant loyalty program',
    'food business community',
    'digital loyalty cards',
    'restaurant token rewards',
    'customer loyalty app Thailand',
  ],
  openGraph: {
    title: 'Freedom World for Food & Restaurants',
    description:
      'Replace paper loyalty cards with token rewards. 107.5% transaction growth. Set up in 15 minutes.',
    url: `${APP_URL}/community-features/food`,
    siteName: 'Freedom World',
    images: [
      {
        url: `${APP_URL}/images/og/food.png`,
        width: 1200,
        height: 630,
        alt: 'Freedom World for Food Businesses',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freedom World for Food & Restaurants',
    description:
      'Digital loyalty rewards for food businesses. 107.5% transaction growth.',
    images: [`${APP_URL}/images/og/food.png`],
  },
  alternates: {
    canonical: `${APP_URL}/community-features/food`,
  },
}

const FOOD_FAQS = [
  {
    q: 'Can I replace my existing paper stamp cards?',
    a: 'Yes! Freedom World\'s digital token system fully replaces paper loyalty cards. Customers earn tokens automatically on every purchase — no stamps, no cards to lose.',
  },
  {
    q: 'Will customers actually use a digital loyalty app?',
    a: 'Absolutely. Token users at Raja Ferry Port showed 100% top-up to purchase conversion and spent 9x more than cash-only customers. The app is simple enough for all ages.',
  },
  {
    q: 'How do I see which customers visit most often?',
    a: 'Your Freedom World dashboard shows every customer\'s visit history, spending, and token balance. You finally know who your regulars are.',
  },
  {
    q: 'Can I run promotions to bring customers back?',
    a: 'Yes — create missions and campaigns that reward specific behaviors (visit 3x this week, share with a friend, try a new dish). Targeted, measurable, and automatic.',
  },
  {
    q: 'How long does setup take?',
    a: 'About 15 minutes. Our AI assistant guides you through branding, menu setup, and token configuration. No technical skills needed.',
  },
  {
    q: 'Is it free for restaurants?',
    a: 'Creating your community is free. You only pay a small transaction fee when customers make purchases through your community shop.',
  },
]

export default function FoodVerticalPage() {
  const breadcrumbs = [
    { name: 'Home', url: APP_URL },
    { name: 'Community Features', url: `${APP_URL}/community-features` },
    { name: 'Food & Restaurants', url: `${APP_URL}/community-features/food` },
  ]

  return (
    <>
      <FAQSchema faqs={FOOD_FAQS} />
      <BreadcrumbSchema items={breadcrumbs} />

      <main>
        {/* Food-specific hero — override headline */}
        <section className="bg-white pt-20 pb-16 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-lg">🍜</span>
              <span className="text-sm font-medium text-gray-700">
                For restaurants, cafes &amp; food businesses
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Turn Every Meal into{' '}
              <span className="text-brand-green-dark">Loyal Customers</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Replace paper loyalty cards with digital token rewards. Know your
              regulars. Run campaigns. Watch revenue grow —{' '}
              <strong className="text-gray-900">107.5% transaction growth</strong> at
              Raja Ferry Port.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/signup"
                aria-label="Create your free community — live in 15 minutes"
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg bg-brand-green hover:bg-[#00E87A] text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              >
                Start Free — Live in 15 Minutes
              </a>
              <a
                href="#case-study"
                aria-label="View Raja Ferry Port case study"
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-lg border-2 border-brand-green text-brand-green-dark hover:bg-brand-green/10 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              >
                See Raja Ferry&apos;s results
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span>✓ No paper cards</span>
              <span>✓ Real customer data</span>
              <span>✓ Free to start</span>
            </div>
          </div>
        </section>

        <PainPoints vertical="food" />

        <div id="case-study">
          <CaseStudy />
        </div>

        <FAQ faqs={FOOD_FAQS} title="Questions about food businesses" />

        <BottomCTA
          headline="Ready to replace your loyalty cards?"
          subheadline="Join food businesses growing with Freedom World. Digital loyalty, real customer data, and 107.5% more transactions."
          ctaText="Start Free — No Credit Card"
          location="food-bottom-cta"
        />
      </main>
    </>
  )
}
