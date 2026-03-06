interface CaseStudyStat {
  value: string
  label: string
}

interface CaseStudyProps {
  businessName: string
  businessType: string
  quote: string
  stats: CaseStudyStat[]
  imageAlt?: string
}

const RAJA_FERRY_CASE: CaseStudyProps = {
  businessName: 'Raja Ferry Port',
  businessType: 'Food & Hospitality',
  quote:
    '"Freedom World transformed how we connect with passengers. Our repeat customers now spend 9x more than before — the token system built loyalty we couldn\'t achieve with paper cards."',
  stats: [
    { value: '107.5%', label: 'Transaction Growth' },
    { value: '9×', label: 'Higher Token User Spend' },
    { value: '100%', label: 'Token Top-Up → Purchase Rate' },
    { value: '24 days', label: 'Token User Lifespan vs 11 days cash' },
  ],
}

export default function CaseStudy({
  businessName = RAJA_FERRY_CASE.businessName,
  businessType = RAJA_FERRY_CASE.businessType,
  quote = RAJA_FERRY_CASE.quote,
  stats = RAJA_FERRY_CASE.stats,
}: Partial<CaseStudyProps>) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-10">
          <span className="inline-block bg-brand-green/10 text-brand-green-dark text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
            Real Results
          </span>
          <h2 className="text-3xl font-bold text-gray-900">
            See what&apos;s possible
          </h2>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Quote + business info */}
            <div className="p-8 md:p-10 flex flex-col justify-between">
              <div>
                <p className="text-lg text-gray-700 leading-relaxed italic mb-6">
                  {quote}
                </p>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{businessName}</p>
                <p className="text-gray-500 text-sm">{businessType}</p>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="bg-gray-900 p-8 md:p-10 grid grid-cols-2 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-extrabold text-brand-green mb-1">
                    {stat.value}
                  </div>
                  <div className="text-gray-400 text-sm leading-tight">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
