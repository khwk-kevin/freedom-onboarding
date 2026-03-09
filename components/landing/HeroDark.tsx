'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { track } from '@/lib/tracking/unified'

export default function HeroDark() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0">
        {/* Main gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-fw-hero-glow rounded-full blur-[120px] opacity-40 animate-glow-pulse" />
        {/* Blue accent */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fw-blue/20 rounded-full blur-[100px] opacity-30" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24 pb-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-fw-green rounded-full animate-pulse" />
          <span className="text-fw-text-secondary text-xs font-medium tracking-wide uppercase">
            แพลตฟอร์มสำหรับธุรกิจยุคใหม่
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-bold text-4xl sm:text-5xl md:text-7xl leading-tight mb-6">
          <span className="text-fw-text-primary">ธุรกิจของคุณ.</span>
          <br />
          <span className="text-fw-text-primary">โลกของคุณ.</span>
          <br />
          <span className="bg-gradient-to-r from-fw-green via-fw-cyan to-fw-green bg-clip-text text-transparent">
            สร้างได้เลย
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-fw-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          สร้างชุมชนที่เชื่อมต่อลูกค้าในระบบการตลาดแบบเกมมิฟิเคชั่น
          <br className="hidden md:block" />
          แพลตฟอร์มครบวงจรเพื่อเพิ่มยอดขาย สร้างความภักดี และขยายธุรกิจ
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/start"
            onClick={() => track.ctaClick('hero', 'dark')}
            className="group relative bg-fw-green hover:bg-fw-green-hover text-fw-bg font-bold px-8 py-4 rounded-2xl text-base transition-all hover:shadow-[0_0_40px_rgba(16,244,139,0.3)] hover:scale-105"
          >
            เริ่มต้นสร้างชุมชน
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <a
            href="https://info.freedom.world"
            target="_blank"
            rel="noopener"
            className="text-fw-text-secondary hover:text-fw-text-primary border border-white/10 hover:border-white/20 px-8 py-4 rounded-2xl text-base transition-all hover:bg-white/5"
          >
            ดูข้อมูลเพิ่มเติม
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <div className="text-2xl md:text-3xl font-bold text-fw-green">800K+</div>
            <div className="text-fw-text-tertiary text-xs mt-1">ผู้ใช้งาน</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-fw-green">1,000+</div>
            <div className="text-fw-text-tertiary text-xs mt-1">ร้านค้าพาร์ทเนอร์</div>
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-bold text-fw-green">฿50M+</div>
            <div className="text-fw-text-tertiary text-xs mt-1">ยอดธุรกรรม</div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-fw-bg to-transparent" />
    </section>
  )
}
