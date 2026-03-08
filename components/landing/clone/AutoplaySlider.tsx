'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface SliderItem {
  id: string
  title: string
  subtitle: string
  image: string
}

interface AutoplaySliderProps {
  items: SliderItem[]
  duration?: number
  className?: string
  imageLeft?: boolean
  isLoyalty?: boolean
  title?: string
  onActiveChange?: (index: number) => void
  renderRight: (item: SliderItem, index: number) => React.ReactNode
  renderMobileCard: (item: SliderItem, index: number) => React.ReactNode
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return isMobile
}

export function AutoplaySlider({
  items,
  duration = 4000,
  className = '',
  imageLeft = false,
  isLoyalty = false,
  title,
  onActiveChange,
  renderRight,
  renderMobileCard,
}: AutoplaySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef(0)
  const rafRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile(768)

  const isInView = () => {
    const el = containerRef.current
    if (!el) return true
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    return rect.bottom > 0 && rect.top < vh
  }

  const goTo = useCallback(
    (rawIndex: number, opts?: { scroll?: boolean }) => {
      const idx = ((rawIndex % items.length) + items.length) % items.length
      startTimeRef.current = performance.now()
      setProgress(0)
      setActiveIndex(idx)
      onActiveChange?.(idx)
      if (opts?.scroll && scrollRef.current && isInView()) {
        const el = scrollRef.current.querySelector(`[data-afs-card-index="${idx}"]`)
        el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    },
    [items.length, onActiveChange]
  )

  useEffect(() => {
    startTimeRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / duration
      if (elapsed < 1) {
        setProgress(elapsed)
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setProgress(1)
        requestAnimationFrame(() => {
          goTo(activeIndex + 1, { scroll: isMobile })
          rafRef.current = requestAnimationFrame(tick)
        })
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [duration, items.length, activeIndex, goTo, isMobile])

  // Mobile carousel layout
  if (isMobile) {
    return (
      <div ref={containerRef} className={`flex w-full flex-col gap-4 ${className}`}>
        {title && (
          <h4
            className="font-bold text-[24px] leading-[34px] uppercase text-center px-4 text-[#F4F4FC]"
            style={{ fontFamily: 'var(--font-encode-sans, "Encode Sans Expanded", sans-serif)' }}
          >
            {title}
          </h4>
        )}
        <div
          ref={scrollRef}
          className="flex w-full snap-x snap-mandatory overflow-x-auto pb-2"
          style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          onScroll={(e) => {
            const el = e.currentTarget
            const children = Array.from(el.children)
            if (!children.length) return
            const center = el.scrollLeft + el.clientWidth / 2
            let nearest = 0
            let minDist = Infinity
            children.forEach((child, i) => {
              const dist = Math.abs((child as HTMLElement).offsetLeft + (child as HTMLElement).clientWidth / 2 - center)
              if (dist < minDist) { minDist = dist; nearest = i }
            })
            if (nearest !== activeIndex) {
              setActiveIndex(nearest)
              onActiveChange?.(nearest)
            }
          }}
        >
          {items.map((item, i) => (
            <div key={item.id} data-afs-card-index={i} className="snap-center">
              {renderMobileCard(item, i)}
            </div>
          ))}
        </div>
        {/* Dot indicators */}
        <div className="flex w-full items-center justify-center gap-2">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i, { scroll: true })}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'w-8 bg-[#10F48B]' : 'w-3 bg-[#10F48B]/30'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Desktop layout
  return (
    <div className={`flex w-full items-center gap-6 self-stretch z-10 ${className} ${imageLeft ? 'flex-row-reverse' : ''}`}>
      {/* Left: tab list */}
      <div className="flex flex-col items-start gap-6 flex-1 min-w-0">
        {title && (
          <h4
            className="font-bold text-[24px] leading-[34px] uppercase text-[#F4F4FC]"
            style={{ fontFamily: 'var(--font-encode-sans, "Encode Sans Expanded", sans-serif)' }}
          >
            {title}
          </h4>
        )}
        {items.map((item, i) => {
          const isActive = i === activeIndex
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i, { scroll: false })}
              className="flex w-full gap-4 text-left cursor-pointer"
            >
              {/* Progress bar */}
              <div className="relative w-0.5 overflow-hidden rounded bg-white/20">
                <div
                  className="absolute top-0 h-full w-full origin-top bg-emerald-400"
                  style={{ transform: `scaleY(${activeIndex === i ? progress : 0})` }}
                />
              </div>
              <div className="flex flex-col items-start gap-2 self-stretch flex-1 min-w-0">
                <h4 className={`text-lg font-bold capitalize whitespace-nowrap overflow-hidden text-ellipsis transition-opacity ${isActive ? 'text-[#F4F4FC]' : 'text-[#A6A7B5]'}`}>
                  {item.title}
                </h4>
                <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-20 text-[#868898]' : 'max-h-0 opacity-0'}`}>
                  <p className="mt-1 max-w-md text-sm text-white/70">{item.subtitle}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Right: image */}
      <div className={isLoyalty ? 'flex w-[500px] items-center justify-center' : 'flex flex-1 basis-0 items-center justify-end'}>
        {renderRight(items[activeIndex], activeIndex)}
      </div>
    </div>
  )
}
