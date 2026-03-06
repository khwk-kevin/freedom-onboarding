'use client'

const featureSections = [
  {
    label: 'LOYALTY ENGINE',
    title: 'สร้างระบบ Loyalty ที่ยั่งยืน',
    items: [
      { icon: '🔗', name: 'ระบบแนะนำเพื่อน', desc: 'ขยายฐานลูกค้าผ่านรีเฟอรัลที่ได้ผลจริง' },
      { icon: '🎯', name: 'มิชชั่น & ความท้าทาย', desc: 'สร้าง engagement loop ด้วยภารกิจรายวัน' },
      { icon: '🪙', name: 'โทเค็นของร้านคุณ', desc: 'สร้างแต้มสะสมเฉพาะร้านที่แลกรางวัลได้' },
      { icon: '🏅', name: 'ลีดเดอร์บอร์ด', desc: 'กระตุ้นชุมชนด้วย rankings และ badges' },
    ],
  },
  {
    label: 'E-COMMERCE',
    title: 'ขายทุกอย่าง รับเงินทุกที่',
    items: [
      { icon: '🛍️', name: 'ร้านค้าออนไลน์', desc: 'ลิสต์สินค้าข้ามหลายช่องทาง POS + ออนไลน์' },
      { icon: '🔒', name: 'Checkout ปลอดภัย', desc: 'ลดการละทิ้งตะกร้าด้วยระบบชำระเงินที่ไว้ใจได้' },
      { icon: '💳', name: 'รับทุกการชำระ', desc: 'บัตร, โทเค็น, ระบบ loyalty ครบวงจร' },
      { icon: '📱', name: 'POS & Merchant Mode', desc: 'จัดการหน้าร้าน ดู dashboard ยอดขายแบบ real-time' },
    ],
  },
  {
    label: 'COMMUNITY',
    title: 'เชื่อมต่อลูกค้า สร้างชุมชน',
    items: [
      { icon: '💬', name: 'แชทกับลูกค้า', desc: 'ซัพพอร์ตลูกค้าแบบ real-time ด้วย AI หรือทีมงาน' },
      { icon: '📢', name: 'ฟีดข่าวสาร', desc: 'ส่งโปรโมชั่นและข่าวตรงถึงลูกค้าทันที' },
      { icon: '👥', name: 'ชุมชนแชท', desc: 'สร้างพื้นที่พูดคุยให้ลูกค้าเชื่อมต่อกัน' },
      { icon: '📊', name: 'โพล & แบบสำรวจ', desc: 'เก็บข้อมูลความพึงพอใจและไอเดียจากลูกค้า' },
    ],
  },
]

export default function ExploreFeatures() {
  return (
    <section id="explore" className="relative py-24 md:py-32">
      {/* Background */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fw-green/5 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-fw-green text-xs font-heading font-semibold tracking-[0.2em] uppercase">
            EXPLORE FEATURES
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl mt-4">
            ฟีเจอร์ที่ช่วยยกระดับธุรกิจคุณ
          </h2>
        </div>

        <div className="space-y-16">
          {featureSections.map((section, si) => (
            <div key={si}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-fw-green/30 to-transparent" />
                <span className="text-fw-green text-xs font-heading font-semibold tracking-[0.15em]">
                  {section.label}
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-fw-green/30 to-transparent" />
              </div>
              <h3 className="font-heading font-bold text-xl md:text-2xl text-center mb-8">
                {section.title}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.items.map((item, ii) => (
                  <div
                    key={ii}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                  >
                    <div className="text-2xl mb-3">{item.icon}</div>
                    <h4 className="text-fw-text-primary font-semibold text-sm mb-2">{item.name}</h4>
                    <p className="text-fw-text-tertiary text-xs leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
