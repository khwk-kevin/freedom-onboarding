'use client'

import Image from 'next/image'

export default function EngageSection() {
  return (
    <div className="gap-[36px] sm:gap-[48px] md:gap-[64px] px-[24px] sm:px-[32px] md:px-[24px] relative flex flex-col">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute" style={{
          top: '30%', left: '50%', width: '25%', height: '20%',
          transform: 'translate(-50%, -50%) rotate(30deg)', borderRadius: '50%',
          background: 'linear-gradient(117deg, rgba(0,194,255,0) 0%, #FF29C3 100%)',
          filter: 'blur(150px)', opacity: 0.45,
        }} />
        <div className="absolute" style={{
          top: '40%', left: '55%', width: '40%', height: '10%',
          transform: 'translate(-50%, -50%) rotate(110deg)', borderRadius: '50%',
          background: 'linear-gradient(117deg, rgba(24,75,255,0) 0%, #174AFF 100%)',
          filter: 'blur(150px)', opacity: 0.95,
        }} />
      </div>

      {/* Card */}
      <div
        className="max-w-[1080px] mx-auto w-full mt-6 mb-[50px] md:mb-[0px] rounded-[32px] relative"
        style={{
          overflow: 'visible',
          background: 'linear-gradient(-70deg,#F742A240 25%, #F742A254 33%, #36BBF699 60%)',
          padding: "1.5px",
        }}
      >
        <div
          className="rounded-[31px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col md:flex-row items-center md:items-center justify-between relative md:py-9 md:px-18 md:pr-0 p-6 pb-0 h-auto md:min-h-[460px]"
          style={{ overflow: 'visible' }}
        >
          {/* Left content */}
          <div className="flex-1 flex flex-col gap-7 w-full md:w-1/2 max-w-[390px] z-10 md:order-1">
            <div>
              <h3
                className="w-fit uppercase md:text-start text-center font-black text-[24px] leading-[36px] sm:text-[28px] sm:leading-[40px] md:text-[32px] md:leading-[48px] text-white"
                
              >
                run your business
              </h3>
              <p className="w-fit md:text-start text-center text-[#A6A7B5] text-[14px] leading-[21px] tracking-[-0.24px] mt-2">
                Manage all your customer interactions, data,<br />
                and tools in one simple platform.
              </p>
            </div>

            <div className="relative pt-3 pb-0 md:py-0 md:pt-1 flex flex-col items-center md:items-start">
              <a
                href="https://console.freedom.world/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm hover:scale-105 transition-transform"
              >
                try it now
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                  <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
                </span>
              </a>

              {/* App store badges */}
              <div className="flex gap-2 sm:gap-[9px] pt-6 md:pt-10 flex-nowrap md:justify-start justify-center z-50">
                <a href="https://play.google.com/store/apps/details?id=com.bitazza.freedom.wallet&hl=en" target="_blank" rel="noopener noreferrer">
                  <Image
                    alt="Get it on Google Play"
                    src="/images/cdn/engage/google-play.png"
                    width={101}
                    height={32}
                    className="object-contain h-8 sm:h-auto"
                    unoptimized
                  />
                </a>
                <a href="https://apps.apple.com/my/app/freedom-world-social-chat/id1606936073" target="_blank" rel="noopener noreferrer">
                  <Image
                    alt="Download on the App Store"
                    src="/images/cdn/engage/app-store.png"
                    width={101}
                    height={32}
                    className="object-contain h-8 sm:h-auto"
                    unoptimized
                  />
                </a>
                <Image
                  alt="Available on App Gallery"
                  src="/images/cdn/engage/app-gallery.png"
                  width={101}
                  height={32}
                  className="object-contain h-8 sm:h-auto"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* Right: app screenshot */}
          <div className="flex-1 w-full md:w-1/2 relative md:absolute md:right-[22px] h-[300px] md:-bottom-25 md:h-auto order-last md:order-2 -mb-[100px] md:mb-0">
            <Image
              alt="Business management platform"
              src="/images/cdn/engage/image001.webp"
              width={534}
              height={636}
              className="object-contain w-full h-full"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  )
}
