'use client'

import Link from 'next/link'
import { track } from '@/lib/tracking/unified'

interface CTAButtonProps {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  location: string
  variant?: 'primary' | 'outline'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function CTAButton({
  href = '/signup',
  onClick,
  children,
  location,
  variant = 'primary',
  className = '',
  size = 'md',
}: CTAButtonProps) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variants = {
    primary:
      'bg-brand-green hover:bg-brand-green-hover text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all',
    outline:
      'border-2 border-brand-green text-brand-green-dark hover:bg-brand-green/10 font-semibold transition-all',
  }

  const base = `inline-flex items-center justify-center rounded-xl ${sizes[size]} ${variants[variant]} ${className}`

  function handleClick() {
    track.ctaClick(location)
    onClick?.()
  }

  if (href) {
    return (
      <Link href={href} className={base} onClick={handleClick}>
        {children}
      </Link>
    )
  }

  return (
    <button className={base} onClick={handleClick}>
      {children}
    </button>
  )
}
