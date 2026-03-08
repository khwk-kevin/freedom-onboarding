'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useTranslation } from '@/context/TranslationContext'

interface FeatureIcon {
  titleKey: string
  icon: string
}

interface Slide {
  id: string
  titleKey: string
  textTitleKey: string
  textKey: string
  text2Key?: string
  imageUrl: string
  imageUrlMO: string
  categoryKey: string
  icons: FeatureIcon[]
  iconUrl: string
  link: string
}

const slides: Slide[] = [
  {
    id: 'slide1',
    titleKey: 'success_tat_discoverthailand',
    textTitleKey: 'success_tat_title',
    textKey: 'success_tat_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/discover_thailand.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/discover_thailand.avif')",
    categoryKey: 'success_tat_tourism',
    icons: [
      { titleKey: 'success_tat_universal_rewards', icon: '/svgs/reward.svg' },
      { titleKey: 'success_tat_interactive_map', icon: '/svgs/location.svg' },
    ],
    iconUrl: '/images/home/community/icons/discover_thailand.png',
    link: 'https://freedom.world/discover-thailand',
  },
  {
    id: 'slide2',
    titleKey: 'success_myst_mysticvalley',
    textTitleKey: 'success_myst_title',
    textKey: 'success_myst_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/valley.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/valley.avif')",
    categoryKey: 'success_myst_entertainment',
    icons: [
      { titleKey: 'success_myst_points', icon: '/svgs/reward.svg' },
      { titleKey: 'success_myst_nft_tickets', icon: '/svgs/nft.svg' },
      { titleKey: 'success_myst_missions', icon: '/svgs/missons.svg' },
    ],
    iconUrl: '/images/home/community/icons/mystic_valley.png',
    link: 'https://freedom.world/mystic-valley-festival',
  },
  {
    id: 'slide3',
    titleKey: 'success_raja_ferry',
    textTitleKey: 'success_raja_title',
    textKey: 'success_raja_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/raja.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/raja.avif')",
    categoryKey: 'success_raja_transportation',
    icons: [
      { titleKey: 'success_raja_referral_system', icon: '/svgs/referral.svg' },
      { titleKey: 'success_raja_points', icon: '/svgs/location.svg' },
      { titleKey: 'success_raja_nft_evoucher', icon: '/svgs/nft.svg' },
    ],
    iconUrl: '/images/home/community/icons/raja_ferry.png',
    link: 'https://freedom.world/raja-ferry',
  },
  {
    id: 'slide30',
    titleKey: 'success_top_golf',
    textTitleKey: 'success_topgolf_title',
    textKey: 'success_topgolf_desc',
    text2Key: 'success_topgolf_desc2',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/image_topgolf.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/image_topgolf.avif')",
    categoryKey: 'success_topgolf_activity',
    icons: [
      { titleKey: 'success_topgolf_missions', icon: '/svgs/Flag.svg' },
      { titleKey: 'success_topgolf_merchant_system', icon: '/svgs/shop.svg' },
      { titleKey: 'success_topgolf_topup', icon: '/svgs/hand-holding-circle-dollar.svg' },
    ],
    iconUrl: '/images/home/community/icons/logo_topgolf.avif',
    link: 'https://freedom.world/topgolf-thailand',
  },
  {
    id: 'slide4',
    titleKey: 'success_roon_khanom',
    textTitleKey: 'success_roon_title',
    textKey: 'success_roon_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/RoonKhanomKhai.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/RoonKhanomKhai-mobile.avif')",
    categoryKey: 'success_roon_fnb',
    icons: [
      { titleKey: 'success_roon_topup', icon: '/svgs/nft-certificates.svg' },
      { titleKey: 'success_roon_missions', icon: '/svgs/missons.svg' },
      { titleKey: 'success_roon_nft_evoucher', icon: '/svgs/nft.svg' },
    ],
    iconUrl: '/images/home/community/icons/RoonKhanomKhai.avif',
    link: 'https://freedom.world/roon-khanom-khai',
  },
  {
    id: 'slide5',
    titleKey: 'success_onyx_bangkok',
    textTitleKey: 'success_onyx_title',
    textKey: 'success_onyx_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/Onyx.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/Onyx-mobile.avif')",
    categoryKey: 'success_onyx_nightlife',
    icons: [
      { titleKey: 'success_onyx_qr_payments', icon: '/svgs/points.svg' },
      { titleKey: 'success_onyx_points', icon: '/svgs/qr-payment.svg' },
      { titleKey: 'success_onyx_missions', icon: '/svgs/missons.svg' },
    ],
    iconUrl: '/images/home/community/icons/Onyx.avif',
    link: 'https://freedom.world/onyx',
  },
  {
    id: 'slide10',
    titleKey: 'success_bchf',
    textTitleKey: 'success_bchf_title',
    textKey: 'success_bchf_desc',
    text2Key: 'success_bchf_desc2',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/image_bchf.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/image_bchf.avif')",
    categoryKey: 'success_bchf_non_profit',
    icons: [
      { titleKey: 'success_bchf_points', icon: '/svgs/points.svg' },
      { titleKey: 'success_bchf_missions', icon: '/svgs/missons.svg' },
      { titleKey: 'success_bchf_merchant_system', icon: '/svgs/shop.svg' },
    ],
    iconUrl: '/images/home/community/icons/logo_bchf.avif',
    link: 'https://freedom.world/Bangkok-Community-Help-Foundation',
  },
  {
    id: 'slide11',
    titleKey: 'success_fdrun_freedom_run',
    textTitleKey: 'success_fdrun_title',
    textKey: 'success_fdrun_desc',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/freedom_run.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/freedom_run.avif')",
    categoryKey: 'success_fdrun_shared_interest',
    icons: [
      { titleKey: 'success_fdrun_points', icon: '/svgs/points.svg' },
      { titleKey: 'success_fdrun_referral_system', icon: '/svgs/referral.svg' },
    ],
    iconUrl: '/images/home/community/icons/fd_run.png',
    link: 'https://freedom.world/freedom-run',
  },
]

