import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PHProvider, PostHogPageview } from '@/lib/posthog/provider'
import { GTMProvider } from '@/lib/gtm/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Freedom World — Grow Your Community',
  description: 'Join Freedom World and start earning from your community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <PHProvider>
          <GTMProvider />
          <PostHogPageview />
          {children}
        </PHProvider>
      </body>
    </html>
  )
}
