'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-fw-bg/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/freedom-logo.svg" alt="Freedom World" className="h-7 w-auto" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm">
          <a href="#features" className="text-fw-text-secondary hover:text-fw-text-primary transition-colors">
            ฟีเจอร์
          </a>
          <a href="#why" className="text-fw-text-secondary hover:text-fw-text-primary transition-colors">
            ทำไมต้องเรา
          </a>
          <a href="#success" className="text-fw-text-secondary hover:text-fw-text-primary transition-colors">
            ความสำเร็จ
          </a>
          <a href="#explore" className="text-fw-text-secondary hover:text-fw-text-primary transition-colors">
            สำรวจ
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="bg-fw-green hover:bg-fw-green-hover text-fw-bg font-semibold px-5 py-2 rounded-xl text-sm transition-all hover:shadow-[0_0_20px_rgba(16,244,139,0.3)]"
          >
            เริ่มต้นเลย
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
          <a href="#features" className="block text-fw-text-secondary hover:text-fw-text-primary text-sm py-2" onClick={() => setMenuOpen(false)}>ฟีเจอร์</a>
          <a href="#why" className="block text-fw-text-secondary hover:text-fw-text-primary text-sm py-2" onClick={() => setMenuOpen(false)}>ทำไมต้องเรา</a>
          <a href="#success" className="block text-fw-text-secondary hover:text-fw-text-primary text-sm py-2" onClick={() => setMenuOpen(false)}>ความสำเร็จ</a>
          <a href="#explore" className="block text-fw-text-secondary hover:text-fw-text-primary text-sm py-2" onClick={() => setMenuOpen(false)}>สำรวจ</a>
        </div>
      )}
    </nav>
  )
}
