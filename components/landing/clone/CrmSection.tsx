'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'
import { useTranslation } from '@/context/TranslationContext'

const crmItemDefs = [
  {
    id: 'profiles',
    titleKey: 'crm_customer_profile_title',
    subtitleKey: 'crm_customer_profile_desc',
    image: '/images/cdn/crm/visual_crm01.webp',
  },
  {
    id: 'funnel',
    titleKey: 'crm_funnel_title',
    subtitleKey: 'crm_funnel_desc',
    image: '/images/cdn/crm/visual_crm02.webp',
  },
  {
    id: 'segments',
    titleKey: 'crm_segment_tracking_title',
    subtitleKey: 'crm_segment_tracking_desc',
    image: '/images/cdn/crm/visual_crm04.webp',
  },
  {
    id: 'ai',
    titleKey: 'crm_ai_insights_title',
    subtitleKey: 'crm_ai_insights_desc',
    image: '/images/cdn/crm/visual_crm03.webp',
  },
  {
    id: 'assistant',
    titleKey: 'crm_assistant_title',
    subtitleKey: 'crm_assistant_desc',
    image: '/images/cdn/crm/visual_crm05.webp',
  },
]

export default function CrmSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const { t } = useTranslation()

  const crmItems = crmItemDefs.map((def) => ({
    id: def.id,
    title: t(def.titleKey),
    subtitle: t(def.subtitleKey),
    image: def.image,
  }))

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start gap-12 px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Header */}
      <div className="flex w-full flex-col items-center gap-2 self-stretch">
        <div>
          <h2 className="text-center text-[30px] md:text-[40px] font-black leading-[100%] uppercase text-[#F4F4FC]">
            {t('crm_grow_faster_title')}
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]">
            {t('crm_grow_faster_title2')}
          </p>
        </div>
        <p className="text-center text-[14px] font-normal leading-[160%] text-[#A6A7B5]">
          {t('crm_grow_faster_desc')}
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
