import Navbar from '@/components/landing/Navbar'
import HeroDark from '@/components/landing/HeroDark'
import FeaturesDark from '@/components/landing/FeaturesDark'
import WhyFreedom from '@/components/landing/WhyFreedom'
import SuccessStory from '@/components/landing/SuccessStory'
import ExploreFeatures from '@/components/landing/ExploreFeatures'
import BottomCTADark from '@/components/landing/BottomCTADark'
import FooterDark from '@/components/landing/FooterDark'
import { LandingTracker } from '@/components/landing/LandingTracker'
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
} from '@/components/shared/SchemaMarkup'

export default function CommunityFeaturesPage() {
  return (
    <>
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <main className="min-h-screen bg-fw-bg text-fw-text-primary overflow-x-hidden">
        <LandingTracker />
        <Navbar />
        <div id="hero"><HeroDark /></div>
        <div id="features"><FeaturesDark /></div>
        <div id="why-freedom"><WhyFreedom /></div>
        <div id="success-story"><SuccessStory /></div>
        <div id="explore-features"><ExploreFeatures /></div>
        <div id="bottom-cta"><BottomCTADark /></div>
        <div id="footer"><FooterDark /></div>
      </main>
    </>
  )
}
