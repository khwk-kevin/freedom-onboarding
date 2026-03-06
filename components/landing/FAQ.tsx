'use client'

import { useState } from 'react'
import { track } from '@/lib/tracking/unified'

interface FAQItem {
  q: string
  a: string
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: 'How long does it take to set up my community?',
    a: 'About 15 minutes. Our AI assistant guides you through the entire process — from branding to your first product listing.',
  },
  {
    q: 'Is it free to get started?',
    a: 'Yes! Creating your community is free. You only pay transaction fees when your customers make purchases.',
  },
  {
    q: 'Do I need technical skills?',
    a: 'Not at all. The AI assistant handles everything — from generating your logo to setting up your loyalty token. Just answer a few questions about your business.',
  },
  {
    q: 'What types of businesses use Freedom World?',
    a: 'Restaurants, cafes, creators, fitness studios, NGOs, educators, and more. Any business that wants to build a loyal customer community.',
  },
  {
    q: 'How do token rewards work?',
    a: 'Your customers earn your custom tokens for purchases and engagement. They can redeem tokens for rewards you set. Token users spend on average 9x more than cash-only customers.',
  },
  {
    q: 'Can I customize my community\'s branding?',
    a: 'Absolutely. Your community gets your logo, colors, banner, and custom token name. It\'s your brand, your community.',
  },
]

interface FAQProps {
  faqs?: FAQItem[]
  title?: string
}

export default function FAQ({
  faqs = DEFAULT_FAQS,
  title = 'Frequently asked questions',
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          {title}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                onClick={() => { setOpenIndex(openIndex === i ? null : i); if (openIndex !== i) track.faqExpand(faq.q); }}
                aria-expanded={openIndex === i}
              >
                <span className="font-semibold text-gray-900 text-base">
                  {faq.q}
                </span>
                <span
                  className={`text-brand-green-dark text-xl font-bold flex-shrink-0 transition-transform duration-200 ${
                    openIndex === i ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>

              {openIndex === i && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed text-sm border-t border-gray-100 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
