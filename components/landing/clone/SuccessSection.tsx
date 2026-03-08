'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface FeatureIcon {
  title: string
  icon: string
}

interface Slide {
  id: string
  title: string
  textTitle: string
  text: string
  text2?: string
  imageUrl: string
  imageUrlMO: string
  category: string
  icons: FeatureIcon[]
  iconUrl: string
  link: string
}

const slides: Slide[] = [
  {
    id: 'slide1',
    title: 'Discover Thailand',
    textTitle: 'Personalized adventures and rewarding discoveries.',
    text: 'Freedom World and the Tourism of Thailand (TAT) have teamed up to embark travelers onto a unique journey where they can explore up to 80+ local businesses, enjoy special deals, and earn epic rewards.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/discover_thailand.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/discover_thailand.avif')",
    category: 'Tourism',
    icons: [
      { title: 'Universal Rewards', icon: '/svgs/reward.svg' },
      { title: 'Interactive Map', icon: '/svgs/location.svg' },
    ],
    iconUrl: '/images/home/community/icons/discover_thailand.png',
    link: 'https://freedom.world/discover-thailand',
  },
  {
    id: 'slide2',
    title: 'Mystic Valley Festival',
    textTitle: 'Immersive and cutting-edge festival experience',
    text: 'By integrating the Freedom World App, Mystic Valley transforms the traditional festival into a cutting-edge digital ecosystem where NFT tickets provide secure, collectible access, while MYST points streamline on-site transactions for a frictionless, cashless environment.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/valley.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/valley.avif')",
    category: 'Entertainment',
    icons: [
      { title: 'MYST Points', icon: '/svgs/reward.svg' },
      { title: 'NFT Tickets', icon: '/svgs/nft.svg' },
      { title: 'Missions', icon: '/svgs/missons.svg' },
    ],
    iconUrl: '/images/home/community/icons/mystic_valley.png',
    link: 'https://freedom.world/mystic-valley-festival',
  },
  {
    id: 'slide3',
    title: 'Raja Ferry',
    textTitle: 'Rewarding & engaging journey experience',
    text: "Through the Freedom World ecosystem, Thailand's leading ferry service transforms travel into a premium experience by driving engagement and loyalty via referral systems, RAJA points, and NFT e-vouchers.",
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/raja.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/raja.avif')",
    category: 'Transportation',
    icons: [
      { title: 'Referral System', icon: '/svgs/referral.svg' },
      { title: 'RAJA Points', icon: '/svgs/location.svg' },
      { title: 'NFT E-Voucher', icon: '/svgs/nft.svg' },
    ],
    iconUrl: '/images/home/community/icons/raja_ferry.png',
    link: 'https://freedom.world/raja-ferry',
  },
  {
    id: 'slide30',
    title: 'Topgolf Thailand',
    textTitle: 'Rewarding Every Swing through A Seamless Loyalty Journey',
    text: 'Topgolf Thailand has implemented the top-up function, mission system, and merchant system through Freedom World to drive customer loyalty, enhance engagement, and boost retention within the Topgolf ecosystem.',
    text2: 'By adopting the Freedom App, Topgolf has elevated its customer journey by combining seamless payment experiences with interactive reward mechanisms.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/image_topgolf.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/image_topgolf.avif')",
    category: 'Activity',
    icons: [
      { title: 'Missions', icon: '/svgs/Flag.svg' },
      { title: 'Merchant System', icon: '/svgs/shop.svg' },
      { title: 'Top Up', icon: '/svgs/hand-holding-circle-dollar.svg' },
    ],
    iconUrl: '/images/home/community/icons/logo_topgolf.avif',
    link: 'https://freedom.world/topgolf-thailand',
  },
  {
    id: 'slide4',
    title: 'Roon Khanom Khai',
    textTitle: 'BOOSTING LOYALTY THROUGH DIGITAL REWARDS',
    text: 'By embracing the Freedom World app, Roon Khanom Khai connects with customers in new ways, offering top-ups, missions, and special in-store deals that drive repeat visits and lasting loyalty.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/RoonKhanomKhai.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/RoonKhanomKhai-mobile.avif')",
    category: 'Food & Beverage',
    icons: [
      { title: 'Topup', icon: '/svgs/nft-certificates.svg' },
      { title: 'Missions', icon: '/svgs/missons.svg' },
      { title: 'NFT E-Voucher', icon: '/svgs/nft.svg' },
    ],
    iconUrl: '/images/home/community/icons/RoonKhanomKhai.avif',
    link: 'https://freedom.world/roon-khanom-khai',
  },
  {
    id: 'slide5',
    title: 'Onyx Bangkok',
    textTitle: 'REDEFINING THE NIGHTLIFE EXPERIENCE',
    text: 'In the heart of RCA, ONYX is blending entertainment with digital innovation. Patrons top up ONYX Points, redeem rewards, and enjoy seamless QR payments. Missions and campaigns extend engagement beyond the dance floor.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/Onyx.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/Onyx-mobile.avif')",
    category: 'Nightlife',
    icons: [
      { title: 'QR Payments', icon: '/svgs/points.svg' },
      { title: 'ONYX Points', icon: '/svgs/qr-payment.svg' },
      { title: 'Missions', icon: '/svgs/missons.svg' },
    ],
    iconUrl: '/images/home/community/icons/Onyx.avif',
    link: 'https://freedom.world/onyx',
  },
  {
    id: 'slide10',
    title: 'Bangkok Community Help Foundation',
    textTitle: 'Turning compassion into action',
    text: "Through the Freedom World Impact program, the Bangkok Community Help Foundation leverages the Merchant System and QuickScan to transform donations into a seamless, secure, and transparent experience.",
    text2: 'By linking donations to structured Missions and recognizing milestones with on-chain digital badges, the platform converts one-time contributions into a verifiable, high-engagement journey.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/image_bchf.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/image_bchf.avif')",
    category: 'Impact',
    icons: [
      { title: 'BCHF Points', icon: '/svgs/points.svg' },
      { title: 'Missions', icon: '/svgs/missons.svg' },
      { title: 'Merchant System', icon: '/svgs/shop.svg' },
    ],
    iconUrl: '/images/home/community/icons/logo_bchf.avif',
    link: 'https://freedom.world/Bangkok-Community-Help-Foundation',
  },
  {
    id: 'slide11',
    title: 'Freedom Run',
    textTitle: 'Thriving community fostered by a shared passion',
    text: 'Igniting a passionate community of running lovers from just a small group of runners from the Amazing Thailand Marathon 2023, the community has shown what a strong bond and shared enthusiasm can achieve.',
    imageUrl: "linear-gradient(to right, #050314 0%, #050314 30%, #050314CC 40%, #05031499 50%, #0503144D 60%, #0503141A 70%, #05031400 80%), url('https://public.freedom.world/landing_page/community/freedom_run.avif')",
    imageUrlMO: "linear-gradient(to right, #050314CC 0%, #050314CC 30%, #050314CC 40%, #05031499 50%, #05031499 60%, #05031499 70%, #05031499 80%), url('https://public.freedom.world/landing_page/community/freedom_run.avif')",
    category: 'Shared Interest',
    icons: [
      { title: 'RUN Points', icon: '/svgs/points.svg' },
      { title: 'Referral System', icon: '/svgs/referral.svg' },
    ],
    iconUrl: '/images/home/community/icons/fd_run.png',
    link: 'https://freedom.world/freedom-run',
  },
]

