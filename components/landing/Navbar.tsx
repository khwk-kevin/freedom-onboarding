'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from '@/context/TranslationContext'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, locale, setLocale } = useTranslation()

  const navLinks = [
    { href: '#features', label: locale === 'en' ? 'Features' : 'ฟีเจอร์' },
    { href: '#why',      label: locale === 'en' ? 'Why Us'   : 'ทำไมต้องเรา' },
    { href: '#success',  label: locale === 'en' ? 'Success'  : 'ความสำเร็จ' },
    { href: '#explore',  label: locale === 'en' ? 'Explore'  : 'สำรวจ' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-fw-bg/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/freedom-logo.svg" alt="Freedom World" className="h-10 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-fw-text-secondary hover:text-fw-text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA + Language toggle */}
        <div className="flex items-center gap-3">
          {/* EN / TH pill toggle */}
          <div className="hidden md:flex items-center rounded-full border border-white/15 bg-white/5 p-[2px] text-xs font-bold select-none">
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1 rounded-full transition-all ${
                locale === 'en'
                  ? 'bg-[#10F48B] text-[#050314]'
                  : 'text-fw-text-secondary hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale('th')}
              className={`px-3 py-1 rounded-full transition-all ${
                locale === 'th'
                  ? 'bg-[#10F48B] text-[#050314]'
                  : 'text-fw-text-secondary hover:text-white'
              }`}
            >
              TH
            </button>
          </div>

          <Link
            href="/onboarding"
            className="bg-fw-green hover:bg-fw-green-hover text-fw-bg font-semibold px-5 py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(16,244,139,0.3)]"
          >
            {locale === 'en' ? 'Get Started' : 'เริ่มต้นเลย'}
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-fw-text-secondary p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-fw-bg/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-fw-text-secondary hover:text-fw-text-primary text-sm py-2"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {/* Mobile language toggle */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-fw-text-secondary text-xs">Lang:</span>
            <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-[2px] text-xs font-bold">
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 rounded-full transition-all ${
                  locale === 'en' ? 'bg-[#10F48B] text-[#050314]' : 'text-fw-text-secondary'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('th')}
                className={`px-3 py-1 rounded-full transition-all ${
                  locale === 'th' ? 'bg-[#10F48B] text-[#050314]' : 'text-fw-text-secondary'
                }`}
              >
                TH
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
