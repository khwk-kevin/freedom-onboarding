'use client'

import Image from 'next/image'
import { useTranslation } from '@/context/TranslationContext'

function CtaCard1({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="flex-1 rounded-[32px] relative"
      style={{
        background: 'linear-gradient(281deg, rgba(247,66,162,0.25) 14.21%, rgba(247,66,162,0.33) 49.46%, rgba(55,200,245,0.80) 95.44%)',
        padding: "1.5px",
      }}
    >
      <div
        className="rounded-[31px] flex flex-col items-start justify-between gap-[68px] shrink-0 overflow-hidden inset-0"
        style={{ background: '#0B1036' }}
      >
        {/* Desktop */}
        <div className="md:flex hidden flex-col justify-center flex-1">
          <div className="flex flex-col justify-center items-center p-[24px] sm:p-[24px] md:p-[32px]">
            <div className="px-2 m-0">
              <h3 className="uppercase p-0 m-0 font-black text-[28px] md:text-[36px] text-[#F4F4FC] leading-tight text-center">
                {t('build_customer_title')}
              </h3>
            </div>
            <h3 className="rounded-full w-fit uppercase px-2 m-0 font-black text-[28px] md:text-[36px] text-[#F4F4FC] leading-tight text-center">
              {t('build_customer_title2')}
            </h3>
          </div>
          <div className="px-[14px] sm:px-[16px] md:px-[32px] pr-0">
            <Image
              alt=""
              src="/images/home/cta/cta02.webp"
              width={528}
              height={328}
              className="h-[280px] min-h-[280px] w-full object-cover"
              unoptimized
            />
          </div>
          <div className="p-[24px] sm:p-[24px] md:p-[32px] flex justify-center">
            <a
              href="/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm hover:scale-105 transition-transform"
            >
              {t('build_customer_create_community_cta')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
              </span>
            </a>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col w-full">
          <div className="flex flex-col justify-center items-center uppercase p-[24px] gap-[6px] sm:gap-[8px] md:gap-[12px]">
            <div className="px-[14px] sm:px-[16px] md:px-[32px]">
              <h3 className="font-black text-[#F4F4FC] text-2xl text-center">
                {t('build_customer_title')}
              </h3>
            </div>
            <h3 className="rounded-full w-fit uppercase font-black text-[#F4F4FC] text-2xl py-[4px] sm:py-[8px] md:py-[12px] px-[14px] sm:px-[16px] md:px-[32px] text-center">
              {t('build_customer_title2')}
            </h3>
          </div>
          <div className="px-[14px] sm:px-[16px] md:px-[32px] pr-0 flex flex-col justify-center items-center">
            <Image
              alt=""
              src="/images/home/cta/cta02.webp"
              width={485}
              height={299}
              className="rounded-l-full w-full h-auto"
              unoptimized
            />
            <div className="p-[24px]">
              <a
                href="/onboarding"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm"
              >
                {t('build_customer_create_community_cta')}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                  <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CtaCard2({ t }: { t: (key: string) => string }) {
  return (
    <div
      className="flex-1 z-50 rounded-[32px] relative"
      style={{
        background: 'linear-gradient(281deg, rgba(247,66,162,0.25) 14.21%, rgba(247,66,162,0.33) 49.46%, rgba(55,200,245,0.80) 95.44%)',
        padding: "1.5px",
      }}
    >
      <div
        className="rounded-[31px] flex flex-col items-start justify-between shrink-0 overflow-hidden"
        style={{ background: '#0B1036' }}
      >
        {/* Desktop */}
        <div className="md:flex hidden flex-col justify-center flex-1">
          <div className="flex flex-col justify-center items-center p-[24px] sm:p-[24px] md:p-[32px]">
            <div className="px-2">
              <h3 className="uppercase font-black text-[28px] md:text-[36px] text-[#F4F4FC] leading-tight text-center">
                {t('join_as_partner_title')}
              </h3>
            </div>
            <h3 className="rounded-full w-fit uppercase px-2 font-black text-[28px] md:text-[36px] text-[#F4F4FC] leading-tight text-center">
              {t('join_as_partner_title2')}
            </h3>
          </div>
          <div className="px-[14px] sm:px-[16px] md:px-[32px] pl-0">
            <Image
              alt=""
              src="/images/home/cta/cta03.webp"
              width={528}
              height={335}
              className="h-[280px] min-h-[280px] object-contain"
              unoptimized
            />
          </div>
          <div className="p-[24px] sm:p-[24px] md:p-[32px] flex justify-center">
            <a
              href="/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm hover:scale-105 transition-transform"
            >
              {t('join_as_partner_contact_cta')}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
              </span>
            </a>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col w-full">
          <div className="flex flex-col justify-center items-center p-[24px] gap-[6px] sm:gap-[8px] md:gap-[12px]">
            <div className="px-[14px] sm:px-[16px] md:px-[32px]">
              <h3 className="uppercase font-black text-[#F4F4FC] text-2xl text-center">
                {t('join_as_partner_title')}
              </h3>
            </div>
            <h3 className="rounded-full w-fit uppercase font-black text-[#F4F4FC] text-2xl py-[4px] sm:py-[8px] md:py-[12px] px-[14px] sm:px-[16px] md:px-[32px] text-center">
              {t('join_as_partner_title2')}
            </h3>
          </div>
          <div className="px-[14px] sm:px-[16px] md:px-[32px] pl-0 flex flex-col justify-center items-center">
            <Image
              alt=""
              src="/images/home/cta/cta03.webp"
              width={489}
              height={317}
              className="w-full h-[280px] min-h-[280px] object-contain"
              unoptimized
            />
            <div className="p-[24px]">
              <a
                href="/onboarding"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm"
              >
                {t('join_as_partner_contact_cta')}
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
                  <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CtaSection() {
  const { t } = useTranslation()

  return (
    <div className="relative px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] md:w-[700px] md:h-[700px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />
      <div className="relative max-w-[1080px] m-auto flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 z-30 pb-0">
          <CtaCard1 t={t} />
          <CtaCard2 t={t} />
        </div>
      </div>
    </div>
  )
}
