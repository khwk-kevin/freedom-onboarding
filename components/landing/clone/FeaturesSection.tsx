'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'

const loyaltyItems = [
  {
    id: 'converted_referrals',
    title: 'Converted Referrals',
    subtitle: 'Expand your customer base through performance-based referrals that reward verified purchases and mission completions.',
    image: '/images/cdn/features/visual_loyalty01.webp',
  },
  {
    id: 'missions',
    title: 'Missions',
    subtitle: 'Create consistent engagement loops through daily missions that inspire participation and reinforce loyalty behaviors.',
    image: '/images/cdn/features/visual_loyalty02.webp',
  },
  {
    id: 'loyalty_tokens',
    title: 'Loyalty Tokens',
    subtitle: 'Give your customers something worth earning. Launch your own tokens or points that can be redeemed or collected across your ecosystem.',
    image: '/images/cdn/features/visual_loyalty03.webp',
  },
  {
    id: 'top_contribution',
    title: 'Top Contribution',
    subtitle: 'Recognize and reward your most active members with leaderboard features that celebrate loyalty and drive competition.',
    image: '/images/cdn/features/visual_loyalty04.webp',
  },
]

const shopItems = [
  {
    id: 'shop',
    title: 'Shop',
    subtitle: 'List and sell products or services directly from your community, with full inventory management built in.',
    image: '/images/cdn/features/visual_shop01.webp',
  },
  {
    id: 'secure_checkout',
    title: 'Secure Checkout',
    subtitle: 'Give buyers a frictionless, trusted checkout experience with built-in security and multiple payment options.',
    image: '/images/cdn/features/visual_shop04.webp',
  },
  {
    id: 'payments',
    title: 'Payments',
    subtitle: 'Accept digital payments seamlessly, from QR scans to wallet top-ups, fully integrated with your community.',
    image: '/images/cdn/features/visual_shop02.webp',
  },
  {
    id: 'pos',
    title: 'POS',
    subtitle: 'Manage in-person transactions with a lightweight point-of-sale system connected to your digital community.',
    image: '/images/cdn/features/visual_shop03.webp',
  },
]

const communityItems = [
  {
    id: 'customer_support',
    title: 'Customer Support Chat',
    subtitle: 'Resolve issues faster through integrated chat that connects customers to human or AI support in real time.',
    image: '/images/cdn/features/visual_community01.webp',
  },
  {
    id: 'feed',
    title: 'Feed',
    subtitle: "Broadcast important news, offers, and alerts straight into your users' activity feed for real-time visibility.",
    image: '/images/cdn/features/visual_community02.webp',
  },
  {
    id: 'community',
    title: 'Community Chat',
    subtitle: 'Keep conversations flowing with live chat channels designed for collaboration and community building.',
    image: '/images/cdn/features/visual_community03.webp',
  },
  {
    id: 'polls',
    title: 'Polls',
    subtitle: 'Gather instant feedback and drive engagement with interactive polls your community can respond to in real time.',
    image: '/images/cdn/features/visual_community04.webp',
  },
]

function MobileImagePreview({ items, activeIndex }: { items: typeof loyaltyItems; activeIndex: number }) {
  return (
    <div className="md:hidden relative w-[358px] h-[350px] mx-auto overflow-hidden rounded-2xl">
      {items.map((item, i) => (
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
            priority={i === 0}
            unoptimized
          />
        </div>
      ))}
    </div>
  )
}

function MobileCard({ item }: { item: (typeof loyaltyItems)[0] }) {
  return (
    <div className="flex flex-col w-[calc(100vw-80px)] max-w-[358px] min-w-[280px] px-6">
      <div
        className="md:w-auto md:flex-1 w-full md:min-w-0 z-30 min-h-[165px] rounded-[24px] relative"
        style={{
          background: 'linear-gradient(281deg, #F742A240 25%, #F742A254 33%, #36BBF699 60%)',
          padding: "1.5px",
        }}
      >
        <div className="rounded-[23px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-start items-start min-h-[165px] relative w-full break-words p-4 gap-[6px] sm:gap-[10px] md:gap-[16px]">
          <div className="flex flex-col items-start gap-2 w-full">
            <h3 className="text-[16px] font-bold text-[#F4F4FC] line-clamp-2">{item.title}</h3>
            <p className="text-[12px] font-normal leading-[160%] text-[#A6A7B5]">{item.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeaturesSection() {
  const [loyaltyActive, setLoyaltyActive] = useState(0)
  const [shopActive, setShopActive] = useState(0)
  const [communityActive, setCommunityActive] = useState(0)

  return (
    <div className="relative mx-auto flex w-full max-w-[1080px] flex-col items-start gap-12 md:gap-12 px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] md:w-[800px] md:h-[800px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />

      {/* Section Header */}
      <div className="flex w-full flex-col items-center gap-2 self-stretch">
        <div>
          <h2 className="text-center text-[30px] md:text-[40px] font-black leading-[100%] uppercase text-[#F4F4FC]"
            >
            explore features built to
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]"
            >
            lift your business higher
          </p>
        </div>
      </div>

      {/* Loyalty subsection */}
      <MobileImagePreview items={loyaltyItems} activeIndex={loyaltyActive} />
      <AutoplaySlider
        items={loyaltyItems}
        duration={5000}
        imageLeft
        isLoyalty
        title="build a loyalty engine that lasts."
        onActiveChange={setLoyaltyActive}
        renderRight={(_, idx) => (
          <div className="relative overflow-hidden rounded-2xl w-[400px]" style={{ aspectRatio: '48/53' }}>
            {loyaltyItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  priority={i === 0}
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
        renderMobileCard={(item) => <MobileCard item={item} />}
      />

      {/* Shop subsection */}
      <MobileImagePreview items={shopItems} activeIndex={shopActive} />
      <AutoplaySlider
        items={shopItems}
        duration={5000}
        title="sell anything. fulfill everywhere."
        onActiveChange={setShopActive}
        renderRight={(_, idx) => (
          <div className="relative w-full max-w-[479px] overflow-hidden rounded-2xl" style={{ aspectRatio: '48/53' }}>
            {shopItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  priority={i === 0}
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
        renderMobileCard={(item) => <MobileCard item={item} />}
      />

      {/* Community subsection */}
      <MobileImagePreview items={communityItems} activeIndex={communityActive} />
      <AutoplaySlider
        items={communityItems}
        duration={5000}
        imageLeft
        title="connect better. support smarter."
        onActiveChange={setCommunityActive}
        renderRight={(_, idx) => (
          <div className="relative w-full max-w-[479px] overflow-hidden rounded-2xl" style={{ aspectRatio: '48/53' }}>
            {communityItems.map((item, i) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-300 ${i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  priority={i === 0}
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
        renderMobileCard={(item) => <MobileCard item={item} />}
      />
    </div>
  )
}
