import posthog from 'posthog-js'

function isEnabled() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  return typeof window !== 'undefined' && key && key !== 'phc_xxxxx'
}

// ─── Landing page events ───
export function trackScrollDepth(depth: 25 | 50 | 75 | 100, page: string) {
  if (!isEnabled()) return
  posthog.capture('scroll_depth', { depth_pct: depth, page })
}

export function trackCTAClick(location: string, variant?: string) {
  if (!isEnabled()) return
  posthog.capture('cta_click', { button_location: location, page_variant: variant })
}

export function trackFAQExpand(question: string) {
  if (!isEnabled()) return
  posthog.capture('faq_expand', { question })
}

// ─── Signup events ───
export function trackSignupStart(method: 'email' | 'google') {
  if (!isEnabled()) return
  posthog.capture('signup_start', { method })
}

export function trackSignupComplete(cognitoSub: string, merchantId: string) {
  if (!isEnabled()) return
  posthog.identify(merchantId, { cognito_sub: cognitoSub })
  posthog.capture('signup_complete', {
    cognito_user_id: cognitoSub,
    merchant_id: merchantId,
  })
}

export function trackSignupError(error: string) {
  if (!isEnabled()) return
  posthog.capture('signup_error', { error })
}

// ─── Onboarding events ───
export function trackOnboardStart(businessTypeHint?: string) {
  if (!isEnabled()) return
  posthog.capture('onboard_start', { business_type_hint: businessTypeHint })
}

export function trackOnboardStep(step: string, data: Record<string, unknown> = {}) {
  if (!isEnabled()) return
  posthog.capture(`onboard_step_${step}`, data)
}

export function trackOnboardComplete(totalMinutes: number) {
  if (!isEnabled()) return
  posthog.capture('onboard_complete', { total_time_minutes: totalMinutes })
}

export function trackOnboardDropOff(lastPhase: string, timeSpentMinutes: number) {
  if (!isEnabled()) return
  posthog.capture('onboard_drop_off', {
    last_phase: lastPhase,
    time_spent_minutes: timeSpentMinutes,
  })
}

export function trackOnboardResume(phase: string) {
  if (!isEnabled()) return
  posthog.capture('onboard_resume', { resumed_from_phase: phase })
}

// ─── Handoff events ───
export function trackHandoffTriggered(reason: string, phase: string) {
  if (!isEnabled()) return
  posthog.capture('handoff_triggered', { reason, stuck_phase: phase })
}

// ─── Post-onboarding events ───
export function trackFirstProduct(productType: string) {
  if (!isEnabled()) return
  posthog.capture('first_product', { product_type: productType })
}

export function trackFirstTransaction(amount: number, paymentMethod: string) {
  if (!isEnabled()) return
  posthog.capture('first_transaction', { amount, payment_method: paymentMethod })
}
