import type { Metadata } from 'next'
import { Encode_Sans_Expanded, Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { PHProvider, PostHogPageview } from '@/lib/posthog/provider'
import { GTMProvider } from '@/lib/gtm/provider'

const encodeSans = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-heading',
})

const notoThai = Noto_Sans_Thai({
  subsets: ['thai'],
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
      <body className={`${encodeSans.variable} ${notoThai.variable} font-thai bg-fw-bg text-fw-text-primary antialiased`}>
        <PHProvider>
          <GTMProvider />
          <PostHogPageview />
          {children}
        </PHProvider>
      </body>
    </html>
  )
}
