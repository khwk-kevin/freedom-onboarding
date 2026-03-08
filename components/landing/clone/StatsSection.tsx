'use client'

import Image from 'next/image'

interface TipCard {
  id: number
  title: string
  subTitle: string
  image: string
}

const tips: TipCard[] = [
  {
    id: 1,
    title: 'integrated\ne-commerce',
    subTitle: 'Sell and list products end-to-end.',
    image: 'https://public.freedom.world/landing_page/svg/hiro01.svg',
  },
  {
    id: 2,
    title: 'gamified engagement',
    subTitle: 'Create gamified experiences\nthat drive user action.',
    image: 'https://public.freedom.world/landing_page/svg/hiro02.svg',
  },
  {
    id: 3,
    title: 'customer retention systems',
    subTitle: 'Connect, engage and promote with automated rewards.',
    image: 'https://public.freedom.world/landing_page/svg/hiro03.svg',
  },
]

function TipCardComponent({ tip }: { tip: TipCard }) {
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
          className="text-center w-fit text-white uppercase font-black text-[18px] leading-[27px] sm:text-[20px] sm:leading-[30px] md:text-[24px] md:leading-[36px]"
          style={{ fontFamily: 'Kanit, sans-serif' }}
        >
          {tip.id === 1 ? (
            <>integrated<br />e-commerce</>
          ) : (
            tip.title
          )}
        </h3>
        <p className="text-center text-[#A6A7B5] text-sm">{tip.subTitle}</p>
      </div>
    </div>
  )
}

function CardsGrid() {
  return (
    <div className="w-full">
      {/* Mobile: single column */}
      <div className="lg:hidden flex justify-start overflow-y-hidden scrollbar-hide py-4">
        <div className="flex flex-col gap-6 w-full">
          {tips.map((tip) => (
            <TipCardComponent key={tip.id} tip={tip} />
          ))}
        </div>
      </div>
      {/* Desktop: row */}
      <div className="hidden lg:flex gap-6 justify-center max-w-[1080px] m-auto items-stretch">
        {tips.map((tip) => (
          <TipCardComponent key={tip.id} tip={tip} />
        ))}
      </div>
    </div>
  )
}

export default function StatsSection() {
  return (
    <div className="relative flex flex-col md:pt-0 pt-0 gap-[36px] sm:gap-[48px] md:gap-[64px] px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 -top-20 md:-top-40 -translate-x-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />

      <div className="flex flex-col justify-center items-center z-10 text-center gap-[6px] sm:gap-[10px] md:gap-[16px]">
        <h2 className="w-fit text-white uppercase text-[30px] md:text-[40px] text-center font-black leading-[100%]"
          style={{ fontFamily: 'Kanit, sans-serif' }}>
          all-in-one platform to grow and
        </h2>
        <p className="rounded-full w-fit text-[#10F48B] uppercase text-[30px] md:text-[60px] text-center font-black leading-[100%]"
          style={{ fontFamily: 'Kanit, sans-serif' }}>
          engage your customers
        </p>
      </div>

      <CardsGrid />
    </div>
  )
}
