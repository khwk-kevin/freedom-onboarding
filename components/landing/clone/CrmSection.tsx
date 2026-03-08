'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'

const crmItems = [
  {
    id: 'profiles',
    title: 'customer profiles & dashboards',
    subtitle: 'Understand your customers better with a full overview of their behavior, spending, and engagement patterns.',
    image: '/images/cdn/crm/visual_crm01.webp',
  },
  {
    id: 'funnel',
    title: 'Funnel',
    subtitle: 'Monitor the full customer journey and trigger targeted actions when users are inactive or ready to convert.',
    image: '/images/cdn/crm/visual_crm02.webp',
  },
  {
    id: 'segments',
    title: 'Segment Tracking',
    subtitle: 'Spot your most valuable, ready-to-buy, and inactive customers, and run targeted campaigns that drive results.',
    image: '/images/cdn/crm/visual_crm04.webp',
  },
  {
    id: 'ai',
    title: 'AI Insights',
    subtitle: 'AI scans your data 24/7 to deliver automatic recommendations on what action will improve growth or retention.',
    image: '/images/cdn/crm/visual_crm03.webp',
  },
  {
    id: 'assistant',
    title: 'Assistant',
    subtitle: 'Save hours with AI that interprets plain-language requests to build, schedule, and enhance campaigns on your behalf.',
    image: '/images/cdn/crm/visual_crm05.webp',
  },
]

export default function CrmSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start gap-12 px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Header */}
      <div className="flex w-full flex-col items-center gap-2 self-stretch">
        <div>
          <h2 className="text-center text-[30px] md:text-[40px] font-black leading-[100%] uppercase text-[#F4F4FC]"
            style={{ fontFamily: 'Kanit, sans-serif' }}>
            grow faster with
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]"
            style={{ fontFamily: 'Kanit, sans-serif' }}>
            crm &amp; ai
          </p>
        </div>
        <p className="text-center text-[14px] font-normal leading-[160%] text-[#A6A7B5]">
          Manage your entire community with our Freedom Console
        </p>
      </div>

      {/* Mobile image preview */}
      <div className="md:hidden relative w-full h-[298px] overflow-hidden rounded-2xl px-6" style={{ aspectRatio: '179/149' }}>
        {crmItems.map((item, i) => (
          <Image
            key={item.id}
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 358px"
            quality={100}
            unoptimized
            className={`object-contain absolute inset-0 transition-opacity duration-300 ${i === activeIndex ? 'opacity-100' : 'opacity-0'}`}
            priority={i === 0}
          />
        ))}
      </div>

      {/* Slider */}
      <AutoplaySlider
        items={crmItems}
        duration={5000}
        onActiveChange={setActiveIndex}
        renderRight={(_, idx) => (
          <div className="relative h-[369px] w-full self-stretch overflow-hidden rounded-2xl">
            {crmItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 0px, 600px"
                  quality={100}
                  unoptimized
                  className="object-contain"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        )}
        renderMobileCard={(item) => (
          <div className="flex flex-col w-[calc(100vw-80px)] max-w-[358px] min-w-[280px] px-6">
            <div
              className="md:w-auto md:flex-1 w-full md:min-w-0 z-30 min-h-[146px] rounded-[24px] relative"
              style={{
                background: 'linear-gradient(281deg, #F742A240 25%, #F742A254 33%, #36BBF699 60%)',
                padding: "1.5px",
              }}
            >
              <div className="rounded-[23px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-start items-start min-h-[146px] relative w-full p-4 gap-[6px] sm:gap-[10px] md:gap-[16px] break-words">
                <div className="flex flex-col items-start gap-2 w-full">
                  <h3 className="text-[16px] font-bold text-[#F4F4FC] line-clamp-2 capitalize">{item.title}</h3>
                  <p className="text-[12px] font-normal leading-[160%] text-[#A6A7B5]">{item.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
