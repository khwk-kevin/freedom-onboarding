import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Kanit } from 'next/font/google'
import './globals.css'
import { PHProvider, PostHogPageview } from '@/lib/posthog/provider'
import { GTMProvider } from '@/lib/gtm/provider'

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-thai',
})

export const metadata: Metadata = {
  title: 'Freedom World — ธุรกิจของคุณ โลกของคุณ สร้างได้เลย',
  description: 'สร้างชุมชนที่เชื่อมต่อลูกค้าในระบบการตลาดแบบเกมมิฟิเคชั่น เติบโตไปพร้อมกับ Freedom World',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${GeistSans.variable} ${kanit.variable} font-thai bg-fw-bg text-fw-text-primary antialiased`}>
        <PHProvider>
          <GTMProvider />
          <PostHogPageview />
          {children}
        </PHProvider>
      </body>
    </html>
  )
}
