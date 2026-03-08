import type { Metadata } from 'next'
import SignupForm from '@/components/signup/SignupForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'สมัครสมาชิก — Freedom World',
  description: 'สร้างบัญชีร้านค้า Freedom World และเริ่มสร้างชุมชนของคุณ',
  robots: 'noindex',
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-fw-bg flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-fw-blue/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-fw-pink/10 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fw-green to-fw-cyan flex items-center justify-center text-fw-bg font-bold text-sm">
              FW
            </div>
          </Link>
          <h1 className="font-bold text-2xl text-fw-text-primary">Freedom World</h1>
          <p className="text-fw-text-secondary text-sm mt-1">สร้างบัญชีร้านค้าของคุณ</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-fw-text-primary mb-6">เริ่มต้นฟรี</h2>
          <SignupForm />
        </div>

        <p className="text-center text-sm text-fw-text-tertiary mt-6">
          มีบัญชีอยู่แล้ว?{' '}
          <Link
            href="/onboarding"
            className="text-fw-green hover:underline font-medium"
          >
            ดำเนินการต่อ
          </Link>
        </p>
      </div>
    </main>
  )
}
