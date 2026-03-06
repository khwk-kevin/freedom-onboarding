'use client'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    title: 'อีคอมเมิร์ซครบวงจร',
    desc: 'ลิสต์สินค้า จัดการออเดอร์ รับชำระเงิน ทุกอย่างในที่เดียว ทั้ง POS และขายออนไลน์',
    gradient: 'from-fw-cyan/20 to-fw-blue/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.491 48.491 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    ),
    title: 'เกมมิฟิเคชั่น',
    desc: 'สร้างประสบการณ์แบบเกมที่ดึงดูดลูกค้า มิชชั่นรายวัน ความท้าทาย และรางวัลพิเศษ',
    gradient: 'from-fw-pink/20 to-purple-500/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
    title: 'CRM & AI อัจฉริยะ',
    desc: 'ระบบ CRM พร้อม AI ที่วิเคราะห์ข้อมูลลูกค้า 24/7 แนะนำกลยุทธ์เพิ่มยอดขายอัตโนมัติ',
    gradient: 'from-fw-green/20 to-emerald-500/20',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: 'ระบบสะสมแต้ม & รางวัล',
    desc: 'สร้างโทเค็นของร้านคุณเอง ลูกค้าสะสมแต้ม แลกรางวัล สร้างความภักดีระยะยาว',
    gradient: 'from-amber-500/20 to-fw-pink/20',
  },
]

export default function FeaturesDark() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-fw-green text-xs font-heading font-semibold tracking-[0.2em] uppercase">
            ALL-IN-ONE PLATFORM
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl mt-4 mb-6">
            แพลตฟอร์มครบวงจร
            <br />
            <span className="text-fw-text-secondary">เพื่อเพิ่มยอดขายและสร้างชุมชน</span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className={`group relative bg-gradient-to-br ${f.gradient} border border-white/[0.06] rounded-2xl p-8 hover:border-white/[0.12] transition-all duration-300 hover:scale-[1.02]`}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-fw-green mb-5">
                  {f.icon}
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3 text-fw-text-primary">
                  {f.title}
                </h3>
                <p className="text-fw-text-secondary text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
