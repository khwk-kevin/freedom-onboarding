'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/tracking/unified'
import posthog from 'posthog-js'
import { gtmPageView } from '@/lib/gtm/events'

/**
 * Tracks all landing page engagement:
 * - Scroll depth (25%, 50%, 75%, 100%)
 * - Time on page
 * - Section visibility (which sections users actually see)
 * - Exit intent (mouse leaves viewport)
 */
export function LandingTracker() {
  const scrollMilestones = useRef(new Set<number>())
  const startTime = useRef(Date.now())
  const sectionsViewed = useRef(new Set<string>())

  // Fire landing page_view immediately on mount
  useEffect(() => {
    posthog.capture('landing_page_view', {
      $current_url: window.location.href,
      referrer: document.referrer || '$direct',
      page_title: document.title,
    })
    gtmPageView(window.location.pathname, document.title)
  }, [])

  useEffect(() => {
    // --- Scroll Depth Tracking ---
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      const scrollPct = Math.round((window.scrollY / scrollHeight) * 100)

      const milestones: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100]
      for (const m of milestones) {
        if (scrollPct >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m)
          track.scrollDepth(m, 'landing')
        }
      }
    }

    // --- Section Visibility Tracking ---
    const sectionIds = [
      'hero', 'features', 'why-freedom', 'success-story',
      'explore-features', 'bottom-cta', 'footer'
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !sectionsViewed.current.has(entry.target.id)) {
            sectionsViewed.current.add(entry.target.id)
            track.ctaClick(`section_view:${entry.target.id}`)
          }
        }
      },
      { threshold: 0.3 }
    )

    // Observe sections after a tick (elements may not be mounted yet)
    setTimeout(() => {
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      }
    }, 500)

    // --- Time on Page Tracking ---
    const handleBeforeUnload = () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
      // Use sendBeacon for reliable exit tracking
      const payload = JSON.stringify({
        event: 'landing_exit',
        properties: {
          time_on_page_seconds: timeSpent,
          scroll_depth_reached: Math.max(...Array.from(scrollMilestones.current), 0),
          sections_viewed: Array.from(sectionsViewed.current),
        },
      })
      navigator.sendBeacon?.('/api/events/beacon', payload)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Fire initial scroll check
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      observer.disconnect()
    }
  }, [])

  return null
}
