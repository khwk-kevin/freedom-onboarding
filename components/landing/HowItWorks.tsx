const steps = [
  {
    number: '01',
    title: 'Create your account',
    description:
      'Sign up in 30 seconds. No credit card, no setup fees. Your Freedom World account is free to create.',
  },
  {
    number: '02',
    title: 'AI sets up your community',
    description:
      'Our AI assistant asks a few questions about your business and automatically generates your logo, branding, and first products.',
  },
  {
    number: '03',
    title: 'Go live & grow',
    description:
      'Your branded community is live. Start accepting members, running token reward campaigns, and driving repeat purchases.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-brand-green-dark uppercase tracking-wider mb-3">
            Simple setup
          </p>
          <h2 className="text-3xl font-bold text-gray-900">
            From signup to live in 15 minutes
          </h2>
        </div>
        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.number} className="flex gap-6 items-start">
              {/* Step number */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-green flex items-center justify-center">
                <span className="text-gray-900 font-bold text-sm">{step.number}</span>
              </div>
              {/* Connector line */}
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="ml-0 mt-2 w-px h-4 bg-gray-200 ml-6" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
