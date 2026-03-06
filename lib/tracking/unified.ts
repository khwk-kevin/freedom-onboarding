// Unified tracking layer — PostHog + GTM + Supabase event log
// Single import for all analytics across the app

import * as ph from '@/lib/posthog/events'
import * as gtm from '@/lib/gtm/events'

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || ''

async function logToSupabase(
  merchantId: string | null,
  eventType: string,
  data: Record<string, unknown> = {}
) {
  try {
    await fetch(`${API_BASE}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, eventType, eventData: data }),
    })
  } catch (e) {
    console.warn('Event logging failed:', e)
  }
}

export const track = {
  // ─── Landing page ───
  ctaClick(location: string, variant?: string) {
    ph.trackCTAClick(location, variant)
  },

  scrollDepth(depth: 25 | 50 | 75 | 100, page: string) {
    ph.trackScrollDepth(depth, page)
  },

  faqExpand(question: string) {
    ph.trackFAQExpand(question)
  },

  // ─── Signup ───
  signupStart(method: 'email' | 'google') {
    ph.trackSignupStart(method)
  },

  signupComplete(cognitoSub: string, merchantId: string, source: string) {
    ph.trackSignupComplete(cognitoSub, merchantId)
    gtm.gtmGenerateLead(merchantId, source)
    logToSupabase(merchantId, 'signup_complete', { cognitoSub })
  },

  signupError(error: string) {
    ph.trackSignupError(error)
  },

  // ─── Onboarding ───
  onboardStart(merchantId: string, hint?: string) {
    ph.trackOnboardStart(hint)
    logToSupabase(merchantId, 'onboard_start', { business_type_hint: hint })
  },

  onboardStep(merchantId: string, step: string, data: Record<string, unknown> = {}) {
    ph.trackOnboardStep(step, data)
    logToSupabase(merchantId, `onboard_step_${step}`, data)
  },

  onboardComplete(merchantId: string, totalMinutes: number, businessType: string) {
    ph.trackOnboardComplete(totalMinutes)
    gtm.gtmConversionOnboard(merchantId, businessType)
    logToSupabase(merchantId, 'onboard_complete', {
      total_time_minutes: totalMinutes,
      business_type: businessType,
    })
  },

  onboardDropOff(merchantId: string, lastPhase: string, minutes: number) {
    ph.trackOnboardDropOff(lastPhase, minutes)
    logToSupabase(merchantId, 'onboard_drop_off', {
      last_phase: lastPhase,
      time_spent: minutes,
    })
  },

  onboardResume(merchantId: string, phase: string) {
    ph.trackOnboardResume(phase)
    logToSupabase(merchantId, 'onboard_resume', { phase })
  },

  // ─── Handoff ───
  handoffTriggered(merchantId: string, reason: string, phase: string) {
    ph.trackHandoffTriggered(reason, phase)
    logToSupabase(merchantId, 'handoff_triggered', { reason, stuck_phase: phase })
  },

  // ─── Post-onboarding ───
  firstProduct(merchantId: string, productType: string) {
    ph.trackFirstProduct(productType)
    logToSupabase(merchantId, 'first_product', { product_type: productType })
  },

  firstTransaction(merchantId: string, amount: number, method: string) {
    ph.trackFirstTransaction(amount, method)
    gtm.gtmConversionFirstSale(merchantId, amount)
    logToSupabase(merchantId, 'first_transaction', {
      amount,
      payment_method: method,
    })
  },
}
