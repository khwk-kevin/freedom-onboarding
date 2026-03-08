import Navbar from '@/components/landing/Navbar'
import HeroClone from '@/components/landing/HeroClone'
import FeaturesDark from '@/components/landing/FeaturesDark'
import BottomCTADark from '@/components/landing/BottomCTADark'
import FooterDark from '@/components/landing/FooterDark'

export const metadata = {
  title: 'Clone Test — Freedom World',
  robots: 'noindex',
}

export default function CloneTestPage() {
  return (
    <main className="min-h-screen bg-[#050314] text-white overflow-x-hidden">
      <Navbar />
      <HeroClone />
      <FeaturesDark />
      <BottomCTADark />
      <FooterDark />
    </main>
  )
}
