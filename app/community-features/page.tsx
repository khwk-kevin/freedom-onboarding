import Hero from '@/components/landing/Hero'
import ValueProps from '@/components/landing/ValueProps'
import SocialProof from '@/components/landing/SocialProof'
import HowItWorks from '@/components/landing/HowItWorks'
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
} from '@/components/shared/SchemaMarkup'

export default function CommunityFeaturesPage() {
  return (
    <>
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <main>
        <Hero />
        <ValueProps />
        <SocialProof />
        <HowItWorks />
      </main>
    </>
  )
}
