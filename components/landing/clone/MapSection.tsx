'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'
import { useTranslation } from '@/context/TranslationContext'

const mapItemDefs = [
  {
    id: 'map_reach_explorers',
    titleKey: 'map_reach_explorers_title',
    subtitleKey: 'map_reach_explorers_desc',
    image: '/images/cdn/map/visual_map01.webp',
  },
  {
    id: 'bring_customers',
    titleKey: 'map_bring_customers_title',
    subtitleKey: 'map_bring_customers_desc',
    image: '/images/cdn/map/visual_map02.webp',
  },
  {
    id: 'map_win_visibility',
    titleKey: 'map_win_visibility_title',
    subtitleKey: 'map_win_visibility_desc',
    image: '/images/cdn/map/visual_map03.webp',
  },
]

export default function MapSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const { t } = useTranslation()

  const mapItems = mapItemDefs.map((def) => ({
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
            {t('map_put_your_business_title')}
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]">
            {t('map_put_your_business_title2')}
          </p>
        </div>
      </div>

      {/* Mobile image preview */}
      <div className="md:hidden relative w-[358px] h-[395px] mx-auto overflow-hidden rounded-2xl">
        {mapItems.map((item, i) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-300 ${i === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes="358px"
              className="object-contain"
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* Slider */}
      <AutoplaySlider
        items={mapItems}
        duration={5000}
        imageLeft
        onActiveChange={setActiveIndex}
        renderRight={(_, idx) => (
          <div className="relative w-full max-w-[479px] overflow-hidden rounded-2xl" style={{ aspectRatio: '48/53' }}>
            {mapItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
        renderMobileCard={(item) => (
          <div className="flex flex-col w-[calc(100vw-80px)] max-w-[358px] min-w-[280px] px-6">
            <div
              className="md:w-auto md:flex-1 w-full md:min-w-0 z-30 min-h-[188px] rounded-[24px] relative"
              style={{
                background: 'linear-gradient(281deg, #F742A240 25%, #F742A254 33%, #36BBF699 60%)',
                padding: "1.5px",
              }}
            >
              <div className="rounded-[23px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-start items-start min-h-[188px] relative w-full p-4 gap-[6px] sm:gap-[10px] md:gap-[16px] break-words">
                <div className="flex flex-col items-start gap-2 w-full">
                  <h3 className="text-[16px] font-bold text-[#F4F4FC] line-clamp-2">{item.title}</h3>
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
