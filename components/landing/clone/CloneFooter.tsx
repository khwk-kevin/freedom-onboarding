'use client'

import Link from 'next/link'
import { useTranslation } from '@/context/TranslationContext'

export default function CloneFooter() {
  const { locale } = useTranslation()

  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/freedom-logo.svg" alt="Freedom World" className="h-8 w-auto" />

          {/* Single CTA */}
          <Link
            href="/onboarding"
            className="bg-[#10F48B] hover:bg-[#00dd77] text-black font-bold px-8 py-3 rounded-2xl text-base transition-all hover:shadow-[0_0_40px_rgba(16,244,139,0.3)] hover:scale-105"
          >
            {locale === 'th' ? 'เริ่มต้นสร้างชุมชน →' : 'Start Building Your Community →'}
          </Link>

          {/* Copyright */}
          <p className="text-[#67697C] text-xs">
            © {new Date().getFullYear()} Freedomverse Co., Ltd. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
