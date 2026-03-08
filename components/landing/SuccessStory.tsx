'use client'

export default function SuccessStory() {
  return (
    <section id="success" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fw-pink/10 rounded-full blur-[120px] opacity-30" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-fw-green text-xs font-semibold tracking-[0.2em] uppercase">
            SUCCESS STORIES
          </span>
          <h2 className="font-bold text-3xl md:text-5xl mt-4">
            เรื่องราวความสำเร็จ
          </h2>
        </div>

        {/* TAT partnership card */}
        <div className="bg-gradient-to-br from-fw-blue/20 via-white/[0.03] to-fw-pink/10 border border-white/[0.08] rounded-3xl p-8 md:p-12 mb-8">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-block bg-fw-green/10 border border-fw-green/20 rounded-full px-3 py-1 text-fw-green text-xs font-semibold mb-4">
                🏆 พาร์ทเนอร์ระดับประเทศ
              </div>
              <h3 className="font-bold text-2xl md:text-3xl mb-4">
                Discover Thailand
              </h3>
              <p className="text-fw-text-secondary mb-6 leading-relaxed">
                Freedom World ร่วมมือกับการท่องเที่ยวแห่งประเทศไทย (ททท.) 
                สร้างประสบการณ์การท่องเที่ยวแบบใหม่ ที่ให้นักท่องเที่ยวค้นพบธุรกิจท้องถิ่นกว่า 80+ แห่ง 
                พร้อมดีลพิเศษและรางวัลมากมาย
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-fw-green font-bold text-xl">80+</div>
                  <div className="text-fw-text-tertiary text-xs mt-1">ธุรกิจท้องถิ่น</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-fw-green font-bold text-xl">+107%</div>
                  <div className="text-fw-text-tertiary text-xs mt-1">ยอดธุรกรรม</div>
                </div>
                <div className="bg-white/[0.05] rounded-xl p-3 text-center">
                  <div className="text-fw-green font-bold text-xl">4.8★</div>
                  <div className="text-fw-text-tertiary text-xs mt-1">ความพึงพอใจ</div>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Placeholder for TAT image — using gradient background */}
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-fw-blue/30 to-fw-cyan/20 border border-white/[0.08] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">🇹🇭</div>
                  <div className="text-fw-text-secondary text-sm">
                    TOURISM AUTHORITY OF THAILAND
                  </div>
                  <div className="text-fw-text-tertiary text-xs mt-1">×</div>
                  <div className="text-fw-green text-sm font-semibold mt-1">
                    FREEDOM WORLD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Merchant testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'คุณสมชาย',
              biz: 'ร้านกาแฟ The Brew',
              quote: 'ระบบสะสมแต้มช่วยให้ลูกค้ากลับมาซื้อซ้ำเพิ่มขึ้น 45% ภายใน 3 เดือน',
              metric: '+45% ลูกค้าขาประจำ',
            },
            {
              name: 'คุณนภา',
              biz: 'ร้านอาหาร Napa Kitchen',
              quote: 'AI แนะนำโปรโมชั่นที่ตรงใจลูกค้า ยอดขายเพิ่มขึ้นโดยไม่ต้องเสียเวลาคิดเอง',
              metric: '+68% ยอดขาย',
            },
            {
              name: 'คุณวิทย์',
              biz: 'Fit Zone Gym',
              quote: 'มิชชั่นรายวันทำให้สมาชิกมีส่วนร่วมมากขึ้น อัตราต่ออายุสูงขึ้นเยอะ',
              metric: '+82% อัตราต่ออายุ',
            },
          ].map((t, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-all"
            >
              <p className="text-fw-text-secondary text-sm leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
                <div>
                  <div className="text-fw-text-primary text-sm font-semibold">{t.name}</div>
                  <div className="text-fw-text-tertiary text-xs">{t.biz}</div>
                </div>
                <div className="text-fw-green text-xs font-bold">{t.metric}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
