'use client'

const reasons = [
  {
    emoji: '💸',
    title: 'จ่ายน้อยลง รายได้มากขึ้น',
    desc: 'เครื่องมือทุกอย่างที่คุณต้องการเพื่อเติบโต — โดยไม่ต้องเสียค่าใช้จ่ายสูง ค่าธรรมเนียมเริ่มต้นเพียง 1%',
  },
  {
    emoji: '📊',
    title: 'ทุกอย่างในแดชบอร์ดเดียว',
    desc: 'ประหยัดเวลา จัดการธุรกิจทั้งหมดจากคอนโซลเดียว — ยอดขาย, ลูกค้า, แคมเปญ, ทุกอย่าง',
  },
  {
    emoji: '🎯',
    title: 'รู้จักลูกค้าดีขึ้น',
    desc: 'ใช้ข้อมูลเชิงลึกของลูกค้าเพื่อส่งข้อเสนอพิเศษ คอนเทนต์เฉพาะบุคคล และประสบการณ์แบบเกม',
  },
]

export default function WhyFreedom() {
  return (
    <section id="why" className="relative py-24 md:py-32">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-fw-blue/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-fw-green text-xs font-semibold tracking-[0.2em] uppercase">
            WHY FREEDOM WORLD
          </span>
          <h2 className="font-bold text-3xl md:text-5xl mt-4">
            ทำไมต้อง Freedom World?
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {reasons.map((r, i) => (
            <div
              key={i}
              className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300"
            >
              <div className="text-4xl mb-5">{r.emoji}</div>
              <h3 className="font-bold text-lg mb-3 text-fw-text-primary">
                {r.title}
              </h3>
              <p className="text-fw-text-secondary text-sm leading-relaxed">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
