import CloneNavbar from '@/components/landing/clone/CloneNavbar'
import CloneFooter from '@/components/landing/clone/CloneFooter'
import HeroClone from '@/components/landing/HeroClone'

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
import { LandingTracker } from '@/components/landing/LandingTracker'

export const metadata = {
  title: 'Freedom World — Your Business, Your World, Yours To Create',
  description: 'Create, engage, and grow your community with Freedom World. Built for creators, managed for success.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050314] text-white overflow-x-hidden">
      <LandingTracker />
      <CloneNavbar />

      <div className="flex flex-col md:gap-[190px] gap-[120px]">
        <div>
          <VideoSection />
          <HeroClone />
        </div>
        <StatsSection />
        <EngageSection />
        <CrmSection />
        <MapSection />
        <WhySection />
        <FeaturesSection />
        <SuccessSection />
        <CtaSection />
        <BlogsSection />
      </div>

      <CloneFooter />
    </main>
  )
}
