'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'

const mapItems = [
  {
    id: 'map_reach_explorers',
    title: 'Reach Explorers Across the Globe',
    subtitle: 'Tourists and explorers collect digital stamps as they travel. Featuring your business turns every visit into a collectible memory — promoting your brand to a global audience.',
    image: '/images/cdn/map/visual_map01.webp',
  },
  {
    id: 'bring_customers',
    title: 'Bring Customers to Your Door',
    subtitle: 'Draw more foot traffic with Missions that bring motivated customers to your door to complete challenges, redeem NFTs, and claim rewards or exclusive offers.',
    image: '/images/cdn/map/visual_map02.webp',
  },
  {
    id: 'map_win_visibility',
    title: 'Win Visibility Inside The Scape',
    subtitle: 'Give your customers something worth earning. Launch your own tokens or points that can be redeemed or collected across your ecosystem.',
    image: '/images/cdn/map/visual_map03.webp',
  },
]

export default function MapSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start gap-12 px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Header */}
      <div className="flex w-full flex-col items-center gap-2 self-stretch">
        <div>
          <h2 className="text-center text-[30px] md:text-[40px] font-black leading-[100%] uppercase text-[#F4F4FC]"
            >
            put your business
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]"
            >
            on the map
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
