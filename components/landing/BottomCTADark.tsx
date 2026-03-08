'use client'

import Link from 'next/link'
import { track } from '@/lib/tracking/unified'

export default function BottomCTADark() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-fw-hero-glow rounded-full blur-[120px] opacity-30" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-heading font-bold text-3xl md:text-5xl mb-6">
          พร้อมเริ่มต้นหรือยัง?
        </h2>
        <p className="text-fw-text-secondary text-lg mb-10 leading-relaxed">
          สร้างชุมชนของคุณวันนี้ ด้วย AI ที่ช่วยออกแบบทุกอย่างให้คุณ
          <br />
          ตั้งแต่โลโก้ แบนเนอร์ ไปจนถึงหน้าร้านค้า — เสร็จภายใน 5 นาที
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            onClick={() => track.ctaClick('bottom_cta', 'dark')}
            className="group bg-fw-green hover:bg-fw-green-hover text-fw-bg font-bold px-10 py-4 rounded-2xl text-lg transition-all hover:shadow-[0_0_40px_rgba(16,244,139,0.3)] hover:scale-105"
          >
            เริ่มต้นฟรี
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <a
            href="https://info.freedom.world"
            target="_blank"
            rel="noopener"
            className="text-fw-text-secondary hover:text-fw-text-primary text-sm transition-colors"
          >
            หรือนัดเดโม →
          </a>
        </div>

        <p className="text-fw-text-tertiary text-xs mt-8">
          ไม่ต้องใช้บัตรเครดิต · เริ่มต้นได้ทันที · ยกเลิกเมื่อไหร่ก็ได้
        </p>
      </div>
    </section>
  )
}