function SlideContent({ slide }: { slide: Slide }) {
  const isSEENSPACE = slide.title === 'SEENSPACE'
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
                <h4 className="w-fit text-white uppercase font-black" style={{ fontFamily: 'Kanit, sans-serif' }}>
                  {slide.title.toUpperCase()}
                </h4>
              </>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-4 self-stretch">
            <h4 className="w-fit text-white font-black uppercase" style={{ fontFamily: 'Kanit, sans-serif' }}>
              {slide.textTitle.toUpperCase()}
            </h4>
            <p className="w-fit text-white text-sm">{slide.text}</p>
            {slide.text2 && <p className="w-fit text-white text-sm">{slide.text2}</p>}
          </div>

          {/* Feature icons */}
          <div className="flex gap-3 border-t border-b justify-between border-white/20 py-3 lg:flex-row flex-col">
            {slide.icons.map((icon, i) => (
              <div key={icon.title + i} className="flex gap-2 items-center px-2.5">
                <Image alt="" src={icon.icon} height={24} width={24} />
                <span className="w-fit text-white capitalize text-sm">{icon.title}</span>
              </div>
            ))}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-white text-sm">Category</h3>
            <p className="w-fit text-white text-sm">{slide.category}</p>
          </div>

          {slide.link !== '' && (
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm w-fit"
            >
              join the community
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
                <h4 className="w-fit text-white uppercase font-black" style={{ fontFamily: 'Kanit, sans-serif' }}>
                  {slide.title.toUpperCase()}
                </h4>
              </>
            )}
          </div>

          {/* Text content */}
          <div className="flex flex-col gap-4 self-stretch">
            <h4 className="w-fit text-white uppercase font-black" style={{ fontFamily: 'Kanit, sans-serif' }}>
              {slide.textTitle.toUpperCase()}
            </h4>
            <p className="w-fit text-white text-sm">{slide.text}</p>
            {slide.text2 && <p className="w-fit text-white text-sm">{slide.text2}</p>}
          </div>

          {/* Feature icons */}
          <div className="flex gap-3 border-t border-b justify-between border-white/20 py-3 lg:flex-row flex-col">
            {slide.icons.map((icon, i) => (
              <div key={icon.title + i} className="flex gap-2 items-center px-2.5">
                <Image alt="" src={icon.icon} height={24} width={24} />
                <span className="w-fit text-white capitalize text-sm">{icon.title}</span>
              </div>
            ))}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <h3 className="font-black text-white text-sm"> Category</h3>
            <h4 className="text-sm text-white">{slide.category}</h4>
          </div>

          {slide.link !== '' && (
            <a
              href={slide.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm w-fit"
            >
              join the community
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
        <h1 className="rounded-full w-fit text-white uppercase font-black text-3xl"
          style={{ fontFamily: 'Kanit, sans-serif' }}>
          success stories
        </h1>
      </div>

      {/* Heading mobile */}
      <div className="flex sm:hidden flex-col gap-0 justify-center items-center z-10 text-center">
        <h2 className="w-fit text-white uppercase text-3xl font-black"
          style={{ fontFamily: 'Kanit, sans-serif' }}>
          success stories
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
                  <SlideContent slide={slides[prevIndex]} />
                </div>
              )}
              <div
                className={`relative h-full transition-opacity duration-500 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
              >
                <SlideContent slide={slides[activeIndex]} />
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
