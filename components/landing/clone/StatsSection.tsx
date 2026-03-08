'use client'

import Image from 'next/image'
import { useTranslation } from '@/context/TranslationContext'

interface TipCard {
  id: number
  titleKey: string
  subTitleKey: string
  image: string
}

const tips: TipCard[] = [
  {
    id: 1,
    titleKey: 'all_inone_integrated_title',
    subTitleKey: 'all_in_one_integrated_desc',
    image: 'https://public.freedom.world/landing_page/svg/hiro01.svg',
  },
  {
    id: 2,
    titleKey: 'all_in_one_gamified_title',
    subTitleKey: 'all_in_one_gamified_desc',
    image: 'https://public.freedom.world/landing_page/svg/hiro02.svg',
  },
  {
    id: 3,
    titleKey: 'all_in_one_customer_title',
    subTitleKey: 'all_in_one_customer_desc',
    image: 'https://public.freedom.world/landing_page/svg/hiro03.svg',
  },
]

function TipCardComponent({ tip, t }: { tip: TipCard; t: (key: string) => string }) {
  const title = t(tip.titleKey)
  const subTitle = t(tip.subTitleKey)

  return (
    <div
      className="md:w-auto md:flex-1 min-w-[300px] w-full md:min-w-0 z-30 h-[395px] rounded-[32px] relative"
      style={{
        background: 'linear-gradient(-70deg,#F742A240 25%, #F742A254 33%, #36BBF699 60%)',
        padding: "1.5px",
      }}
    >
      <div
        className="rounded-[31px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-center items-center h-[390px] relative w-full break-words gap-[6px] sm:gap-[10px] md:gap-[16px] p-[24px] sm:p-[24px] md:p-[32px]"
      >
        <Image
          src={tip.image}
          width={215}
          height={215}
          alt=""
          unoptimized
        />
        <h3
          className="text-center w-fit text-white uppercase font-black text-[18px] leading-[27px] sm:text-[20px] sm:leading-[30px] md:text-[24px] md:leading-[36px] whitespace-pre-line"
        >
          {title}
        </h3>
        <p className="text-center text-[#A6A7B5] text-sm whitespace-pre-line">{subTitle}</p>
      </div>
    </div>
  )
}

function CardsGrid({ t }: { t: (key: string) => string }) {
  return (
    <div className="w-full">
      {/* Mobile: single column */}
      <div className="lg:hidden flex justify-start overflow-y-hidden scrollbar-hide py-4">
        <div className="flex flex-col gap-6 w-full">
          {tips.map((tip) => (
            <TipCardComponent key={tip.id} tip={tip} t={t} />
          ))}
        </div>
      </div>
      {/* Desktop: row */}
      <div className="hidden lg:flex gap-6 justify-center max-w-[1080px] m-auto items-stretch">
        {tips.map((tip) => (
          <TipCardComponent key={tip.id} tip={tip} t={t} />
        ))}
      </div>
    </div>
  )
}

export default function StatsSection() {
  const { t } = useTranslation()

  return (
    <div className="relative flex flex-col md:pt-0 pt-0 gap-[36px] sm:gap-[48px] md:gap-[64px] px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 -top-20 md:-top-40 -translate-x-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />

      <div className="flex flex-col justify-center items-center z-10 text-center gap-[6px] sm:gap-[10px] md:gap-[16px]">
        <h2 className="w-fit text-white uppercase text-[30px] md:text-[40px] text-center font-black leading-[100%]">
          {t('all_in_one_title')}
        </h2>
        <p className="rounded-full w-fit text-[#10F48B] uppercase text-[30px] md:text-[60px] text-center font-black leading-[100%]">
          {t('all_in_one_title2')}
        </p>
      </div>

      <CardsGrid t={t} />
    </div>
  )
}