function SlideContent({ slide, t }: { slide: Slide; t: (key: string) => string }) {
  const titleText = t(slide.titleKey)
  const isSEENSPACE = titleText === 'SEENSPACE'

  return (
    <div className="h-full">
      {/* Mobile */}
      <div
        className="relative w-full ml-auto flex flex-col gap-6 overflow-auto lg:hidden px-4 h-full min-h-[820px]"
        style={{
          backgroundImage: slide.imageUrlMO,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col justify-between gap-6 max-w-[574px] z-40 p-4 sm:p-6 pb-10 h-full">
          {/* Logo/title */}
          <div className="flex gap-4 font-black text-2xl items-center pr-8 w-fit h-full">
            {isSEENSPACE ? (
              <Image alt="" src={slide.iconUrl} width={270} height={42} className="object-cover py-3 rounded-3xl flex-1" />
            ) : (
              <>
                <Image alt="" src={slide.iconUrl} width={44} height={44} className="object-cover py-3 rounded-3xl flex-1" unoptimized />
                <h4 className="w-fit text-white uppercase font-black">
                  {titleText.toUpperCase()}
                </h4>
              </>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-4 self-stretch">
            <h4 className="w-fit text-white font-black uppercase">
              {t(slide.textTitleKey).toUpperCase()}
            </h4>
            <p className="w-fit text-white text-sm">{t(slide.textKey)}</p>
            {slide.text2Key && <p className="w-fit text-white text-sm">{t(slide.text2Key)}</p>}
          </div>

          {/* Feature icons */}
          <div className="flex gap-3 border-t border-b justify-between border-white/20 py-3 lg:flex-row flex-col">
            {slide.icons.map((icon, i) => (
              <div key={icon.titleKey + i} className="flex gap-2 items-center px-2.5">
                <Image alt="" src={icon.icon} height={24} width={24} />
                <span className="w-fit text-white capitalize text-sm">{t(icon.titleKey)}</span>
              </div>
            ))}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-white text-sm">{t('success_category_title')}</h3>
            <p className="w-fit text-white text-sm">{t(slide.categoryKey)}</p>
          </div>

          {slide.link !== '' && (
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm w-fit"
            >
              {t('success_join_cta')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Desktop */}
      <div
        className="relative w-full ml-auto hidden gap-6 max-h-[717px] py-10 lg:h-[717px] h-auto lg:flex"
        style={{
          backgroundImage: slide.imageUrl,
          backgroundSize: 'cover',
          backgroundPosition: 'right',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col gap-6 justify-between max-w-[574px]">
          {/* Logo/title */}
          <div className="flex gap-4 font-black text-2xl items-center pr-8 w-fit">
            {isSEENSPACE ? (
              <Image alt="" src={slide.iconUrl} width={270} height={42} className="object-cover py-3 rounded-3xl flex-1" />
            ) : (
              <>
                <Image alt="" src={slide.iconUrl} width={44} height={44} className="object-cover py-3 rounded-3xl flex-1" unoptimized />
                <h4 className="w-fit text-white uppercase font-black">
                  {titleText.toUpperCase()}
                </h4>
              </>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-4 self-stretch">
            <h4 className="w-fit text-white uppercase font-black">
              {t(slide.textTitleKey).toUpperCase()}
            </h4>
            <p className="w-fit text-white text-sm">{t(slide.textKey)}</p>
            {slide.text2Key && <p className="w-fit text-white text-sm">{t(slide.text2Key)}</p>}
          </div>

          {/* Feature icons */}
          <div className="flex gap-3 border-t border-b justify-between border-white/20 py-3 lg:flex-row flex-col">
            {slide.icons.map((icon, i) => (
              <div key={icon.titleKey + i} className="flex gap-2 items-center px-2.5">
                <Image alt="" src={icon.icon} height={24} width={24} />
                <span className="w-fit text-white capitalize text-sm">{t(icon.titleKey)}</span>
              </div>
            ))}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-white text-sm">{t('success_category_title')}</h3>
            <h4 className="text-sm text-white">{t(slide.categoryKey)}</h4>
          </div>

          {slide.link !== '' && (
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm w-fit"
            >
              {t('success_join_cta')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SuccessSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const touchStartX = useRef<number | null>(null)
  const touchMoveX = useRef<number | null>(null)
  const { t } = useTranslation()

  const goTo = (idx: number) => {
    if (idx === activeIndex) return
    setPrevIndex(activeIndex)
    setVisible(false)
    setActiveIndex(idx)
    requestAnimationFrame(() => setVisible(true))
    setTimeout(() => setPrevIndex(null), 500)
  }

  return (
    <div
      id="Communities"
      className="py-[80px] sm:py-[80px] md:py-[120px] gap-[36px] sm:gap-[48px] md:gap-[64px] flex flex-col pr-0 relative"
    >
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute" style={{
          top: '45%', left: '40%', width: '25%', height: '20%',
          transform: 'translate(-50%, -50%) rotate(30deg)', borderRadius: '50%',
          background: 'linear-gradient(117deg, rgba(0,194,255,0) 0%, #FF29C3 100%)',
          filter: 'blur(150px)', opacity: 0.95,
        }} />
        <div className="absolute" style={{
          top: '40%', left: '55%', width: '40%', height: '10%',
          transform: 'translate(-50%, -50%) rotate(110deg)', borderRadius: '50%',
          background: 'linear-gradient(117deg, rgba(24,75,255,0) 0%, #174AFF 100%)',
          filter: 'blur(150px)', opacity: 0.95,
        }} />
      </div>

      {/* Heading desktop */}
      <div className="px-[14px] sm:px-[16px] md:px-[32px] py-[4px] sm:py-[8px] md:py-[12px] pl-[4px] sm:pl-[8px] md:pl-[12px] gap-[6px] sm:gap-[10px] md:gap-[16px] hidden sm:flex items-center rounded-full m-auto">
        <h1 className="rounded-full w-fit text-white uppercase font-black text-3xl">
          {t('success_stories_title')}
        </h1>
      </div>

      {/* Heading mobile */}
      <div className="flex sm:hidden flex-col gap-0 justify-center items-center z-10 text-center">
        <h2 className="w-fit text-white uppercase text-3xl font-black">
          {t('success_stories_title')}
        </h2>
      </div>

      {/* Slides container */}
      <div
        className="flex flex-col pr-0 h-full"
        style={{ paddingLeft: 'calc((100vw - 1080px) / 2)' }}
      >
        <div
          className="relative w-full overflow-visible"
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchMove={(e) => { touchMoveX.current = e.touches[0].clientX }}
          onTouchEnd={() => {
            if (!touchStartX.current || !touchMoveX.current) return
            const diff = touchStartX.current - touchMoveX.current
            if (diff > 50 && activeIndex < slides.length - 1) goTo(activeIndex + 1)
            else if (diff < -50 && activeIndex > 0) goTo(activeIndex - 1)
            touchStartX.current = null
            touchMoveX.current = null
          }}
        >
          <div className="relative w-full flex flex-col gap-12">
            <div className="relative w-full min-h-[820px] lg:min-h-[717px]">
              {prevIndex !== null && (
                <div
                  className="absolute inset-0 h-full opacity-0 pointer-events-none transition-opacity duration-500 ease-in-out"
                  aria-hidden="true"
                >
                  <SlideContent slide={slides[prevIndex]} t={t} />
                </div>
              )}
              <div
                className={`relative h-full transition-opacity duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
              >
                <SlideContent slide={slides[activeIndex]} t={t} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dot navigation */}
      <div className="-mt-8 flex justify-center items-center gap-6 z-10">
        <button
          onClick={() => goTo(activeIndex === 0 ? slides.length - 1 : activeIndex - 1)}
          aria-label="Previous slide"
          className="cursor-pointer"
        >
          <Image alt="" src="/svgs/Chevron-Left.svg" width={40} height={40} className="object-cover rounded-3xl" />
        </button>

        <div className="flex gap-3.5 transition-all duration-150">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-3 rounded-full border-2 cursor-pointer transition-all duration-300 ${
                activeIndex === i
                  ? 'border-[#10F48B] bg-[#10F48B] w-8'
                  : 'border-white bg-transparent opacity-50 w-3'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo((activeIndex + 1) % slides.length)}
          aria-label="Next slide"
          className="cursor-pointer"
        >
          <Image alt="" src="/svgs/Chevron-Right.svg" width={40} height={40} className="object-cover rounded-3xl" />
        </button>
      </div>
    </div>
  )
}
