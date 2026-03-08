import Navbar from '@/components/landing/Navbar'
import HeroClone from '@/components/landing/HeroClone'
import FooterDark from '@/components/landing/FooterDark'

import VideoSection from '@/components/landing/clone/VideoSection'
import StatsSection from '@/components/landing/clone/StatsSection'
import EngageSection from '@/components/landing/clone/EngageSection'
import CrmSection from '@/components/landing/clone/CrmSection'
import MapSection from '@/components/landing/clone/MapSection'
import WhySection from '@/components/landing/clone/WhySection'
import FeaturesSection from '@/components/landing/clone/FeaturesSection'
import SuccessSection from '@/components/landing/clone/SuccessSection'
import CtaSection from '@/components/landing/clone/CtaSection'
import BlogsSection from '@/components/landing/clone/BlogsSection'

export const metadata = {
  title: 'Clone Test — Freedom World',
  robots: 'noindex',
}

export default function CloneTestPage() {
  return (
    <main className="min-h-screen bg-[#050314] text-white overflow-x-hidden">
      <Navbar />

      {/* Sections stacked with freedom.world spacing */}
      <div className="flex flex-col gap-[120px] md:gap-[190px] pb-[120px] md:pb-[190px]">
        {/* 1. Video placeholder */}
        <VideoSection />

        {/* 2. Hero */}
        <HeroClone />

        {/* 3. Stats / All-in-one */}
        <StatsSection />

        {/* 4. Engage */}
        <EngageSection />

        {/* 5. CRM */}
        <CrmSection />

        {/* 6. Map */}
        <MapSection />

        {/* 7. Why Freedom */}
        <WhySection />

        {/* 8. Features */}
        <FeaturesSection />

        {/* 9. Success Stories */}
        <SuccessSection />

        {/* 10. CTA */}
        <CtaSection />

        {/* 11. Blogs */}
        <BlogsSection />
      </div>

      <FooterDark />
    </main>
  )
}
