const valueProps = [
  {
    icon: '🎯',
    headline: 'Acquire',
    description:
      'Attract customers through your branded community shop and social features. Turn every campaign into a customer acquisition engine.',
  },
  {
    icon: '🏗️',
    headline: 'Build',
    description:
      'Create loyalty with token rewards — token users spend 9x more. Build a community that keeps coming back.',
  },
  {
    icon: '💰',
    headline: 'Monetize',
    description:
      'Turn engagement into revenue with missions, campaigns, and digital assets. Your community, your income.',
  },
]

export default function ValueProps() {
  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to grow
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((vp) => (
            <div
              key={vp.headline}
              className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{vp.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {vp.headline}
              </h3>
              <p className="text-gray-600 leading-relaxed">{vp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
