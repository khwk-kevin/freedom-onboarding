'use client'

import Image from 'next/image'
import { useTranslation } from '@/context/TranslationContext'

interface BlogCard {
  id: number
  titleKey: string
  subTitleKey: string
  image: string
  url: string
}

const blogs: BlogCard[] = [
  {
    id: 1,
    titleKey: 'community_insights_inspiration_title',
    subTitleKey: 'community_insights_inspiration_desc',
    image: '/images/home/blogs/blog1.webp',
    url: 'https://blog.freedom.world/blog/why-building-your-community-drives-more-impact',
  },
  {
    id: 2,
    titleKey: 'community_insights_playbooks_title',
    subTitleKey: 'community_insights_playbooks_desc',
    image: '/images/home/blogs/blog2.webp',
    url: 'https://blog.freedom.world/blog/creative-ways-to-monetize-your-virtual-communities-0',
  },
  {
    id: 3,
    titleKey: 'community_insights_features_title',
    subTitleKey: 'community_insights_features_desc',
    image: '/images/home/blogs/blog3.webp',
    url: 'https://blog.freedom.world/blog/the-new-era-of-community-recognition-with-freedom-world',
  },
]

function BlogCard({ blog, t }: { blog: BlogCard; t: (key: string) => string }) {
  return (
    <div
      className="md:w-auto md:flex-1 min-w-[300px] w-full md:min-w-0 z-30 h-auto rounded-[32px] relative"
      style={{
        background: 'linear-gradient(281deg, #F742A240 25%, #F742A254 33%, #36BBF699 60%)',
        padding: "1.5px",
      }}
    >
      <a
        className="rounded-[31px] bg-[#120A2A]/90 backdrop-blur-md flex flex-col justify-center items-center h-auto relative w-full break-words p-3 md:p-6 gap-[6px] sm:gap-[10px] md:gap-[16px]"
        href={blog.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="mt-auto w-full relative">
          <Image
            alt={t(blog.titleKey)}
            src={blog.image}
            width={277}
            height={200}
            className="object-cover rounded-[22px] md:rounded-[10px] w-full h-auto"
            unoptimized
          />
        </div>
        <div className="flex flex-col w-full p-4 px-0 md:pt-4 md:px-8 md:pb-8 gap-2">
          <div className="flex justify-between items-start gap-1 w-full">
            <h3 className="text-[#F4F4FC] text-2xl font-black uppercase">
              {t(blog.titleKey)}
            </h3>
            <Image alt="Read more" src="/svgs/up-right-arrow.svg" width={41} height={41} className="w-6 h-6 lg:w-10 lg:h-10" />
          </div>
          <p className="text-[#A6A7B5] w-full text-left whitespace-pre-line text-[12px] leading-[18px] md:text-[14px] md:leading-[21px] tracking-[-0.24px]">
            {t(blog.subTitleKey)}
          </p>
        </div>
      </a>
    </div>
  )
}

function BlogsGrid({ t }: { t: (key: string) => string }) {
  return (
    <div className="w-full">
      {/* Mobile */}
      <div className="lg:hidden flex justify-start overflow-y-hidden scrollbar-hide py-4">
        <div className="flex flex-col gap-6 w-full">
          {blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} t={t} />
          ))}
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden lg:flex gap-6 justify-center max-w-[1080px] m-auto items-stretch">
        {blogs.map((blog) => (
          <BlogCard key={blog.id} blog={blog} t={t} />
        ))}
      </div>
    </div>
  )
}

export default function BlogsSection() {
  const { t } = useTranslation()

  return (
    <div className="relative m-auto md:flex md:flex-col overflow-hidden md:mb-[277px] mb-0 px-[24px] sm:px-[32px] md:px-[24px]">
      {/* Background glow */}
      <div
        className="absolute left-1/2 -top-[700px] md:top-[100px] -translate-x-1/2 w-[400px] h-[300px] md:w-[800px] md:h-[500px] rounded-full blur-[80px] md:blur-[100px] opacity-15 z-0"
        style={{ background: 'linear-gradient(135deg, #3b82f6, #9333ea, #4f46e5)' }}
      />

      <div className="flex flex-col items-center m-auto relative gap-[36px] sm:gap-[48px] md:gap-[64px]">
        {/* Desktop heading */}
        <div className="hidden sm:flex flex-col justify-center items-center z-10 text-center">
          <h2 className="w-fit text-white uppercase text-[40px] font-black">
            {t('community_insights_title')}
          </h2>
          <h1 className="rounded-full w-fit text-[#10F48B] uppercase text-[90px] font-black leading-[100%]">
            {t('community_insights_title2')}
          </h1>
          <a
            href="/onboarding"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full px-4 py-2 bg-[#1248C8] font-black uppercase text-white text-sm mt-4 hover:scale-105 transition-transform"
          >
            {t('community_insights_see_more_cta')}
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10F48B]">
              <Image src="/svgs/up-right-arrow.svg" alt="" width={14} height={14} />
            </span>
          </a>
        </div>

        {/* Mobile heading */}
        <div className="flex sm:hidden flex-col gap-0 justify-center items-center z-10 text-center">
          <h2 className="w-fit text-white uppercase text-3xl font-black">
            {t('community_insights_title')}
          </h2>
          <h1 className="rounded-full w-fit text-[#10F48B] uppercase text-3xl font-black">
            {t('community_insights_title2')}
          </h1>
        </div>

        {/* Blogs grid */}
        <div className="relative flex flex-col md:pt-0 pt-0 w-full gap-[36px] sm:gap-[48px] md:gap-[64px]">
          <BlogsGrid t={t} />
        </div>
      </div>
    </div>
  )
}
