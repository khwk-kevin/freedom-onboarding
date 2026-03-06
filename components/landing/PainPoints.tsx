interface PainPoint {
  icon: string
  title: string
  description: string
}

interface PainPointsProps {
  vertical: 'food' | 'creators'
}

const PAIN_POINTS: Record<PainPointsProps['vertical'], PainPoint[]> = {
  food: [
    {
      icon: '📋',
      title: 'Manual loyalty cards get lost',
      description:
        'Paper stamp cards fall apart, get forgotten, and tell you nothing about who your most loyal customers actually are.',
    },
    {
      icon: '📊',
      title: 'No customer data',
      description:
        'Every transaction is anonymous. You have no idea who your regulars are, what they order, or when they last visited.',
    },
    {
      icon: '💸',
      title: 'Cash-only limits growth',
      description:
        'Cash payments leave no trail. No way to send promotions, track spending patterns, or reward your best customers.',
    },
  ],
  creators: [
    {
      icon: '🎲',
      title: 'Platform dependency kills income',
      description:
        "One algorithm change, one policy update, and your livelihood disappears. You\u2019re building on rented land.",
    },
    {
      icon: '📉',
      title: 'Algorithm changes wipe reach overnight',
      description:
        'You spent years building an audience only to reach 2% of them. Platforms decide who sees your work, not you.',
    },
    {
      icon: '🚫',
      title: 'No direct monetization path',
      description:
        'Ad revenue is unpredictable. Brand deals are one-off. You have no recurring, community-owned income stream.',
    },
  ],
}

export default function PainPoints({ vertical }: PainPointsProps) {
  const points = PAIN_POINTS[vertical]

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Sound familiar?
        </h2>
        <p className="text-gray-500 text-center mb-10 text-lg">
          These are the problems holding{' '}
          {vertical === 'food' ? 'food businesses' : 'creators'} back.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {points.map((point) => (
            <div
              key={point.title}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{point.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {point.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
