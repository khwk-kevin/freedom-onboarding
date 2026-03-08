'use client'

import { useState } from 'react'

const FEATURED_STORIES = [
  {
    id: 'bchf',
    org: 'Bangkok Community Help Foundation',
    category: 'Impact',
    title: 'turning compassion into action',
    desc: 'Through the Freedom World Impact program, the Bangkok Community Help Foundation leverages the Merchant System and QuickScan to transform donations into a seamless, secure, and transparent experience.',
    desc2: 'By linking donations to structured Missions and recognizing milestones with on-chain digital badges, the platform converts one-time contributions into a verifiable, high-engagement journey of personal impact.',
    tags: ['Merchant System', 'Missions', 'BCHF Points', 'Impact'],
    statsL: null,
    statsR: null,
    accent: '#10F48B',
  },
  {
    id: 'tat',
    org: 'Discover Thailand',
    category: 'Tourism',
    title: 'Personalized adventures and rewarding discoveries.',
    desc: 'Freedom World and the Tourism of Thailand (TAT) have teamed up to embark travelers onto a unique journey where they can explore up to 80+ local businesses, enjoy special deals, and earn epic rewards.',
    desc2: null,
    tags: ['Interactive Map', 'Community Shop', 'Universal Rewards', 'Tourism'],
    statsL: { value: '80+', label: 'Participating Merchants' },
    statsR: { value: '3 ISLANDS', label: 'in Southern Thailand' },
    accent: '#36BBF6',
  },
]

const MORE_STORIES = [
  {
    org: 'Mystic Valley Festival',
    category: 'Entertainment',
    title: 'immersive and cutting-edge festival experience',
    statsL: { value: '12,000+', label: 'Transactions in 3 Days' },
    statsR: { value: '3,000', label: 'Total Attendees in 3 Days' },
    tags: ['NFT Tickets', 'Missions', 'MYST Points'],
    accent: '#F742A2',
  },
  {
    org: 'Raja Ferry',
    category: 'Transportation',
    title: 'rewarding & engaging journey experience',
    statsL: { value: '30%', label: 'Annual User Growth Rate' },
    statsR: { value: '52.4%', label: 'Increased Top-Up Rate in 6 Months' },
    tags: ['NFT E-Voucher', 'RAJA Points', 'Referral System'],
    accent: '#36BBF6',
  },
  {
    org: 'ONYX Bangkok',
    category: 'Nightlife',
    title: 'REDEFINING THE NIGHTLIFE EXPERIENCE',
    statsL: { value: '200+', label: 'Special Packages Sales in 3 Months' },
    statsR: { value: '130.5%', label: 'New User Growth After Launch' },
    tags: ['ONYX Points', 'QR Payments', 'Missions'],
    accent: '#10F48B',
  },
  {
    org: 'Topgolf Thailand',
    category: 'Activity',
    title: 'Rewarding Every Swing through A Seamless Loyalty Journey',
    statsL: null,
    statsR: null,
    tags: ['Merchant System', 'Missions', 'Top Up'],
    accent: '#F742A2',
  },
  {
    org: 'Tomyum Koong',
    category: 'Food & Beverage',
    title: 'THE DINING EXPERIENCE, LEVELED UP',
    statsL: { value: '5+', label: 'Partner Ecosystem' },
    statsR: { value: '468%', label: 'User Growth in 6 Months' },
    tags: ['Missions', 'Referral System', 'Community Shop'],
    accent: '#10F48B',
  },
  {
    org: 'Roon Khanom Khai',
    category: 'Food & Beverage',
    title: 'BOOSTING LOYALTY THROUGH DIGITAL REWARDS',
    statsL: { value: '214%', label: 'Increase in New Joiners' },
    statsR: { value: '15%', label: 'Boost in Transactions' },
    tags: ['Missions', 'NFT E-Voucher', 'Topup'],
    accent: '#36BBF6',
  },
]

function FeaturedCard({ story }: { story: typeof FEATURED_STORIES[0] }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.06] p-6 md:p-8 flex flex-col gap-6"
      style={{
        background: `linear-gradient(135deg, ${story.accent}12 0%, rgba(255,255,255,0.02) 100%)`,
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 100% 0%, ${story.accent}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Category badge */}
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style={{ background: `${story.accent}20`, color: story.accent, border: `1px solid ${story.accent}30` }}
          >
            {story.category}
          </span>
          <span className="text-[#67697C] text-xs">{story.org}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-3xl font-black uppercase text-white leading-tight max-w-lg">
          {story.title}
        </h3>

        {/* Desc */}
        <p className="text-[#A6A7B5] text-sm leading-relaxed max-w-xl">{story.desc}</p>
        {story.desc2 && (
          <p className="text-[#A6A7B5] text-sm leading-relaxed max-w-xl">{story.desc2}</p>
        )}

        {/* Stats */}
        {(story.statsL || story.statsR) && (
          <div className="grid grid-cols-2 gap-4">
            {story.statsL && (
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                <p className="font-black text-2xl text-white">{story.statsL.value}</p>
                <p className="text-[#A6A7B5] text-xs mt-1">{story.statsL.label}</p>
              </div>
            )}
            {story.statsR && (
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4">
                <p className="font-black text-2xl text-white">{story.statsR.value}</p>
                <p className="text-[#A6A7B5] text-xs mt-1">{story.statsR.label}</p>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-3 py-1 text-xs border border-white/[0.08] text-[#A6A7B5]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function StoryCard({ story }: { story: typeof MORE_STORIES[0] }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-white/[0.06] p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="absolute top-0 left-0 w-full h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${story.accent}60, transparent)` }}
      />

      <div className="flex items-center gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: `${story.accent}18`, color: story.accent, border: `1px solid ${story.accent}25` }}
        >
          {story.category}
        </span>
        <span className="text-[#67697C] text-xs">{story.org}</span>
      </div>

      <h4 className="text-white text-sm font-bold uppercase leading-snug line-clamp-2">
        {story.title}
      </h4>

      {(story.statsL || story.statsR) && (
        <div className="grid grid-cols-2 gap-3">
          {story.statsL && (
            <div>
              <p className="font-black text-lg text-white">{story.statsL.value}</p>
              <p className="text-[#67697C] text-[10px] leading-tight">{story.statsL.label}</p>
            </div>
          )}
          {story.statsR && (
            <div>
              <p className="font-black text-lg text-white">{story.statsR.value}</p>
              <p className="text-[#67697C] text-[10px] leading-tight">{story.statsR.label}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {story.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full px-2 py-0.5 text-[10px] border border-white/[0.06] text-[#67697C]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SuccessSection() {
  const [page, setPage] = useState(0)
  const perPage = 3
  const totalPages = Math.ceil(MORE_STORIES.length / perPage)
  const visible = MORE_STORIES.slice(page * perPage, (page + 1) * perPage)

  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(18,72,200,0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
            Case Studies
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
            success stories
          </h2>
        </div>

        {/* Featured 2 stories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED_STORIES.map((s) => <FeaturedCard key={s.id} story={s} />)}
        </div>

        {/* More stories carousel */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white uppercase">More Success Stories</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-full border border-white/[0.1] flex items-center justify-center text-[#A6A7B5] hover:border-white/[0.3] hover:text-white disabled:opacity-30 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-full border border-white/[0.1] flex items-center justify-center text-[#A6A7B5] hover:border-white/[0.3] hover:text-white disabled:opacity-30 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {visible.map((s, i) => <StoryCard key={i} story={s} />)}
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === page ? '#10F48B' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
