'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoplaySlider } from './AutoplaySlider'
import { useTranslation } from '@/context/TranslationContext'

const loyaltyItemDefs = [
  {
    id: 'converted_referrals',
    titleKey: 'features_converted_referrals_title',
    subtitleKey: 'features_converted_referrals_desc',
    image: '/images/cdn/features/visual_loyalty01.webp',
  },
  {
    id: 'missions',
    titleKey: 'features_missions_title',
    subtitleKey: 'features_missions_desc',
    image: '/images/cdn/features/visual_loyalty02.webp',
  },
  {
    id: 'loyalty_tokens',
    titleKey: 'features_loyalty_tokens_title',
    subtitleKey: 'features_loyalty_tokens_desc',
    image: '/images/cdn/features/visual_loyalty03.webp',
  },
  {
    id: 'top_contribution',
    titleKey: 'features_top_contribution_title',
    subtitleKey: 'features_top_contribution_desc',
    image: '/images/cdn/features/visual_loyalty04.webp',
  },
]

const shopItemDefs = [
  {
    id: 'shop',
    titleKey: 'features_shop_title',
    subtitleKey: 'features_shop_desc',
    image: '/images/cdn/features/visual_shop01.webp',
  },
  {
    id: 'secure_checkout',
    titleKey: 'features_secure_checkout_title',
    subtitleKey: 'features_secure_checkout_desc',
    image: '/images/cdn/features/visual_shop04.webp',
  },
  {
    id: 'payments',
    titleKey: 'features_payments_title',
    subtitleKey: 'features_payments_desc',
    image: '/images/cdn/features/visual_shop02.webp',
  },
  {
    id: 'pos',
    titleKey: 'features_pos_title',
    subtitleKey: 'features_pos_desc',
    image: '/images/cdn/features/visual_shop03.webp',
  },
]

const communityItemDefs = [
  {
    id: 'customer_support',
    titleKey: 'features_customer_support_title',
    subtitleKey: 'features_customer_support_desc',
    image: '/images/cdn/features/visual_community01.webp',
  },
  {
    id: 'feed',
    titleKey: 'features_feed_title',
    subtitleKey: 'features_feed_desc',
    image: '/images/cdn/features/visual_community02.webp',
  },
  {
    id: 'community',
    titleKey: 'features_community_title',
    subtitleKey: 'features_community_desc',
    image: '/images/cdn/features/visual_community03.webp',
  },
  {
    id: 'polls',
    titleKey: 'features_polls_title',
    subtitleKey: 'features_polls_desc',
    image: '/images/cdn/features/visual_community04.webp',
  },
]

function MobileImagePreview({ items, activeIndex }: { items: { id: string; image: string; title: string }[]; activeIndex: number }) {
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

function MobileCard({ item }: { item: { id: string; title: string; subtitle: string } }) {
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
  const { t } = useTranslation()

  const loyaltyItems = loyaltyItemDefs.map((d) => ({ id: d.id, title: t(d.titleKey), subtitle: t(d.subtitleKey), image: d.image }))
  const shopItems    = shopItemDefs.map((d)    => ({ id: d.id, title: t(d.titleKey), subtitle: t(d.subtitleKey), image: d.image }))
  const communityItems = communityItemDefs.map((d) => ({ id: d.id, title: t(d.titleKey), subtitle: t(d.subtitleKey), image: d.image }))

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
          <h2 className="text-center text-[30px] md:text-[40px] font-black leading-[100%] uppercase text-[#F4F4FC]">
            {t('features_explore_features_title')}
          </h2>
          <p className="text-center text-[30px] md:text-[60px] font-black leading-[100%] uppercase text-[#10F48B]">
            {t('features_explore_features_title2')}
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
        title={t('features_build_loyalty_title')}
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
        title={t('features_sell_anything_title')}
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
        title={t('features_connect_better_title')}
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
