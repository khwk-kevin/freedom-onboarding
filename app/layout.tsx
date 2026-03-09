import type { Metadata } from 'next'
import { Kanit, Encode_Sans_Expanded } from 'next/font/google'
import './globals.css'
import { PHProvider, PostHogPageview } from '@/lib/posthog/provider'
import { GTMProvider } from '@/lib/gtm/provider'
import { TranslationProvider } from '@/context/TranslationContext'

const kanit = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-encode-sans',
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
      <body className={`${kanit.className} ${encodeSansExpanded.variable} bg-fw-bg text-fw-text-primary antialiased`}>
        <PHProvider>
          <GTMProvider />
          <PostHogPageview />
          <TranslationProvider>
            {children}
          </TranslationProvider>
        </PHProvider>
      </body>
    </html>
  )
}
