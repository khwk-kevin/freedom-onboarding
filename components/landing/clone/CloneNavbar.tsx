'use client'

import Link from 'next/link'
import { useTranslation } from '@/context/TranslationContext'

export default function CloneNavbar() {
  const { locale, setLocale } = useTranslation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050314]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/clone-test" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/freedom-logo.svg" alt="Freedom World" className="h-10 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                locale === 'en'
                  ? 'bg-[#10F48B] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('th')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                locale === 'th'
                  ? 'bg-[#10F48B] text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              TH
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/onboarding"
            className="bg-[#10F48B] hover:bg-[#00dd77] text-black font-semibold px-5 py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(16,244,139,0.3)]"
          >
            {locale === 'th' ? 'เริ่มต้นเลย' : 'Get Started'}
          </Link>
        </div>
      </div>
    </nav>
  )
}
