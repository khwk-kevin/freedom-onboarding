import Link from 'next/link'

interface VerticalCard {
  href: string
  icon: string
  title: string
  description: string
  highlight: string
}

const VERTICALS: VerticalCard[] = [
  {
    href: '/community-features/food',
    icon: '🍜',
    title: 'Food & Restaurants',
    description:
      'Replace paper loyalty cards with digital token rewards. Know your customers, run promotions, and grow repeat visits.',
    highlight: '107.5% transaction growth',
  },
  {
    href: '/community-features/creators',
    icon: '🎨',
    title: 'Creators & Influencers',
    description:
      'Own your audience. Monetize directly through your community shop. No algorithm, no platform dependency.',
    highlight: 'Direct monetization',
  },
]

export default function VerticalCards() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Built for your industry
          </h2>
          <p className="text-gray-500 text-lg">
            See how Freedom World works specifically for your business type.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {VERTICALS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group block bg-white rounded-2xl border border-gray-200 p-7 shadow-sm hover:shadow-lg hover:border-brand-green/40 transition-all"
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-green-dark transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                {card.description}
              </p>
              <span className="inline-block bg-brand-green/10 text-brand-green-dark text-xs font-semibold px-3 py-1 rounded-full">
                {card.highlight}
              </span>
              <div className="mt-4 text-brand-green-dark text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
