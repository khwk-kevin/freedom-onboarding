'use client'

import Image from 'next/image'
import { useTranslation } from '@/context/TranslationContext'

interface WhyCard {
  id: number
  titleKey: string
  title2Key: string
  subTitleKey: string
  image: string
}

const whyCards: WhyCard[] = [
  {
    id: 1,
    titleKey: 'why_will_freedom_pay_less_title',
    title2Key: 'why_will_freedom_pay_less_title2',
    subTitleKey: 'why_will_freedom_pay_less_desc',
    image: '/images/home/why/Visual_WhyItWorks_Card01.webp',
  },
  {
    id: 2,
    titleKey: 'why_will_freedom_everything_in_one_title',
    title2Key: 'why_will_freedom_everything_in_one_title2',
    subTitleKey: 'why_will_freedom_everything_in_one_desc',
    image: '/images/home/why/Visual_WhyItWorks_Card02.webp',
  },
  {
    id: 3,
    titleKey: 'why_will_freedom_know_your_customers_title',
    title2Key: 'why_will_freedom_know_your_customers_title2',
    subTitleKey: 'why_will_freedom_know_your_customers_desc',
    image: '/images/home/why/Visual_WhyItWorks_Card03.webp',
  },
]

function WhyCard({ why, t }: { why: WhyCard; t: (key: string) => string }) {
  return (
    <div
      className="md:w-auto md:flex-1 min-w-[300px] w-full md:min-w-0 z-30 h-auto md:h-[430px] rounded-[32px] relative"
      style={{
        background: 'linear-gradient(281deg, #F742A240 25%, #F742A254 33%, #36BBF699 60%)',
        padding: "1.5px",
      }}
    >
      <a
        className="rounded-[31px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-start items-center h-auto md:h-[430px] relative w-full break-words p-3 md:p-6 overflow-hidden gap-[6px] sm:gap-[10px] md:gap-[16px]"
        href="/onboarding"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="w-full relative h-50 shrink-0">
          <Image
            alt={t(why.titleKey)}
            src={why.image}
            width={277}
            height={200}
            className="object-cover rounded-[22px] md:rounded-[10px] w-full h-full"
            unoptimized
          />
        </div>
        <div className="flex flex-col w-full p-4 px-0 md:pt-4 md:px-8 md:pb-8 gap-2 flex-1">
          <div className="flex justify-between items-start gap-1 w-full">
            <div className="flex flex-col">
              <h5 className="text-[#F4F4FC] text-2xl font-bold uppercase line-clamp-2">
                {t(why.titleKey)}
              </h5>
              <h5 className="text-[#F4F4FC] text-2xl font-bold uppercase line-clamp-2">
                {t(why.title2Key)}
              </h5>
            </div>
          </div>
          <p className="text-[#A6A7B5] w-full text-left whitespace-pre-line line-clamp-4 text-[12px] leading-[18px] md:text-[14px] md:leading-[21px] tracking-[-0.24px]">
            {t(why.subTitleKey)}
          </p>
        </div>
      </a>
    </div>
  )
}

function CardsGrid({ t }: { t: (key: string) => string }) {
  return (
    <div className="w-full">
      {/* Mobile */}
      <div className="lg:hidden flex justify-start overflow-y-hidden scrollbar-hide py-4">
        <div className="flex flex-col gap-6 w-full">
          {whyCards.map((card) => (
            <WhyCard key={card.id} why={card} t={t} />
          ))}
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden lg:flex gap-6 justify-center max-w-[1080px] m-auto items-stretch">
        {whyCards.map((card) => (
          <WhyCard key={card.id} why={card} t={t} />
        ))}
      </div>
    </div>
  )
}

export default function WhySection() {
  const { t } = useTranslation()

  return (
    <div className="relative m-auto md:flex md:flex-col overflow-hidden px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] md:w-[700px] md:h-[700px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />

      <div className="flex flex-col items-center m-auto relative gap-[36px] sm:gap-[48px] md:gap-[64px]">
        {/* Desktop heading */}
        <div className="hidden sm:flex flex-col justify-center items-center z-10 text-center">
          <h2 className="w-fit text-white uppercase text-[40px] font-black">
            {t('why_will_freedom_title')}
          </h2>
          <h1 className="rounded-full w-fit text-[#10F48B] uppercase text-[90px] font-black leading-[100%]">
            {t('why_will_freedom_title2')}
          </h1>
        </div>

        {/* Mobile heading */}
        <div className="flex sm:hidden flex-col gap-0 justify-center items-center z-10 text-center">
          <h2 className="w-fit text-white uppercase text-3xl font-black">
            {t('why_will_freedom_title')}
          </h2>
          <h1 className="rounded-full w-fit text-[#10F48B] uppercase text-3xl font-black">
            {t('why_will_freedom_title2')}
          </h1>
        </div>

        {/* Cards */}
        <div className="relative flex flex-col md:pt-0 pt-0 w-full gap-[36px] sm:gap-[48px] md:gap-[64px]">
          <CardsGrid t={t} />
        </div>
      </div>
    </div>
  )
}
