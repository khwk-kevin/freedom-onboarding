'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { track } from '@/lib/tracking/unified'

/* ─── Logo Marquee ─────────────────────────────────────────── */
const LOGOS = [
  '/images/home/logos/01.png',
  '/images/home/logos/02.png',
  '/images/home/logos/03.png',
  '/images/home/logos/04.png',
  '/images/home/logos/05.png',
  '/images/home/logos/06.png',
  '/images/home/logos/07.png',
  '/images/home/logos/08.png',
]

function LogoMarquee() {
  // Duplicate logos enough times for seamless scroll
  const repeated = [...LOGOS, ...LOGOS, ...LOGOS, ...LOGOS]

  return (
    <div className="flex flex-col items-center gap-4 mt-10 mb-4 w-full">
      <h3 className="text-center text-base font-semibold text-[#A6A7B5] z-40 uppercase">
        As Seen In
      </h3>
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: 64,
          maskImage: 'linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 64px, black calc(100% - 64px), transparent 100%)',
        }}
      >
        <div
          className="flex items-center gap-[90px] hover:[animation-play-state:paused]"
          style={{
            animation: 'marquee-scroll 30s linear infinite',
            width: 'max-content',
          }}
        >
          {repeated.map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`Partner logo ${(i % LOGOS.length) + 1}`}
              width={120}
              height={64}
              className="h-16 w-auto object-contain flex-shrink-0"
              unoptimized
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

/* ─── Blue Glow Background ─────────────────────────────────── */
function BlueGlow() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute"
        style={{
          top: '40%',
          left: '55%',
          width: '40%',
          height: '10%',
          transform: 'translate(-50%, -50%) rotate(110deg)',
          borderRadius: '50%',
          background: 'linear-gradient(117deg, rgba(24,75,255,0.2) 0%, rgba(23,74,255,0.3) 100%)',
          filter: 'blur(150px)',
          opacity: 0.3,
        }}
      />
    </div>
  )
}

/* ─── CTA Button (matches FW style) ──────────────────────── */
function CTABtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-full px-5 pr-2 py-2 cursor-pointer bg-[#1248C8] transition-transform hover:scale-105 active:scale-95 w-fit"
    >
      <span className="text-sm font-black uppercase leading-[150%] text-white whitespace-nowrap">
        {label}
      </span>
      <div className="flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-[#10F48B]">
        <Image src="/svgs/up-right-arrow.svg" alt="" width={32} height={32} className="h-6 w-6 lg:h-8 lg:w-8" />
      </div>
    </button>
  )
}

