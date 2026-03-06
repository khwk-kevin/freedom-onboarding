export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Freedom World',
          url: 'https://freedom.world',
          logo: 'https://freedom.world/images/freedom-logo.svg',
          description:
            'Community platform for businesses with token rewards and AI-powered setup',
          sameAs: [
            'https://www.facebook.com/FreedomWorldApp',
            'https://x.com/FreedomWorld',
            'https://www.instagram.com/freedomworld',
          ],
        }),
      }}
    />
  )
}

export function FAQSchema({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }),
      }}
    />
  )
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
          })),
        }),
      }}
    />
  )
}

export function SoftwareApplicationSchema() {
  // NOTE: aggregateRating OMITTED — only add when we have REAL verified ratings.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Freedom World',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web, iOS, Android',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'THB',
            description: 'Free to create your community',
          },
        }),
      }}
    />
  )
}
