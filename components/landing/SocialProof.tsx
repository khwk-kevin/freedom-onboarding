const stats = [
  {
    value: '107.5%',
    label: 'Transaction growth',
    subtext: 'Raja Ferry case study',
  },
  {
    value: '9x',
    label: 'Higher spend by token users',
    subtext: '฿7,881 vs ฿867 average',
  },
  {
    value: '100%',
    label: 'Token → purchase conversion',
    subtext: 'Top-up to first purchase',
  },
  {
    value: '24 days',
    label: 'Token user lifespan',
    subtext: 'vs 11 days cash-only',
  },
]

export default function SocialProof() {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm font-semibold text-brand-green-dark uppercase tracking-wider mb-4">
          Real results from real merchants
        </p>
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          Numbers that speak for themselves
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.value} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-3xl md:text-4xl font-extrabold text-brand-green-dark mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