/* ─── Hero Section (cloned from freedom.world) ────────────── */
export default function HeroClone() {
  return (
    <div className="relative md:min-h-screen px-1 xs:px-4 md:pb-10 pb-20 text-white w-full flex flex-col items-center gap-6 md:gap-12 lg:gap-24 justify-center"
      style={{ backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Background */}
      <Image
        src="/images/home/hiro/bg.webp"
        alt="Background"
        fill
        priority
        fetchPriority="high"
        className="object-cover z-0"
      />
      <BlueGlow />

      {/* Content */}
      <div className="flex flex-col justify-center items-center gap-4 w-full z-[1]">
        {/* Headline */}
        <div
          className="w-full m-auto flex flex-col items-center justify-center md:pt-[120px] pt-[50px]"
          style={{ background: 'linear-gradient(0deg, #02021000 0%, #020210 10%)' }}
        >
          <h2 className="w-fit text-white uppercase text-[30px] md:text-[40px] text-center font-black p-0 leading-[40px] md:leading-[60px]">
            Your Business, Your World
          </h2>
          <h1 className="rounded-full w-fit text-[#10F48B] uppercase text-[30px] md:text-[60px] text-center font-black p-0 leading-[48px] md:leading-[60px]">
            Yours To Create
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-center px-4 text-[#A6A7B5] text-[14px] leading-[21px] tracking-[-0.24px] p-0">
          Create, engage, and grow your community with Freedom World.
          <br className="hidden sm:block" />
          Built for creators, managed for success.
        </p>

        {/* CTA */}
        <Link href="/onboarding" onClick={() => track.ctaClick('hero_clone', 'fw')}>
          <CTABtn label="Get Started" />
        </Link>

        {/* iPad + floating assets composition */}
        <div className="md:-mt-[60px] relative mx-auto w-full max-w-[1179px] aspect-[1179/600]">
          {/* iPad base */}
          <Image
            alt="Freedom World Platform"
            src="/images/home/hero/iPad.avif"
            width={1179}
            height={773}
            sizes="(max-width: 768px) 100vw, 1179px"
            className="w-full h-auto absolute bottom-0 animate-[fadeIn_0.6s_ease_0.6s_both]"
            priority
            fetchPriority="high"
            loading="eager"
            unoptimized
          />

          {/* 5 Star Coffee card - top left */}
          <Image
            alt=""
            src="/images/home/hero/5StarCoffee.webp"
            width={213}
            height={139}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_0.9s_both] hidden md:block"
            style={{ width: '22.17%', left: '4.6%', bottom: '48.5%' }}
            priority
            unoptimized
          />

          {/* FDS1 - left side */}
          <Image
            alt=""
            src="/images/home/hero/FDS1.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both] hidden md:block"
            style={{ width: '9.25%', left: '-5%', bottom: '23%' }}
            unoptimized
          />

          {/* Shard1 */}
          <Image
            alt=""
            src="/images/home/hero/Shard1.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '4.75%', left: '12%', bottom: '13.6%' }}
            unoptimized
          />

          {/* Soulgazer1 - left */}
          <Image
            alt=""
            src="/images/home/hero/Soulgazer1.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '5.68%', left: '18.666%', bottom: '15.667%' }}
            unoptimized
          />

          {/* Pin Restaurant */}
          <Image
            alt=""
            src="/images/home/hero/Pin_Restaurant.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '6.87%', left: '26.36%', bottom: '30.667%' }}
            unoptimized
          />

          {/* Ghajar */}
          <Image
            alt=""
            src="/images/home/hero/Ghajar.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '5.43%', left: '29%', bottom: '16.1%' }}
            unoptimized
          />

          {/* FDW Logo - center */}
          <Image
            alt=""
            src="/images/home/hero/FDW Logo.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_0.6s_both]"
            style={{ width: '24.43%', left: '38.33%', bottom: '36.333%' }}
            unoptimized
          />

          {/* Soulgazer1 - right */}
          <Image
            alt=""
            src="/images/home/hero/Soulgazer1.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '3.985%', left: '62.52%', bottom: '22.5%' }}
            unoptimized
          />

          {/* Shard2 */}
          <Image
            alt=""
            src="/images/home/hero/Shard2.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '4.75%', left: '62%', bottom: '11.5%' }}
            unoptimized
          />

          {/* Ghost */}
          <Image
            alt=""
            src="/images/home/hero/Ghost.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both]"
            style={{ width: '5.86%', left: '70.81%', bottom: '14%' }}
            unoptimized
          />

          {/* Pin Shop */}
          <Image
            alt=""
            src="/images/home/hero/Pin_Shop.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both] hidden md:block"
            style={{ width: '7.64%', left: '78.3%', bottom: '12.5%' }}
            unoptimized
          />

          {/* Monthly card - top right */}
          <Image
            alt=""
            src="/images/home/hero/Monthly.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_0.9s_both] hidden md:block"
            style={{ width: '23.91%', left: '73.66%', bottom: '34.33%' }}
            unoptimized
          />

          {/* FDS2 - far right */}
          <Image
            alt=""
            src="/images/home/hero/FDS2.avif"
            width={289}
            height={400}
            className="h-auto absolute animate-[fadeIn_0.6s_ease_1.2s_both] hidden md:block"
            style={{ width: '10.18%', right: '-6.12%', bottom: '21%' }}
            unoptimized
          />
        </div>
      </div>

      {/* Logo Marquee */}
      <LogoMarquee />
    </div>
  )
}
