'use client'

import { useState } from 'react'
import Link from 'next/link'

const TABS = [
  {
    id: 'assistant',
    label: 'Assistant',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M5.5 9h7M5.5 12h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="13" cy="5" r="2.5" fill="#10F48B" />
      </svg>
    ),
    title: 'Assistant',
    desc: 'Save hours with AI that interprets plain-language requests to build, schedule, and enhance campaigns on your behalf.',
    color: '#10F48B',
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2l1.8 5.4H17l-4.9 3.6 1.8 5.4L9 13l-4.9 3.4 1.8-5.4L2 7.4h6.2L9 2z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
    ),
    title: 'AI Insights',
    desc: 'AI scans your data 24/7 to deliver automatic recommendations on what action will improve growth or retention.',
    color: '#36BBF6',
  },
  {
    id: 'profiles',
    label: 'Customer Profiles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
        <path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </svg>
    ),
    title: 'customer profiles & dashboards',
    desc: 'Understand your customers better with a full overview of their behavior, spending, and engagement patterns.',
    color: '#F742A2',
  },
  {
    id: 'funnel',
    label: 'Funnel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M2 4h14l-5 6v5l-4-2V10L2 4z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Funnel',
    desc: 'Monitor the full customer journey and trigger targeted actions when users are inactive or ready to convert.',
    color: '#10F48B',
  },
]

// Simple UI mockups for each tab
const TabMockup = ({ tab }: { tab: typeof TABS[0] }) => {
  return (
    <div className="w-full h-full rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${tab.color}20`, color: tab.color }}
        >
          {tab.icon}
        </div>
        <span className="text-white font-semibold text-sm capitalize">{tab.label}</span>
      </div>

      {/* Mock chart/data */}
      {tab.id === 'assistant' && (
        <div className="flex flex-col gap-2 flex-1">
          {['Build a re-engagement campaign', 'Schedule push for inactive users', 'Analyze top converting segment'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.04] px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10F48B]" />
              <span className="text-[#A6A7B5] text-xs">{item}</span>
            </div>
          ))}
          <div className="mt-auto flex items-center gap-2 rounded-lg bg-[#10F48B]/10 border border-[#10F48B]/20 px-3 py-2">
            <span className="text-[#10F48B] text-xs">✨ AI Response ready</span>
          </div>
        </div>
      )}

      {tab.id === 'ai-insights' && (
        <div className="flex flex-col gap-3 flex-1">
          {[
            { label: 'Retention Rate', value: 78, color: '#10F48B' },
            { label: 'Engagement Score', value: 62, color: '#36BBF6' },
            { label: 'Churn Risk', value: 15, color: '#F742A2' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#A6A7B5]">{item.label}</span>
                <span style={{ color: item.color }}>{item.value}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.value}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab.id === 'profiles' && (
        <div className="flex flex-col gap-2 flex-1">
          {[
            { name: 'Alex K.', tags: ['VIP', 'Active'], score: 98 },
            { name: 'Sarah M.', tags: ['Regular'], score: 74 },
            { name: 'Tom W.', tags: ['At Risk'], score: 31 },
          ].map((u, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/[0.04] px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1248C8] to-[#10F48B] flex items-center justify-center text-xs font-bold text-white">
                {u.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium">{u.name}</p>
                <div className="flex gap-1 mt-0.5">
                  {u.tags.map((t) => (
                    <span key={t} className="text-[10px] text-[#A6A7B5] bg-white/[0.06] rounded px-1">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-[#10F48B] text-xs font-bold">{u.score}</span>
            </div>
          ))}
        </div>
      )}

      {tab.id === 'funnel' && (
        <div className="flex flex-col gap-2 flex-1 items-center justify-center">
          {[
            { label: 'Awareness', count: 10000, color: '#1248C8', w: '100%' },
            { label: 'Engaged', count: 4200, color: '#36BBF6', w: '70%' },
            { label: 'Active', count: 1800, color: '#10F48B', w: '45%' },
            { label: 'Loyal', count: 640, color: '#F742A2', w: '25%' },
          ].map((stage, i) => (
            <div key={i} className="flex flex-col items-center gap-1 w-full">
              <div
                className="flex items-center justify-between rounded-lg px-3 py-1.5"
                style={{ width: stage.w, background: `${stage.color}20`, border: `1px solid ${stage.color}30` }}
              >
                <span className="text-[11px] text-white/80">{stage.label}</span>
                <span className="text-[11px] font-bold" style={{ color: stage.color }}>
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CrmSection() {
  const [activeTab, setActiveTab] = useState('assistant')
  const tab = TABS.find((t) => t.id === activeTab) || TABS[0]

  return (
    <section className="relative w-full px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '-10%',
          width: '50%',
          height: '60%',
          background: 'radial-gradient(ellipse at 20% 50%, rgba(18,72,200,0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 flex flex-col gap-10 md:gap-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex flex-col gap-3">
            <span className="uppercase text-xs font-semibold tracking-[0.2em] text-[#10F48B]">
              CRM & AI
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl md:text-5xl font-black uppercase text-white leading-tight">
                grow faster with
              </h2>
              <h2 className="text-3xl md:text-5xl font-black uppercase text-[#10F48B] leading-tight">
                crm &amp; ai
              </h2>
            </div>
            <p className="text-[#A6A7B5] text-base max-w-md">
              Manage all your customer interactions, data, and tools in one simple platform.
            </p>
          </div>

          <Link
            href="/onboarding"
            className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 bg-[#1248C8] hover:scale-105 active:scale-95 transition-transform w-fit self-start md:self-auto"
          >
            <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
              see how growth works
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#050314" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Tabs + content */}
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
          {/* Tab list */}
          <div className="flex flex-col gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex items-start gap-4 rounded-2xl p-4 text-left transition-all"
                style={{
                  background: activeTab === t.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: activeTab === t.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                    color: activeTab === t.id ? t.color : '#67697C',
                  }}
                >
                  {t.icon}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold capitalize"
                    style={{ color: activeTab === t.id ? 'white' : '#67697C' }}
                  >
                    {t.label}
                  </p>
                  {activeTab === t.id && (
                    <p className="text-[#A6A7B5] text-xs mt-1 leading-relaxed">{t.desc}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Mockup panel */}
          <div className="h-80 md:h-auto">
            <TabMockup tab={tab} />
          </div>
        </div>
      </div>
    </section>
  )
}
