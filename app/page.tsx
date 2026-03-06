import Navbar from '@/components/landing/Navbar'
import HeroDark from '@/components/landing/HeroDark'
import FeaturesDark from '@/components/landing/FeaturesDark'
import WhyFreedom from '@/components/landing/WhyFreedom'
import SuccessStory from '@/components/landing/SuccessStory'
import ExploreFeatures from '@/components/landing/ExploreFeatures'
import BottomCTADark from '@/components/landing/BottomCTADark'
import FooterDark from '@/components/landing/FooterDark'

export default function Home() {
  return (
    <main className="min-h-screen bg-fw-bg text-fw-text-primary overflow-x-hidden">
      <Navbar />
      <HeroDark />
      <FeaturesDark />
      <WhyFreedom />
      <SuccessStory />
      <ExploreFeatures />
      <BottomCTADark />
      <FooterDark />
    </main>
  )
}
