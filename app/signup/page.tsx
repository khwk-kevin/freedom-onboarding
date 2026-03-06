import type { Metadata } from 'next'
import SignupForm from '@/components/signup/SignupForm'

export const metadata: Metadata = {
  title: 'Create Account — Freedom World',
  description: 'Create your Freedom World merchant account and start growing your community.',
  robots: 'noindex', // Signup pages shouldn't be indexed
}

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Freedom World</h1>
          <p className="text-gray-500 text-sm mt-1">Create your merchant account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Get started for free</h2>
          <SignupForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/onboarding`}
            className="text-indigo-600 hover:underline font-medium"
          >
            Continue onboarding
          </a>
        </p>
      </div>
    </main>
  )
}
